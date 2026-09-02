const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const TMDB_API_KEY = process.env.TMDB_API_KEY || '4b153b123319df27bb67fcbfe219537d';

// --- Security Headers (helmet-like) ---
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.removeHeader('X-Powered-By');
  next();
});

app.use(express.static(path.join(__dirname)));

// --- TMDB API Proxy (hides API key from client) ---
const TMDB_ALLOWED_PATHS = /^(discover|search|tv|movie)\//;
app.get('/api/tmdb/*', (req, res) => {
  const tmdbPath = req.params[0];

  if (!TMDB_ALLOWED_PATHS.test(tmdbPath)) {
    return res.status(403).json({ error: 'Disallowed endpoint' });
  }

  const qs = new URLSearchParams(req.query).toString();
  const url = `https://api.themoviedb.org/3/${tmdbPath}?api_key=${TMDB_API_KEY}${qs ? '&' + qs : ''}`;

  fetch(url)
    .then(r => {
      if (!r.ok) throw new Error(`TMDB ${r.status}`);
      return r.json();
    })
    .then(data => res.json(data))
    .catch(err => res.status(502).json({ error: err.message }));
});

// Health check — fast response for Render's health probe
app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`pkview running on port ${PORT}`);
});