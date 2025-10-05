const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (_req, res) => res.send('✅ API Okta Test Running Successfully!'));

app.get('/login', (_req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/callback', (_req, res) => res.sendFile(path.join(__dirname, 'callback.html')));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
