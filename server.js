const express=require('express'),http=require('http'),{Server}=require('socket.io'),crypto=require('crypto');
const app=express(),server=http.createServer(app),io=new Server(server),rooms=new Map();
app.use(express.static('public'));app.get('/healthz',(_,r)=>r.send('OK'));
const code=()=>crypto.randomBytes(3).toString('hex').toUpperCase(), clean=s=>String(s||'').trim().slice(0,40);
function publicState(r){return {code:r.code,active:r.active,setNo:r.setNo,round:r.round,open:r.open,reveal:r.reveal,challenge:r.open?r.challenge:null,players:[...r.players.values()].map(p=>({id:p.id,name:p.name,xp:p.xp,awards:p.awards,submitted:p.submitted})),hostOnline:!!r.host};}
function broadcast(r){io.to(r.code).emit('state',publicState(r));}
function hostOnly(s,r){return r&&s.data.role==='host'&&r.host===s.id;}
function endTimer(r){if(r.timer){clearTimeout(r.timer);r.timer=null}}
function closeRound(r){endTimer(r);r.open=false;r.reveal=false;r.challenge=null;r.submissions=[];}
io.on('connection',s=>{
 s.on('create',d=>{if(!clean(d.name)||String(d.pin||'').length<4)return s.emit('err','Host login requires a host name and PIN of at least 4 characters.');let c;do{c=code()}while(rooms.has(c));let r={code:c,pin:String(d.pin),host:s.id,active:false,setNo:1,round:-1,open:false,reveal:false,challenge:null,players:new Map(),submissions:[],timer:null};rooms.set(c,r);s.join(c);s.data={code:c,role:'host'};s.emit('created',c);broadcast(r)});
 s.on('reconnectHost',d=>{let r=rooms.get(String(d.code||'').toUpperCase());if(!r||r.pin!==String(d.pin))return s.emit('err','Incorrect room code or host PIN.');if(r.host&&io.sockets.sockets.has(r.host))return s.emit('err','Host is already connected.');r.host=s.id;s.data={code:r.code,role:'host'};s.join(r.code);s.emit('created',r.code);broadcast(r)});
 s.on('join',d=>{let r=rooms.get(String(d.code||'').toUpperCase());if(!r)return s.emit('err','Room not found. Check the room code.');if(!clean(d.name))return s.emit('err','Enter your player name.');if(!r.players.has(s.id))r.players.set(s.id,{id:s.id,name:clean(d.name),xp:0,awards:0,submitted:'',connected:true});s.join(r.code);s.data={code:r.code,role:'player'};s.emit('joined',r.code);broadcast(r)});
 s.on('submitAnswer',d=>{let r=rooms.get(s.data.code);if(!r||s.data.role!=='player'||!r.open||r.reveal)return s.emit('err','Answers are only accepted while the round is open and before reveal.');let p=r.players.get(s.id);if(!p)return s.emit('err','Join as a player first.');let answer=clean(d.answer);if(!answer)return s.emit('err','Type your answer first.');p.submitted=answer;r.submissions.push({playerId:s.id,name:p.name,answer,at:Date.now()});io.to(r.code).emit('answerSubmitted',{name:p.name});broadcast(r)});
 s.on('host',d=>{let r=rooms.get(s.data.code);if(!hostOnly(s,r))return s.emit('err','Host controls are only available to the host.');
 switch(d.a){
 case 'start':if(r.active)return s.emit('err','Finish the current set before starting another.');r.active=true;r.setNo=Math.max(1,Math.min(30,+d.set||1));r.round=-1;closeRound(r);r.players.forEach(p=>{p.xp=0;p.awards=0;p.submitted=''});break;
 case 'open':if(!r.active||r.open)return s.emit('err','Close the current round before opening the next.');if(+d.round!==r.round+1||r.round>=9)return s.emit('err','Use Next Round to open rounds in order.');r.round=+d.round;r.open=true;r.reveal=false;r.challenge=d.q;r.submissions=[];r.players.forEach(p=>p.submitted='');endTimer(r);r.timer=setTimeout(()=>{if(r.open){r.open=false;r.reveal=false;io.to(r.code).emit('timerEnded');broadcast(r)}},40000);break;
 case 'close':if(!r.challenge)return s.emit('err','No round has been opened yet.');endTimer(r);r.open=false;break;
 case 'reveal':if(!r.challenge||r.round<0)return s.emit('err','No round has been opened to reveal.');endTimer(r);r.open=false;r.reveal=true;io.to(r.code).emit('revealedAnswers',r.submissions);break;
 case 'awardWinner':if(!r.reveal||!r.challenge)return s.emit('err','Reveal the answer before awarding XP.');{let p=r.players.get(d.id);if(!p)return s.emit('err','Select a player.');if(p.awardedRound===r.round)return s.emit('err','This player has already received XP for this round.');p.xp+=r.challenge.xp;p.awards++;p.awardedRound=r.round;io.to(r.code).emit('winnerAwarded',{name:p.name,xp:r.challenge.xp});}break;
 case 'finish':if(!r.active)return s.emit('err','No active set.');r.active=false;closeRound(r);break;
 case 'reset':endTimer(r);io.to(r.code).emit('ended');rooms.delete(r.code);return;
 }broadcast(r)});
 s.on('disconnect',()=>{let r=rooms.get(s.data.code);if(!r)return;if(s.data.role==='player'){r.players.delete(s.id)}else if(r.host===s.id){r.host=null}broadcast(r)});
});
server.listen(process.env.PORT||10000,'0.0.0.0',()=>console.log('Golden Clash v2 ready'));
