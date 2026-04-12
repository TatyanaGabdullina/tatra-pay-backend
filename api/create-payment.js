import axios from "axios";

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ test: "ok" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // TOKEN
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

    // PAYMENT
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
          email: "agrumisk@gmail.com"
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Request-ID": crypto.randomUUID(),
          "IP-Address": "1.1.1.1",
          "Redirect-URI": "https://jenyberg.com/dakujeme",
          "Preferred-Method": "CARD_PAY"
        }
      }
    );

    return res.status(200).json({
      payment_url: paymentResponse.data.tatraPayPlusUrl,
      debug: paymentResponse.data
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message,
      details: error.response?.data || null
    });
  }
}
