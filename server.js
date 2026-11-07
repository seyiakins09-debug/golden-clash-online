const express=require('express');
const http=require('http');
const {Server}=require('socket.io');
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const app=express(), server=http.createServer(app), io=new Server(server);
const PORT=process.env.PORT||3000;
const BANK=JSON.parse(fs.readFileSync(path.join(__dirname,'data/questions.json'),'utf8'));
const rooms=new Map();
app.use(express.static(path.join(__dirname,'public')));
app.get('/health',(req,res)=>res.json({ok:true,rooms:rooms.size,bankRounds:BANK.length}));
function makeCode(){return crypto.randomBytes(3).toString('hex').toUpperCase()}
function clean(s,max=40){return String(s||'').trim().slice(0,max)}
function norm(s){return String(s??'').toLowerCase().trim().replace(/\s+/g,'').replace(/[.,!?]/g,'')}
function roomView(room){return {code:room.code,hostName:room.hostName,started:room.started,set:room.set,round:room.round,players:[...room.players.values()].map(p=>({id:p.id,name:p.name,team:p.team,captain:p.captain})),scores:room.scores,teams:room.teams,question:room.question?{set:room.question.set,round:room.question.round,category:room.question.category,xp:room.question.xp,question:room.question.question,published:room.question.published,revealed:room.question.revealed,answer:room.question.revealed?room.question.answer:null}:null,timer:room.timer,roundWinner:room.roundWinner,notice:room.notice}}
function emitRoom(room){io.to(room.code).emit('room:update',roomView(room))}
function stopTimer(room){if(room.timerHandle){clearInterval(room.timerHandle);room.timerHandle=null}}
function nextRound(room){stopTimer(room); room.roundWinner=null; room.notice=''; room.question=null; if(room.round>=10){room.round=1;room.set++;}else room.round++; if(room.set>30){room.finished=true;room.started=false;room.notice='Tournament complete!';} emitRoom(room)}
io.on('connection',socket=>{
 socket.on('host:create',({name}={})=>{
  let code=makeCode(); while(rooms.has(code))code=makeCode();
  const room={code,name:clean(name||'Host'),hostId:socket.id,hostName:clean(name||'Host'),players:new Map(),teams:{A:[],B:[]},scores:{A:0,B:0},started:false,finished:false,set:1,round:1,question:null,timer:0,timerHandle:null,roundWinner:null,notice:'Room created. Share the code with your players.'};
  rooms.set(code,room);socket.join(code);socket.data.room=code;socket.data.role='host';socket.emit('room:created',{code});emitRoom(room);
 });
 socket.on('player:join',({code,name,team})=>{
  code=clean(code,8).toUpperCase(); const room=rooms.get(code); if(!room)return socket.emit('error:message','Room code not found.');
  if(room.started)return socket.emit('error:message','This room has already started.');
  if(room.players.size>=6)return socket.emit('error:message','Room is full (6 players maximum).');
  name=clean(name,24); if(!name)return socket.emit('error:message','Enter your player name.');
  if([...room.players.values()].some(p=>p.name.toLowerCase()===name.toLowerCase()))return socket.emit('error:message','That player name is already in use.');
  if(!['A','B'].includes(team))return socket.emit('error:message','Choose Team A or Team B.');
  if(room.teams[team].length>=3)return socket.emit('error:message',`Team ${team} is full. Choose the other team.`);
  const player={id:socket.id,name,team,captain:false}; room.players.set(socket.id,player);room.teams[team].push(socket.id);socket.join(code);socket.data.room=code;socket.data.role='player';
  room.notice=`${name} joined Team ${team}.`;emitRoom(room);
 });
 socket.on('captain:choose',()=>{const room=rooms.get(socket.data.room);if(!room||socket.data.role!=='player')return;const p=room.players.get(socket.id);if(!p)return;room.players.forEach(x=>{if(x.team===p.team)x.captain=false});p.captain=true;room.notice=`${p.name} is now Team ${p.team} captain.`;emitRoom(room)});
 socket.on('host:start',()=>{const room=rooms.get(socket.data.room);if(!room||room.hostId!==socket.id)return;if(room.players.size!==6||room.teams.A.length!==3||room.teams.B.length!==3)return socket.emit('error:message','Start requires exactly 3 players on each team (6 total).');room.started=true;room.notice='Golden Clash has started!';room.question=null;emitRoom(room)});
 socket.on('host:publish',({set,round,question,answer,xp,category})=>{const room=rooms.get(socket.data.room);if(!room||room.hostId!==socket.id)return;if(!room.started)return socket.emit('error:message','Start the game first.');if(room.roundWinner)return socket.emit('error:message','Round already won. Reveal and move to next round.');set=Number(set)||room.set;round=Number(round)||room.round;question=clean(question,1000);answer=clean(answer,300);if(!question||!answer)return socket.emit('error:message','Question and answer are required.');room.set=set;room.round=round;room.question={set,round,category:clean(category||'Golden Challenge',50),xp:Math.max(0,Number(xp)||500),question,answer,acceptedAnswers:[answer],published:true,revealed:false};room.notice=`Set ${set}, Round ${round} is live!`;emitRoom(room)});
 socket.on('host:publish-bank',()=>{const room=rooms.get(socket.data.room);if(!room||room.hostId!==socket.id)return;if(!room.started)return socket.emit('error:message','Start the game first.');const q=BANK.find(x=>x.set===room.set&&x.round===room.round);if(!q)return socket.emit('error:message','No bank question found for this round.');room.question={...q,published:true,revealed:false};room.roundWinner=null;room.notice=`${q.category} is live!`;emitRoom(room)});
 socket.on('player:answer',({answer})=>{const room=rooms.get(socket.data.room);if(!room||socket.data.role!=='player')return;const p=room.players.get(socket.id);if(!p||!room.started||!room.question||!room.question.published||room.question.revealed||room.roundWinner)return;answer=clean(answer,300);if(!answer)return;const correct=room.question.acceptedAnswers.some(a=>norm(a)===norm(answer));if(correct){room.roundWinner=p.team;room.scores[p.team]+=room.question.xp;room.notice=`${p.name} from Team ${p.team} answered correctly! +${room.question.xp.toLocaleString()} XP`;stopTimer(room);emitRoom(room);io.to(room.code).emit('round:won',{team:p.team,player:p.name,xp:room.question.xp});}else{socket.emit('answer:result',{correct:false,message:'Incorrect answer. No XP awarded. Try again while the round is live.'})}});
 socket.on('host:reveal',()=>{const room=rooms.get(socket.data.room);if(!room||room.hostId!==socket.id||!room.question)return;room.question.revealed=true;room.notice=`Answer revealed: ${room.question.answer}`;emitRoom(room)});
 socket.on('host:timer',({seconds})=>{const room=rooms.get(socket.data.room);if(!room||room.hostId!==socket.id)return;stopTimer(room);seconds=Math.min(600,Math.max(5,Number(seconds)||30));room.timer=seconds;room.notice=`Timer started: ${seconds} seconds`;room.timerHandle=setInterval(()=>{room.timer--;if(room.timer<=0){stopTimer(room);room.timer=0;room.notice='Time is up!';emitRoom(room)}else emitRoom(room)},1000);emitRoom(room)});
 socket.on('host:stop-timer',()=>{const room=rooms.get(socket.data.room);if(!room||room.hostId!==socket.id)return;stopTimer(room);room.timer=0;room.notice='Timer stopped.';emitRoom(room)});
 socket.on('host:next',()=>{const room=rooms.get(socket.data.room);if(!room||room.hostId!==socket.id)return;if(!room.question)return;room.question.revealed=true;nextRound(room)});
 socket.on('host:reset',()=>{const room=rooms.get(socket.data.room);if(!room||room.hostId!==socket.id)return;stopTimer(room);room.started=false;room.finished=false;room.set=1;room.round=1;room.scores={A:0,B:0};room.roundWinner=null;room.question=null;room.notice='Game reset. Players remain in the room.';emitRoom(room)});
 socket.on('disconnect',()=>{const room=rooms.get(socket.data.room);if(!room)return;if(socket.data.role==='player'){const p=room.players.get(socket.id);if(p){room.players.delete(socket.id);room.teams[p.team]=room.teams[p.team].filter(id=>id!==socket.id);room.notice=`${p.name} disconnected.`;emitRoom(room)}}else if(room.hostId===socket.id){room.notice='Host disconnected. Room remains temporarily available.';emitRoom(room)}});
});
server.listen(PORT,()=>console.log(`Golden Arena running on ${PORT}`));
