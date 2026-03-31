export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = "https://api.tatrabanka.sk/tatrapayplus/sandbox/auth/oauth/v2/token";

  try {
    const response = await fetch("https://api.tatrabanka.sk/tatrapayplus/sandbox/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Request-ID": crypto.randomUUID(),
        "IP-Address": "127.0.0.1",
        "Redirect-URI": "https://jenyberg.com/dakujeme"
      },
      body: JSON.stringify({
        basePayment: {
          instructedAmount: {
            amountValue: 500,
            currency: "EUR"
          }
        },
        userData: {
          firstName: "Test",
          lastName: "User",
          email: "test@test.com"
        }
      })
    });

    const data = await response.json();

    return res.status(200).json({
      status: "success",
      payment_url: data.tatraPayPlusUrl
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
