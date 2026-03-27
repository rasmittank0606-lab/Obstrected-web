const express       = require('express');
const session       = require('express-session');
const SQLiteStore   = require('connect-sqlite3')(session);
const path          = require('path');
const { initDB }    = require('./db');

const authRoutes        = require('./routes/auth');
const architectRoutes   = require('./routes/architects');
const customerRoutes    = require('./routes/customers');
const appointmentRoutes = require('./routes/appointments');
const contactRoutes     = require('./routes/contact');
const adminRoutes       = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (required for secure cookies behind Render/Railway/Heroku)
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

// ── Initialise DB (creates tables + seeds if empty) ──────────────────────────
initDB();

// ── Migrate: add otc column if it doesn't exist yet ─────────────────────────
setTimeout(() => {
    const { getDB } = require('./db');
    getDB().run("ALTER TABLE appointments ADD COLUMN otc TEXT", (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('Migration error:', err.message);
        }
    });
}, 2000);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session (stored in SQLite)
app.use(session({
    store : new SQLiteStore({ db: 'sessions.db', dir: path.join(__dirname) }),
    secret: process.env.SESSION_SECRET || 'obstrected-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,  // 24 h
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
}));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/architect',    architectRoutes);
app.use('/api/customer',     customerRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/contact',      contactRoutes);
app.use('/api/admin',        adminRoutes);

// Health Check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

// Public Architect List
app.get('/api/public/architects', async (_req, res) => {
    try {
        const { dbAll } = require('./db');
        const rows = await dbAll("SELECT name, username FROM architects WHERE status = 'approved'");
        res.json({ architects: rows });
    } catch (e) {
        res.status(500).json({ error: 'Database error' });
    }
});

// ── Serve Static Frontend (must be AFTER api routes) ─────────────────────────
app.use(express.static(path.join(__dirname, '..')));

// Catch-all: always serve index.html for unknown routes
app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n✅  OBSTRECTED server running at http://localhost:${PORT}`);
    console.log(`   Open http://localhost:${PORT} in your browser\n`);
});
