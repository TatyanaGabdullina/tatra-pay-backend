export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ test: "ok" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1. Получаем токен
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

    // 2. Создаём платёж
    const paymentResponse = await fetch(
      "https://api.tatrabanka.sk/tatrapayplus/sandbox/v1/payments",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Request-ID": crypto.randomUUID(),
          "IP-Address": req.headers["x-forwarded-for"] || "8.8.8.8",
          "Redirect-URI": "https://jenyberg.com/dakujeme"
        },
        body: JSON.stringify({
          basePayment: {
            instructedAmount: {
              amountValue: 1,
              currency: "EUR"
            },
            endToEnd: {
              variableSymbol: "123",
              specificSymbol: "123",
              constantSymbol: "0308"
            }
          },
          userData: {
            firstName: "Test",
            lastName: "User",
            email: "test@test.com"
          },
          cardDetail: {
            cardHolder: "Test User",
            billingAddress: {
              streetName: "Test Street",
              buildingNumber: "1",
              townName: "Bratislava",
              postCode: "81101",
              country: "SK"
            }
          }
        })
      }
    );

    const data = await paymentResponse.json();

    return res.status(200).json({
      payment_url: data.tatraPayPlusUrl || null,
      debug: data
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}
