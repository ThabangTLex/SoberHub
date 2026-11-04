const mysql = require('mysql2/promise');
let pool;
let databasePromise;
let schemaPromise;

function databaseConfig(){
  if(!process.env.DB_HOST || !process.env.DB_NAME) throw new Error('DB_HOST and DB_NAME are not configured.');
  return {
    host:process.env.DB_HOST,
    port:Number(process.env.DB_PORT||3306),
    user:process.env.DB_USER||'root',
    password:process.env.DB_PASSWORD ?? '',
    timezone:'Z'
  };
}

async function ensureDatabase(){
  if(!databasePromise){
    databasePromise=(async()=>{
      const config=databaseConfig();
      const admin=await mysql.createConnection(config);
      const databaseName=String(process.env.DB_NAME).replace(/`/g,'``');
      await admin.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
      await admin.end();
      pool=mysql.createPool({...config,database:process.env.DB_NAME,waitForConnections:true,connectionLimit:10});
    })().catch(error=>{databasePromise=null;throw error;});
  }
  return databasePromise;
}

function sqlClient(){
  databaseConfig();
  if(!pool){
    ensureDatabase();
  }
  return async(strings,...values)=>{
    await ensureDatabase();
    let query='';
    for(let i=0;i<strings.length;i++) query+=strings[i]+(i<values.length?'?':'');
    query=query
      .replace(/NOW\(\)\s*\+\s*INTERVAL\s*'(\d+)\s+(hours?|days?)'/gi,(_,amount,unit)=>`DATE_ADD(NOW(), INTERVAL ${amount} ${unit.toUpperCase().startsWith('HOUR')?'HOUR':'DAY'})`)
      .replace(/\bTRUE\b/gi,'1')
      .replace(/\bFALSE\b/gi,'0');
    const returning=query.match(/\s+RETURNING\s+([\w,\s.*]+)\s*$/i);
    const executable=returning?query.slice(0,returning.index):query;
    const [result]=await pool.execute(executable,values);
    if(!returning) return result;
    const table=(executable.match(/(?:INSERT\s+INTO|UPDATE)\s+([\w]+)/i)||[])[1];
    if(!table) return [];
    const idIndex=executable.match(/\bWHERE\s+id\s*=\s*\?/i);
    const id=idIndex?values[executable.slice(0,idIndex.index).split('?').length-1]:result.insertId;
    const [rows]=await pool.execute(`SELECT ${returning[1]} FROM ${table} WHERE id=?`,[id]);
    return rows;
  };
}

async function ensureSchema(){
  if(!schemaPromise){
    const sql=sqlClient();
    schemaPromise=(async()=>{
      await sql`CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY, first_name VARCHAR(255) NOT NULL, last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL, phone VARCHAR(50), password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'member', membership_status VARCHAR(20) NOT NULL DEFAULT 'inactive',
        membership_plan VARCHAR(20), membership_expires_at DATETIME, email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        verification_token_hash VARCHAR(255), verification_expires_at DATETIME, reset_token_hash VARCHAR(255),
        reset_expires_at DATETIME, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`;
      await sql`CREATE TABLE IF NOT EXISTS rate_limits (rate_key VARCHAR(255) PRIMARY KEY, window_start DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, request_count INT NOT NULL DEFAULT 0)`;
      await sql`CREATE TABLE IF NOT EXISTS checkins (id INT AUTO_INCREMENT PRIMARY KEY,user_id INT NOT NULL,mood VARCHAR(100) NOT NULL,note TEXT,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`;
      await sql`CREATE TABLE IF NOT EXISTS community_posts (id INT AUTO_INCREMENT PRIMARY KEY,user_id INT NOT NULL,content TEXT NOT NULL,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`;
      await sql`CREATE TABLE IF NOT EXISTS mentor_requests (id INT AUTO_INCREMENT PRIMARY KEY,user_id INT NOT NULL,message TEXT,status VARCHAR(50) NOT NULL DEFAULT 'Pending',created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`;
      await sql`CREATE TABLE IF NOT EXISTS emergency_requests (id INT AUTO_INCREMENT PRIMARY KEY,user_id INT NOT NULL,message TEXT,status VARCHAR(50) NOT NULL DEFAULT 'Open',created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`;
      await sql`CREATE TABLE IF NOT EXISTS payments (id INT AUTO_INCREMENT PRIMARY KEY,user_id INT NOT NULL,amount_cents INT NOT NULL,plan VARCHAR(20) NOT NULL,provider VARCHAR(50) NOT NULL DEFAULT 'demo',provider_reference VARCHAR(255),status VARCHAR(50) NOT NULL DEFAULT 'pending',created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`;
      for(const statement of [
        'CREATE INDEX idx_checkins_user ON checkins(user_id,created_at)',
        'CREATE INDEX idx_posts_created ON community_posts(created_at)',
        'CREATE INDEX idx_payments_user ON payments(user_id,created_at)',
        'CREATE INDEX idx_users_verification ON users(verification_token_hash)',
        'CREATE INDEX idx_users_reset ON users(reset_token_hash)',
        'CREATE INDEX idx_rate_limits_window ON rate_limits(window_start)'
      ]){ try{ await pool.query(statement); }catch(error){ if(error.code!=='ER_DUP_KEYNAME') throw error; } }
    })().catch(e=>{schemaPromise=null;throw e;});
  }
  return schemaPromise;
}
module.exports={sqlClient,ensureSchema};
