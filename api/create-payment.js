export default async function handler(req, res) { 
  if (req.method === "GET") {
    return res.status(200).json({ test: "ok" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const tokenResponse = await fetch(
      "https://api.tatrabanka.sk/tatrapayplus/sandbox/auth/oauth/v2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: "ТВОЙ_CLIENT_ID",
          client_secret: "ТВОЙ_CLIENT_SECRET",
          scope: "TATRAPAYPLUS"
        })
      }
    );

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return res.status(500).json({
        error: "No access token received",
        token_response: tokenData
      });
    }

    const paymentResponse = await fetch(
      "https://api.tatrabanka.sk/tatrapayplus/sandbox/v1/payments",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Request-ID": crypto.randomUUID(),
          "IP-Address": "192.168.8.78",
          "Redirect-URI": "https://jenyberg.com/dakujeme"
        },
        body: JSON.stringify({
          basePayment: {
            instructedAmount: {
              amountValue: "500.00",
              currency: "EUR"
            },
            endToEndId: "order-123"
          },
          userData: {
            firstName: "Test",
            lastName: "User",
            email: "test@test.com"
          }
        })
      }
    );

    const data = await paymentResponse.json();

    return res.status(200).json({
      status: "success",
      payment_url: data.tatraPayPlusUrl || null,
      full_response: data
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}
}
