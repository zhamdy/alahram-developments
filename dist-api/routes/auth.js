"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = require("bcryptjs");
const db_js_1 = __importDefault(require("../db.js"));
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// POST /api/auth/login
router.post('/login', (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
        res.status(400).json({ success: false, error: 'Email and password are required' });
        return;
    }
    const user = db_js_1.default.prepare('SELECT id, name, email, password, role, created_at FROM users WHERE email = ?').get(email);
    if (!user || !(0, bcryptjs_1.compareSync)(password, user.password)) {
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
    }
    const token = (0, auth_js_1.signToken)({ userId: user.id, email: user.email, role: user.role });
    res.json({
        success: true,
        data: {
            user: { id: String(user.id), name: user.name, email: user.email, role: user.role, createdAt: user.created_at },
            tokens: { accessToken: token, refreshToken: token },
        },
    });
});
// POST /api/auth/logout
router.post('/logout', (_req, res) => {
    res.json({ success: true, data: null });
});
// GET /api/auth/me
router.get('/me', auth_js_1.requireAuth, (req, res) => {
    const user = db_js_1.default.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.user.userId);
    if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
    }
    res.json({
        success: true,
        data: { id: String(user.id), name: user.name, email: user.email, role: user.role, createdAt: user.created_at },
    });
});
exports.default = router;
