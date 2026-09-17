const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));

const pool = mysql.createPool({host:process.env.DB_HOST||'localhost',port:process.env.DB_PORT||3306,user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||'',database:process.env.DB_NAME||'training_institute_finder',waitForConnections:true,connectionLimit:10});
const secret = process.env.JWT_SECRET || 'dev_secret_change_me';

function auth(req,res,next){
  const h=req.headers.authorization||''; const token=h.startsWith('Bearer ')?h.slice(7):null;
  if(!token) return res.status(401).json({message:'Login required'});
  try{req.user=jwt.verify(token,secret); next();}catch(e){res.status(401).json({message:'Invalid or expired token'});}
}
function admin(req,res,next){ if(req.user?.role!=='admin') return res.status(403).json({message:'Admin access required'}); next(); }

app.get('/api/health',(req,res)=>res.json({ok:true}));

app.get('/api/institutes',async(req,res)=>{
  try{
    const {q='',city='',course=''}=req.query;
    let sql=`SELECT i.*, GROUP_CONCAT(c.name ORDER BY c.name SEPARATOR ', ') courses FROM institutes i LEFT JOIN institute_courses ic ON ic.institute_id=i.id LEFT JOIN courses c ON c.id=ic.course_id WHERE 1=1`;
    const p=[];
    if(q){sql+=' AND (i.name LIKE ? OR i.address LIKE ? OR i.description LIKE ? OR c.name LIKE ?)'; const x=`%${q}%`;p.push(x,x,x,x);}
    if(city){sql+=' AND i.city=?';p.push(city);}
    if(course){sql+=' AND c.name=?';p.push(course);}
    sql+=' GROUP BY i.id ORDER BY i.rating DESC,i.name';
    const [rows]=await pool.query(sql,p); res.json(rows);
  }catch(e){res.status(500).json({message:'Database error',error:e.message});}
});

app.get('/api/institutes/:id',async(req,res)=>{try{const [rows]=await pool.query(`SELECT i.*,GROUP_CONCAT(c.name ORDER BY c.name SEPARATOR ', ') courses FROM institutes i LEFT JOIN institute_courses ic ON ic.institute_id=i.id LEFT JOIN courses c ON c.id=ic.course_id WHERE i.id=? GROUP BY i.id`,[req.params.id]); if(!rows.length)return res.status(404).json({message:'Institute not found'});res.json(rows[0]);}catch(e){res.status(500).json({message:e.message});}});
app.get('/api/courses',async(req,res)=>{const [rows]=await pool.query('SELECT * FROM courses ORDER BY name');res.json(rows);});

app.post('/api/register',async(req,res)=>{try{const {name,email,mobile,password}=req.body;if(!name||!email||!password)return res.status(400).json({message:'Name, email and password are required'});const [old]=await pool.query('SELECT id FROM users WHERE email=?',[email]);if(old.length)return res.status(409).json({message:'Email already registered'});const hash=await bcrypt.hash(password,10);const [r]=await pool.query('INSERT INTO users(name,email,mobile,password_hash,role) VALUES(?,?,?,?,?)',[name,email,mobile||'',hash,'user']);res.status(201).json({message:'Registration successful',id:r.insertId});}catch(e){res.status(500).json({message:e.message});}});

app.post('/api/login',async(req,res)=>{try{const {email,password}=req.body;const [rows]=await pool.query('SELECT * FROM users WHERE email=?',[email]);if(!rows.length||!(await bcrypt.compare(password,rows[0].password_hash)))return res.status(401).json({message:'Invalid email or password'});const u=rows[0];const token=jwt.sign({id:u.id,name:u.name,email:u.email,role:u.role},secret,{expiresIn:'7d'});res.json({token,user:{id:u.id,name:u.name,email:u.email,role:u.role}});}catch(e){res.status(500).json({message:e.message});}});

app.get('/api/me',auth,(req,res)=>res.json(req.user));
app.get('/api/favorites',auth,async(req,res)=>{const [rows]=await pool.query('SELECT i.* FROM favorites f JOIN institutes i ON i.id=f.institute_id WHERE f.user_id=? ORDER BY f.created_at DESC',[req.user.id]);res.json(rows);});
app.post('/api/favorites/:id',auth,async(req,res)=>{await pool.query('INSERT IGNORE INTO favorites(user_id,institute_id) VALUES(?,?)',[req.user.id,req.params.id]);res.json({message:'Saved'});});
app.delete('/api/favorites/:id',auth,async(req,res)=>{await pool.query('DELETE FROM favorites WHERE user_id=? AND institute_id=?',[req.user.id,req.params.id]);res.json({message:'Removed'});});

app.post('/api/admin/institutes',auth,admin,async(req,res)=>{try{const {name,city,address,phone,email,website,image,description,latitude,longitude,rating}=req.body;if(!name||!city||!address)return res.status(400).json({message:'Name, city and address required'});const [r]=await pool.query('INSERT INTO institutes(name,city,address,phone,email,website,image,description,latitude,longitude,rating) VALUES(?,?,?,?,?,?,?,?,?,?,?)',[name,city,address,phone||'',email||'',website||'',image||'',description||'',latitude||null,longitude||null,rating||0]);res.status(201).json({id:r.insertId});}catch(e){res.status(500).json({message:e.message});}});
app.put('/api/admin/institutes/:id',auth,admin,async(req,res)=>{try{const {name,city,address,phone,email,website,image,description,latitude,longitude,rating}=req.body;await pool.query('UPDATE institutes SET name=?,city=?,address=?,phone=?,email=?,website=?,image=?,description=?,latitude=?,longitude=?,rating=? WHERE id=?',[name,city,address,phone||'',email||'',website||'',image||'',description||'',latitude||null,longitude||null,rating||0,req.params.id]);res.json({message:'Updated'});}catch(e){res.status(500).json({message:e.message});}});
app.delete('/api/admin/institutes/:id',auth,admin,async(req,res)=>{await pool.query('DELETE FROM institutes WHERE id=?',[req.params.id]);res.json({message:'Deleted'});});

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
const port=process.env.PORT||10000;app.listen(port,()=>console.log(`Training Institute Finder running on port ${port}`));
