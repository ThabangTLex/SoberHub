const {sqlClient,ensureSchema}=require('./_lib/db');const {requireAuth}=require('./_lib/auth');const {json}=require('./_lib/response');
module.exports=async(req,res)=>{try{await ensureSchema();const u=requireAuth(req,res);if(!u)return;const sql=sqlClient();
const user=(await sql`SELECT id,first_name,last_name,email,role,membership_status,membership_plan,membership_expires_at FROM users WHERE id=${u.id}`)[0];
if(user && user.membership_status==='active' && user.membership_expires_at && new Date(user.membership_expires_at) < new Date()) {
  await sql`UPDATE users SET membership_status='expired' WHERE id=${u.id}`;
  user.membership_status='expired';
}
const counts=(await sql`SELECT (SELECT COUNT(*) FROM checkins WHERE user_id=${u.id}) AS checkins,(SELECT COUNT(*) FROM mentor_requests WHERE user_id=${u.id}) AS mentor_requests,(SELECT COUNT(*) FROM payments WHERE user_id=${u.id} AND status='paid') AS payments`)[0];
return json(res,200,{user,stats:{checkins:Number(counts.checkins),mentorRequests:Number(counts.mentor_requests),payments:Number(counts.payments)}});}catch(e){console.error(e);return json(res,500,{error:'Could not load dashboard.'});}};