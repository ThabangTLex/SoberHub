const jwt = require('jsonwebtoken');
const COOKIE = 'soberhub_session';
function secret(){ return process.env.JWT_SECRET || 'CHANGE_ME_IN_VERCEL'; }
function sign(user){
  return jwt.sign({id:user.id,email:user.email,role:user.role,email_verified:user.email_verified===true}, secret(), {expiresIn:'7d'});
}
function setCookie(res, token){
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`);
}
function clearCookie(res){ res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`); }
function getToken(req){
  const raw=req.headers.cookie||'';
  const match=raw.split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
}
function requireAuth(req,res,roles){
  const token=getToken(req);
  if(!token){ res.status(401).json({error:'Please log in.'}); return null; }
  try{
    const user=jwt.verify(token,secret());
    if(roles && !roles.includes(user.role)){ res.status(403).json({error:'You do not have permission for this action.'}); return null; }
    return user;
  }catch(e){ res.status(401).json({error:'Your session has expired. Please log in again.'}); return null; }
}
module.exports={sign,setCookie,clearCookie,requireAuth};
