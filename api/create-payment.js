export default async function handler(req, res) {
  // Разрешаем только POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 🔐 1. Получаем токен
    const tokenResponse = await fetch(
      "https://api.tatrabanka.sk/tatrapayplus/auth/oauth/v2/token",
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

    if (!tokenData.access_token) {
      return res.status(500).json({
        error: "Failed to get token",
        debug: tokenData
      });
    }

    const accessToken = tokenData.access_token;

    // 🌍 2. Получаем IP пользователя
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket?.remoteAddress ||
      "127.0.0.1";

    // 🔑 3. Генерируем UUID (без crypto.randomUUID — чтобы точно работало)
    const requestId = Math.random().toString(36).substring(2) + Date.now();

    // 💳 4. Создаём платёж
    const paymentResponse = await fetch(
      "https://api.tatrabanka.sk/tatrapayplus/v1/payments",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Request-ID": requestId,
          "IP-Address": ip,
          "Redirect-URI": "https://jenyberg.com/dakujeme",
          "Preferred-Method": "CARD_PAY"
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
      success: true,
      payment_url: data.tatraPayPlusUrl || null,
      debug: data
    });

  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
}
