const {sqlClient,ensureSchema}=require('./_lib/db');
module.exports=async(req,res)=>{
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  try{
    await ensureSchema();
    const sql=sqlClient();
    const r=await sql`SELECT NOW() AS database_time`;
    return res.status(200).json({ok:true,database:'connected',database_time:r[0].database_time});
  }catch(e){console.error(e);return res.status(500).json({ok:false,database:'not connected',error:'Database connection failed.'});}
};
