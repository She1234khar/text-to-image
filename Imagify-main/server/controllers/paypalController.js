import axios from "axios";
import userModel from "../models/userModel.js";
import transactionModel from "../models/transactionModel.js";

const PLAN_MAP = {
  Basic: { amount: 10, currency: "USD", credits: 100, description: "Basic credits" },
  Advanced: { amount: 50, currency: "USD", credits: 500, description: "Advanced credits" },
  Business: { amount: 250, currency: "USD", credits: 5000, description: "Business credits" },
};

const getAccessToken = async () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  const base = process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

  const tokenRes = await axios.post(
    `${base}/v1/oauth2/token`,
    new URLSearchParams({ grant_type: "client_credentials" }),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      auth: { username: clientId, password: secret },
    }
  );
  return { accessToken: tokenRes.data.access_token, base };
};

const createOrder = async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = PLAN_MAP[planId];
    if (!plan) {
      return res.json({ success: false, message: "Invalid plan" });
    }

    const { accessToken, base } = await getAccessToken();
    const orderRes = await axios.post(
      `${base}/v2/checkout/orders`,
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: { currency_code: plan.currency, value: plan.amount.toFixed(2) },
            description: plan.description,
          },
        ],
      },
      { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
    );

    return res.json({ success: true, id: orderRes.data.id });
  } catch (error) {
    const errData = error?.response?.data;
    console.log("PayPal create error:", errData || error.message);
    return res.json({ success: false, message: errData?.message || errData?.name || error.message || "Failed to create PayPal order", details: errData });
  }
};

const captureOrder = async (req, res) => {
  try {
    const { orderId, planId, userId } = req.body;
    const plan = PLAN_MAP[planId];
    if (!orderId || !plan) {
      return res.json({ success: false, message: "Invalid capture request" });
    }

    const { accessToken, base } = await getAccessToken();
    const captureRes = await axios.post(
      `${base}/v2/checkout/orders/${orderId}/capture`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
    );

    const status = captureRes.data.status;
    if (status !== "COMPLETED") {
      return res.json({ success: false, message: "Payment not completed" });
    }

    // Credit the user
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    user.creditBalance = (user.creditBalance || 0) + plan.credits;
    await user.save();

    // Extract capture details for invoice
    const purchaseUnit = captureRes.data.purchase_units?.[0];
    const paymentCapture = purchaseUnit?.payments?.captures?.[0];
    const captureId = paymentCapture?.id;
    const amountValue = Number(paymentCapture?.amount?.value || plan.amount);
    const payerEmail = captureRes.data.payer?.email_address;
    const payerName = `${captureRes.data.payer?.name?.given_name || ''} ${captureRes.data.payer?.name?.surname || ''}`.trim();

    // Save transaction
    await transactionModel.create({
      userId,
      orderId,
      captureId,
      amount: amountValue,
      currency: plan.currency,
      planId,
      creditsAdded: plan.credits,
      payerEmail,
      payerName,
      raw: captureRes.data,
    });

    return res.json({
      success: true,
      message: "Payment captured",
      credits: user.creditBalance,
      invoice: {
        orderId,
        captureId,
        amount: amountValue,
        currency: plan.currency,
        planId,
        creditsAdded: plan.credits,
        payerEmail,
        payerName,
      }
    });
  } catch (error) {
    const errData = error?.response?.data;
    console.log("PayPal capture error:", errData || error.message);
    return res.json({ success: false, message: errData?.message || errData?.name || error.message || "Failed to capture PayPal order", details: errData });
  }
};

export { createOrder, captureOrder };


