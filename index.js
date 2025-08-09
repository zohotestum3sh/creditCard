
export default function handler(req, res) {
  res.status(200).json({
    message: "Welcome to the Credit Card Generator API",
    usage: "/api/generate?apikey=YOUR_KEY&type=visa&count=3",
    types: ["visa", "mastercard", "amex", "discover"],
    apiKeys: ["zkart123", "test456", "demo789"]
  });
}
