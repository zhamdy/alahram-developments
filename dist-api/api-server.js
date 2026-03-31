"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Standalone API server for deployment on Render (or similar PaaS).
 * Runs only the Express API routes — no Angular SSR.
 */
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const db_js_1 = __importDefault(require("./db.js"));
const auth_js_1 = __importDefault(require("./routes/auth.js"));
const public_js_1 = __importDefault(require("./routes/public.js"));
const admin_js_1 = __importDefault(require("./routes/admin.js"));
const dataDir = (0, node_path_1.join)(process.cwd(), 'data');
if (!(0, node_fs_1.existsSync)(dataDir)) {
    (0, node_fs_1.mkdirSync)(dataDir, { recursive: true });
}
const app = (0, express_1.default)();
// ── CORS ──
const allowedOrigins = [
    'https://alahram-developments.pages.dev',
    'https://alahram-developments.com',
    'https://www.alahram-developments.com',
];
if (process.env['NODE_ENV'] !== 'production') {
    allowedOrigins.push('http://localhost:4200', 'http://localhost:4000');
}
app.use((0, cors_1.default)({
    origin(origin, callback) {
        // Allow requests with no origin (server-to-server, curl, etc.)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error(`CORS: origin ${origin} not allowed`));
        }
    },
    credentials: true,
}));
// ── JSON body parser ──
app.use(express_1.default.json());
// ── Health check ──
app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});
// ── Serve uploaded files ──
const uploadsDir = (0, node_path_1.join)(dataDir, 'uploads');
if (!(0, node_fs_1.existsSync)(uploadsDir)) {
    (0, node_fs_1.mkdirSync)(uploadsDir, { recursive: true });
}
app.use('/uploads', express_1.default.static(uploadsDir, { maxAge: '7d' }));
// ── API routes ──
app.use('/api/auth', auth_js_1.default);
app.use('/api', public_js_1.default);
app.use('/api/admin', admin_js_1.default);
// ── Newsletter ──
app.post('/api/newsletter', (req, res) => {
    const { email } = req.body ?? {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
        res.status(400).json({ success: false, message: 'Invalid email' });
        return;
    }
    const sanitized = email.trim().toLowerCase();
    const existing = db_js_1.default.prepare('SELECT id FROM subscribers WHERE email = ?').get(sanitized);
    if (existing) {
        res.json({ success: true, message: 'Already subscribed' });
        return;
    }
    db_js_1.default.prepare('INSERT INTO subscribers (email) VALUES (?)').run(sanitized);
    res.json({ success: true, message: 'Subscribed successfully' });
});
// ── Contact form ──
app.post('/api/contact', (req, res) => {
    const { name, phone, message } = req.body ?? {};
    if (!name || !phone || !message) {
        res.status(400).json({ success: false, message: 'All fields are required' });
        return;
    }
    db_js_1.default.prepare('INSERT INTO contacts (name, phone, message) VALUES (?, ?, ?)').run(String(name).trim(), String(phone).trim(), String(message).trim());
    res.json({ success: true, message: 'Message received' });
});
// ── Start server ──
const port = process.env['PORT'] || 3000;
app.listen(port, () => {
    console.log(`API server listening on port ${port}`);
});
