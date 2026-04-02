export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzfIugKNZlz1NncrXe3o2pMZZMC0cDWGs-eQvF2pbHoVF4sDQSH--Z80282C2igkUPr/exec';

  // Normalize native language names to English
  const LANG_MAP = {
    'Français': 'French', 'Español': 'Spanish', 'Deutsch': 'German',
    'Italiano': 'Italian', 'العربية': 'Arabic', 'English': 'English',
  };

  async function translateToEnglish(text) {
    if (!text || text.trim() === '' || text === 'None') return text;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Translate the following text to English. If it is already in English, return it as is. Return only the translated text, nothing else.\n\n${text}`,
        }],
      }),
    });
    const data = await response.json();
    return data?.content?.[0]?.text?.trim() || text;
  }

  try {
    const body = req.body;

    if (body.sheetData) {
      const d = body.sheetData;

      // Translate free-text guest fields to English
      const [commentEn, questionsEn] = await Promise.all([
        translateToEnglish(d.finalComment),
        translateToEnglish(d.new_questions),
      ]);

      // Normalize language name to English
      const languageEn = LANG_MAP[d.language] || d.language || '';

      // Ordered row matching columns A–M exactly
      const row = [
        d.date        || '',  // A: Date
        d.guestName   || '',  // B: Guest Name
        '',                   // C: Facture N° — filled manually by manager
        languageEn,           // D: Language (English name)
        d.bookings    || '',  // E: Services
        d.staffRating || '',  // F: Staff
        d.roomRating  || '',  // G: Room
        d.breakfastRating  || '', // H: Breakfast
        d.hammamRating     || '', // I: Hammam
        d.massageRating    || '', // J: Massage
        d.transportRating  || '', // K: Transfer
        commentEn          || '', // L: Comment (translated)
        questionsEn        || '', // M: New Questions (translated)
      ];

      const headers = ['Date', 'Guest Name', 'Facture N°', 'Language', 'Services',
                       'Staff', 'Room', 'Breakfast', 'Hammam', 'Massage',
                       'Transfer', 'Comment', 'New Questions'];

      await fetch(SHEET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ headers, row })
      });
      return res.status(200).json({ status: 'ok' });
    }

    // Normal chat request
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
