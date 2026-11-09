// Vercel serverless proxy for SofaScore's public web endpoints.
// Keeps browser CORS restrictions away from the client-side application.
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Accept, Content-Type');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const path = typeof req.query.path === 'string' ? req.query.path : '';
  // Only allow relative SofaScore API paths; prevent arbitrary URL proxying.
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('..') || path.length > 500) {
    return res.status(400).json({ error: 'Invalid SofaScore API path' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const upstream = await fetch(`https://www.sofascore.com/api/v1${path}`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://www.sofascore.com/',
        'Origin': 'https://www.sofascore.com'
      }
    });
    const body = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json; charset=utf-8');
    return res.send(body);
  } catch (error) {
    console.error('SofaScore proxy error:', error);
    return res.status(502).json({ error: 'SofaScore upstream is temporarily unavailable' });
  } finally {
    clearTimeout(timeout);
  }
};
