// Suara & musik latar dibuat langsung dengan Web Audio API (tanpa file mp3).
let ctx=null,master=null,bgmGain=null,timer=null,beat=0,muted=false;
try{muted=localStorage.getItem('cb-mute')==='1'}catch{}
const AC=typeof window!=='undefined'&&(window.AudioContext||window.webkitAudioContext);

function ensure(){
  if(!ctx&&AC){ctx=new AC();master=ctx.createGain();master.gain.value=muted?0:1;master.connect(ctx.destination);
    bgmGain=ctx.createGain();bgmGain.gain.value=.5;bgmGain.connect(master)}
  if(ctx&&ctx.state==='suspended')ctx.resume();
  return ctx;
}
function tone(f,d=.15,type='square',v=.15,at=0,dest){
  const c=ensure();if(!c)return;const t=c.currentTime+at,o=c.createOscillator(),g=c.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(.0001,t);
  g.gain.exponentialRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(g);g.connect(dest||master);o.start(t);o.stop(t+d+.02);
}
function sweep(f1,f2,d,type,v){
  const c=ensure();if(!c)return;const t=c.currentTime,o=c.createOscillator(),g=c.createGain();
  o.type=type;o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(f2,t+d);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(master);o.start(t);o.stop(t+d+.02);
}
function noise(d,v){
  const c=ensure();if(!c)return;const n=Math.floor(c.sampleRate*d),b=c.createBuffer(1,n,c.sampleRate),a=b.getChannelData(0);
  for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);
  const s=c.createBufferSource(),g=c.createGain();g.gain.value=v;s.buffer=b;s.connect(g);g.connect(master);s.start();
}

export const sfx={
  step(c){ if(c==='F'){tone(440,.09,'square',.12);tone(587,.09,'square',.12,.07)} // maju: bip naik
    else if(c==='R')tone(740,.12,'triangle',.2); else tone(520,.12,'triangle',.2) }, // belok
  boom(){ sweep(420,50,.55,'sawtooth',.22);noise(.35,.25);tone(110,.4,'square',.15,.05) },
  win(){ [523,659,784,1047].forEach((f,i)=>tone(f,.28,'triangle',.22,i*.13));
    [1568,2093,1760,2349,2637].forEach((f,i)=>tone(f,.18,'sine',.1,.6+i*.08));
    [523,659,784].forEach(f=>tone(f,.9,'triangle',.12,.6)) },
};

const MEL=[523,659,784,659,880,784,659,587,523,659,784,880,784,659,587,0];
const BASS=[131,131,175,175,196,196,131,131];
function tick(){
  if(!ctx)return;const m=MEL[beat%16];
  if(m)tone(m,.22,'triangle',.07,0,bgmGain);
  if(beat%2===0)tone(BASS[Math.floor(beat/2)%8],.45,'sine',.1,0,bgmGain);
  beat++;
}
function run(){ if(!timer)timer=setInterval(tick,260) }
function halt(){ clearInterval(timer);timer=null }

export const audio={
  start(){ if(ensure()&&!muted)run() },            // dipanggil saat klik pertama (aturan browser)
  isMuted:()=>muted,
  toggleMute(){
    muted=!muted;try{localStorage.setItem('cb-mute',muted?'1':'0')}catch{}
    if(ensure()){master.gain.value=muted?0:1}
    muted?halt():run();return muted;
  },
};
