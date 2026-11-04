// Single Vercel entry point. When MySQL variables exist, requests use the database API.
// Without database variables, the original classroom demo mode remains available.
const demoMode = String(process.env.DEMO_MODE || '').toLowerCase() === 'true' || !process.env.DB_HOST || !process.env.DB_NAME;

const dbRoutes = {
  auth: require('./auth'),
  dashboard: require('./dashboard'),
  profile: require('./profile'),
  checkins: require('./checkins'),
  community: require('./community'),
  mentor: require('./mentor'),
  emergency: require('./emergency'),
  payments: require('./payments'),
  'payfast-itn': require('./payfast-itn'),
  staff: require('./staff'),
  health: require('./health')
};

async function databaseRouter(req, res, path) {
  const handler = dbRoutes[path];
  if (!handler) return res.status(404).json({ error: 'API endpoint not found.' });
  return handler(req, res);
}

// If a real MySQL connection is configured, use the database-backed API files.
// Otherwise fall back to the self-contained classroom demo implementation.
if (!demoMode) {
  module.exports = async (req, res) => {
    try {
      const path = String(req.query?.path || '').replace(/^\//, '').split('/')[0];
      return databaseRouter(req, res, path);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Backend error.' });
    }
  };
} else {
  const jwt = require('jsonwebtoken');
  const bcrypt = require('bcryptjs');
  const SECRET = process.env.JWT_SECRET || 'sober-hub-class-demo-secret-2026';
  const SESSION = 'soberhub_session';
  const DATA = 'soberhub_demo_data';
  function parseCookies(req){ const out={}; for(const part of (req.headers.cookie||'').split(';')){ const i=part.indexOf('='); if(i>0) out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim()); } return out; }
  function cookie(res,name,value,maxAge=604800){ const current=res.getHeader('Set-Cookie'); const cookies=current==null?[]:Array.isArray(current)?current:[current]; cookies.push(`${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`); res.setHeader('Set-Cookie',cookies); }
  function clear(res,name){ cookie(res,name,'',0); }
  function send(res,status,body){ res.status(status).setHeader('Content-Type','application/json'); res.end(JSON.stringify(body)); }
  function body(req){ return new Promise((resolve,reject)=>{ if(req.body && typeof req.body==='object') return resolve(req.body); let s=''; req.on('data',c=>s+=c); req.on('end',()=>{try{resolve(s?JSON.parse(s):{})}catch(e){reject(e)}}); }); }
  function signSession(u){ return jwt.sign({id:u.id,email:u.email,role:u.role},SECRET,{expiresIn:'7d'}); }
  function auth(req,res,roles){ const c=parseCookies(req); if(!c[SESSION]){send(res,401,{error:'Please log in.'});return null} try{const u=jwt.verify(c[SESSION],SECRET);if(roles&&!roles.includes(u.role)){send(res,403,{error:'You do not have permission for this action.'});return null}return u}catch(e){send(res,401,{error:'Your session has expired. Please log in again.'});return null} }
  function readData(req){ const c=parseCookies(req); if(c[DATA]){try{return jwt.verify(c[DATA],SECRET).data}catch(e){}} return {users:[{id:1,first_name:'Demo',last_name:'Member',email:'member@soberhub.demo',phone:'0712345678',password_hash:bcrypt.hashSync('Member123!',8),role:'member',membership_status:'inactive',membership_plan:null,membership_expires_at:null,created_at:new Date().toISOString()},{id:2,first_name:'Sober',last_name:'Hub Staff',email:'staff@soberhub.demo',phone:'0723456789',password_hash:bcrypt.hashSync('Staff123!',8),role:'staff',membership_status:'inactive',membership_plan:null,membership_expires_at:null,created_at:new Date().toISOString()}],checkins:[],posts:[],mentors:[],emergencies:[],payments:[]}; }
  function saveData(res,data){ const token=jwt.sign({data},SECRET,{expiresIn:'30d'}); cookie(res,DATA,token,2592000); }
  function safe(u){const {password_hash,...x}=u;return x}
  function findUser(data,id){return data.users.find(x=>String(x.id)===String(id))}
  function nextId(arr){return arr.length?Math.max(...arr.map(x=>Number(x.id)))+1:1}
  function planAmount(plan){return {R50:5000,R75:7500,R100:10000}[plan]}
  module.exports = async (req,res)=>{
   try{
    const path='/' + (req.query?.path || '').replace(/^\//,''); const p=path==='/'?'/':path.replace(/\/$/,''); const b=await body(req); const data=readData(req);
    if(p==='/auth'&&req.method==='GET'){const s=auth(req,res);if(!s)return;const u=findUser(data,s.id);if(!u)return send(res,401,{error:'Account not found.'});return send(res,200,{user:safe(u)});}
    if(p==='/auth'&&req.method==='POST'){const {action}=b;if(action==='logout'){clear(res,SESSION);return send(res,200,{message:'Logged out.'})}if(action==='register'){const firstName=String(b.firstName||'').trim(),lastName=String(b.lastName||'').trim(),email=String(b.email||'').trim().toLowerCase(),password=String(b.password||'');const role=b.role==='staff'?'staff':'member';if(!firstName||!lastName||!email||password.length<6)return send(res,400,{error:'Please complete all required fields. Password must be at least 6 characters.'});if(role==='staff'&&b.staffCode!==(process.env.STAFF_SIGNUP_CODE||'SOBER-STAFF-2026'))return send(res,403,{error:'Invalid staff registration code.'});if(data.users.some(u=>u.email===email))return send(res,409,{error:'An account with that email already exists.'});const u={id:nextId(data.users),first_name:firstName,last_name:lastName,email,phone:b.phone||null,password_hash:bcrypt.hashSync(password,10),role,membership_status:'inactive',membership_plan:null,membership_expires_at:null,created_at:new Date().toISOString()};data.users.push(u);saveData(res,data);cookie(res,SESSION,signSession(u));return send(res,201,{user:safe(u)});}if(action==='login'){const email=String(b.email||'').trim().toLowerCase(),u=data.users.find(x=>x.email===email);if(!u||!bcrypt.compareSync(String(b.password||''),u.password_hash))return send(res,401,{error:'Incorrect email or password.'});cookie(res,SESSION,signSession(u));saveData(res,data);return send(res,200,{user:safe(u)});}return send(res,400,{error:'Unknown authentication action.'});}
    const s=auth(req,res);if(!s)return;const u=findUser(data,s.id);if(!u)return send(res,401,{error:'Account not found.'});
    if(p==='/dashboard')return send(res,200,{user:safe(u),stats:{checkins:data.checkins.filter(x=>x.user_id===u.id).length,mentorRequests:data.mentors.filter(x=>x.user_id===u.id).length,payments:data.payments.filter(x=>x.user_id===u.id&&x.status==='paid').length}});
    if(p==='/profile'){if(req.method==='GET')return send(res,200,{user:safe(u)});if(req.method==='PUT'){if(!b.firstName||!b.lastName)return send(res,400,{error:'First name and last name are required.'});u.first_name=String(b.firstName).trim();u.last_name=String(b.lastName).trim();u.phone=b.phone||null;saveData(res,data);return send(res,200,{user:safe(u),message:'Profile updated successfully.'});}}
    if(p==='/checkins'){if(req.method==='GET')return send(res,200,{checkins:data.checkins.filter(x=>x.user_id===u.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,10)});if(req.method==='POST'){if(!b.mood)return send(res,400,{error:'Please select a mood.'});const x={id:nextId(data.checkins),user_id:u.id,mood:String(b.mood),note:String(b.note||''),created_at:new Date().toISOString()};data.checkins.push(x);saveData(res,data);return send(res,201,{checkin:x,message:'Daily check-in saved.'});}}
    if(p==='/community'){if(req.method==='GET'){const posts=data.posts.slice().sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,30).map(x=>({...x,first_name:findUser(data,x.user_id)?.first_name||'Member',last_name:findUser(data,x.user_id)?.last_name||''}));return send(res,200,{posts});}if(req.method==='POST'){const content=String(b.content||'').trim();if(!content||content.length>500)return send(res,400,{error:'Write a message up to 500 characters.'});const x={id:nextId(data.posts),user_id:u.id,content,created_at:new Date().toISOString()};data.posts.push(x);saveData(res,data);return send(res,201,{post:{...x,first_name:u.first_name,last_name:u.last_name},message:'Post shared with the community.'});}}
    if(p==='/mentor'){if(req.method==='GET')return send(res,200,{requests:data.mentors.filter(x=>x.user_id===u.id)});if(req.method==='POST'){const x={id:nextId(data.mentors),user_id:u.id,message:String(b.message||''),status:'Pending',created_at:new Date().toISOString()};data.mentors.push(x);saveData(res,data);return send(res,201,{request:x,message:'Mentor request sent.'});}}
    if(p==='/emergency'){if(req.method==='GET')return send(res,200,{requests:data.emergencies.filter(x=>x.user_id===u.id)});if(req.method==='POST'){const x={id:nextId(data.emergencies),user_id:u.id,message:String(b.message||'Urgent support requested.'),status:'Open',created_at:new Date().toISOString()};data.emergencies.push(x);saveData(res,data);return send(res,201,{request:x,message:'Support request recorded.'});}}
    if(p==='/payments'){if(req.method==='GET')return send(res,200,{payments:data.payments.filter(x=>x.user_id===u.id)});if(req.method==='POST'){const plan=b.plan||'R50',amount=planAmount(plan);if(!amount)return send(res,400,{error:'Choose R50, R75 or R100.'});const ref='DEMO-'+Date.now();const x={id:nextId(data.payments),user_id:u.id,amount_cents:amount,plan,provider:'demo',provider_reference:ref,status:'paid',created_at:new Date().toISOString()};data.payments.push(x);u.membership_status='active';u.membership_plan=plan;u.membership_expires_at=new Date(Date.now()+30*86400000).toISOString();saveData(res,data);return send(res,200,{mode:'demo',message:'Demo payment successful. Membership activated for 30 days.',reference:ref});}}
    if(p==='/staff'){if(!['staff','admin'].includes(u.role))return send(res,403,{error:'Staff access only.'});return send(res,200,{members:data.users.map(safe),mentors:data.mentors,emergencies:data.emergencies});}
    return send(res,404,{error:'API endpoint not found.'});
   }catch(e){console.error(e);return send(res,500,{error:'Server error: '+e.message});}
  };
}
