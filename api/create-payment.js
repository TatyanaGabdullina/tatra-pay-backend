export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // ===== 1. ПОЛУЧАЕМ ТОКЕН =====
    const tokenResponse = await fetch(
      "https://api.tatrabanka.sk/tatrapayplus/auth/oauth/v2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: "l7233dc796764741eea9371f48353e0e0e",
          client_secret: "ec2379668d9d4a00ba5000e007852634",
          scope: "TATRAPAYPLUS"
        })
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return res.status(500).json({ error: "Token error", debug: tokenData });
    }

    const accessToken = tokenData.access_token;

    // ===== 2. IP ПОЛЬЗОВАТЕЛЯ =====
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket?.remoteAddress ||
      "213.151.208.20";

    // ===== 3. УНИКАЛЬНЫЙ ID =====
    const requestId =
      Date.now().toString() + Math.random().toString(36).substring(2);

    // ===== 4. СОЗДАЁМ ПЛАТЁЖ =====
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
      payment_url: data.tatraPayPlusUrl,
      debug: data
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}
