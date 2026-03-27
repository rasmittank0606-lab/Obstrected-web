const express = require('express');
const bcrypt  = require('bcryptjs');
const { transporter, GMAIL_USER } = require('../utils/mailer');
const { dbGet, dbRun } = require('../db');
const router  = express.Router();

// ──  POST /api/auth/send-otp ──────────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Generate random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000).toISOString(); // 10 minutes from now

    try {
        // Save to DB (overwrite if already exists for this email)
        await dbRun(`
            INSERT INTO otp_verifications (email, code, expires_at) 
            VALUES (?, ?, ?) 
            ON CONFLICT(email) DO UPDATE SET code = ?, expires_at = ?
        `, [email, code, expiresAt, code, expiresAt]);

        // If credentials aren't set yet, just pretend it sent (useful for testing UI)
        if (GMAIL_USER === 'YOUR_GMAIL_ADDRESS_HERE') {
            console.log(`\n\n[DEV MODE] 📧 OTP for ${email} is ${code}\n(Did not actually send email because Gmail credentials are empty)\n\n`);
            return res.json({ success: true, message: 'OTP logged to server console (Dev Mode)' });
        }

        // Send actual email
        const mailOptions = {
            from: `"OBSTRECTED Architecture" <${GMAIL_USER}>`,
            to: email,
            subject: 'Your Registration Verification Code',
            text: `Welcome to OBSTRECTED Architecture!\n\nYour 6-digit verification code is: ${code}\nThis code will expire in 10 minutes.\n\nThank you!`
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Verification code sent to email' });

    } catch (e) {
        console.error('OTP Error:', e);
        res.status(500).json({ error: 'Failed to send verification code. Check email credentials in server.' });
    }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ error: 'Missing credentials' });
    }

    try {
        let user = null;
        if (role === 'architect') {
            user = await dbGet('SELECT * FROM architects WHERE username = ?', [username]);
        } else if (role === 'customer') {
            user = await dbGet('SELECT * FROM customers WHERE username = ?', [username]);
        } else if (role === 'admin') {
            user = await dbGet('SELECT * FROM admins WHERE username = ?', [username]);
        } else {
            return res.status(400).json({ error: 'Invalid role' });
        }

        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        if (role === 'architect' && user.status === 'suspended') {
            return res.status(401).json({ error: 'Your account is currently suspended. Please contact the administrator.' });
        }

        const safeUser = { id: user.id, username: user.username, name: role === 'admin' ? 'Master Admin' : user.name, role };
        
        if (role === 'admin') {
            req.session.adminUser = safeUser;
        } else {
            req.session.user = safeUser;
        }

        const { password: _pw, ...safe } = user;
        res.json({ success: true, user: safeUser });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
    const { role, username, password, name, speciality, houseType, city, state, budget, architect, email, otp } = req.body;

    if (!username || !password || !role || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (role === 'customer' && (!email || !otp)) {
        return res.status(400).json({ error: 'Email and verification code are required' });
    }

    try {
        if (role === 'customer') {
            // Verify OTP
            const otpRecord = await dbGet('SELECT * FROM otp_verifications WHERE LOWER(email) = LOWER(?)', [email]);
            if (!otpRecord) {
                return res.status(400).json({ error: 'No verification code requested for this email' });
            }
            if (otpRecord.code !== otp.trim()) {
                return res.status(400).json({ error: 'Invalid verification code' });
            }
            if (new Date() > new Date(otpRecord.expires_at)) {
                return res.status(400).json({ error: 'Verification code has expired' });
            }
        }

        const hash = bcrypt.hashSync(password, 10);
        
        if (role === 'architect') {
            await dbRun(
                'INSERT INTO architects (username, password, name, speciality, email) VALUES (?, ?, ?, ?, ?)',
                [username, hash, name, speciality || 'General Architecture', email || username]
            );
        } else if (role === 'customer') {
            await dbRun(
                'INSERT INTO customers (username, password, name, houseType, architect, budget, city, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [username, hash, name, houseType || 'Residential', architect || 'Unassigned', budget || 'TBD', state ? `${city}, ${state}` : city || 'Unknown', email || username]
            );
        } else {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Auto-login the user after registration
        let user;
        if (role === 'architect') user = await dbGet('SELECT * FROM architects WHERE username = ?', [username]);
        if (role === 'customer')  user = await dbGet('SELECT * FROM customers WHERE username = ?', [username]);

        req.session.user = { id: user.id, username: user.username, name: user.name, role };
        const { password: _pw, ...safe } = user;
        
        res.json({ success: true, user: { ...safe, role } });
    } catch (e) {
        if (e.message && e.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Username already exists' });
        }
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
    // Standard logout: keep the admin session alive if it exists, only destroy user session
    delete req.session.user;
    req.session.save(() => res.json({ success: true }));
});

// ── POST /api/auth/admin-logout ───────────────────────────────────────────────
router.post('/admin-logout', (req, res) => {
    // Admin logout: keep customer/arch session alive, only destroy admin session
    delete req.session.adminUser;
    req.session.save(() => res.json({ success: true }));
});

// ── GET /api/auth/me (Standard User) ──────────────────────────────────────────
router.get('/me', async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id, username, role } = req.session.user;
    const table = role === 'architect' ? 'architects' : 'customers';
    
    try {
        const user = await dbGet(`SELECT * FROM ${table} WHERE id = ?`, [id]);
        if (!user) return res.status(401).json({ error: 'User not found' });

        const { password: _pw, ...safe } = user;
        res.json({ user: { ...safe, role } });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ── GET /api/auth/admin-me (Master Admin) ─────────────────────────────────────
router.get('/admin-me', (req, res) => {
    if (!req.session || !req.session.adminUser || req.session.adminUser.role !== 'admin') {
        return res.status(401).json({ error: 'Not authenticated as admin' });
    }
    return res.json({ user: req.session.adminUser });
});

module.exports = router;
