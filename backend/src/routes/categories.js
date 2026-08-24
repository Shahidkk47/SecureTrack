const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/categories — list all categories (used by the incident submission form)
router.get('/', requireAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name FROM categories ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
