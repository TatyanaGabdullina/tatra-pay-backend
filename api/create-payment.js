import axios from "axios";

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ test: "ok" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1. Получаем access token
    const tokenResponse = await axios.post(
      "https://api.tatrabanka.sk/tatrapayplus/sandbox/auth/oauth/v2/token",
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: "l7233dc796764741eea9371f48353e0e0e",
        client_secret: "ec2379668d9d4a00ba5000e007852634",
        scope: "TATRAPAYPLUS"
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // 2. Создаём платеж
    const paymentResponse = await axios.post(
      "https://api.tatrabanka.sk/tatrapayplus/sandbox/v1/payments",
      {
        basePayment: {
          instructedAmount: {
            amountValue: 1,
            currency: "EUR"
          }
        },
        userData: {
          firstName: "Test",
          lastName: "User",
          email: "agrumisk@gmail.com"
        },
        redirectUrls: {
          success: "https://jenyberg.com/dakujeme",
          cancel: "https://jenyberg.com/dakujeme",
          fail: "https://jenyberg.com/dakujeme"
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Request-ID": "test-request-123",
          "IP-Address": req.headers["x-forwarded-for"] || "8.8.8.8",
          "Redirect-URI": "https://jenyberg.com/dakujeme",
          "Preferred-Method": "CARD_PAY"
        }
      }
    );

    const data = paymentResponse.data;

    return res.status(200).json({
      status: "success",
      payment_url: data.tatraPayPlusUrl || null,
      debug: data
    });

  } catch (error) {
    return res.status(500).json({
      error: error.response?.data || error.message
    });
  }
}
