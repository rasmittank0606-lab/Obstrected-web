const express = require('express');
const { dbGet, dbAll, dbRun } = require('../db');
const router = express.Router();

// Middleware to ensure user is logged in as Master Admin
function requireAdmin(req, res, next) {
    if (!req.session || !req.session.adminUser || req.session.adminUser.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Master Admin only' });
    }
    next();
}

// ── Dashboard Overview Stats ────────────────────────────────────────────────────────
router.get('/stats', requireAdmin, async (req, res) => {
    try {
        const archCount = await dbGet('SELECT COUNT(*) as cx FROM architects');
        const custCount = await dbGet('SELECT COUNT(*) as cx FROM customers');
        const pendingAppts = await dbGet("SELECT COUNT(*) as cx FROM appointments WHERE status = 'pending'");
        
        // Today's appointments
        const today = new Date().toISOString().split('T')[0];
        const todayAppts = await dbGet('SELECT COUNT(*) as cx FROM appointments WHERE date = ?', [today]);

        res.json({
            totalUsers: archCount.cx + custCount.cx,
            totalArchitects: archCount.cx,
            totalCustomers: custCount.cx,
            pendingApprovals: pendingAppts.cx,
            todayAppointments: todayAppts.cx
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Database error' });
    }
});

// ── Architect Management ───────────────────────────────────────────────────────────
router.get('/architects', requireAdmin, async (req, res) => {
    try {
        const architects = await dbAll('SELECT id, username, name, speciality, email, projects, appointments, status FROM architects');
        // Fetch handled appointments for each architect
        for (let arch of architects) {
            arch.handled_appointments = await dbAll('SELECT * FROM appointments WHERE arch = ? ORDER BY date DESC, time DESC', [arch.username]);
        }
        res.json({ architects });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Database error' });
    }
});

router.patch('/architects/:id/status', requireAdmin, async (req, res) => {
    try {
        const { status } = req.body; // 'approved' or 'suspended'
        if (!['approved', 'suspended'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
        
        await dbRun('UPDATE architects SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ success: true, message: `Architect status updated to ${status}` });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Database error' });
    }
});

// ── Customer Management ────────────────────────────────────────────────────────────
router.get('/customers', requireAdmin, async (req, res) => {
    try {
        const customers = await dbAll('SELECT id, username, name, email, city, houseType, architect, budget, cooldown_override FROM customers');
        // Fetch booking history for each customer
        for (let cust of customers) {
            cust.booking_history = await dbAll('SELECT * FROM appointments WHERE client = ? ORDER BY date DESC', [cust.name]);
        }
        res.json({ customers });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Database error' });
    }
});

router.patch('/customers/:id/override', requireAdmin, async (req, res) => {
    try {
        const { override } = req.body;
        await dbRun('UPDATE customers SET cooldown_override = ? WHERE id = ?', [override ? 1 : 0, req.params.id]);
        res.json({ success: true, message: `Cooldown override set to ${override}` });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Database error' });
    }
});

// Delete a customer account
router.delete('/customers/:id', requireAdmin, async (req, res) => {
    try {
        const cust = await dbGet('SELECT name FROM customers WHERE id = ?', [req.params.id]);
        if (!cust) return res.status(404).json({ error: 'Customer not found' });
        // Also delete their appointments
        await dbRun('DELETE FROM appointments WHERE client = ?', [cust.name]);
        await dbRun('DELETE FROM customers WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Customer account and appointments deleted' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Database error' });
    }
});

// Delete an architect account
router.delete('/architects/:id', requireAdmin, async (req, res) => {
    try {
        const arch = await dbGet('SELECT username FROM architects WHERE id = ?', [req.params.id]);
        if (!arch) return res.status(404).json({ error: 'Architect not found' });
        await dbRun('DELETE FROM architects WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Architect account deleted' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Database error' });
    }
});

// ── Global Appointments ─────────────────────────────────────────────────────────────
router.get('/appointments', requireAdmin, async (req, res) => {
    try {
        const appointments = await dbAll('SELECT * FROM appointments ORDER BY created_at DESC');
        res.json({ appointments });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Database error' });
    }
});

// Admin override for appointment status
router.patch('/appointments/:id/status', requireAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'confirmed', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

        await dbRun('UPDATE appointments SET status = ? WHERE id = ?', [status, req.params.id]);
        
        // We won't trigger emails here automatically since it's an admin override, 
        // to keep it simple, or we could if needed.
        
        res.json({ success: true, message: `Appointment status administratively updated to ${status}` });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
