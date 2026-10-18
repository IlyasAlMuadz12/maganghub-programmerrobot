// Suara & musik dibuat dengan Web Audio API (tanpa file mp3).
export const PACKS=[{n:'8-Bit Klasik',e:'👾'},{n:'Marimba Ceria',e:'🎹'},{n:'Robot Sci-Fi',e:'🤖'},{n:'Gelembung Air',e:'🫧'},{n:'Kayu & Drum',e:'🥁'}];
const P=[['square',.12,.09,880,[440,587],740,520],['sine',.25,.22,660,[523,659],784,392],['sawtooth',.09,.1,300,[220,330],440,180],['sine',.2,.12,1200,[880,1175],1318,988],['triangle',.3,.07,200,[196,247],330,147]];
export const BGMS=[
 {n:'Petualangan Robot',e:'🚀',ms:260,w:'triangle',v:.14,mel:[523,659,784,659,880,784,659,587,523,659,784,880,784,659,587,0],bass:[131,131,175,175,196,196,131,131]},
 {n:'Santai di Pantai',e:'🌴',ms:340,w:'sine',v:.18,mel:[392,0,494,0,587,0,494,440,392,0,440,0,494,587,494,0],bass:[98,98,98,98,147,147,131,131]},
 {n:'Karnaval Ceria',e:'🎪',ms:200,w:'square',v:.07,mel:[523,659,523,784,659,1047,784,659,587,698,587,880,698,1175,880,698],bass:[131,196,131,196,175,262,196,131]},
 {n:'Malam Tenang',e:'🌙',ms:420,w:'sine',v:.18,mel:[440,0,523,0,659,0,587,0,523,0,440,0,392,0,440,0],bass:[110,110,87,87,98,98,110,110]},
 {n:'Balapan Seru',e:'🏎️',ms:170,w:'sawtooth',v:.05,mel:[659,784,659,988,880,784,659,587,659,784,880,988,880,784,659,0],bass:[82,82,82,98,82,82,110,98]},
];
let ctx=null,master=null,sfxG=null,bgmG=null,timer=null,beat=0,curMs=0,muted=false,cfg={pack:0,bgm:0,sfxVol:.8,bgmVol:.5,bgmOn:true};
try{muted=localStorage.getItem('cb-mute')==='1'}catch{}
const AC=typeof window!=='undefined'&&(window.AudioContext||window.webkitAudioContext);
function ensure(){
  if(!ctx&&AC){ctx=new AC();master=ctx.createGain();master.gain.value=muted?0:1;master.connect(ctx.destination);
    sfxG=ctx.createGain();sfxG.gain.value=cfg.sfxVol;sfxG.connect(master);bgmG=ctx.createGain();bgmG.gain.value=cfg.bgmVol;bgmG.connect(master)}
  if(ctx&&ctx.state==='suspended')ctx.resume();return ctx;
}
function tone(f,d=.15,type='square',v=.15,at=0,dest){
  const c=ensure();if(!c)return;const t=c.currentTime+at,o=c.createOscillator(),g=c.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(.0001,t);
  g.gain.exponentialRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(g);g.connect(dest||sfxG);o.start(t);o.stop(t+d+.02);
}
function sweep(f1,f2,d,type,v){
  const c=ensure();if(!c)return;const t=c.currentTime,o=c.createOscillator(),g=c.createGain();
  o.type=type;o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(f2,t+d);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(sfxG);o.start(t);o.stop(t+d+.02);
}
function noise(d,v){
  const c=ensure();if(!c)return;const n=Math.floor(c.sampleRate*d),b=c.createBuffer(1,n,c.sampleRate),a=b.getChannelData(0);
  for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);
  const s=c.createBufferSource(),g=c.createGain();g.gain.value=v;s.buffer=b;s.connect(g);g.connect(sfxG);s.start();
}
export const sfx={
  click(pk=cfg.pack){const p=P[pk];tone(p[3],.05,p[0],p[1])},
  step(c,pk=cfg.pack){const[w,v,d,,f,r,l]=P[pk];
    if(c==='F'){tone(f[0],d,w,v);tone(f[1],d,w,v,.07)}
    else if(c==='B'){tone(f[1],d,w,v);tone(f[0],d,w,v,.07)}
    else if(c==='U'){tone(r,d*1.2,w,v*1.5);tone(l,d*1.2,w,v*1.5,.1)}
    else if(c==='P'){tone(1175,.12,'sine',.2);tone(1568,.22,'sine',.18,.1)}
    else tone(c==='R'?r:l,d*1.3,w,v*1.5)},
  demo(pk){sfx.click(pk);setTimeout(()=>sfx.step('F',pk),160);setTimeout(()=>sfx.step('R',pk),380);setTimeout(()=>sfx.step('L',pk),560)},
  boom(){sweep(420,50,.55,'sawtooth',.22);noise(.35,.25);tone(110,.4,'square',.15,.05)},
  win(){[523,659,784,1047].forEach((f,i)=>tone(f,.28,'triangle',.22,i*.13));
    [1568,2093,1760,2349,2637].forEach((f,i)=>tone(f,.18,'sine',.1,.6+i*.08));[523,659,784].forEach(f=>tone(f,.9,'triangle',.12,.6))},
};
function tick(){if(!ctx)return;const g=BGMS[cfg.bgm]||BGMS[0],m=g.mel[beat%16];
  if(m)tone(m,g.ms/1000*.85,g.w,g.v,0,bgmG);
  if(beat%2===0)tone(g.bass[Math.floor(beat/2)%8],g.ms/1000*1.7,'sine',.2,0,bgmG);beat++}
function sync(){
  const on=ctx&&cfg.bgmOn&&!muted,ms=(BGMS[cfg.bgm]||BGMS[0]).ms;
  if(timer&&(!on||ms!==curMs)){clearInterval(timer);timer=null}
  if(on&&!timer){curMs=ms;beat=0;timer=setInterval(tick,ms)}
}
export const audio={
  start(){ensure();sync()},
  isMuted:()=>muted,
  config(c){cfg={...cfg,...c};if(sfxG)sfxG.gain.value=cfg.sfxVol;if(bgmG)bgmG.gain.value=cfg.bgmVol;sync()},
  toggleMute(){muted=!muted;try{localStorage.setItem('cb-mute',muted?'1':'0')}catch{}
    if(ensure())master.gain.value=muted?0:1;sync();return muted},
};
