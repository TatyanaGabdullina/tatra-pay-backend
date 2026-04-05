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
          client_id: "l7233dc796764741eea9371f48353e0e0e",
          client_secret: "ec2379668d9d4a00ba5000e007852634",
          scope: "TATRAPAYPLUS"
        })
      }
    );

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

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
          "Redirect-URI": "https://developer.tatrabanka.sk";
          "Preferred-Method": "CARD_PAY"
        },
        body: JSON.stringify({
          basePayment: {
            instructedAmount: {
              amountValue: 500,
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
            email: "agrumisk@gmail.com",
            externalApplicantId: "test123",
            phone: "+421900000000"
          },
          cardDetail: {
    cardHolder: "Test User",
    billingAddress: {
      streetName: "Test Street",
      buildingNumber: "1",
      townName: "Bratislava",
      postCode: "81101",
      country: "SK"
    }, 
    cardPayLangOverride: "SK",
    isPreAuthorization: false
            
  }
        })
      }
    );

    const data = await paymentResponse.json();

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}
