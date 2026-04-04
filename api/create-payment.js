import crypto from "crypto";

export default async function handler(req, res) {
  try {
    const CLIENT_ID = process.env.CLIENT_ID;
    const CLIENT_SECRET = process.env.CLIENT_SECRET;

    // 1. Получаем access token
    const tokenResponse = await fetch(
      "https://api.tatrabanka.sk/tatrapayplus/sandbox/v1/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        }),
      }
    );

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Создаем платеж
    const paymentResponse = await fetch(
      "https://api.tatrabanka.sk/tatrapayplus/sandbox/v1/payments",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          basePayment: {
            instructedAmount: {
              amount: "10.00",
              currency: "EUR",
            },
            endToEndId: "test123",
          },
        }),
      }
    );

    const paymentData = await paymentResponse.json();
    const paymentId = paymentData.paymentId;

    // ❗ ЕСЛИ НЕТ paymentId — сразу ошибка
    if (!paymentId) {
      return res.status(500).json({
        error: "No paymentId",
        full_response: paymentData,
      });
    }

    // 3. ФОРМИРУЕМ ПОДПИСЬ (КЛЮЧЕВОЕ МЕСТО)
    const stringToSign = `paymentId=${paymentId}&client_id=${CLIENT_ID}`;

    const hmac = crypto
      .createHmac("sha256", CLIENT_SECRET)
      .update(stringToSign)
      .digest("hex");

    // 🔍 ЛОГИ (в правильном месте)
    console.log("STRING_TO_SIGN:", stringToSign);
    console.log("HMAC:", hmac);

    // 4. Формируем URL
    const tatraPayPlusUrl = `https://api.tatrabanka.sk/tatrapayplus/sandbox/v1/auth?paymentId=${paymentId}&client_id=${CLIENT_ID}&hmac=${hmac}`;

    console.log("FINAL_URL:", tatraPayPlusUrl);

    // 5. Ответ
    return res.status(200).json({
      status: "success",
      payment_url: tatraPayPlusUrl,
      debug: {
        paymentId,
      },
    });
  } catch (error) {
    console.error("ERROR:", error);

    return res.status(500).json({
      error: "Internal error",
      message: error.message,
    });
  }
}
