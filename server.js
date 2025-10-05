const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Página principal (inicio)
app.get('/', (_r,res)=>res.sendFile(path.join(__dirname,'index.html')));
app.get('/auth', (_r,res)=>res.sendFile(path.join(__dirname,'login.html'))); // ← NUEVA
app.get('/callback', (_r,res)=>res.sendFile(path.join(__dirname,'callback.html')));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
