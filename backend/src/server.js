require('dotenv').config();
const express = require('express');

const authRoutes = require('./routes/auth');
const incidentRoutes = require('./routes/incidents');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SecureTrack backend listening on port ${PORT}`));

module.exports = app;
