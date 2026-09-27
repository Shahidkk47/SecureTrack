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

// PATCH /api/users/:id/role — promote/demote a user — admin only
// This replaces the old self-service "role" field on signup (DEFECT-01 fix).
router.patch('/:id/role', requireAuth, requireRole('admin'), async (req, res) => {
    const { role } = req.body;
    if (!['employee', 'admin', 'manager'].includes(role)) {
        return res.status(400).json({ error: 'role must be employee, admin, or manager' });
    }
    try {
        const result = await pool.query(
            `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, full_name, email, role`,
            [role, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
