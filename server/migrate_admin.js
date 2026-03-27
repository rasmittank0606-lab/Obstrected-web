const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database(path.join(__dirname, 'obstrected.db'));

db.serialize(() => {
    try {
        db.run(`
            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        `, (err) => {
            if (err) console.error(err);
            else {
                console.log('Admins table created or exists');
                const hash = bcrypt.hashSync('admin123', 10);
                db.run('INSERT OR IGNORE INTO admins (username, password) VALUES (?, ?)', ['admin', hash], (err) => {
                    if (err) console.error(err);
                    else console.log('Admin account seeded');
                });
            }
        });

        db.run('ALTER TABLE architects ADD COLUMN status TEXT DEFAULT "approved"', (err) => {
            if (err) console.log('architects.status already exists or error:', err.message);
            else console.log('Added status column to architects');
        });

        db.run('ALTER TABLE customers ADD COLUMN cooldown_override BOOLEAN DEFAULT 0', (err) => {
            if (err) console.log('customers.cooldown_override already exists or error:', err.message);
            else console.log('Added cooldown_override column to customers');
        });

    } catch(e) { console.error(e); }
});

setTimeout(() => db.close(), 1500);
