const express  = require('express');
const { dbRun } = require('../db');
const router   = express.Router();

router.post('/', async (req, res) => {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email and message are required' });
    }

    try {
        const info = await dbRun(
            'INSERT INTO contacts (name, email, phone, message) VALUES (?, ?, ?, ?)',
            [name, email, phone || '', message]
        );
        res.json({ success: true, id: info.lastID, message: 'Message sent successfully!' });
    } catch (e) {
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
