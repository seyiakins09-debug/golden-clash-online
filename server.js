const express=require('express'),http=require('http'),{Server}=require('socket.io'),crypto=require('crypto');
const app=express(),server=http.createServer(app),io=new Server(server),rooms=new Map();
app.use(express.static('public'));app.get('/healthz',(_,r)=>r.send('OK'));
const code=()=>crypto.randomBytes(3).toString('hex').toUpperCase(),name=s=>String(s||'').trim().slice(0,30);
function state(r){return {code:r.code,active:r.active,setNo:r.setNo,round:r.round,open:r.open,challenge:r.open?r.challenge:null,reveal:r.reveal,players:[...r.players.values()],host:!!r.host};}
function send(r){io.to(r.code).emit('state',state(r));}
io.on('connection',s=>{
 s.on('create',d=>{if(!name(d.name)||String(d.pin||'').length<4)return s.emit('err','Host name and PIN (4+ characters) required');let c;do{c=code()}while(rooms.has(c));let r={code:c,pin:String(d.pin),host:s.id,active:false,setNo:1,round:-1,open:false,reveal:false,challenge:null,players:new Map()};rooms.set(c,r);s.join(c);s.data={code:c,role:'host'};s.emit('created',c);send(r)});
 s.on('join',d=>{let r=rooms.get(String(d.code||'').toUpperCase());if(!r)return s.emit('err','Room not found');if(!name(d.name))return s.emit('err','Enter player name');r.players.set(s.id,{id:s.id,name:name(d.name),xp:0,awards:0});s.join(r.code);s.data={code:r.code,role:'player'};s.emit('joined',r.code);send(r)});
 s.on('reconnectHost',d=>{let r=rooms.get(String(d.code||'').toUpperCase());if(!r||r.pin!==String(d.pin))return s.emit('err','Room/PIN incorrect');r.host=s.id;s.data={code:r.code,role:'host'};s.join(r.code);s.emit('created',r.code);send(r)});
 s.on('host',d=>{let r=rooms.get(s.data.code);if(!r||s.data.role!=='host'||r.host!==s.id)return s.emit('err','Host only');switch(d.a){
 case 'start':r.active=true;r.setNo=+d.set||1;r.round=-1;r.open=false;r.players.forEach(p=>{p.xp=0;p.awards=0});break;
 case 'open':if(!r.active||r.open||r.round>=4)return s.emit('err','Cannot open round');r.round++;r.open=true;r.reveal=false;r.challenge=d.q;break;
 case 'close':r.open=false;r.challenge=null;r.reveal=false;break;
 case 'reveal':if(r.open)r.reveal=true;break;
 case 'award':{let p=r.players.get(d.id);if(p){p.xp+=Math.max(0,+d.xp||0);p.awards++}break}
 case 'clear':{let p=r.players.get(d.id);if(p){p.xp=0;p.awards=0}break}
 case 'finish':r.active=false;r.open=false;r.challenge=null;break;
 case 'reset':io.to(r.code).emit('ended');rooms.delete(r.code);return;
 }send(r)});
 s.on('disconnect',()=>{let r=rooms.get(s.data.code);if(!r)return;if(s.data.role==='player')r.players.delete(s.id);send(r)});
});
server.listen(process.env.PORT||10000,'0.0.0.0',()=>console.log('Golden Clash online server ready'));
