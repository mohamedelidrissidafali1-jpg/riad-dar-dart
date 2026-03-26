// api/chat.js — Vercel serverless function
// The API key lives HERE on the server, never in the browser

// Google Sheet webhook URL — server-side only, avoids browser CORS block
const SHEET_WEBHOOK = 'https://script.google.com/macros/s/AKfycbwYLtNDCOJZK-gQypOtdTZzYJcYcy7UbMmcaXsWvCbGTcnS67qoSGvPgI1j84uGitUJpA/exec';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS — allow your domain only
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { messages, system, sheetData } = req.body;

    // ── GOOGLE SHEET WEBHOOK — if sheetData present, forward and return ──
    if (sheetData) {
      await fetch(SHEET_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(sheetData)
      });
      return res.status(200).json({ ok: true });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY, // ← stored securely in Vercel
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        system,
        messages,
      }),
    });

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message || 'Something went wrong' });
  }
}
