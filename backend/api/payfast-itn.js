const crypto = require("node:crypto");
const { sqlClient, ensureSchema } = require("./_lib/db");
const { json } = require("./_lib/response");
const { createSignature, isPayfastIp } = require("./_lib/payfast");

function safeEqual(left, right) {
  if (!/^[a-f0-9]{32}$/i.test(left) || !/^[a-f0-9]{32}$/i.test(right)) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

function requestData(body) {
  if (typeof body === "string") {
    return Object.fromEntries(new URLSearchParams(body));
  }
  return body && typeof body === "object" ? body : {};
}

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return json(res, 405, { error: "Method not allowed." });
    }
    const data = requestData(req.body);
    const signature = String(data.signature || "");
    const expectedSignature = createSignature(
      data,
      process.env.PAYFAST_PASSPHRASE || "",
    );
    if (!safeEqual(signature, expectedSignature)) {
      return json(res, 400, { error: "Invalid PayFast signature." });
    }
    if (
      !process.env.PAYFAST_MERCHANT_ID ||
      String(data.merchant_id) !== String(process.env.PAYFAST_MERCHANT_ID)
    ) {
      return json(res, 400, { error: "PayFast merchant ID does not match." });
    }
    const sourceIp = String(
      req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "",
    )
      .split(",")[0]
      .trim();
    if (!isPayfastIp(sourceIp)) {
      return json(res, 403, { error: "PayFast notification source is not allowed." });
    }

    const paymentId = Number(data.m_payment_id);
    if (!Number.isSafeInteger(paymentId) || paymentId < 1) {
      return json(res, 400, { error: "Invalid payment reference." });
    }
    await ensureSchema();
    const sql = sqlClient();
    const rows =
      await sql`SELECT id,user_id,amount_cents,plan,status FROM payments WHERE id=${paymentId} AND provider='payfast'`;
    const payment = rows[0];
    if (!payment) return json(res, 404, { error: "PayFast payment was not found." });
    if (payment.status === "paid") return json(res, 200, { received: true });
    const grossAmount = Number(data.amount_gross);
    if (
      !Number.isFinite(grossAmount) ||
      Math.abs(grossAmount - payment.amount_cents / 100) > 0.01
    ) {
      return json(res, 400, { error: "PayFast payment amount does not match." });
    }
    if (data.payment_status !== "COMPLETE") {
      if (data.payment_status === "CANCELLED") {
        await sql`UPDATE payments SET status='cancelled' WHERE id=${payment.id} AND status='pending'`;
      }
      return json(res, 200, { received: true });
    }

    const sandbox =
      String(process.env.PAYFAST_SANDBOX || "true").toLowerCase() === "true";
    const host = `${sandbox ? "sandbox." : "www."}payfast.co.za`;
    const confirmationParameters = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
      if (key !== "signature" && value !== "") {
        confirmationParameters.append(key, String(value));
      }
    }
    const confirmation = await fetch(`https://${host}/eng/query/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: confirmationParameters,
    });
    if (!confirmation.ok || (await confirmation.text()).trim() !== "VALID") {
      return json(res, 502, { error: "PayFast could not validate the notification." });
    }

    await sql`UPDATE payments SET status='paid',provider_reference=${String(data.pf_payment_id || payment.id)} WHERE id=${payment.id} AND status='pending'`;
    await sql`UPDATE users SET membership_status='active',membership_plan=${payment.plan},membership_expires_at=NOW()+INTERVAL '30 days' WHERE id=${payment.user_id}`;
    return json(res, 200, { received: true });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: "Could not process PayFast notification." });
  }
};