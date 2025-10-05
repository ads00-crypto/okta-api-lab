const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (_req, res) => res.send('✅ API Okta Test Running Successfully!'));
app.get('/callback', (_req, res) => res.send('✅ Login successful — authorization code received!'));
app.get('/health', (_req, res) => res.send('ok'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
