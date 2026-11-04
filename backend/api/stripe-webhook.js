const {sqlClient,ensureSchema}=require('./_lib/db');const Stripe=require('stripe');
module.exports=async(req,res)=>{try{if(req.method!=='POST')return res.status(405).end();if(!process.env.STRIPE_SECRET_KEY||!process.env.STRIPE_WEBHOOK_SECRET)return res.status(200).json({received:true,configured:false});
const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);const sig=req.headers['stripe-signature'];let event;
try{event=stripe.webhooks.constructEvent(req.body,sig,process.env.STRIPE_WEBHOOK_SECRET);}catch(e){return res.status(400).send(`Webhook Error: ${e.message}`);}
if(event.type==='checkout.session.completed'){const s=event.data.object;const userId=Number(s.metadata?.userId);const plan=s.metadata?.plan;if(userId&&plan){const sql=sqlClient();await ensureSchema();await sql`UPDATE payments SET status='paid' WHERE provider_reference=${s.id}`;await sql`UPDATE users SET membership_status='active',membership_plan=${plan},membership_expires_at=NOW()+INTERVAL '30 days' WHERE id=${userId}`;}}
return res.status(200).json({received:true});}catch(e){console.error(e);return res.status(500).json({error:'Webhook failed'});}};
module.exports.config={api:{bodyParser:false}};
