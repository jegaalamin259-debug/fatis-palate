export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    const {
      amount,
      email,
      name,
      phone,
      orderId
    } = req.body || {};

    if (!amount || !email || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Missing payment information."
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount."
      });
    }

    const txRef = `FATIS-${orderId}-${Date.now()}`;

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:5500";

    const redirectUrl =
      `${baseUrl}/payment-success.html`;

    const response = await fetch(
      "https://api.flutterwave.com/v3/payments",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${process.env.FLW_SECRET_KEY}`,

          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          tx_ref: txRef,

          amount: numericAmount,

          currency: "NGN",

          redirect_url: redirectUrl,

          customer: {
            email: email,
            name: name || "Fatis Palate Customer",
            phonenumber: phone || ""
          },

          customizations: {
            title: "Fatis Palate",
            description: "Fatis Palate Restaurant Order"
          },

          meta: {
            orderId: orderId
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok || data.status !== "success") {
      console.error(
        "Flutterwave error:",
        data
      );

      return res.status(500).json({
        success: false,
        message: "Unable to create Flutterwave payment."
      });
    }

    return res.status(200).json({
      success: true,
      paymentLink: data.data.link,
      txRef: txRef
    });

  } catch (error) {

    console.error(
      "Payment server error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Payment service is currently unavailable."
    });
  }
}