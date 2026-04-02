export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzfIugKNZlz1NncrXe3o2pMZZMC0cDWGs-eQvF2pbHoVF4sDQSH--Z80282C2igkUPr/exec';

  // Convert numeric rating to star emojis; leave non-numeric values (Yes/No/'') as-is
  function toStars(val) {
    const n = parseInt(val, 10);
    return (!isNaN(n) && n > 0) ? '⭐'.repeat(n) : (val || '');
  }

  // Normalize native language names to English
  const LANG_MAP = {
    'Français': 'French', 'Español': 'Spanish', 'Deutsch': 'German',
    'Italiano': 'Italian', 'العربية': 'Arabic', 'English': 'English',
  };

  async function translateToEnglish(text) {
    if (!text || text.trim() === '' || text === 'None') return text;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: controller.signal,
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
      clearTimeout(timeout);
      const data = await response.json();
      return data?.content?.[0]?.text?.trim() || text;
    } catch (e) {
      return text; // fallback: return original text if translation fails or times out
    }
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

      // Flat payload — matches what the Apps Script expects
      const payload = {
        date:             d.date             || '',
        guestName:        d.guestName        || '',
        language:         languageEn,
        bookings:         d.bookings         || '',
        staffRating:      toStars(d.staffRating),
        roomRating:       toStars(d.roomRating),
        breakfastRating:  toStars(d.breakfastRating),
        hammamRating:     toStars(d.hammamRating),
        massageRating:    toStars(d.massageRating),
        transportRating:  toStars(d.transportRating),
        finalComment:     commentEn          || '',
        new_questions:    questionsEn        || '',
      };

      console.log('Sending to sheet:', JSON.stringify(payload));

      const sheetRes = await fetch(SHEET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
      const sheetText = await sheetRes.text();
      console.log('Sheet response:', sheetText);

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
