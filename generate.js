export default function handler(req, res) {
  const { apikey, type = "visa", count = 1, includeCVV = "true", includeExpiry = "true" } = req.query;

  // Allow multiple keys
  const validKeys = (process.env.API_KEYS || "").split(",");
  if (!apikey || !validKeys.includes(apikey)) {
    return res.status(401).json({ error: "Invalid API Key" });
  }

  // Generate random card numbers
  const cards = [];
  for (let i = 0; i < count; i++) {
    const number = generateCardNumber(type);
    const card = {
      issuer: "Zoho Card",
      number,
      ...(includeCVV === "true" && { cvv: Math.floor(100 + Math.random() * 900).toString() }),
      ...(includeExpiry === "true" && { expiry: `${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}/${new Date().getFullYear() + Math.floor(Math.random() * 5)}` })
    };
    cards.push(card);
  }

  res.status(200).json({ cards });
}

function generateCardNumber(type) {
  let prefix = type === "visa" ? "4" : "5";
  let number = prefix;
  for (let i = 0; i < 15; i++) {
    number += Math.floor(Math.random() * 10).toString();
  }
  return number;
}
