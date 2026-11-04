const { sqlClient, ensureSchema } = require("./_lib/db");
const { requireAuth } = require("./_lib/auth");
const { json } = require("./_lib/response");
module.exports = async (req, res) => {
  try {
    await ensureSchema();
    const u = requireAuth(req, res, ["staff", "admin"]);
    if (!u) return;
    const sql = sqlClient();
    if (req.method === "GET") {
      const members =
        await sql`SELECT id,first_name,last_name,email,role,membership_status,membership_plan,created_at FROM users ORDER BY created_at DESC LIMIT 100`;
      const mentors =
        await sql`SELECT m.id,m.message,m.status,m.created_at,u.first_name,u.last_name,u.email FROM mentor_requests m JOIN users u ON u.id=m.user_id ORDER BY m.created_at DESC LIMIT 50`;
      const emergencies =
        await sql`SELECT e.id,e.message,e.status,e.created_at,u.first_name,u.last_name,u.email FROM emergency_requests e JOIN users u ON u.id=e.user_id ORDER BY e.created_at DESC LIMIT 50`;
      const payments =
        await sql`SELECT p.id,p.amount_cents,p.plan,p.provider,p.provider_reference,p.status,p.created_at,u.first_name,u.last_name,u.email FROM payments p JOIN users u ON u.id=p.user_id WHERE p.status='pending' ORDER BY p.created_at DESC LIMIT 50`;
      return json(res, 200, { members, mentors, emergencies, payments });
    }
    if (req.method === "PATCH") {
      const { type, id, status } = req.body || {};
      if (type === "payment") {
        if (!Number.isInteger(Number(id)) || !["paid", "rejected"].includes(status))
          return json(res, 400, { error: "Invalid payment confirmation." });
        const rows =
          await sql`UPDATE payments SET status=${status} WHERE id=${Number(id)} AND provider='manual_eft' AND status='pending' RETURNING user_id,plan`;
        if (!rows[0])
          return json(res, 409, {
            error: "This manual EFT payment is no longer pending.",
          });
        if (status === "paid") {
          await sql`UPDATE users SET membership_status='active',membership_plan=${rows[0].plan},membership_expires_at=NOW()+INTERVAL '30 days' WHERE id=${rows[0].user_id}`;
        } else {
          await sql`UPDATE users SET membership_status='inactive',membership_plan=NULL WHERE id=${rows[0].user_id} AND membership_status='pending' AND membership_plan=${rows[0].plan}`;
        }
        return json(res, 200, {
          message:
            status === "paid"
              ? "Manual EFT confirmed. Membership activated."
              : "Manual EFT rejected.",
        });
      }
      const allowed = {
        mentor: ["Pending", "In Progress", "Resolved"],
        emergency: ["Open", "In Progress", "Resolved"],
      };
      if (
        !allowed[type] ||
        !allowed[type].includes(status) ||
        !Number.isInteger(Number(id))
      )
        return json(res, 400, { error: "Invalid support request update." });
      if (type === "mentor")
        await sql`UPDATE mentor_requests SET status=${status} WHERE id=${Number(id)}`;
      if (type === "emergency")
        await sql`UPDATE emergency_requests SET status=${status} WHERE id=${Number(id)}`;
      return json(res, 200, { message: "Request status updated." });
    }
    return json(res, 405, { error: "Method not allowed" });
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: "Could not load staff data." });
  }
};
