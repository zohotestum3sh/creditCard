
function generateCardNumber(prefix, length) {
  let cardNumber = prefix.toString();
  while (cardNumber.length < (length - 1)) {
    cardNumber += Math.floor(Math.random() * 10).toString();
  }
  let sum = 0;
  let shouldDouble = true;
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber.charAt(i));
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return cardNumber + checkDigit.toString();
}

export default function handler(req, res) {
  const { apikey, type = "visa", count = 1 } = req.query;
  const validKeys = ["zkart123", "test456", "demo789"];

  if (!apikey || !validKeys.includes(apikey)) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  const cardTypes = {
    visa: { prefix: "4", length: 16 },
    mastercard: { prefix: "5", length: 16 },
    amex: { prefix: "34", length: 15 },
    discover: { prefix: "6011", length: 16 }
  };

  if (!cardTypes[type]) {
    return res.status(400).json({ error: "Invalid card type" });
  }

  const { prefix, length } = cardTypes[type];
  const cards = Array.from({ length: parseInt(count) }, () =>
    ({
      issuer: "Zoho Card",
      type,
      number: generateCardNumber(prefix, length)
    })
  );

  res.status(200).json({ cards });
}
