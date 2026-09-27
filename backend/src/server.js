require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const incidentRoutes = require('./routes/incidents');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');

const app = express();
// FRONTEND_URL should be set to your deployed frontend (e.g. https://securetrack.vercel.app).
// Falls back to allowing all origins for local development.
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SecureTrack backend listening on port ${PORT}`));

module.exports = app;
