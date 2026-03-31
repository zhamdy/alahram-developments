"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
let _db = null;
function getDb() {
    if (_db)
        return _db;
    const dataDir = (0, node_path_1.join)(process.cwd(), 'data');
    if (!(0, node_fs_1.existsSync)(dataDir)) {
        (0, node_fs_1.mkdirSync)(dataDir, { recursive: true });
    }
    const dbPath = (0, node_path_1.join)(dataDir, 'alahram.db');
    _db = new better_sqlite3_1.default(dbPath);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    // Run schema if schema.sql is found
    const schemaPath = (0, node_path_1.join)(process.cwd(), 'src/server/schema.sql');
    if ((0, node_fs_1.existsSync)(schemaPath)) {
        const schema = (0, node_fs_1.readFileSync)(schemaPath, 'utf-8');
        _db.exec(schema);
    }
    return _db;
}
// Proxy that lazily initializes the database on first use
const db = new Proxy({}, {
    get(_target, prop) {
        const instance = getDb();
        const value = instance[prop];
        if (typeof value === 'function') {
            return value.bind(instance);
        }
        return value;
    },
});
exports.default = db;
