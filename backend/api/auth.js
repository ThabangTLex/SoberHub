const {sqlClient,ensureSchema}=require('./_lib/db');
const bcrypt=require('bcryptjs');
const crypto=require('crypto');
const {sign,setCookie,clearCookie,requireAuth}=require('./_lib/auth');
const {sendEmail,appUrl,verificationEmail,verificationCodeEmail,resetEmail}=require('./_lib/email');
const {json,method}=require('./_lib/response');
const {clientIp,normalizeEmail,validEmail,validName,validPhone,validPassword,randomKey,rateLimit,tooMany}=require('./_lib/security');
const tokenHash=t=>crypto.createHash('sha256').update(t).digest('hex');
const makeToken=()=>crypto.randomBytes(32).toString('hex');
const makeCode=()=>String(Math.floor(100000+Math.random()*900000));
const safe=u=>{const {password_hash,verification_token_hash,verification_expires_at,reset_token_hash,reset_expires_at,...x}=u;return x};

module.exports=async(req,res)=>{try{
 await ensureSchema(); const sql=sqlClient(); const ip=clientIp(req);
 if(req.method==='GET'){
   const action=String(req.query?.action||'session');
   if(action==='verify'){
     const rl=await rateLimit(sql,randomKey('verify-ip',ip),10,900); if(!rl.allowed)return tooMany(res,rl.retryAfter);
     const token=String(req.query?.token||''); if(!token)return json(res,400,{error:'Verification link is missing.'});
     const rows=await sql`SELECT id,email,first_name,verification_expires_at FROM users WHERE verification_token_hash=${tokenHash(token)}`;
     if(!rows[0])return json(res,400,{error:'This verification link is invalid or has already been used.'});
     if(rows[0].verification_expires_at && new Date(rows[0].verification_expires_at)<new Date())return json(res,400,{error:'This verification link has expired. Enter your email below to request a new verification email.',code:'VERIFICATION_EXPIRED',canResend:true});
     await sql`UPDATE users SET email_verified=TRUE,verification_token_hash=NULL,verification_expires_at=NULL WHERE id=${rows[0].id}`;
     return json(res,200,{verified:true,message:'Email verified successfully. You can now log in.'});
   }
   if(action==='resend-verification'){
     const email=normalizeEmail(req.query?.email); if(!validEmail(email))return json(res,400,{error:'Please enter a valid email address.'});
     const rl=await rateLimit(sql,randomKey('resend-email',email),3,900); if(!rl.allowed)return tooMany(res,rl.retryAfter);
     const ipRl=await rateLimit(sql,randomKey('resend-ip',ip),10,900); if(!ipRl.allowed)return tooMany(res,ipRl.retryAfter);
     const rows=await sql`SELECT id,first_name,email,email_verified FROM users WHERE email=${email}`;
     if(!rows[0])return json(res,200,{message:'If an account exists for that email, a verification email will be sent.'});
     if(rows[0].email_verified)return json(res,200,{message:'This email is already verified. You can log in.'});
       const code=makeCode(); await sql`UPDATE users SET verification_token_hash=${tokenHash(code)},verification_expires_at=NOW()+INTERVAL '24 hours' WHERE id=${rows[0].id}`;
     return json(res,200,{message:'A new verification code has been generated.',code,email:rows[0].email,firstName:rows[0].first_name});
   }
   const session=requireAuth(req,res); if(!session)return; const rows=await sql`SELECT id,first_name,last_name,email,phone,role,membership_status,membership_plan,membership_expires_at,email_verified,created_at FROM users WHERE id=${session.id}`;
   if(!rows[0])return json(res,401,{error:'Account not found.'}); return json(res,200,{user:safe(rows[0])});
 }
 if(!method(req,res,['POST']))return;
 const {action}=req.body||{};
 if(action==='register'){
   const rl=await rateLimit(sql,randomKey('register-ip',ip),5,3600); if(!rl.allowed)return tooMany(res,rl.retryAfter);
   const firstName=String(req.body.firstName||'').trim(),lastName=String(req.body.lastName||'').trim(),email=normalizeEmail(req.body.email),phone=String(req.body.phone||'').trim(),password=String(req.body.password||''),role=req.body.role==='staff'?'staff':'member';
   if(!validName(firstName)||!validName(lastName))return json(res,400,{error:'Please enter a valid first and last name.'});
   if(!validEmail(email))return json(res,400,{error:'Please enter a valid email address.'});
   if(!validPhone(phone))return json(res,400,{error:'Please enter a valid phone number.'});
   if(!validPassword(password))return json(res,400,{error:'Password must be between 8 and 128 characters.'});
   if(role==='staff' && req.body.staffCode !== (process.env.STAFF_SIGNUP_CODE||'SOBER-STAFF-2026'))return json(res,403,{error:'Invalid staff registration code.'});
   const existing=await sql`SELECT id,email_verified FROM users WHERE email=${email}`; if(existing[0])return json(res,409,{error:existing[0].email_verified?'An account with that email already exists.':'An account already exists but has not been verified. Use Resend verification on the login page.'});
   const hash=await bcrypt.hash(password,12),code=makeCode();
  const skipEmailVerification=String(process.env.SKIP_EMAIL_VERIFICATION||'').toLowerCase()==='true';
  const rows=await sql`INSERT INTO users(first_name,last_name,email,phone,password_hash,role,email_verified,verification_token_hash,verification_expires_at) VALUES(${firstName},${lastName},${email},${phone||null},${hash},${role},FALSE,${tokenHash(code)},NOW()+INTERVAL '24 hours') RETURNING id,first_name,last_name,email,phone,role,membership_status,membership_plan,membership_expires_at,email_verified`;
  if(skipEmailVerification){
   await sql`UPDATE users SET email_verified=TRUE,verification_token_hash=NULL,verification_expires_at=NULL WHERE id=${rows[0].id}`;
   return json(res,201,{message:'Account created in local test mode. Email verification was skipped.'});
  }
   try{ await sendEmail({to:email,subject:'Your Sober Hub verification code',html:verificationCodeEmail({name:firstName,code})}); }
   catch(e){ console.error(e); await sql`DELETE FROM users WHERE id=${rows[0].id}`; return json(res,500,{error:'Your account could not be completed because the verification email could not be sent. Please check the email service configuration.'}); }
   return json(res,201,{message:'Account created. A 6-digit verification code has been sent to your email.',email,code,requiresVerification:true});
 }
 if(action==='resend-verification'){
   const email=normalizeEmail(req.body.email); if(!validEmail(email))return json(res,400,{error:'Please enter a valid email address.'});
   const rl=await rateLimit(sql,randomKey('resend-email',email),3,900); if(!rl.allowed)return tooMany(res,rl.retryAfter);
   const ipRl=await rateLimit(sql,randomKey('resend-ip',ip),10,900); if(!ipRl.allowed)return tooMany(res,ipRl.retryAfter);
   const rows=await sql`SELECT id,first_name,email,email_verified FROM users WHERE email=${email}`;
   if(!rows[0])return json(res,200,{message:'If an account exists for that email, a verification code will be sent.'});
   if(rows[0].email_verified)return json(res,200,{message:'This email is already verified. You can log in.'});
   const code=makeCode(); await sql`UPDATE users SET verification_token_hash=${tokenHash(code)},verification_expires_at=NOW()+INTERVAL '24 hours' WHERE id=${rows[0].id}`;
   return json(res,200,{message:'A new verification code has been generated.',code,email:rows[0].email,firstName:rows[0].first_name});
 }
 if(action==='verify-code'){
   const email=normalizeEmail(req.body.email),code=String(req.body.code||'').trim();
   if(!validEmail(email)||!code)return json(res,400,{error:'Email and verification code are required.'});
   const rl=await rateLimit(sql,randomKey('verify-code-ip',ip),10,900); if(!rl.allowed)return tooMany(res,rl.retryAfter);
   const rows=await sql`SELECT id,email,first_name,verification_expires_at FROM users WHERE email=${email} AND verification_token_hash=${tokenHash(code)}`;
   if(!rows[0])return json(res,400,{error:'Invalid verification code. Please check your email and try again.'});
   if(rows[0].verification_expires_at && new Date(rows[0].verification_expires_at)<new Date())return json(res,400,{error:'This code has expired. Request a new one.',code:'VERIFICATION_EXPIRED',canResend:true});
   await sql`UPDATE users SET email_verified=TRUE,verification_token_hash=NULL,verification_expires_at=NULL WHERE id=${rows[0].id}`;
   const user=await sql`SELECT id,first_name,last_name,email,phone,role,membership_status,membership_plan,membership_expires_at,email_verified,created_at FROM users WHERE id=${rows[0].id}`;
   const token=sign(user[0]); setCookie(res,token);
   return json(res,200,{verified:true,message:'Email verified successfully.',user:safe(user[0])});
 }
 if(action==='login'){
   const cleanEmail=normalizeEmail(req.body.email); const rl=await rateLimit(sql,randomKey('login-ip-email',`${ip}:${cleanEmail}`),10,900); if(!rl.allowed)return tooMany(res,rl.retryAfter);
   if(!validEmail(cleanEmail))return json(res,400,{error:'Please enter a valid email address.'});
   const rows=await sql`SELECT * FROM users WHERE email=${cleanEmail}`;
   if(!rows[0]||!(await bcrypt.compare(String(req.body.password||''),rows[0].password_hash)))return json(res,401,{error:'Incorrect email or password.'});
   if(!rows[0].email_verified)return json(res,403,{error:'Please verify your email before logging in.',code:'EMAIL_NOT_VERIFIED'});
   const token=sign(rows[0]);setCookie(res,token);return json(res,200,{user:safe(rows[0])});
 }
 if(action==='forgot-password'){
   const email=normalizeEmail(req.body.email); if(!validEmail(email))return json(res,400,{error:'Please enter a valid email address.'});
   const rl=await rateLimit(sql,randomKey('reset-email',email),5,3600); if(!rl.allowed)return tooMany(res,rl.retryAfter);
   const rows=await sql`SELECT id,first_name,email FROM users WHERE email=${email}`;
   if(rows[0]){const token=makeToken();await sql`UPDATE users SET reset_token_hash=${tokenHash(token)},reset_expires_at=NOW()+INTERVAL '1 hour' WHERE id=${rows[0].id}`;const link=`${appUrl(req)}/reset-password.html?token=${encodeURIComponent(token)}`;try{await sendEmail({to:rows[0].email,subject:'Reset your Sober Hub password',html:resetEmail({name:rows[0].first_name,link})});}catch(e){console.error(e);}}
   return json(res,200,{message:'If an account exists for that email, a password reset link has been sent.'});
 }
 if(action==='reset-password'){
   const token=String(req.body.token||''),newPassword=String(req.body.newPassword||'');
   if(!token||!validPassword(newPassword))return json(res,400,{error:'Please use a valid reset link and a password of 8 to 128 characters.'});
   const rl=await rateLimit(sql,randomKey('reset-token',token),5,3600); if(!rl.allowed)return tooMany(res,rl.retryAfter);
   const rows=await sql`SELECT id FROM users WHERE reset_token_hash=${tokenHash(token)} AND reset_expires_at > NOW()`; if(!rows[0])return json(res,400,{error:'This password reset link is invalid or has expired.'});
   const hash=await bcrypt.hash(newPassword,12);await sql`UPDATE users SET password_hash=${hash},reset_token_hash=NULL,reset_expires_at=NULL WHERE id=${rows[0].id}`;return json(res,200,{message:'Password reset successfully. You can now log in.'});
 }
 if(action==='change-password'){
   const session=requireAuth(req,res);if(!session)return;const currentPassword=String(req.body.currentPassword||''),newPassword=String(req.body.newPassword||'');
   if(!currentPassword||!validPassword(newPassword))return json(res,400,{error:'Please provide your current password and a new password of 8 to 128 characters.'});
   const rows=await sql`SELECT password_hash FROM users WHERE id=${session.id}`;if(!rows[0]||!(await bcrypt.compare(currentPassword,rows[0].password_hash)))return json(res,401,{error:'Current password is incorrect.'});
   const hash=await bcrypt.hash(newPassword,12);await sql`UPDATE users SET password_hash=${hash} WHERE id=${session.id}`;return json(res,200,{message:'Password changed successfully.'});
 }
 if(action==='logout'){clearCookie(res);return json(res,200,{message:'Logged out.'});}
 return json(res,400,{error:'Unknown authentication action.'});
}catch(e){console.error(e);return json(res,500,{error:'Server error. Check your Vercel environment variables, database, and email configuration.'});}};
