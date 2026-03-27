const sqlite3 = require('sqlite3').verbose();
const bcrypt  = require('bcryptjs');
const path    = require('path');

const DB_PATH = path.join(__dirname, 'obstrected.db');
let _db = null;

/** Returns the open DB singleton */
function getDB() {
    if (!_db) {
        _db = new sqlite3.Database(DB_PATH);
        _db.run('PRAGMA journal_mode = WAL;');
    }
    return _db;
}

/** Helper to run async db.all */
function dbAll(query, params = []) {
    return new Promise((resolve, reject) => {
        getDB().all(query, params, (err, rows) => {
            if (err) reject(err); else resolve(rows);
        });
    });
}

/** Helper to run async db.get */
function dbGet(query, params = []) {
    return new Promise((resolve, reject) => {
        getDB().get(query, params, (err, row) => {
            if (err) reject(err); else resolve(row);
        });
    });
}

/** Helper to run async db.run */
function dbRun(query, params = []) {
    return new Promise((resolve, reject) => {
        getDB().run(query, params, function (err) {
            if (err) reject(err); else resolve(this);
        });
    });
}

/** Creates tables and seeds data (only if empty) */
function initDB() {
    const db = getDB();

    db.serialize(() => {
        // ── Create tables ────────────────────────────────────────────────────────
        db.exec(`
            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS architects (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                username     TEXT UNIQUE NOT NULL,
                password     TEXT NOT NULL,
                name         TEXT,
                speciality   TEXT,
                email        TEXT,
                projects     INTEGER DEFAULT 0,
                appointments INTEGER DEFAULT 0,
                status       TEXT DEFAULT 'approved'
            );

            CREATE TABLE IF NOT EXISTS customers (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                username  TEXT UNIQUE NOT NULL,
                password  TEXT NOT NULL,
                name      TEXT,
                houseType TEXT,
                architect TEXT,
                budget    TEXT,
                city      TEXT,
                email     TEXT,
                cooldown_override BOOLEAN DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS appointments (
                id       INTEGER PRIMARY KEY AUTOINCREMENT,
                client   TEXT,
                type     TEXT,
                date     TEXT,
                time     TEXT,
                status   TEXT DEFAULT 'pending',
                arch     TEXT,
                email    TEXT,
                phone    TEXT,
                planning TEXT,
                otc      TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS projects (
                id       INTEGER PRIMARY KEY AUTOINCREMENT,
                name     TEXT,
                type     TEXT,
                client   TEXT,
                progress INTEGER DEFAULT 0,
                arch     TEXT,
                start    TEXT,
                end      TEXT
            );

            CREATE TABLE IF NOT EXISTS messages (
                id     INTEGER PRIMARY KEY AUTOINCREMENT,
                client TEXT,
                msg    TEXT,
                date   TEXT,
                status TEXT DEFAULT 'unread',
                arch   TEXT
            );

            CREATE TABLE IF NOT EXISTS contacts (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                name       TEXT,
                email      TEXT,
                phone      TEXT,
                message    TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS otp_verifications (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                email      TEXT UNIQUE,
                code       TEXT,
                expires_at DATETIME
            );
        `);

        // ── Seed only if tables are empty ────────────────────────────────────────
        db.get('SELECT COUNT(*) as c FROM architects', (err, row) => {
            if (err) return console.error(err);
            if (row.c > 0) {
                console.log('✅  Database architects already seeded — skipping.');
                
                // Ensure admin exists
                db.get('SELECT count(*) as c FROM admins', (err, adminRow) => {
                    if (adminRow && adminRow.c === 0) {
                        const adminHash = bcrypt.hashSync('sladeoo7', 10);
                        db.run('INSERT INTO admins (username, password) VALUES (?, ?)', ['slade', adminHash]);
                    }
                });
                return;
            }

            console.log('🌱  Seeding database...');
            const ROUNDS = 10;
            
            // Ensure admin exists on fresh seed
            const adminHash = bcrypt.hashSync('sladeoo7', ROUNDS);
            db.run('INSERT INTO admins (username, password) VALUES (?, ?)', ['slade', adminHash]);

            db.serialize(() => {
                const stmtA = db.prepare(`INSERT INTO architects (username,password,name,speciality,projects,appointments) VALUES (?,?,?,?,?,?)`);
                const architects = [
                    ['beloo.gajjar',     bcrypt.hashSync('Arch@BeG2024', ROUNDS), 'Ar. Beloo Gajjar',     'Modern Residential & Villa Designs',      28, 5],
                    ['riya.kavathiya',   bcrypt.hashSync('Arch@RiK2024', ROUNDS), 'Ar. Riya Kavathiya',   'Interior Layouts & Contemporary Planning', 22, 3],
                    ['kushal.shah',      bcrypt.hashSync('Arch@KuS2024', ROUNDS), 'Ar. Kushal Shah',      'Luxury Villas & Innovative Concepts',      19, 4],
                    ['diya.patel',       bcrypt.hashSync('Arch@DiP2024', ROUNDS), 'Ar. Diya Patel',       'Luxury Villas & Modern Architecture',      17, 2],
                    ['yesh.muleva',      bcrypt.hashSync('Arch@YeM2024', ROUNDS), 'Ar. Yesh Muleva',      'Urban Architecture & Smart Design',        21, 6],
                    ['himani.shukla',    bcrypt.hashSync('Arch@HiS2024', ROUNDS), 'Ar. Himani Shukla',    'Sustainable & Green Architecture',         15, 3],
                    ['amritansh.pandey', bcrypt.hashSync('Arch@AmP2024', ROUNDS), 'Ar. Amritansh Pandey', 'Commercial & Residential Architecture',    24, 7],
                    ['rajveer.vaghela',  bcrypt.hashSync('Arch@RaV2024', ROUNDS), 'Ar. Rajveer Vaghela',  'Expert in interior layouts and contemporary house planning', 12, 0]
                ];
                architects.forEach(a => stmtA.run(a));
                stmtA.finalize();

                const stmtC = db.prepare(`INSERT INTO customers (username,password,name,houseType,architect,budget,city) VALUES (?,?,?,?,?,?,?)`);
                const customers = [
                    ['rohan.mehta',    bcrypt.hashSync('Cust@RoM2024', ROUNDS), 'Rohan Mehta',    'Villa',     'Ar. Beloo Gajjar',     '₹85 Lakh',   'Ahmedabad'],
                    ['sneha.doshi',    bcrypt.hashSync('Cust@SnD2024', ROUNDS), 'Sneha Doshi',    'Apartment', 'Ar. Beloo Gajjar',     '₹45 Lakh',   'Surat'],
                    ['karan.patel',    bcrypt.hashSync('Cust@KaP2024', ROUNDS), 'Karan Patel',    'Bunglow',   'Ar. Beloo Gajjar',     '₹62 Lakh',   'Vadodara'],
                    ['priya.shah',     bcrypt.hashSync('Cust@PrS2024', ROUNDS), 'Priya Shah',     'Penthouse', 'Ar. Beloo Gajjar',     '₹1.2 Crore', 'Mumbai'],
                    ['vikram.nair',    bcrypt.hashSync('Cust@ViN2024', ROUNDS), 'Vikram Nair',    'Villa',     'Ar. Kushal Shah',      '₹95 Lakh',   'Pune'],
                    ['divya.tiwari',   bcrypt.hashSync('Cust@DiT2024', ROUNDS), 'Divya Tiwari',   'Penthouse', 'Ar. Amritansh Pandey', '₹1.5 Crore', 'Delhi'],
                    ['harish.pandya',  bcrypt.hashSync('Cust@HaP2024', ROUNDS), 'Harish Pandya',  'Villa',     'Ar. Yesh Muleva',      '₹78 Lakh',   'Rajkot'],
                    ['amit.jain',      bcrypt.hashSync('Cust@AmJ2024', ROUNDS), 'Amit Jain',      'Duplex',    'Ar. Beloo Gajjar',     '₹55 Lakh',   'Indore'],
                    ['nisha.trivedi',  bcrypt.hashSync('Cust@NiT2024', ROUNDS), 'Nisha Trivedi',  'Duplex',    'Ar. Riya Kavathiya',   '₹50 Lakh',   'Surat'],
                    ['pooja.iyer',     bcrypt.hashSync('Cust@PoI2024', ROUNDS), 'Pooja Iyer',     'Penthouse', 'Ar. Kushal Shah',      '₹1.1 Crore', 'Chennai']
                ];
                customers.forEach(c => stmtC.run(c));
                stmtC.finalize();

                const stmtP = db.prepare(`INSERT INTO projects (name,type,client,progress,arch,start,end) VALUES (?,?,?,?,?,?,?)`);
                const projects = [
                    ['Skyline Residences',  'Apartment', 'Rohan Mehta',      75, 'beloo.gajjar',     '2025-09-01', '2026-06-30'],
                    ['Green Valley Villa',  'Villa',     'Sneha Doshi',      40, 'beloo.gajjar',     '2025-11-15', '2026-09-15'],
                    ['Sunrise Bunglow',     'Bunglow',   'Karan Patel',      90, 'beloo.gajjar',     '2025-07-01', '2026-04-15'],
                    ['Coastal View Duplex', 'Duplex',    'Nisha Trivedi',    55, 'riya.kavathiya',   '2025-09-15', '2026-07-01'],
                    ['Metro Heights',       'Apartment', 'Raj Soni',         30, 'riya.kavathiya',   '2026-01-01', '2026-12-31'],
                    ['Serenity Villa',      'Villa',     'Vikram Nair',      60, 'kushal.shah',      '2025-10-01', '2026-08-01'],
                    ['Sky Penthouse',       'Penthouse', 'Pooja Iyer',       20, 'kushal.shah',      '2026-02-01', '2027-01-31'],
                    ['Heritage Bunglow',    'Bunglow',   'Sanjay Kumar',     85, 'kushal.shah',      '2025-08-01', '2026-05-01'],
                    ['Twin Towers Duplex',  'Duplex',    'Manan Shah',       45, 'diya.patel',       '2025-11-01', '2026-10-01'],
                    ['Royal Villa',         'Villa',     'Aarti Desai',      70, 'diya.patel',       '2025-09-01', '2026-07-01'],
                    ['Summit View',         'Villa',     'Harish Pandya',    50, 'yesh.muleva',      '2025-12-01', '2026-10-01'],
                    ['Urban Nest',          'Apartment', 'Meena Chaudhary',  35, 'yesh.muleva',      '2026-01-15', '2026-11-15'],
                    ['Lakeside Bunglow',    'Bunglow',   'Ruchit Gandhi',    65, 'yesh.muleva',      '2025-10-15', '2026-08-15'],
                    ['Eco Green Flat',      'Apartment', 'Sunil Das',        80, 'himani.shukla',    '2025-07-15', '2026-03-15'],
                    ['Garden Duplex',       'Duplex',    'Prateek Malhotra', 25, 'himani.shukla',    '2026-02-15', '2027-02-15'],
                    ['Elite Penthouse',     'Penthouse', 'Divya Tiwari',     90, 'amritansh.pandey', '2025-08-01', '2026-03-30'],
                    ['Majestic Villa',      'Villa',     'Shyam Agarwal',    60, 'amritansh.pandey', '2025-10-01', '2026-09-01'],
                    ['Prestige Residency',  'Apartment', 'Rekha Gupta',      40, 'amritansh.pandey', '2025-12-01', '2026-11-01'],
                    ['Classic Duplex',      'Duplex',    'Arjun Choudhary',  55, 'amritansh.pandey', '2025-11-01', '2026-08-01']
                ];
                projects.forEach(p => stmtP.run(p));
                stmtP.finalize();

                console.log('✅  Database seeded successfully.');
            });
        });
    });
}

module.exports = { getDB, initDB, dbAll, dbGet, dbRun };
