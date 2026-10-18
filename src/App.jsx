import {useState,useEffect,useMemo,useRef} from 'react';
import {LEVELS,WORLDS,ARROW,DN,LBL,CMD,ORDER,ITEM,cn,simulate,starsFor,rankFor,countCards,expand,isNew,NEW_AT,fmtTime} from './game.js';
import {storage,DEFAULTS} from './storage.js';
import {audio,sfx,BGMS} from './audio.js';
import Settings from './Settings.jsx';
import Admin from './Admin.jsx';
import Hero,{EnterIcon,Rocket,CardBot} from './Hero.jsx';
import Board from './Board.jsx';
import Tutorial from './Tutorial.jsx';

const AVS=['🤖','👾','🦊','🐼','🦄','🐯'];
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,16);

export default function App(){
  const [admin,setAdmin]=useState(location.hash==='#/admin'),[muted,setMuted]=useState(audio.isMuted()),[me,setMe]=useState(null),[screen,setScreen]=useState('login'),[lv,setLv]=useState(0),[pend,setPend]=useState(null);
  const cfg=useMemo(()=>({...DEFAULTS,...(me?.settings||{})}),[me]);
  useEffect(()=>{document.body.classList.toggle('adminbg',admin);return()=>document.body.classList.remove('adminbg')},[admin]);
  useEffect(()=>{const h=()=>setAdmin(location.hash==='#/admin');window.addEventListener('hashchange',h);return()=>window.removeEventListener('hashchange',h)},[]);
  useEffect(()=>{const f=()=>audio.start();window.addEventListener('pointerdown',f,{once:true});window.addEventListener('keydown',f,{once:true});return()=>{window.removeEventListener('pointerdown',f);window.removeEventListener('keydown',f)}},[]);
  useEffect(()=>{document.body.classList.toggle('stage',screen==='login'&&!admin);document.body.classList.toggle('space',(screen==='home'||screen==='game'||screen==='end'||screen==='tutorial')&&!admin);document.body.classList.toggle('arena',screen==='game'&&!admin);return()=>document.body.classList.remove('stage','space','arena')},[screen,admin]);
  useEffect(()=>{audio.config(cfg);document.documentElement.dataset.theme=cfg.theme},[cfg]);
  useEffect(()=>{storage.restore().then(s=>{if(s){setMe(s);setScreen('home')}})},[]);
  const onRun=async(i,result,k,stars,secs)=>{setMe(await storage.play(me,i,k,result,result==='win'?stars:0,result==='win'?secs:null))};
  const play=i=>{if(storage.tutSeen(me)){setLv(i);setScreen('game')}else{setPend(i);setScreen('tutorial')}};
  const endTut=()=>{storage.setTutSeen(me);if(pend!=null){setLv(pend);setPend(null);setScreen('game')}else setScreen('home')};
  const nextSong=async()=>setMe(await storage.saveSettings(me,{...cfg,bgm:((cfg.bgm||0)+1)%BGMS.length,bgmOn:true}));
  if(admin)return<main className="wide"><Admin/></main>;
  return(<main className={screen==='home'||screen==='game'||screen==='tutorial'?'xl':undefined} onClickCapture={e=>{if(e.target.closest('button')&&!e.target.closest('[data-nosound]'))sfx.click()}}>
    {screen==='login'?<><Hero/><button className="mute" aria-label="Suara" onClick={()=>setMuted(audio.toggleMute())}>{muted?'🔇':'🔊'}</button></>:<div className="top"><h1>🚀 Misi Coder-Bot</h1><div className="row">
      {screen==='home'&&<button className="btn" onClick={()=>setScreen('settings')}>⚙️ Pengaturan</button>}
      {me&&screen!=='settings'&&<button className="btn" title="Ganti lagu latar" data-nosound onClick={nextSong}>🎵 {BGMS[cfg.bgm]?.e}</button>}
      <button className="btn" onClick={()=>setMuted(audio.toggleMute())}>{muted?'🔇':'🔊'}</button></div></div>}
    {screen==='login'&&<Auth onLogin={s=>{setMe(s);setScreen('home')}}/>}
    {screen==='home'&&<Home me={me} onCert={()=>setScreen('end')} onPlay={play} onTut={()=>{setPend(null);setScreen('tutorial')}} onOut={async()=>{await storage.logout();setMe(null);setScreen('login')}}/>}
    {screen==='settings'&&<Settings cfg={cfg} onBack={()=>{audio.config(cfg);setScreen('home')}} onSave={async v=>{setMe(await storage.saveSettings(me,v));setScreen('home')}}/>}
    {screen==='game'&&<Game key={lv} me={me} L={LEVELS[lv]} cfg={cfg} onRun={onRun} onBack={()=>setScreen('home')} onNext={()=>lv<LEVELS.length-1?setLv(lv+1):setScreen('end')}/>}
    {screen==='tutorial'&&<Tutorial onClose={endTut} doneLabel={pend!=null?'Mulai Main! 🚀':'Selesai ✔️'}/>}
    {screen==='end'&&<End me={me} onBack={()=>setScreen('home')}/>}
  </main>);
}

function Auth({onLogin}){
  const [tab,setTab]=useState('login'),[name,setName]=useState(''),[pin,setPin]=useState(''),[pin2,setPin2]=useState(''),[av,setAv]=useState(AVS[0]),[err,setErr]=useState(''),[busy,setBusy]=useState(false);
  const reg=tab==='daftar';
  const sw=t=>{setTab(t);setErr('');setPin('');setPin2('')};
  const go=async()=>{
    setErr('');
    if(slug(name.trim()).length<2)return setErr('Tulis namamu dulu ya (minimal 2 huruf/angka).');
    if(!/^\d{4}$/.test(pin))return setErr('PIN harus 4 angka.');
    if(reg&&pin!==pin2)return setErr('PIN pertama dan kedua belum sama.');
    setBusy(true);
    try{onLogin(await(reg?storage.register(name.trim(),pin,av):storage.login(name.trim(),pin)))}catch(e){setErr(e.message)}
    setBusy(false);
  };
  const key=e=>{if(e.key==='Enter')go()};
  return(<section className="auth">
    <div className="tabs" role="tablist"><button role="tab" aria-selected={!reg} className={'tab'+(!reg?' on':'')} onClick={()=>sw('login')}>🔑 Masuk</button><button role="tab" aria-selected={reg} className={'tab'+(reg?' on':'')} onClick={()=>sw('daftar')}>📝 Daftar Baru</button></div>
    <p><b>{reg?'Halo calon Kapten Programmer! Buat akunmu dulu ya. 🚀':'Selamat datang kembali, Kapten! Masukkan nama dan PIN-mu. 🎮'}</b></p>
    {reg&&<><b>Pilih avatar</b><div className="avs">{AVS.map(a=><button key={a} className={'av'+(a===av?' on':'')} onClick={()=>setAv(a)}>{a}</button>)}</div></>}
    <label>Nama<input value={name} maxLength={16} onChange={e=>setName(e.target.value)} onKeyDown={key} placeholder="contoh: Budi"/></label>
    <label>PIN 4 angka<input value={pin} maxLength={4} inputMode="numeric" type="password" onChange={e=>setPin(e.target.value)} onKeyDown={key}/></label>
    {reg&&<label>Ulangi PIN<input value={pin2} maxLength={4} inputMode="numeric" type="password" onChange={e=>setPin2(e.target.value)} onKeyDown={key}/></label>}
    <div className="err">{err}</div>
    <button className="go" disabled={busy} onClick={go}>{reg?<span aria-hidden="true">🚀</span>:<EnterIcon/>}{busy?'Memuat...':reg?'Daftar & Mulai':'Masuk'}</button>
    <p className="foot">{reg?'Sudah punya akun? Pilih tab Masuk.':'Belum punya akun? Pilih tab Daftar Baru.'} · <a href="#/admin">⚙️ Admin</a></p>
  </section>);
}

const POS=[[50,17],[21,47],[50,47],[79,47],[50,78]];
const DECO=[[['🌳',80,12],['🌸',12,74],['🌿',86,76]],[['🛸',82,10],['🏢',12,20],['🤖',10,76],['🤖',88,78]],[['✨',10,14],['🪐',90,12],['✨',90,84]]];
function Home({me,onPlay,onOut,onCert,onTut}){
  const [board,setBoard]=useState([]),refs=useRef([]);
  useEffect(()=>{storage.board().then(setBoard)},[me]);
  const tm=storage.times(me),open=i=>i===0||(me.stars[i-1]||0)>0,rk=rankFor(me.total),tamat=(me.stars[LEVELS.length-1]||0)>0;
  const cur=LEVELS.find(l=>open(l.i)&&!(me.stars[l.i]));
  const [wi,setWi]=useState(cur?cur.w:0);
  const go=w=>{const k=Math.max(0,Math.min(WORLDS.length-1,w));setWi(k);refs.current[k]?.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'})};
  return(<div className="home">
    <section className="acard"><div className="ava" aria-hidden="true">{me.av}</div>
      <div className="atext"><div className="ah">Adventurer Card</div><b>Halo {me.name}!</b><div>{rk.e} {rk.name} · ⭐ {me.total}/{LEVELS.length*3}</div><div className="row" style={{gap:6}}><button className="btn certbtn" onClick={onTut}>🎬 Cara Main</button>{tamat&&<button className="btn certbtn" onClick={onCert}>🎓 Sertifikat</button>}</div><small>{storage.isApi()?'☁️ Terhubung ke database':'💾 Mode lokal (server tidak terdeteksi)'}</small></div>
      <button className="exit" onClick={onOut}>Keluar</button></section>
    <div className="worlds">
      <svg className="trail" viewBox="0 0 1000 340" preserveAspectRatio="none" aria-hidden="true"><path d="M166 170C260 40 330 300 500 170S740 40 833 170" fill="none" stroke="#0F2F4D" strokeOpacity=".75" strokeWidth="26" strokeLinecap="round" vectorEffect="non-scaling-stroke"/><path d="M166 170C260 40 330 300 500 170S740 40 833 170" fill="none" stroke="#FFF3D6" strokeWidth="3" strokeDasharray="2 12" strokeLinecap="round" vectorEffect="non-scaling-stroke"/></svg>
      {WORLDS.map((t,w)=><div key={w} ref={el=>refs.current[w]=el} className={'world w'+w+(wi===w?' focus':'')}><h2>{t}</h2>
        <div className="planet">{DECO[w].map(([e,x,y],k)=><span key={k} className="deco" aria-hidden="true" style={{left:x+'%',top:y+'%'}}>{e}</span>)}
          {LEVELS.filter(l=>l.w===w).map((l,k)=>{const s=me.stars[l.i]||0,ok=open(l.i),now=cur&&cur.i===l.i;
            return<button key={l.i} style={{left:POS[k][0]+'%',top:POS[k][1]+'%'}} className={'tile'+(s?' done':'')+(now?' cur':'')+(!ok?' lock':'')} disabled={!ok} aria-label={'Level '+(l.i+1)+(!ok?' terkunci':s?', '+s+' bintang'+(tm[l.i]!=null?', waktu terbaik '+fmtTime(tm[l.i]):''):'')} onClick={()=>onPlay(l.i)}>
              {ok?<><b>{l.i+1}</b>{s>0&&<small>{'⭐'.repeat(s)}{tm[l.i]!=null&&<><br/>⏱️{fmtTime(tm[l.i])}</>}</small>}</>:<span className="lk" aria-hidden="true">🔒</span>}{now&&<span className="bot" aria-hidden="true">🤖</span>}</button>})}
        </div></div>)}
    </div>
    <div className="bottom"><div className="podium">{[1,0,2].map(r=>{const b=board[r];return<div key={r} className={'pod p'+(r+1)+(b&&b.id===me.id?' me':'')}><div className="medal" aria-hidden="true">{['⭐','🏅','🏆'][r]}</div>
      <div className="blk2"><b>{r+1}</b><span className="pn">{b?b.av+' '+b.name:'—'}</span><small>⭐ {b?b.total||0:0}</small></div></div>})}</div>
      <nav className="dnav" aria-label="Pilih dunia"><button aria-label="Dunia sebelumnya" disabled={wi===0} onClick={()=>go(wi-1)}>‹</button><button className="mid" onClick={()=>go(cur?cur.w:0)}>Dunia Map</button><button aria-label="Dunia berikutnya" disabled={wi===WORLDS.length-1} onClick={()=>go(wi+1)}>›</button></nav></div>
  </div>);
}

const where=s=>`${cn(...s.pos)} menghadap ${DN[s.dir]} ${ARROW[s.dir]}`;

function Blk({b,cls='',onClick,disabled,n}){
  return<button className={'blk '+b.c+' '+cls} disabled={disabled} onClick={onClick} aria-label={'Hapus kartu '+CMD[b.c].n}>{n&&<span className="n">{n}</span>}{CMD[b.c].e} {CMD[b.c].n}</button>;
}

function Game({me,L,cfg,onRun,onBack,onNext}){
  const [code,setCode]=useState([]),[open,setOpen]=useState(null),[run,setRun]=useState(null),[pop,setPop]=useState(false),[tip,setTip]=useState(''),[help,setHelp]=useState(false);
  const [ms,setMs]=useState(0),[best,setBest]=useState(()=>storage.times(me)[L.i]??null),[rec,setRec]=useState(null);
  const sim=run?.sim,idx=run?.idx||0,running=!!run&&idx<sim.steps.length;
  const shown=idx>0?sim.steps[idx-1]:null,pos=shown?shown.pos:L.start,dir=shown?shown.dir:L.dir,has=shown?shown.has:false;
  const finished=!!run&&!running,err=finished?sim.steps.at(-1)?.error:null,won=finished&&!err&&sim.won;
  const par=L.par,k=countCards(code),st=starsFor(k,par),full=k>=L.max,secs=Math.floor(ms/1000);

  // ===== Timer: mulai saat level dibuka, berhenti saat robot sampai di finish, berhenti sementara saat panduan dibuka =====
  const tm=useRef({last:Date.now(),on:true});
  tm.current.on=!won&&!help;
  useEffect(()=>{const t=setInterval(()=>{const n=Date.now(),d=n-tm.current.last;tm.current.last=n;if(tm.current.on)setMs(m=>m+Math.min(d,2000))},200);return()=>clearInterval(t)},[]);

  const speed=sim&&sim.steps.length>40?Math.min(cfg.speed,260):cfg.speed;
  useEffect(()=>{ if(!running)return; const t=setTimeout(()=>setRun(r=>({...r,idx:r.idx+1})),speed); return()=>clearTimeout(t)},[running,idx]);
  useEffect(()=>{ if(!finished)return;
    const result=err||(sim.won?'win':'short');
    if(won){const isRec=best==null||secs<best;setRec({secs,isRec,best});setBest(b=>b==null?secs:Math.min(b,secs));sfx.win();setPop(true)}
    onRun(L.i,result,k,st,won?secs:null);
  },[finished]);
  useEffect(()=>{ if(!run||idx===0)return; const s=sim.steps[idx-1]; s.error?sfx.boom():sfx.step(s.c) },[run,idx]);

  const touch=()=>{setRun(null);setPop(false);setTip('')};
  const add=c=>{
    if(running)return;
    if(full){setTip(`📦 Papan kartu penuh (${L.max} kartu). Hapus satu kartu, atau pakai 🔁 ULANGI supaya lebih hemat!`);return}
    if(c==='REP'){
      if(open!==null){setTip('🔁 ULANGI tidak boleh ada di dalam ULANGI. Tekan ✅ Selesai dulu ya.');return}
      touch();setCode([...code,{c:'REP',n:3,body:[]}]);setOpen(code.length);return}
    touch();
    setCode(open!==null?code.map((it,i)=>i===open?{...it,body:[...it.body,{c}]}:it):[...code,{c}]);
  };
  const delTop=i=>{if(running)return;touch();setCode(code.filter((_,j)=>j!==i));setOpen(o=>o===null?null:o===i?null:o>i?o-1:o)};
  const delIn=(i,j)=>{if(running)return;touch();setCode(code.map((it,x)=>x===i?{...it,body:it.body.filter((_,y)=>y!==j)}:it))};
  const rep=(i,d)=>{if(running)return;touch();setCode(code.map((it,x)=>x===i?{...it,n:Math.max(2,Math.min(9,it.n+d))}:it))};
  const undo=()=>{if(running)return;touch();
    if(open!==null&&code[open].body.length){setCode(code.map((it,i)=>i===open?{...it,body:it.body.slice(0,-1)}:it));return}
    if(open!==null)setOpen(null);
    setCode(code.slice(0,-1))};
  const clear=()=>{if(running)return;touch();setCode([]);setOpen(null)};
  const canRun=!running&&expand(code).length>0;
  const go=()=>{setPop(false);setTip('');setOpen(null);setRun({sim:simulate(L,code),idx:0})};
  const again=()=>{setRun(null);setCode([]);setOpen(null);setPop(false);setTip('');setMs(0);tm.current.last=Date.now();setRec(null)};

  const newC=ORDER.find(c=>NEW_AT[c]===L.i);
  const msg=useMemo(()=>{
    if(tip)return tip;
    if(!run){
      if(newC)return`✨ Kartu baru: ${CMD[newC].e} ${CMD[newC].n}! Artinya ${CMD[newC].how}`;
      if(L.key)return`Halo Kapten ${me.name}! 🚀 Ambil 🔑 dulu, baru 🚪 pintu bisa dilewati. Bayangkan jalurnya, lalu susun kartunya!`;
      return`Halo Kapten ${me.name}! 🚀 Bayangkan jalurnya dulu, lalu susun kartunya!`}
    if(running)return'Eksekusi dimulai! Perhatikan robotmu... 🎬';
    const last=sim.steps.at(-1),n=last.s+1,card=`[ ${LBL[last.c]} ]`;
    if(err==='out')return`💥 Glitch di langkah ${n} ${card}! Robot di ${where(last)}, tapi di ${last.c==='B'?'belakangnya':'depannya'} sudah tepi papan 🚧. Perlu belok dulu atau berhenti lebih awal?`;
    if(err==='bug')return`💥 Glitch di langkah ${n} ${card}! Robot menginjak ❌ di ${cn(...last.pos)} 😵. Kartu mana sebelum langkah ${n} yang bisa diganti supaya robot menghindari ❌?`;
    if(err==='door')return`🔒 Pintu 🚪 terkunci di langkah ${n} ${card}! Ambil 🔑 dulu: berdirilah di ${cn(...L.key)}, lalu pakai kartu ✋ AMBIL.`;
    if(err==='nopick')return`🤔 Langkah ${n} [ ✋ AMBIL ]: di ${cn(...last.pos)} tidak ada yang bisa diambil. ${L.key?`Kuncinya ada di ${cn(...L.key)} 🔑.`:''}`;
    if(sim.won)return`HEBAT, Kapten ${me.name}! 🎉 ${st===3?'Kodemu sudah paling singkat!':`Bisakah pakai ${par} kartu saja untuk ⭐⭐⭐?`} Waktumu ${fmtTime(secs)} ⏱️ Bintangmu disimpan 💾`;
    const lastS=sim.steps.at(-1);
    return`Tidak ada bug, tapi robot berhenti di ${where(lastS)}. 🏁 Finish ada di ${cn(...L.target)} 🤔.${L.key&&!lastS.has?' Kunci 🔑 belum diambil.':''} Kurang berapa kotak, dan belok ke mana?`;
  },[run,idx,tip]);

  const curI=running&&shown?shown.i:null;
  return(<>
    <div className="play">
      <section className="sum">
        <div className="logo" aria-hidden="true"><Rocket/><span>Misi<br/>Coder-Bot</span></div>
        <div className="pnl">
          <div className="wn">{WORLDS[L.w]}</div>
          <p className="shortest">Kartu terpendek: <b>{par}</b> ⭐</p>
          <div className="facts"><div><span className="fi">🤖</span><small>Robot bot</small></div><div><span className="fi">{ITEM.goal}</span><small>Finish</small></div><div><span className="fi">{L.key?ITEM.key:'⭐'}</span><small>{L.key?'Ambil kunci':'3 bintang'}</small></div><div><span className="fi num">{par}</span><small>Kode terpendek</small></div></div>
          <p className="shortest" style={{marginTop:10}}>🏅 Rekor waktu: <b>{best!=null?fmtTime(best):'belum ada'}</b></p>
        </div>
      </section>
      <section className="pnl stage">
        <div className="stagehd"><button className="chip" onClick={onBack} disabled={running}>🗺️ Peta Level</button><b>Level {L.i+1}</b>
          <div className="stright"><span className={'timer'+(won?' stop':'')} role="timer" aria-label={'Waktu '+fmtTime(secs)}><span aria-hidden="true">⏱️</span> {fmtTime(secs)}</span>
          <button className="chip" onClick={()=>setHelp(true)} disabled={running} aria-label="Cara main">❓</button></div></div>
        <p className="brief">Antar robot ke {ITEM.goal} finish di <b>{cn(...L.target)}</b>.{L.key&&<> Ambil {ITEM.key} di <b>{cn(...L.key)}</b> supaya {ITEM.door} pintu di <b>{cn(...L.door)}</b> terbuka.</>} Hindari ❌! Kode terpendek: <b>{par}</b> kartu ⭐⭐⭐</p>
        <div className="neon"><Board L={L} pos={pos} dir={dir} has={has} boom={!!err} won={won} coords={cfg.coords}/></div>
        <div className="status">{err?(err==='door'?'🔒 PINTU TERKUNCI!':'💥 BOOM! BUG DETECTED!'):won?`🏆 MISI SELESAI! ${'⭐'.repeat(st)} (${k} kartu · ${fmtTime(secs)})`:shown?`Langkah ${shown.s+1}: ${LBL[shown.c]} → ${cn(...pos)}, menghadap ${DN[dir]} ${ARROW[dir]}`:`📍 Robot di ${cn(...pos)}, menghadap ${DN[dir]} ${ARROW[dir]}`}</div>
      </section>
      <section className="pnl cmd">
        <h3 className="ph">🧩 Kartu perintah</h3>
        <div className="cards">{L.cmds.map(c=><button key={c} className={'cc '+c} disabled={running} onClick={()=>add(c)}>{isNew(L,c)&&<em className="newb">BARU!</em>}<CardBot kind={c}/><span>{CMD[c].n}</span></button>)}</div>
        <h3 className="ph">🎮 Kodemu <small>(ketuk kartu untuk menghapus) · kartu {k}/{L.max}</small></h3>
        <div className="prog">{code.length?code.map((it,i)=>it.c==='REP'
          ?<div key={i} className={'loopb'+(open===i?' open':'')+(curI===i?' now':'')+(err&&sim.steps.at(-1).i===i?' bad':'')}>
            <div className="lh"><span>🔁 ULANGI</span>
              <button className="lbtn" disabled={running||it.n<=2} onClick={()=>rep(i,-1)} aria-label="Kurangi ulangan">➖</button><b>{it.n}×</b>
              <button className="lbtn" disabled={running||it.n>=9} onClick={()=>rep(i,1)} aria-label="Tambah ulangan">➕</button>
              <button className="lbtn lx" disabled={running} onClick={()=>delTop(i)} aria-label="Hapus blok ulangi">✕</button></div>
            <div className="lbody" onClick={()=>!running&&setOpen(i)}>
              {it.body.length?it.body.map((b,j)=><Blk key={j} b={b} disabled={running} onClick={e=>{e.stopPropagation();delIn(i,j)}} cls={(curI===i&&shown.j===j?'now':'')+(err&&sim.steps.at(-1).i===i&&sim.steps.at(-1).j===j?' bad':'')}/>)
                :<span className="empty">{open===i?'⬆️ Ketuk kartu di atas untuk memasukkan ke sini':'Kosong'}</span>}</div>
            {open===i?<button className="lfoot ok" disabled={running} onClick={()=>setOpen(null)}>✅ Selesai mengisi</button>
              :<button className="lfoot" disabled={running} onClick={()=>setOpen(i)}>➕ Isi lagi</button>}
          </div>
          :<Blk key={i} b={it} n={i+1} disabled={running} onClick={()=>delTop(i)} cls={(curI===i?'now':'')+(err&&sim.steps.at(-1).i===i?' bad':'')}/>)
          :<span className="empty">Belum ada kartu. Ketuk kartu di atas!</span>}</div>
        <button className="run" disabled={!canRun} onClick={go}><span>▶ JALANKAN!</span><span aria-hidden="true">▷</span></button>
        <div className="row"><button className="ghost" disabled={running} onClick={undo}>⌫ Hapus terakhir</button><button className="ghost" disabled={running} onClick={clear}>🗑 Kosongkan</button>{won&&<button className="ghost next" onClick={onNext}>Level berikutnya ➡️</button>}</div>
      </section>
      <section className="pnl gmbox"><div className="gmav" aria-hidden="true">🤖</div><div><span className="gmtag">GM</span> <b>Coder-Bot</b><div>{msg}</div></div></section>
    </div>
    {pop&&<Popup name={me.name} st={st} k={k} par={par} rec={rec} last={L.i===LEVELS.length-1} onNext={onNext} onAgain={again} onClose={()=>setPop(false)}/>}
    {help&&<div className="tutpop"><Tutorial overlay onClose={()=>setHelp(false)} doneLabel="Kembali ke level ▶"/></div>}
  </>);
}


const FL=['🌸','🌼','🌺','🌷','🌻','💐'];
const AUTO=6;
function Popup({name,st,k,par,rec,last,onNext,onAgain,onClose}){
  const petals=useMemo(()=>Array.from({length:34},(_,i)=>({e:FL[i%FL.length],l:Math.random()*100,d:Math.random()*2.5,s:2.8+Math.random()*2.5,z:22+Math.random()*22})),[]);
  const [left,setLeft]=useState(AUTO);
  useEffect(()=>{const t=setInterval(()=>setLeft(n=>n-1),1000);return()=>clearInterval(t)},[]);
  useEffect(()=>{if(left<=0)onNext()},[left]);
  return(<div className="pop" role="dialog" aria-modal="true" aria-live="polite">
    {petals.map((p,i)=><span key={i} className="petal" style={{left:p.l+'%',animationDelay:p.d+'s',animationDuration:p.s+'s',fontSize:p.z}}>{p.e}</span>)}
    <div className="popcard">
      <div className="big">🎉🏆🎉</div><h2>Selamat, Kapten {name}!<small>Misi selesai! 🚀</small></h2><div className="big">{'⭐'.repeat(st)}</div>
      <p>{k} kartu dipakai. {st===3?'Kodemu paling singkat! Luar biasa!':`Coba ${par} kartu untuk ⭐⭐⭐!`}</p>
      {rec&&<div className="timebox"><div className="tbig">⏱️ {fmtTime(rec.secs)}</div>
        <small>{rec.isRec?(rec.best==null?'🏅 Waktu pertamamu di level ini!':'🏅 REKOR BARU! Sebelumnya '+fmtTime(rec.best)):'Rekor terbaikmu: '+fmtTime(rec.best)}</small></div>}
      <div className="cdown">{last?'Sertifikat muncul':'Lanjut ke level berikutnya'} dalam {Math.max(left,0)} detik…<div className="cbar"><i style={{animationDuration:AUTO+'s'}}/></div></div>
      <div className="row" style={{justifyContent:'center'}}>
        <button className="btn pri" onClick={onNext}>{last?'Lihat Sertifikat 🎓':'Level berikutnya ➡️'}</button>
        <button className="btn" onClick={onAgain}>🔄 Main lagi</button>
        <button className="btn" onClick={onClose}>Tutup</button>
      </div></div></div>);
}

const CF=['#FFC93C','#3DDC97','#FF5A5F','#4A6CF7','#FF8FD0','#7AE7FF'];
function End({me,onBack}){
  const rk=rankFor(me.total),max=LEVELS.length*3,need=rk.next?rk.next.min-me.total:0;
  const bits=useMemo(()=>Array.from({length:60},(_,i)=>({c:CF[i%CF.length],l:Math.random()*100,d:Math.random()*3,s:3+Math.random()*3,w:6+Math.random()*8})),[]);
  const tgl=new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
  return(<div className="end">
    <div className="confetti" aria-hidden="true">{bits.map((b,i)=><i key={i} style={{left:b.l+'%',background:b.c,width:b.w,height:b.w*1.6,animationDelay:b.d+'s',animationDuration:b.s+'s'}}/>)}</div>
    <section className="cert">
      <div className="cert-in">
        <div className="cert-top">🚀 Misi Coder-Bot 🤖</div>
        <h2>Sertifikat Penyelesaian</h2>
        <p>Dengan bangga diberikan kepada</p>
        <div className="cert-name">{rk.e} {rk.name} {me.name}</div>
        <p>telah menyelesaikan semua {LEVELS.length} level Misi Coder-Bot<br/>dan mengumpulkan <b>⭐ {me.total} dari {max} bintang</b>.</p>
        <small>{tgl}</small>
      </div>
    </section>
    <p className="endmsg">{rk.next?`Kumpulkan ${need} bintang lagi untuk jadi ${rk.next.name}! Ulangi level yang masih kurang ⭐⭐⭐.`:'Pangkat tertinggi! Kamu Laksamana Coder-Bot sejati! 🎉'}</p>
    <div className="row noprint" style={{justifyContent:'center'}}><button className="btn pri" onClick={()=>window.print()}>🖨️ Cetak Sertifikat</button><button className="btn" onClick={onBack}>🗺️ Ke Peta Level</button></div>
  </div>);
}
