const { sqlClient, ensureSchema } = require("./_lib/db");
const { requireAuth } = require("./_lib/auth");
const { json } = require("./_lib/response");
const { createSignature } = require("./_lib/payfast");
const amounts = { R50: 5000, R75: 7500, R100: 10000 };
const JOINING_FEE = 10000; // R100 once-off
const DAILY_RATE = 1000;   // R10 per day

function daysFromAmount(cents) { return Math.floor(cents / DAILY_RATE); }

function paymentMethods() {
  const demo =
    String(process.env.DEMO_PAYMENT_MODE || "true").toLowerCase() === "true";
  return {
    demo,
    stripe: !demo && Boolean(process.env.STRIPE_SECRET_KEY),
    payfast:
      !demo &&
      Boolean(process.env.PAYFAST_MERCHANT_ID && process.env.PAYFAST_MERCHANT_KEY),
    manualEft:
      !demo &&
      Boolean(
        process.env.MANUAL_EFT_BANK_NAME &&
          process.env.MANUAL_EFT_ACCOUNT_NAME &&
          process.env.MANUAL_EFT_ACCOUNT_NUMBER &&
          process.env.MANUAL_EFT_BRANCH_CODE,
      ),
  };
}

module.exports = async (req, res) => {
  try {
    await ensureSchema();
    const u = requireAuth(req, res);
    if (!u) return;
    const sql = sqlClient();
    if (req.method === "GET") {
      const r = await sql`SELECT id,amount_cents,plan,provider,provider_reference,status,created_at FROM payments WHERE user_id=${u.id} ORDER BY created_at DESC LIMIT 20`;
      const joiningPaid = r.some(p => p.plan === 'joining' && p.status === 'paid');
      return json(res, 200, { payments: r, methods: paymentMethods(), joiningFee: JOINING_FEE, dailyRate: DAILY_RATE, joiningPaid });
    }
    if (req.method === "POST") {
      const body = req.body || {};
      const action = body.action || "create-checkout";
      if (action === "verify-session") {
        if (!process.env.STRIPE_SECRET_KEY)
          return json(res, 400, { error: "Stripe is not configured." });
        const sessionId = String(body.sessionId || "");
        if (!sessionId)
          return json(res, 400, { error: "Missing checkout session." });
        const Stripe = require("stripe");
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (String(session.metadata?.userId) !== String(u.id))
          return json(res, 403, {
            error: "This checkout session does not belong to this account.",
          });
        if (session.payment_status === "paid") {
          const plan = session.metadata?.plan;
          if (!amounts[plan])
            return json(res, 400, { error: "Invalid membership plan." });
          await sql`UPDATE payments SET status='paid' WHERE provider_reference=${session.id} AND user_id=${u.id}`;
          await sql`UPDATE users SET membership_status='active',membership_plan=${plan},membership_expires_at=NOW()+INTERVAL '30 days' WHERE id=${u.id}`;
          return json(res, 200, {
            paid: true,
            message: "Payment confirmed. Your membership is now active.",
          });
        }
        return json(res, 200, {
          paid: false,
          message: "Payment has not been confirmed yet.",
        });
      }
      const plan = body.plan;
      const type = body.type || 'topup'; // 'joining' or 'topup'
      const methods = paymentMethods();
      const paymentMethod = String(body.method || '');

      if (paymentMethod === 'demo' && methods.demo) {
        const ref = 'DEMO-' + Date.now();
        if (type === 'joining') {
          // Check if already paid joining fee
          const existing = await sql`SELECT id FROM payments WHERE user_id=${u.id} AND plan='joining' AND status='paid'`;
          if (existing[0]) return json(res, 400, { error: 'You have already paid the joining fee.' });
          await sql`INSERT INTO payments(user_id,amount_cents,plan,provider,provider_reference,status) VALUES(${u.id},${JOINING_FEE},'joining','demo',${ref},'paid')`;
          await sql`UPDATE users SET membership_status='active',membership_plan='Member' WHERE id=${u.id}`;
          return json(res, 200, { mode: 'demo', message: 'Joining fee paid. You are now a member! Top up daily access to get started.', reference: ref });
        }
        // Daily top-up
        const topupAmount = Number(body.amount_cents) || DAILY_RATE;
        if (topupAmount < DAILY_RATE) return json(res, 400, { error: `Minimum top-up is R${DAILY_RATE / 100}.` });
        const days = daysFromAmount(topupAmount);
        await sql`INSERT INTO payments(user_id,amount_cents,plan,provider,provider_reference,status) VALUES(${u.id},${topupAmount},'topup','demo',${ref},'paid')`;
        // Extend membership: if already active and not expired, add days on top
        const userRow = await sql`SELECT membership_expires_at FROM users WHERE id=${u.id}`;
        const current = userRow[0]?.membership_expires_at;
        const base = current && new Date(current) > new Date() ? new Date(current) : new Date();
        const newExpiry = new Date(base.getTime() + days * 86400000);
        const expiryStr = newExpiry.toISOString().slice(0, 19).replace('T', ' ');
        await sql`UPDATE users SET membership_status='active',membership_expires_at=${expiryStr} WHERE id=${u.id}`;
        return json(res, 200, { mode: 'demo', message: `Top-up successful! ${days} day${days !== 1 ? 's' : ''} added to your membership.`, reference: ref, days });
      }
      if (paymentMethod === "manual_eft") {
        if (!methods.manualEft)
          return json(res, 400, {
            error: "Manual EFT is unavailable until bank instructions are configured.",
          });
        const rows = await sql`INSERT INTO payments(user_id,amount_cents,plan,provider,status) VALUES(${u.id},${amounts[plan]},${plan},'manual_eft','pending') RETURNING id`;
        const paymentId = rows[0].id;
        const reference = `SOBER-${paymentId}`;
        await sql`UPDATE payments SET provider_reference=${reference} WHERE id=${paymentId}`;
        await sql`UPDATE users SET membership_status='pending',membership_plan=${plan} WHERE id=${u.id} AND membership_status <> 'active'`;
        return json(res, 200, {
          mode: "manual_eft",
          message: "Transfer the membership amount using these bank details. Staff will activate your membership after confirming the payment.",
          reference,
          amount: (amounts[plan] / 100).toFixed(2),
          instructions: {
            bankName: process.env.MANUAL_EFT_BANK_NAME,
            accountName: process.env.MANUAL_EFT_ACCOUNT_NAME,
            accountNumber: process.env.MANUAL_EFT_ACCOUNT_NUMBER,
            branchCode: process.env.MANUAL_EFT_BRANCH_CODE,
          },
        });
      }
      if (paymentMethod === "payfast") {
        if (!methods.payfast)
          return json(res, 400, {
            error: "PayFast is unavailable until merchant credentials are configured.",
          });
        const rows = await sql`INSERT INTO payments(user_id,amount_cents,plan,provider,status) VALUES(${u.id},${amounts[plan]},${plan},'payfast','pending') RETURNING id`;
        const base = (
          process.env.APP_URL || `https://${req.headers.host}`
        ).replace(/\/$/, "");
        const fields = {
          merchant_id: process.env.PAYFAST_MERCHANT_ID,
          merchant_key: process.env.PAYFAST_MERCHANT_KEY,
          return_url: `${base}/payment.html?payfast=return`,
          cancel_url: `${base}/payment.html?cancelled=1`,
          notify_url: `${base}/api/payfast-itn`,
          name_first: u.first_name,
          name_last: u.last_name,
          email_address: u.email,
          m_payment_id: String(rows[0].id),
          amount: (amounts[plan] / 100).toFixed(2),
          item_name: `Sober Hub ${plan} Membership`,
          item_description: "30-day Sober Hub membership",
        };
        fields.signature = createSignature(
          fields,
          process.env.PAYFAST_PASSPHRASE || "",
        );
        const sandbox =
          String(process.env.PAYFAST_SANDBOX || "true").toLowerCase() ===
          "true";
        return json(res, 200, {
          mode: "payfast",
          url: `https://${sandbox ? "sandbox." : "www."}payfast.co.za/eng/process`,
          fields,
        });
      }
      if (paymentMethod !== "stripe" || !methods.stripe)
        return json(res, 400, {
          error: "Choose an available payment method or configure its provider.",
        });
      const Stripe = require("stripe");
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const base = (
        process.env.APP_URL || `https://${req.headers.host}`
      ).replace(/\/$/, "");
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "zar",
              product_data: {
                name: `Sober Hub ${plan} Membership`,
                description: "30-day Sober Hub membership",
              },
              unit_amount: amounts[plan],
            },
            quantity: 1,
          },
        ],
        customer_email: u.email,
        success_url: `${base}/payment.html?success=1&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/payment.html?cancelled=1`,
        metadata: { userId: String(u.id), plan },
      });
      await sql`INSERT INTO payments(user_id,amount_cents,plan,provider,provider_reference,status) VALUES(${u.id},${amounts[plan]},${plan},'stripe',${session.id},'pending')`;
      return json(res, 200, { mode: "stripe", url: session.url });
    }
    return json(res, 405, { error: "Method not allowed" });
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: e.message || "Payment error." });
  }
};
