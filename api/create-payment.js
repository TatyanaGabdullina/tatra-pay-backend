import axios from "axios";

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ test: "ok" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1. Получаем токен
    const tokenResponse = await axios.post(
      "https://api.tatrabanka.sk/tatrapayplus/auth/oauth/v2/token",
      "grant_type=client_credentials&client_id=l7233dc796764741eea9371f48353e0e0e&client_secret=ec2379668d9d4a00ba5000e007852634&scope=TATRAPAYPLUS",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // 2. Создаём платёж (КАК В POSTMAN)
    const paymentResponse = await axios.post(
      "https://api.tatrabanka.sk/tatrapayplus/v1/payments",
      {
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
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Request-ID": "test123",
          "IP-Address": "8.8.8.8",
          "Redirect-URI": "https://jenyberg.com/dakujeme"
        }
      }
    );

    return res.status(200).json({
      status: "success",
      payment_url: paymentResponse.data.tatraPayPlusUrl || null,
      debug: paymentResponse.data
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message,
      details: error.response?.data || null
    });
  }
}
