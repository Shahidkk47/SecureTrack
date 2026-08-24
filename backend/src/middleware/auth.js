const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Verifies the JWT on every protected request.
function requireAuth(req, res, next) {
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const token = header.split(' ')[1];
    try {
        req.user = jwt.verify(token, JWT_SECRET); // { id, role }
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// Restricts a route to specific roles (NFR-02, checked before FR-03/FR-04 state changes).
// Usage: requireRole('admin', 'manager')
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: insufficient role' }); // this is what TC-08 checks
        }
        next();
    };
}

module.exports = { requireAuth, requireRole, JWT_SECRET };
