const express  = require('express');
const { dbRun, dbGet } = require('../db');
const router   = express.Router();

router.post('/', async (req, res) => {
    const { name, email, phone, house_category, architect, date, time, planning } = req.body;

    if (!name || !email || !house_category || !architect || !date || !time) {
        return res.status(400).json({ error: 'Please fill all required fields' });
    }

    // ── Validation: Check for Pending or Recent Approved appointments ──
    try {
        const customer = await dbGet('SELECT cooldown_override FROM customers WHERE LOWER(email) = LOWER(?)', [email]);
        const hasOverride = customer && customer.cooldown_override == 1;

        if (!hasOverride) {
            const existing = await dbGet(
                `SELECT id, status, created_at FROM appointments
                 WHERE LOWER(email) = LOWER(?)
                   AND status IN ('confirmed', 'pending')
                 ORDER BY created_at DESC LIMIT 1`,
                [email]
            );

            if (existing) {
                if (existing.status === 'pending') {
                    return res.status(429).json({
                        error: "Your another appointment is pending; please wait for it to get approved."
                    });
                } else if (existing.status === 'confirmed') {
                    const createdDate = new Date(existing.created_at);
                    const fiveDaysAgo = new Date();
                    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
                    
                    if (createdDate >= fiveDaysAgo) {
                        return res.status(429).json({
                            error: "You already booked an appointment, try again in some days later."
                        });
                    }
                }
            }
        }
    } catch (e) {
        // If check fails, allow booking to proceed (fail open)
    }

    const archMap = {
        'Ar. Beloo Gajjar':     'beloo.gajjar',
        'Ar. Riya Kavathiya':   'riya.kavathiya',
        'Ar. Kushal Shah':      'kushal.shah',
        'Ar. Diya Patel':       'diya.patel',
        'Ar. Yesh Muleva':      'yesh.muleva',
        'Ar. Himani Shukla':    'himani.shukla',
        'Ar. Amritansh Pandey': 'amritansh.pandey',
    };

    const archUsername = archMap[architect] || architect;

    try {
        const info = await dbRun(`
            INSERT INTO appointments (client, type, date, time, status, arch, email, phone, planning)
            VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
            [name, house_category, date, time, archUsername, email, phone, planning || '']
        );
        res.json({ success: true, id: info.lastID, message: 'Appointment booked successfully!' });
    } catch (e) {
        res.status(500).json({ error: 'Database error' });
    }
});

router.get('/verify/:id/:otc', async (req, res) => {
    const { id, otc } = req.params;
    try {
        const appt = await dbGet('SELECT * FROM appointments WHERE id = ?', [id]);
        if (!appt) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        if (appt.otc !== otc) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }
        if (appt.status !== 'confirmed') {
            return res.status(400).json({ error: 'This appointment is not yet approved' });
        }

        // Return details for display on verification page
        res.json({
            success: true,
            details: {
                client: appt.client,
                phone: appt.phone,
                type: appt.type,
                arch: appt.arch,
                date: appt.date,
                time: appt.time
            }
        });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
