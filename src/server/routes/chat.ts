import { Router } from 'express';
import db from '../db.js';

const router = Router();

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

async function buildSystemPrompt(lang: Lang): Promise<string> {
  const [unitStats, projectCount, zoneCount] = await Promise.all([
    db.execute(
      `SELECT COUNT(*) as count, MIN(price) as minPrice, MAX(price) as maxPrice,
        MIN(area) as minArea, MAX(area) as maxArea
      FROM units WHERE status = 'available'`,
    ),
    db.execute('SELECT COUNT(*) as count FROM projects'),
    db.execute('SELECT COUNT(*) as count FROM zones'),
  ]);

  const stats = (unitStats.rows[0] ?? {}) as Record<string, unknown>;
  const projects = (projectCount.rows[0] as Record<string, unknown>)?.['count'] ?? 0;
  const zones = (zoneCount.rows[0] as Record<string, unknown>)?.['count'] ?? 0;
  const na = lang === 'en' ? 'n/a' : 'غير متاح';
  const count = stats['count'] ?? 0;
  const minPrice = stats['minPrice'] ?? na;
  const maxPrice = stats['maxPrice'] ?? na;
  const minArea = stats['minArea'] ?? na;
  const maxArea = stats['maxArea'] ?? na;

  if (lang === 'en') {
    return [
      'You are a helpful assistant for "Al-Ahram Developments", a real estate developer in Sadat City, Egypt.',
      'Answer briefly and helpfully in English (2-4 sentences unless more detail is clearly needed).',
      '',
      'Facts you can share:',
      `- ${projects} residential projects across ${zones} zones in Sadat City`,
      `- ${count} units currently available, priced from ${minPrice} to ${maxPrice} EGP, areas from ${minArea} to ${maxArea} sqm`,
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
    `- ${count} وحدة متاحة حاليًا، الأسعار من ${minPrice} إلى ${maxPrice} جنيه، والمساحات من ${minArea} إلى ${maxArea} متر`,
    '- في خطط تقسيط متاحة، لكن نسبة المقدم والمدة والفوائد بتختلف حسب الوحدة والعروض الحالية — وجّهي العميل لحاسبة التقسيط على الموقع أو لفريق المبيعات عشان الأرقام الدقيقة',
    '- لو حد سأل حاجة برا نطاق العقارات أو الشركة، ردي بلطف ووجّهي الكلام تاني لموضوع تقدري تساعدي فيه',
    '',
    'متخترعيش أكواد وحدات أو أسعار محددة أو مواعيد تسليم أو شروط تعاقدية مش متأكدة منها.',
  ].join('\n');
}

// In-memory sliding window rate limiter
const ipWindows = new Map<string, number[]>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const cutoff = now - RATE_WINDOW_MS;

  let timestamps = ipWindows.get(ip);
  if (!timestamps) {
    timestamps = [];
    ipWindows.set(ip, timestamps);
  }

  // Remove expired entries
  const filtered = timestamps.filter((t) => t > cutoff);
  ipWindows.set(ip, filtered);

  if (filtered.length >= RATE_LIMIT) {
    const retryAfter = Math.ceil((filtered[0]! + RATE_WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfter };
  }

  filtered.push(now);
  return { allowed: true };
}

// POST /api/chat
router.post('/', async (req, res) => {
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) {
    res.status(503).json({ success: false, error: 'Chat is not configured yet — set ANTHROPIC_API_KEY env var' });
    return;
  }

  // Rate limit by IP
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    res.setHeader('Retry-After', String(rateCheck.retryAfter));
    res.status(429).json({ success: false, error: 'Too many requests' });
    return;
  }

  const messages: ChatMessage[] = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const lang: Lang = req.body?.lang === 'en' ? 'en' : 'ar';

  if (messages.length === 0 || messages.length > MAX_MESSAGES) {
    res.status(400).json({ success: false, error: 'Invalid message history' });
    return;
  }
  for (const m of messages) {
    if (typeof m.content !== 'string' || m.content.length === 0 || m.content.length > MAX_MESSAGE_LENGTH) {
      res.status(400).json({ success: false, error: 'Invalid message content' });
      return;
    }
    if (m.role !== 'user' && m.role !== 'assistant') {
      res.status(400).json({ success: false, error: 'Invalid message role' });
      return;
    }
  }

  try {
    const systemPrompt = await buildSystemPrompt(lang);
    const model = process.env['ANTHROPIC_MODEL'] || DEFAULT_MODEL;

    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 500,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.role === 'user' ? stripHtml(m.content) : m.content,
        })),
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('Anthropic API error:', apiRes.status, errText);
      res.status(502).json({ success: false, error: 'Chat service unavailable' });
      return;
    }

    const data = (await apiRes.json()) as { content?: Array<{ type: string; text?: string }> };
    const reply =
      data.content?.find((block) => block.type === 'text')?.text ??
      (lang === 'en' ? 'Sorry, I could not process that.' : 'معلش، حصلت مشكلة في الرد، جربي تاني.');

    res.json({ success: true, data: { reply } });
  } catch (err) {
    console.error('Chat route error:', err);
    res.status(500).json({ success: false, error: 'Chat service unavailable' });
  }
});

export default router;
