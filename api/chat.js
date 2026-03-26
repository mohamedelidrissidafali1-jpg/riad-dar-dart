export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzfIugKNZlz1NncrXe3o2pMZZMC0cDWGs-eQvF2pbHoVF4sDQSH--Z80282C2igkUPr/exec';

  try {
    const body = req.body;

    // If sheetData is present, forward to Google Sheet
    if (body.sheetData) {
      const sheetRes = await fetch(SHEET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ ...body.sheetData, factureNumber: '' })
      });
      return res.status(200).json({ status: 'ok' });
    }

    // Otherwise handle normal chat
    const { messages, system } = body;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
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
