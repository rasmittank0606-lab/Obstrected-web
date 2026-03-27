const express  = require('express');
const { dbGet, dbAll } = require('../db');
const router   = express.Router();

const projectDetails = {
    'rohan.mehta':   { projectName:'Skyline Villa',         progress:75, start:'2025-09-01', end:'2026-06-30' },
    'sneha.doshi':   { projectName:'Amore Apartment',       progress:40, start:'2025-11-15', end:'2026-09-15' },
    'karan.patel':   { projectName:'Sunrise Bunglow',       progress:90, start:'2025-07-01', end:'2026-04-15' },
    'priya.shah':    { projectName:'Sky Tower Penthouse',   progress:20, start:'2026-01-10', end:'2026-12-31' },
    'vikram.nair':   { projectName:'Serenity Villa',        progress:60, start:'2025-10-01', end:'2026-08-01' },
    'divya.tiwari':  { projectName:'Elite Penthouse',       progress:90, start:'2025-08-01', end:'2026-03-30' },
    'harish.pandya': { projectName:'Summit View Villa',     progress:50, start:'2025-12-01', end:'2026-10-01' },
    'amit.jain':     { projectName:'Twin Horizon Duplex',   progress:45, start:'2025-10-15', end:'2026-07-15' },
    'nisha.trivedi': { projectName:'Coastal Duplex',        progress:55, start:'2025-09-15', end:'2026-07-01' },
    'pooja.iyer':    { projectName:'Sky Penthouse',         progress:20, start:'2026-02-01', end:'2027-01-31' },
};

function requireCust(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'customer') {
        return res.status(401).json({ error: 'Not authenticated as customer' });
    }
    next();
}

router.get('/dashboard', requireCust, async (req, res) => {
    try {
        const cust = await dbGet('SELECT * FROM customers WHERE username = ?', [req.session.user.username]);
        if (!cust) return res.status(404).json({ error: 'Customer not found' });

        const { password: _pw, ...safe } = cust;
        const project = projectDetails[cust.username] || {
            projectName: cust.houseType + ' Project',
            progress: 50,
            start: '2026-01-01',
            end:   '2026-12-31',
        };

        const docs = [
            { name:'Site Plan & Layout',       type:'PDF', date:'2025-09-10', status:'delivered' },
            { name:'3D Architectural Render',  type:'IMG', date:'2025-10-05', status:'delivered' },
            { name:'Construction Agreement',   type:'PDF', date:'2025-09-15', status:'delivered' },
        ];

        res.json({ customer: { ...safe, role: 'customer' }, project, docs });
    } catch (e) {
        res.status(500).json({ error: 'Database error' });
    }
});

router.get('/appointments', requireCust, async (req, res) => {
    try {
        const cust = await dbGet('SELECT * FROM customers WHERE username = ?', [req.session.user.username]);
        if (!cust) return res.status(404).json({ error: 'Customer not found' });

        const rows = await dbAll(
            'SELECT * FROM appointments WHERE LOWER(client) = LOWER(?) OR LOWER(client) = LOWER(?) ORDER BY date ASC',
            [cust.name, cust.username]
        );
        res.json({ appointments: rows });
    } catch (e) {
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
