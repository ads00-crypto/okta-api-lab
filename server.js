const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// sirve los html desde la carpeta raíz
app.get('/', (_r,res)=>res.sendFile(path.join(__dirname,'index.html')));
app.get('/login', (_r,res)=>res.sendFile(path.join(__dirname,'login.html')));
app.get('/callback', (_r,res)=>res.sendFile(path.join(__dirname,'callback.html')));

// salud opcional
app.get('/health', (_r,res)=>res.send('ok'));

app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
