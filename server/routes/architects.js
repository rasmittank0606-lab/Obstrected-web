const express  = require('express');
const os       = require('os');
const { dbGet, dbAll, dbRun } = require('../db');
const { transporter, GMAIL_USER } = require('../utils/mailer');
const QRCode = require('qrcode');
const router   = express.Router();

// Get the machine's LAN IP (so QR codes work from phones on same WiFi)
function getLanIp() {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip internal (loopback) and non-IPv4 addresses
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost'; // fallback
}

function requireArch(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'architect') {
        return res.status(401).json({ error: 'Not authenticated as architect' });
    }
    next();
}

router.get('/dashboard', requireArch, async (req, res) => {
    try {
        const arch = await dbGet('SELECT * FROM architects WHERE username = ?', [req.session.user.username]);
        if (!arch) return res.status(404).json({ error: 'Architect not found' });
        const { password: _pw, ...safe } = arch;
        res.json({ architect: { ...safe, role: 'architect' } });
    } catch (e) { res.status(500).json({ error: 'Database error' }) }
});

router.get('/appointments', requireArch, async (req, res) => {
    try {
        const rows = await dbAll('SELECT * FROM appointments WHERE arch = ? ORDER BY date ASC', [req.session.user.username]);
        res.json({ appointments: rows });
    } catch (e) { res.status(500).json({ error: 'Database error' }) }
});

router.get('/appointments/by-date/:date', requireArch, async (req, res) => {
    try {
        const rows = await dbAll(
            'SELECT * FROM appointments WHERE arch = ? AND date = ? ORDER BY time ASC',
            [req.session.user.username, req.params.date]
        );
        res.json({ appointments: rows });
    } catch (e) { res.status(500).json({ error: 'Database error' }); }
});

router.patch('/appointments/:id', requireArch, async (req, res) => {
    const { status } = req.body;
    const allowedStatuses = ['confirmed', 'rejected', 'cancelled', 'pending'];
    if (!allowedStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    try {
        const appt = await dbGet('SELECT * FROM appointments WHERE id = ? AND arch = ?', [req.params.id, req.session.user.username]);
        if (!appt) return res.status(404).json({ error: 'Appointment not found' });

        let otc = appt.otc;
        if (status === 'confirmed' && !otc) {
            // Generate unique 5-digit OTC
            otc = Math.floor(10000 + Math.random() * 90000).toString();
        }

        await dbRun('UPDATE appointments SET status = ?, otc = ? WHERE id = ?', [status, otc, req.params.id]);

        // ── Automated Notifications ──
        if (status === 'rejected') {
            const mailOptions = {
                from: `"OBSTRECTED Architecture" <${GMAIL_USER}>`,
                to: appt.email,
                subject: 'Update on your Appointment Request',
                text: `Hello ${appt.client},\n\nYour appointment has been rejected by the architect for some reason. Please try again later.\n\nThank you!`
            };
            transporter.sendMail(mailOptions).catch(err => console.error('Rejection Email Error:', err));
        } 
        else if (status === 'confirmed') {
            // Generate QR code with public-facing URL for production
            const baseUrl = process.env.BASE_URL || `http://${getLanIp()}:${process.env.PORT || 3000}`;
            const verifyUrl = `${baseUrl}/verify_appointment.html?id=${appt.id}`;
            const qrDataUrl = await QRCode.toDataURL(verifyUrl);

            const mailOptions = {
                from: `"OBSTRECTED Architecture" <${GMAIL_USER}>`,
                to: appt.email,
                subject: 'Your Appointment is Approved! ✅',
                html: `
                    <div style="font-family: 'Poppins', sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; padding: 30px;">
                        <h2 style="color: #28a745; text-align: center;">Appointment Approved!</h2>
                        <p>Hello <strong>${appt.client}</strong>,</p>
                        <p>Your appointment with <strong>${appt.arch}</strong> has been successfully approved.</p>
                        
                        <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; text-align: center; margin: 25px 0;">
                            <p style="margin-bottom: 5px; color: #666;">Verification Code:</p>
                            <h1 style="letter-spacing: 8px; margin: 0; color: #1a1a2e;">${otc}</h1>
                        </div>

                        <p style="text-align: center;">Please show the QR code below or use the unique code above for verification at our studio:</p>
                        <div style="text-align: center; margin: 20px 0;">
                            <img src="cid:qrcode" alt="QR Code" style="width: 200px; height: 200px; border: 5px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                        </div>

                        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px; font-size: 14px; color: #777;">
                            <p><strong>Appointment Details:</strong></p>
                            <ul style="list-style: none; padding: 0;">
                                <li>📅 <strong>Date:</strong> ${appt.date}</li>
                                <li>🕒 <strong>Time:</strong> ${appt.time}</li>
                                <li>🏠 <strong>Project:</strong> ${appt.type}</li>
                            </ul>
                        </div>
                    </div>
                `,
                attachments: [{
                    filename: 'qrcode.png',
                    path: qrDataUrl,
                    cid: 'qrcode'
                }]
            };
            transporter.sendMail(mailOptions).catch(err => console.error('Approval Email Error:', err));
        }

        res.json({ success: true, id: req.params.id, status, otc });
    } catch (e) { 
        console.error('Update Error:', e);
        res.status(500).json({ error: 'Database error' });
    }
});

router.get('/projects', requireArch, async (req, res) => {
    try {
        const rows = await dbAll('SELECT * FROM projects WHERE arch = ? ORDER BY progress DESC', [req.session.user.username]);
        res.json({ projects: rows });
    } catch (e) { res.status(500).json({ error: 'Database error' }) }
});

router.get('/messages', requireArch, async (req, res) => {
    try {
        const rows = await dbAll('SELECT * FROM messages WHERE arch = ? ORDER BY date DESC', [req.session.user.username]);
        res.json({ messages: rows });
    } catch (e) { res.status(500).json({ error: 'Database error' }) }
});

module.exports = router;
