import { Hono } from 'hono';
import type { Env } from '../../api/[[route]]';
import { ensureUnitsTable, getDb } from '../db';
import { rateLimiter } from '../middleware/rate-limit';

export const chatRoutes = new Hono<{ Bindings: Env }>();

const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 800;
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

type Lang = 'ar' | 'en';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

async function buildSystemPrompt(env: Env, lang: Lang): Promise<string> {
  const db = getDb(env);
  await ensureUnitsTable(db);

  const [unitStats, projectCount, zoneCount] = await Promise.all([
    db.execute(`
      SELECT COUNT(*) as count, MIN(price) as minPrice, MAX(price) as maxPrice,
        MIN(area) as minArea, MAX(area) as maxArea
      FROM units WHERE status = 'available'
    `),
    db.execute('SELECT COUNT(*) as count FROM projects'),
    db.execute('SELECT COUNT(*) as count FROM zones'),
  ]);

  const stats = unitStats.rows[0] ?? {};
  const projects = projectCount.rows[0]?.count ?? 0;
  const zones = zoneCount.rows[0]?.count ?? 0;

  if (lang === 'en') {
    return [
      'You are a helpful assistant for "Al-Ahram Developments", a real estate developer in Sadat City, Egypt.',
      'Answer briefly and helpfully in English (2-4 sentences unless more detail is clearly needed).',
      '',
      'Facts you can share:',
      `- ${projects} residential projects across ${zones} zones in Sadat City`,
      `- ${stats.count ?? 0} units currently available, priced from ${stats.minPrice ?? 'n/a'} to ${stats.maxPrice ?? 'n/a'} EGP, areas from ${stats.minArea ?? 'n/a'} to ${stats.maxArea ?? 'n/a'} sqm`,
      '- Installment plans exist, but the exact down payment %, term, and interest rate depend on the unit and current offers — point the user to the installment calculator on the site or to the sales team for exact numbers',
      '- If asked about something outside real estate or this company, politely redirect the conversation back to how you can help',
      '',
      "Never invent specific unit codes, exact prices, delivery dates, or contract terms you don't have data for.",
    ].join('\n');
  }

  return [
    'أنتِ مساعدة ذكية لشركة "الأهرام للتطوير العقاري" في مدينة السادات، مصر.',
    'ردي بإيجاز وبالعربية المصرية البسيطة (جملتين لأربع جمل، إلا لو محتاجة تفصيل أكتر).',
    '',
    'معلومات يمكنك مشاركتها:',
    `- ${projects} مشروع سكني موزعين على ${zones} منطقة في مدينة السادات`,
    `- ${stats.count ?? 0} وحدة متاحة حاليًا، الأسعار من ${stats.minPrice ?? 'غير متاح'} إلى ${stats.maxPrice ?? 'غير متاح'} جنيه، والمساحات من ${stats.minArea ?? 'غير متاح'} إلى ${stats.maxArea ?? 'غير متاح'} متر`,
    '- في خطط تقسيط متاحة، لكن نسبة المقدم والمدة والفوائد بتختلف حسب الوحدة والعروض الحالية — وجّهي العميل لحاسبة التقسيط على الموقع أو لفريق المبيعات عشان الأرقام الدقيقة',
    '- لو حد سأل حاجة برا نطاق العقارات أو الشركة، ردي بلطف ووجّهي الكلام تاني لموضوع تقدري تساعدي فيه',
    '',
    'متخترعيش أكواد وحدات أو أسعار محددة أو مواعيد تسليم أو شروط تعاقدية مش متأكدة منها.',
  ].join('\n');
}

// POST /api/chat
chatRoutes.post('/', rateLimiter({ limit: 10, windowMs: 60_000 }), async (c) => {
  const env = c.env;
  if (!env.ANTHROPIC_API_KEY) {
    return c.json({ success: false, error: 'Chat is not configured yet' }, 503);
  }

  const body = await c.req.json().catch(() => null);
  const messages: ChatMessage[] = Array.isArray(body?.messages) ? body.messages : [];
  const lang: Lang = body?.lang === 'en' ? 'en' : 'ar';

  if (messages.length === 0 || messages.length > MAX_MESSAGES) {
    return c.json({ success: false, error: 'Invalid message history' }, 400);
  }
  for (const m of messages) {
    if (typeof m.content !== 'string' || m.content.length === 0 || m.content.length > MAX_MESSAGE_LENGTH) {
      return c.json({ success: false, error: 'Invalid message content' }, 400);
    }
    if (m.role !== 'user' && m.role !== 'assistant') {
      return c.json({ success: false, error: 'Invalid message role' }, 400);
    }
  }

  try {
    const systemPrompt = await buildSystemPrompt(env, lang);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: env.ANTHROPIC_MODEL || DEFAULT_MODEL,
        max_tokens: 500,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.role === 'user' ? stripHtml(m.content) : m.content,
        })),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Anthropic API error:', res.status, errText);
      return c.json({ success: false, error: 'Chat service unavailable' }, 502);
    }

    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const reply =
      data.content?.find((block) => block.type === 'text')?.text ??
      (lang === 'en' ? 'Sorry, I could not process that.' : 'معلش، حصلت مشكلة في الرد، جربي تاني.');

    return c.json({ success: true, data: { reply } });
  } catch (err) {
    console.error('Chat route error:', err);
    return c.json({ success: false, error: 'Chat service unavailable' }, 500);
  }
});
