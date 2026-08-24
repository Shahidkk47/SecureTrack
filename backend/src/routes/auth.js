const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 12;

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    const { full_name, email, password, role } = req.body;

    if (!full_name || !email || !password || !role) {
        return res.status(400).json({ error: 'full_name, email, password, and role are required' });
    }
    if (!['employee', 'admin', 'manager'].includes(role)) {
        return res.status(400).json({ error: 'role must be employee, admin, or manager' });
    }

    try {
        const password_hash = await bcrypt.hash(password, SALT_ROUNDS); // NFR-01, checked by TC-07
        const result = await pool.query(
            `INSERT INTO users (full_name, email, password_hash, role)
             VALUES ($1, $2, $3, $4)
             RETURNING id, full_name, email, role, created_at`,
            [full_name, email, password_hash, role]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // unique_violation on email
            return res.status(409).json({ error: 'An account with that email already exists' });
        }
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'email and password are required' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({ token, user: { id: user.id, full_name: user.full_name, role: user.role } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
