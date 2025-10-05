const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Página principal (inicio)
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.get('/login', (_req, res) => { res.redirect('/auth');
                                 });

app.get('/callback', (_req, res) => res.sendFile(path.join(__dirname, 'callback.html')));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
