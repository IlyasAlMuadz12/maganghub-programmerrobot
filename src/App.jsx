import {useState,useEffect,useMemo} from 'react';
import {LEVELS,WORLDS,ARROW,DN,LBL,GOAL,cn,simulate,starsFor} from './game.js';
import {storage} from './storage.js';
import {audio,sfx} from './audio.js';

const AVS=['🤖','👾','🦊','🐼','🦄','🐯'],MAX=30;
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,16);

export default function App(){
  const [muted,setMuted]=useState(audio.isMuted()),[me,setMe]=useState(null),[screen,setScreen]=useState('login'),[lv,setLv]=useState(0);
  useEffect(()=>{const f=()=>audio.start();window.addEventListener('pointerdown',f,{once:true});window.addEventListener('keydown',f,{once:true});return()=>{window.removeEventListener('pointerdown',f);window.removeEventListener('keydown',f)}},[]);
  useEffect(()=>{(async()=>{const id=await storage.last();if(id){const s=await storage.get(id);if(s){setMe(s);setScreen('home')}}})()},[]);
  const login=s=>{setMe(s);setScreen('home')};
  const onWin=async(i,st,k)=>{
    const s={...me,stars:{...me.stars},best:{...me.best}};
    s.stars[i]=Math.max(st,s.stars[i]||0);s.best[i]=Math.min(k,s.best[i]||99);
    s.total=Object.values(s.stars).reduce((a,b)=>a+b,0);setMe(s);await storage.put(s);
  };
  return(<main>
    <div className="top"><h1>🚀 Misi Coder-Bot</h1><button className="btn" onClick={()=>setMuted(audio.toggleMute())}>{muted?'🔇 Suara mati':'🔊 Suara'}</button></div>
    {screen==='login'&&<Login onLogin={login}/>}
    {screen==='home'&&<Home me={me} onPlay={i=>{setLv(i);setScreen('game')}} onOut={async()=>{await storage.logout();setMe(null);setScreen('login')}}/>}
    {screen==='game'&&<Game key={lv} me={me} L={LEVELS[lv]} onWin={onWin} onBack={()=>setScreen('home')} onNext={()=>lv<LEVELS.length-1?setLv(lv+1):setScreen('home')}/>}
  </main>);
}

function Login({onLogin}){
  const [name,setName]=useState(''),[pin,setPin]=useState(''),[av,setAv]=useState(AVS[0]),[err,setErr]=useState(''),[busy,setBusy]=useState(false);
  const go=async()=>{
    const id=slug(name.trim());setErr('');
    if(id.length<2)return setErr('Tulis namamu dulu ya (minimal 2 huruf/angka).');
    if(!/^\d{4}$/.test(pin))return setErr('PIN harus 4 angka.');
    setBusy(true);const s=await storage.get(id);setBusy(false);
    if(s){if(s.pin!==pin)return setErr('PIN salah. Coba ingat lagi! 🤔');await storage.put(s);return onLogin(s)}
    const n={id,name:name.trim(),pin,av,stars:{},best:{},total:0};await storage.put(n);onLogin(n);
  };
  return(<section className="panel">
    <b>Halo Kapten Programmer! Siapa namamu?</b>
    <div className="avs">{AVS.map(a=><button key={a} className={'av'+(a===av?' on':'')} onClick={()=>setAv(a)}>{a}</button>)}</div>
    <label>Nama<input value={name} maxLength={16} onChange={e=>setName(e.target.value)} placeholder="contoh: Budi"/></label>
    <label>PIN 4 angka<input value={pin} maxLength={4} inputMode="numeric" type="password" onChange={e=>setPin(e.target.value)}/></label>
    <div className="err">{err}</div>
    <button className="btn pri" disabled={busy} onClick={go}>{busy?'Memuat...':'Masuk / Daftar'}</button>
  </section>);
}

function Home({me,onPlay,onOut}){
  const [board,setBoard]=useState([]);
  useEffect(()=>{storage.all().then(setBoard)},[me]);
  const open=i=>i===0||(me.stars[i-1]||0)>0;
  return(<>
    <section className="panel top"><div><b>Halo {me.av} {me.name}!</b><div>⭐ Total bintang: {me.total}/{LEVELS.length*3}</div></div><button className="btn" onClick={onOut}>Keluar</button></section>
    <section className="panel">{WORLDS.map((t,w)=><div key={w}><h2>{t}</h2>
      <div className="lvgrid">{LEVELS.filter(l=>l.w===w).map(l=>{const s=me.stars[l.i]||0;
        return<button key={l.i} className={'lv'+(s?' ok':'')} disabled={!open(l.i)} onClick={()=>onPlay(l.i)}>{l.i+1}<small>{!open(l.i)?'🔒':s?'⭐'.repeat(s):'—'}</small></button>})}</div></div>)}</section>
    <section className="panel"><b>🏆 Papan Peringkat</b>
      <ol className="lb">{board.length?board.map((s,i)=><li key={s.id} className={s.id===me.id?'me':''}><span>{['🥇','🥈','🥉'][i]||(i+1)+'.'} {s.av} {s.name}</span><span>⭐ {s.total||0}</span></li>):<li>Belum ada pemain.</li>}</ol></section>
  </>);
}

function Board({L,pos,dir,boom,won}){
  const cells=[];
  for(let r=0;r<L.n;r++){cells.push(<div className="hd" key={'h'+r}>B{r+1}</div>);
    for(let c=0;c<L.n;c++){
      const isR=pos[0]===r&&pos[1]===c&&boom!=='out',isT=L.target[0]===r&&L.target[1]===c,isB=L.bugs.some(b=>b[0]===r&&b[1]===c);
      cells.push(<div key={r+'-'+c} className={'cell'+(isR&&won?' win':'')+(isR&&boom==='bug'?' boom':'')}>
        {L.n<5&&<small>{cn(r,c)}</small>}
        {isR?<span className="robot">🤖<span className="ar">{ARROW[dir]}</span></span>:isT?L.obj:isB?'❌':null}</div>);}}
  return<div className="gridwrap" style={{gridTemplateColumns:`28px repeat(${L.n},1fr)`,'--n':L.n}}>
    <div/>{Array.from({length:L.n},(_,c)=><div className="hd" key={c}>K{c+1}</div>)}{cells}</div>;
}

function Game({me,L,onWin,onBack,onNext}){
  const [code,setCode]=useState([]),[run,setRun]=useState(null),[say,setSay]=useState(''),[pop,setPop]=useState(false);
  const sim=run?.sim,idx=run?.idx||0,running=!!run&&idx<sim.steps.length;
  const shown=idx>0?sim.steps[idx-1]:null,pos=shown?shown.pos:L.start,dir=shown?shown.dir:L.dir;
  const finished=!!run&&!running,err=finished?sim.steps.at(-1)?.error:null,won=finished&&!err&&sim.won;
  const par=L.par,k=code.length,st=starsFor(k,par);

  useEffect(()=>{ if(!running)return; const t=setTimeout(()=>setRun(r=>({...r,idx:r.idx+1})),700); return()=>clearTimeout(t)},[running,idx]);
  useEffect(()=>{ if(won){onWin(L.i,st,k);sfx.win();setPop(true)} },[won]);
  useEffect(()=>{ if(!run||idx===0)return; const s=sim.steps[idx-1]; s.error?sfx.boom():sfx.step(s.c) },[run,idx]);

  const edit=fn=>{if(running)return;setRun(null);setPop(false);setCode(fn)};
  const msg=useMemo(()=>{
    if(!run)return`Halo Kapten ${me.name}! 🚀 Bayangkan jalurnya dulu, lalu susun kartunya!`;
    if(running)return'Eksekusi dimulai! Perhatikan robotmu... 🎬';
    const last=sim.steps.at(-1),n=last.i+1;
    if(err==='out')return`💥 Glitch di langkah ${n} [ ${LBL[last.c]} ]! Robot di ${cn(...last.pos)} menghadap ${DN[last.dir]} ${ARROW[last.dir]}, tapi di depannya sudah tepi papan 🚧. Perlu belok dulu atau berhenti lebih awal?`;
    if(err==='bug')return`💥 Glitch di langkah ${n} [ ${LBL[last.c]} ]! Robot menginjak ❌ di ${cn(...last.pos)} 😵. Kartu mana sebelum langkah ${n} yang bisa diganti supaya robot menghindari ❌?`;
    if(sim.won)return`HEBAT, Kapten ${me.name}! 🎉 ${st===3?'Kodemu sudah paling singkat!':`Bisakah pakai ${par} kartu saja untuk ⭐⭐⭐?`} Bintangmu disimpan 💾`;
    return`Tidak ada bug, tapi robot berhenti di ${cn(...pos)} menghadap ${DN[dir]} ${ARROW[dir]}. Target ${L.obj} di ${cn(...L.target)} 🤔. Kurang berapa kotak, dan belok ke mana?`;
  },[run,idx]);

  return(<>
    <div className="top"><button className="btn" onClick={onBack} disabled={running}>⬅ Peta Level</button><b>Level {L.i+1}</b></div>
    <section className="panel">
      <p>Antar robot ke {L.obj} ({GOAL[L.obj]}) di <b>{cn(...L.target)}</b>. Hindari ❌! Kode terpendek: <b>{par}</b> kartu ⭐⭐⭐</p>
      <Board L={L} pos={pos} dir={dir} boom={err} won={won}/>
      <div className="status">{err?'💥 BOOM! BUG DETECTED!':won?`🏆 MISI SELESAI! ${'⭐'.repeat(st)} (${k} kartu)`:shown?`Langkah ${idx}: ${LBL[shown.c]} → ${cn(...pos)}, menghadap ${DN[dir]} ${ARROW[dir]}`:`📍 Robot di ${cn(...pos)}, menghadap ${DN[dir]} ${ARROW[dir]}`}</div>
    </section>
    <section className="panel">
      <b>🧩 Kartu perintah</b>
      <div className="row">{Object.keys(LBL).map(c=><button key={c} className={'blk '+c} onClick={()=>edit(a=>a.length<MAX?[...a,c]:a)}>{LBL[c]}</button>)}</div>
      <b style={{display:'block',marginTop:14}}>🎮 Kodemu <small>(ketuk kartu untuk menghapus)</small></b>
      <div className="prog">{k?code.map((c,i)=><button key={i} disabled={running} onClick={()=>edit(a=>a.filter((_,j)=>j!==i))}
        className={'blk '+c+(running&&i===idx?' now':'')+(err&&i===sim.steps.at(-1).i?' bad':'')}><span className="n">{i+1}</span>[ {LBL[c]} ]</button>)
        :<span className="empty">Belum ada kartu. Ketuk kartu di atas!</span>}</div>
      <div className="row">
        <button className="btn pri" disabled={running||!k} onClick={()=>setRun({sim:simulate(L,code),idx:0})}>▶ JALANKAN!</button>
        <button className="btn" onClick={()=>edit(a=>a.slice(0,-1))}>⌫ Hapus terakhir</button>
        <button className="btn" onClick={()=>edit(()=>[])}>🗑 Kosongkan</button>
        {won&&<button className="btn" onClick={onNext}>Level berikutnya ➡️</button>}
      </div>
    </section>
    {pop&&<Popup st={st} k={k} par={par} last={L.i===LEVELS.length-1} onNext={onNext} onAgain={()=>{setRun(null);setCode([]);setPop(false)}} onClose={()=>setPop(false)}/>}
    <section className="panel gm"><div className="ic">🤖</div><div><b>Coder-Bot (GM)</b><div>{msg}</div></div></section>
  </>);
}

const FL=['🌸','🌼','🌺','🌷','🌻','💐'];
function Popup({st,k,par,last,onNext,onAgain,onClose}){
  const petals=useMemo(()=>Array.from({length:26},(_,i)=>({e:FL[i%FL.length],l:Math.random()*100,d:Math.random()*2.5,s:2.8+Math.random()*2.5,z:22+Math.random()*22})),[]);
  return(<div className="pop" role="dialog" aria-modal="true">
    {petals.map((p,i)=><span key={i} className="petal" style={{left:p.l+'%',animationDelay:p.d+'s',animationDuration:p.s+'s',fontSize:p.z}}>{p.e}</span>)}
    <div className="popcard">
      <div className="big">🎉🏆🎉</div><h2>Misi Selesai!</h2><div className="big">{'⭐'.repeat(st)}</div>
      <p>{k} kartu dipakai. {st===3?'Kodemu paling singkat! Luar biasa!':`Coba ${par} kartu untuk ⭐⭐⭐!`}</p>
      <div className="row" style={{justifyContent:'center'}}>
        <button className="btn pri" onClick={onNext}>{last?'Ke Peta Level':'Level berikutnya ➡️'}</button>
        <button className="btn" onClick={onAgain}>🔄 Main lagi</button>
        <button className="btn" onClick={onClose}>Tutup</button>
      </div></div></div>);
}
