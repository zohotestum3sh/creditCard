// Vercel Serverless Function: api/generate.js
// Ready-to-deploy dummy credit card generator API
// Features:
// - Whitelisted API keys via environment variable (API_KEYS, comma-separated)
// - Supports multiple keys (starts with `zkart123` by default)
// - Query or header key (apikey or x-api-key)
// - Card types: visa, mastercard, amex
// - Optional includeCVV (true/false), includeExpiry (true/false)
// - `count` up to 50
// - Returns Luhn-valid numbers
// - Adds `issuer: "Zoho Card"` to each card

// Save this file as: /api/generate.js

const DEFAULT_KEYS = 'zkart123';

function parseApiKeysFromEnv() {
  const raw = process.env.API_KEYS || DEFAULT_KEYS;
  return raw.split(',').map(k => k.trim()).filter(Boolean);
}

function luhnCheckDigit(numberWithoutCheckDigit) {
  // returns single check digit as string
  let sum = 0;
  let double = true; // we'll process from right to left (excluding check digit space)
  for (let i = numberWithoutCheckDigit.length - 1; i >= 0; i--) {
    let d = parseInt(numberWithoutCheckDigit[i], 10);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  const mod = sum % 10;
  const check = (10 - mod) % 10;
  return String(check);
}

function generateNumber(prefixes, length) {
  // prefixes: array of strings. Choose one at random.
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  let number = prefix;
  while (number.length < length - 1) {
    number += Math.floor(Math.random() * 10).toString();
  }
  const check = luhnCheckDigit(number);
  return number + check;
}

function randomCVV(type) {
  if (type === 'amex') {
    // Amex CVV is 4 digits
    return String(Math.floor(Math.random() * 9000) + 1000);
  }
  return String(Math.floor(Math.random() * 900) + 100);
}

function randomExpiry() {
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const year = new Date().getFullYear() + Math.floor(Math.random() * 5) + 1; // 1-5 years ahead
  return `${month}/${year}`;
}

function sanitizeType(t) {
  if (!t) return 'visa';
  const s = String(t).toLowerCase();
  if (['visa','mastercard','amex'].includes(s)) return s;
  return 'visa';
}

module.exports = async (req, res) => {
  try {
    // CORS (allow all for now) - adapt for production
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    const keys = parseApiKeysFromEnv();

    const apikey = (req.query.apikey || req.headers['x-api-key'] || '').trim();
    if (!apikey || !keys.includes(apikey)) {
      return res.status(401).json({ error: 'Unauthorized. Provide valid apikey as query param or x-api-key header.' });
    }

    const type = sanitizeType(req.query.type);
    let count = parseInt(req.query.count || '1', 10);
    if (isNaN(count) || count < 1) count = 1;
    if (count > 50) count = 50;

    const includeCVV = (req.query.includeCVV || 'true').toString().toLowerCase() !== 'false';
    const includeExpiry = (req.query.includeExpiry || 'true').toString().toLowerCase() !== 'false';

    // Prefix choices
    const prefixMap = {
      visa: ['4'], // 16 digits
      mastercard: ['51','52','53','54','55'], // simplified
      amex: ['34','37'] // 15 digits
    };

    const lenMap = { visa: 16, mastercard: 16, amex: 15 };

    const cards = [];
    for (let i = 0; i < count; i++) {
      const number = generateNumber(prefixMap[type], lenMap[type]);
      const card = {
        type: type,
        number: number,
        issuer: 'Zoho Card'
      };
      if (includeCVV) card.cvv = randomCVV(type);
      if (includeExpiry) card.expiry = randomExpiry();
      cards.push(card);
    }

    return res.status(200).json({ cards });
  } catch (err) {
    console.error('API error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/*
README / Deployment Instructions

1) Project Structure

   /api/generate.js    <-- this file
   package.json

2) package.json (minimal)
{
  "name": "dummy-cc-api",
  "version": "1.0.0",
  "main": "api/generate.js",
  "license": "MIT"
}

3) Environment Variables (set on Vercel dashboard or during deployment)
   - API_KEYS (comma separated). Example: zkart123,teamkey456
     If omitted defaults to: zkart123

4) Deploying to Vercel
   - Install Vercel CLI (optional) or use Vercel dashboard
   - From project root (where `api` folder lives), run:
       vercel deploy --prod
   - Then, set the environment variable in the Vercel project settings: API_KEYS

5) Example requests

cURL (query param):
curl "https://<your-deployment>.vercel.app/api/generate?apikey=zkart123&type=visa&count=3&includeCVV=true&includeExpiry=true"

cURL (header):
curl -H "x-api-key: zkart123" "https://<your-deployment>.vercel.app/api/generate?type=mastercard&count=2"

6) Notes & Security
   - This endpoint generates Luhn-valid dummy numbers only for testing. Do NOT use these for real transactions.
   - Keep your API_KEYS secret. For higher security, consider using a proper auth system.
   - CORS is wide open for convenience—restrict origin in production.

*/
