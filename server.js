const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('✅ API Okta Test Running Successfully!');
});

app.get('/callback', (req, res) => {
  res.send('✅ Login successful — authorization code received!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
