const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Small helper to write an audit_logs row (FR-08). audit_logs is insert-only
// at the DB level (see migration trigger), so this is the ONLY way rows appear.
async function writeAuditLog(client, incidentId, userId, action, details) {
    await client.query(
        `INSERT INTO audit_logs (incident_id, user_id, action, details)
         VALUES ($1, $2, $3, $4)`,
        [incidentId, userId, action, details]
    );
}

// POST /api/incidents  — create incident (FR-01, FR-02)
router.post('/', requireAuth, async (req, res) => {
    const { description, category_id } = req.body;
    if (!description || !category_id) {
        // this is what TC-02 checks: missing required field -> 400
        return res.status(400).json({ error: 'description and category_id are required' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(
            `INSERT INTO incidents (description, category_id, reported_by_id)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [description, category_id, req.user.id]
        );
        const incident = result.rows[0];
        await writeAuditLog(client, incident.id, req.user.id, 'CREATED', 'Incident submitted');
        await client.query('COMMIT');
        res.status(201).json(incident); // TC-01 / TC-03: new unique ID, status New
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// GET /api/incidents/{id} — view incident detail (FR-05)
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM incidents WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Incident not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/incidents/{id}/status — update status (FR-05, FR-06) — admin/manager only (NFR-02)
router.patch('/:id/status', requireAuth, requireRole('admin', 'manager'), async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['New', 'In Progress', 'Resolved', 'Closed'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(
            `UPDATE incidents SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
            [status, req.params.id]
        );
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Incident not found' });
        }
        const incident = result.rows[0];
        await writeAuditLog(client, incident.id, req.user.id, 'STATUS_CHANGED', `Status set to ${status}`);
        await client.query('COMMIT');

        // FR-06: fire-and-forget notification — plug in a real email provider here.
        // notifyReporter(incident.reported_by_id, incident.id, status);

        res.json(incident); // TC-05 checks updated_at changes; TC-06 checks notification fires
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// PATCH /api/incidents/{id}/severity — update severity (FR-03) — admin/manager only (NFR-02)
router.patch('/:id/severity', requireAuth, requireRole('admin', 'manager'), async (req, res) => {
    const { severity } = req.body;
    const validSeverities = ['Low', 'Medium', 'High', 'Critical'];
    if (!validSeverities.includes(severity)) {
        return res.status(400).json({ error: `severity must be one of: ${validSeverities.join(', ')}` }); // TC-04 checks this
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(
            `UPDATE incidents SET severity = $1, updated_at = now() WHERE id = $2 RETURNING *`,
            [severity, req.params.id]
        );
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Incident not found' });
        }
        const incident = result.rows[0];
        await writeAuditLog(client, incident.id, req.user.id, 'SEVERITY_CHANGED', `Severity set to ${severity}`);
        await client.query('COMMIT');
        res.json(incident); // TC-04: severity persists correctly
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// PATCH /api/incidents/{id}/assign — assign/escalate to staff (FR-04) — admin/manager only (NFR-02)
router.patch('/:id/assign', requireAuth, requireRole('admin', 'manager'), async (req, res) => {
    const { assigned_user_id } = req.body;
    if (!assigned_user_id) {
        return res.status(400).json({ error: 'assigned_user_id is required' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(
            `UPDATE incidents SET assigned_user_id = $1, updated_at = now() WHERE id = $2 RETURNING *`,
            [assigned_user_id, req.params.id]
        );
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Incident not found' });
        }
        const incident = result.rows[0];
        await writeAuditLog(client, incident.id, req.user.id, 'ASSIGNED', `Assigned to user ${assigned_user_id}`);
        await client.query('COMMIT');
        res.json(incident); // FR-04: assigned_user_id updates and is visible on incident detail
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// GET /api/incidents — list/report, admin only (FR-07) — this is what TC-08 tests against
router.get('/', requireAuth, requireRole('admin', 'manager'), async (req, res) => {
    const { from, to, status } = req.query;
    const conditions = [];
    const params = [];

    if (from) { params.push(from); conditions.push(`created_at >= $${params.length}`); }
    if (to) { params.push(to); conditions.push(`created_at <= $${params.length}`); }
    if (status) { params.push(status); conditions.push(`status = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    try {
        const result = await pool.query(`SELECT * FROM incidents ${where} ORDER BY created_at DESC`, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
