const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/users — list staff for the assignment dropdown (FR-04) — admin/manager only
// Only returns non-sensitive fields (never password_hash) — matches NFR-01 privacy expectations.
router.get('/', requireAuth, requireRole('admin', 'manager'), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, full_name, role FROM users WHERE role IN ('admin', 'manager') ORDER BY full_name`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
