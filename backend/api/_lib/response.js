function json(res,status,data){res.status(status).json(data)}
function method(req,res,allowed){ if(!allowed.includes(req.method)){res.setHeader('Allow',allowed);json(res,405,{error:'Method not allowed'});return false} return true}
module.exports={json,method};