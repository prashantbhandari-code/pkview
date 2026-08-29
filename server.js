const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));

// Health check — fast response for Render's health probe
app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`pkview running on port ${PORT}`);
});