import {useState,useEffect,useMemo,useRef} from 'react';
import {simulate,CMD,ITEM,ARROW} from './game.js';
import Board from './Board.jsx';
import {CardBot} from './Hero.jsx';

// ===== Panduan bergaya "video" untuk anak SD: slide animasi + suara narasi laki-laki (rekaman public/voice/NN.mp3, atau suara Indonesia bawaan perangkat) =====
const lv=o=>({n:4,start:[0,0],dir:0,target:[3,3],bugs:[],key:null,door:null,...o});
const P=s=>s.split(' ').map(c=>({c}));

const BIG=lv({n:6,start:[0,0],dir:0,target:[2,3],bugs:[[1,1],[2,1],[0,5],[3,3],[4,1],[4,4],[2,5],[5,2]]});

const SLIDES=[
  {t:'Halo, Kapten Programmer!',e:'🚀',dur:13800,
   say:'Halo adik-adik, selamat datang! Hari ini kita belajar membuat robot berjalan sampai ke bendera finish. Caranya gampang, kita susun kartu perintah. Yuk, kita mulai!',
   demo:[{L:BIG,code:P('F F F R F F'),label:'Robot berjalan ke 🏁 finish'}]},
  {t:'Kenali papan 6×6',e:'🗺️',dur:16700,
   say:'Coba lihat papan permainannya. Ini robotnya, panahnya menunjukkan ke mana robot menghadap. Ini bendera finish, tujuan kita. Nah, hati-hati ya, tanda silang merah itu bahaya. Jangan sampai terinjak!',
   demo:[{L:BIG,code:[],label:'Papan 6 baris × 6 kolom'}],
   legend:[['🤖','Robot. Panah ➡️ = arah hadap'],['🏁','Finish. Tujuanmu!'],['❌','Bahaya! Jangan diinjak']]},
  {t:'MAJU',e:'⬆️',cards:['F'],dur:12700,
   say:'Kartu pertama, maju. Robot melangkah satu kotak ke depan. Kalau ada tiga kartu maju, berarti robot melangkah tiga kali. Gampang, kan?',
   demo:[{L:lv({start:[2,0],target:[2,3]}),code:P('F F F'),label:'MAJU ×3'}]},
  {t:'MUNDUR',e:'⬇️',cards:['B'],dur:11200,
   say:'Kartu mundur. Robot melangkah satu kotak ke belakang. Perhatikan ya, badan robot tetap menghadap ke depan, tidak berputar.',
   demo:[{L:lv({start:[1,3],target:[1,0]}),code:P('B B B'),label:'MUNDUR ×3'}]},
  {t:'BELOK KANAN',e:'↩️',cards:['R'],dur:10600,
   say:'Kartu belok kanan. Robot hanya memutar badan ke kanan, tidak pindah kotak. Setelah itu, baru kita suruh maju.',
   demo:[{L:lv({start:[0,1],target:[2,1]}),code:P('R F F'),label:'BELOK KANAN lalu MAJU ×2'}]},
  {t:'BELOK KIRI',e:'↪️',cards:['L'],dur:12100,
   say:'Kalau belok kiri, robot memutar badan ke kiri. Sama seperti tadi, robot tidak pindah kotak. Setelah itu, baru maju.',
   demo:[{L:lv({start:[3,1],target:[1,1]}),code:P('L F F'),label:'BELOK KIRI lalu MAJU ×2'}]},
  {t:'BALIK ARAH',e:'🔄',cards:['U'],dur:10400,
   say:'Kartu balik arah. Robot memutar badan setengah putaran, jadi menghadap ke belakang. Setelah itu, baru maju.',
   demo:[{L:lv({start:[1,3],target:[1,0]}),code:P('U F F F'),label:'BALIK ARAH lalu MAJU ×3'}]},
  {t:'AMBIL kunci 🔑',e:'✋',cards:['P'],dur:16000,
   say:'Sekarang kartu ambil. Robot harus berdiri tepat di kotak kunci, lalu pakai kartu ambil. Nah, lihat, kuncinya pindah ke robot!',
   demo:[{L:lv({start:[2,0],target:[2,3],key:[2,2]}),code:P('F F P F'),label:'MAJU ×2, AMBIL 🔑, MAJU'}]},
  {t:'PINTU 🚪 butuh kunci',e:'🚪',dur:15300,
   say:'Ini pintu. Kalau robot belum punya kunci, pintunya terkunci dan robot tidak bisa lewat. Tapi kalau sudah mengambil kunci, pintu terbuka dan robot bisa lanjut ke finish!',
   demo:[{L:lv({start:[1,0],target:[1,3],key:[1,1],door:[1,2]}),code:P('F F'),label:'❌ Tanpa kunci: pintu terkunci!'},
         {L:lv({start:[1,0],target:[1,3],key:[1,1],door:[1,2]}),code:P('F P F F'),label:'✅ Ambil kunci dulu: pintu terbuka!'}]},
  {t:'ULANGI',e:'🔁',cards:['REP'],dur:16400,
   say:'Kartu ulangi. Daripada menulis kartu maju tiga kali, cukup taruh satu kartu maju di dalam ulangi, lalu atur angkanya jadi tiga. Kartunya jadi lebih sedikit. Hebat, kan?',
   demo:[{L:lv({start:[2,0],target:[2,3]}),code:P('F F F'),label:'Tanpa ULANGI: 3 kartu'},
         {L:lv({start:[2,0],target:[2,3]}),code:[{c:'REP',n:3,body:[{c:'F'}]}],label:'Dengan ULANGI 3×: 2 kartu'}]},
  {t:'Waktu & bintang',e:'⏱️',kind:'timer',dur:15000,
   say:'Perhatikan waktunya ya. Waktu mulai berjalan saat level dibuka, dan berhenti saat robot sampai di finish. Makin cepat dan makin sedikit kartu, makin banyak bintang yang kamu dapat!'},
  {t:'Siap main!',e:'🎉',kind:'ready',dur:14100,
   say:'Nah, kamu sudah siap! Lihat papannya, susun kartunya, lalu tekan jalankan. Kalau salah, tidak apa-apa, coba lagi ya. Semangat, Kapten!'},
];

// Rekaman suara (opsional): taruh public/voice/01 ... 12 (mp3, m4a, mp4, ogg atau wav; voice note WhatsApp boleh). Jika ada, dipakai lebih dulu.
const EXT=['mp3','m4a','mp4','ogg','wav'];
const REC=(n,e)=>import.meta.env.BASE_URL+'voice/'+String(n+1).padStart(2,'0')+'.'+e;
// Pilih suara laki-laki bawaan perangkat (mis. Microsoft Andika). Suara perempuan dihindari.
const FEM=/gadis|female|wanita|perempuan|google/i,MALE=/andika|pria|laki|\bmale\b|cowok/i;

const Card=({c})=><div className={'cc tc '+c}><CardBot kind={c}/><span>{CMD[c].n}</span></div>;

function CodeRow({code,cur}){
  if(!code.length)return null;
  return<div className="tcode"><small>Kodenya:</small><div className="prog">{code.map((it,i)=>it.c==='REP'
    ?<span key={i} className={'loopb mini'+(cur&&cur.i===i?' now':'')}><span className="lh">🔁 ULANGI <b>{it.n}×</b></span>
      <span className="lbody">{it.body.map((b,j)=><span key={j} className={'blk '+b.c}>{CMD[b.c].e} {CMD[b.c].n}</span>)}</span></span>
    :<span key={i} className={'blk '+it.c+(cur&&cur.i===i?' now':'')}>{CMD[it.c].e} {CMD[it.c].n}</span>)}</div></div>;
}

// Memutar contoh langkah robot dengan mesin permainan yang sama
function Demo({variants,playing}){
  const [v,setV]=useState(0),[i,setI]=useState(0);
  const cur=variants[v],sim=useMemo(()=>simulate(cur.L,cur.code),[v]),n=sim.steps.length;
  useEffect(()=>{
    if(!playing)return;
    const t=setTimeout(()=>{if(i<n)setI(i+1);else{setI(0);setV((v+1)%variants.length)}},i<n?950:2400);
    return()=>clearTimeout(t);
  },[playing,i,v]);
  const shown=i>0?sim.steps[i-1]:null,L=cur.L;
  const err=i===n&&n>0?sim.steps[n-1].error:null,won=i===n&&n>0&&!err&&sim.won;
  return<div className="demo">
    <div className="dlabel" aria-live="polite">{cur.label}</div>
    <div className="neon"><Board L={L} pos={shown?shown.pos:L.start} dir={shown?shown.dir:L.dir} has={shown?shown.has:false} boom={!!err} won={won} coords={false}/></div>
    <CodeRow code={cur.code} cur={shown&&i<=n?shown:null}/>
    <div className="dstat">{err==='door'?'🔒 Pintu terkunci!':err?'💥 Glitch!':won?'🏁 Sampai di finish!':shown?`${CMD[shown.c].e} ${CMD[shown.c].n} → menghadap ${ARROW[shown.dir]}`:`Robot menghadap ${ARROW[L.dir]}`}</div>
  </div>;
}

function TimerScene({playing}){
  const [t,setT]=useState(0);
  useEffect(()=>{if(!playing)return;const id=setInterval(()=>setT(x=>x>=42?42:x+1),110);return()=>clearInterval(id)},[playing]);
  const done=t>=42;
  return<div className="demo tscene">
    <div className={'bigtimer'+(done?' stop':'')} role="img" aria-label="Contoh timer">⏱️ 00:{String(t).padStart(2,'0')}</div>
    <ul className="tlist">
      <li>▶️ Timer <b>mulai</b> saat level dibuka</li>
      <li>🏁 Timer <b>berhenti</b> saat robot sampai finish</li>
      <li>🏅 Waktu tercepatmu disimpan jadi <b>rekor</b></li>
    </ul>
    <div className={'tstars'+(done?' on':'')} aria-hidden="true"><span>⭐</span><span>⭐</span><span>⭐</span></div>
    <small>Bintang ⭐ lebih banyak kalau kartumu sedikit</small>
  </div>;
}

function ReadyScene(){
  return<div className="demo tscene">
    <div className="party" aria-hidden="true">🤖🎉</div>
    <ol className="tlist steps"><li>👀 Lihat papan, cari 🏁</li><li>🧩 Ketuk kartu untuk menyusun kode</li><li>▶ Tekan <b>JALANKAN!</b></li><li>🔄 Salah? Tidak apa-apa, coba lagi!</li></ol>
  </div>;
}

export default function Tutorial({onClose,doneLabel='Mulai Main! 🚀',overlay}){
  const [s,setS]=useState(0),[playing,setPlaying]=useState(true),[voiceOn,setVoiceOn]=useState(true),[hasVoice,setHasVoice]=useState(false),[round,setRound]=useState(0);
  const [timeDone,setTimeDone]=useState(false),[speechDone,setSpeechDone]=useState(false);
  const [hasRec,setHasRec]=useState(false),[recExt,setRecExt]=useState('mp3');
  const voice=useRef(null),male=useRef(false),aud=useRef(null),N=SLIDES.length,sl=SLIDES[s];

  useEffect(()=>{
    if(typeof window==='undefined'||!('speechSynthesis' in window))return;
    const load=()=>{const ids=speechSynthesis.getVoices().filter(x=>/^id[-_]?/i.test(x.lang));
      voice.current=ids.find(x=>MALE.test(x.name))||ids.find(x=>!FEM.test(x.name))||ids[0]||null;
      male.current=!!voice.current&&MALE.test(voice.current.name);setHasVoice(!!voice.current)};
    load();speechSynthesis.addEventListener?.('voiceschanged',load);
    return()=>{speechSynthesis.removeEventListener?.('voiceschanged',load);speechSynthesis.cancel()};
  },[]);

  // Ada rekaman suara? (cek file pertama; kalau tidak ada, pakai suara perangkat)
  useEffect(()=>{
    let dead=false,cur=null;
    const probe=i=>{if(dead||i>=EXT.length)return;const a=new Audio();cur=a;a.preload='metadata';
      a.onloadedmetadata=()=>{if(!dead){setRecExt(EXT[i]);setHasRec(true)}};a.onerror=()=>probe(i+1);a.src=REC(0,EXT[i])};
    probe(0);return()=>{dead=true;if(cur)cur.onloadedmetadata=cur.onerror=null};
  },[]);

  // Setiap pindah slide (atau lanjut setelah jeda): mulai hitung durasi + bacakan narasi
  useEffect(()=>{
    setTimeDone(false);
    const talk=voiceOn&&(hasRec||hasVoice)&&playing;
    setSpeechDone(!talk);
    if(!playing)return;
    const t=setTimeout(()=>setTimeDone(true),sl.dur);
    let f;
    const stop=()=>{if(aud.current){aud.current.onended=aud.current.onerror=aud.current.onloadedmetadata=null;aud.current.pause();aud.current=null}if('speechSynthesis' in window)speechSynthesis.cancel()};
    const tts=()=>{
      if(!hasVoice){setSpeechDone(true);return}
      speechSynthesis.cancel();
      const parts=sl.say.split(/(?<=[.!?])\s+/).filter(Boolean);
      parts.forEach((txt,k)=>{
        const u=new SpeechSynthesisUtterance(txt);u.lang='id-ID';u.voice=voice.current;
        u.rate=/[!?]$/.test(txt)?.9:.84;u.pitch=male.current?.85:.6;
        if(k===parts.length-1)u.onend=u.onerror=()=>setSpeechDone(true);
        speechSynthesis.speak(u);
      });
    };
    if(talk){
      stop();f=setTimeout(()=>setSpeechDone(true),sl.dur+14000);
      if(hasRec){
        const a=new Audio(REC(s,recExt));aud.current=a;
        a.onloadedmetadata=()=>{clearTimeout(f);f=setTimeout(()=>setSpeechDone(true),(a.duration||20)*1000+3000)};
        a.onended=()=>setSpeechDone(true);
        a.onerror=tts;
        a.play().catch(tts);
      }else tts();
    }
    return()=>{clearTimeout(t);clearTimeout(f);stop()};
  },[s,round,voiceOn,hasVoice,hasRec,recExt,playing]);

  useEffect(()=>{if(playing&&timeDone&&speechDone&&s<N-1)setS(s+1);else if(playing&&timeDone&&speechDone&&s===N-1)setPlaying(false)},[timeDone,speechDone]);

  const go=k=>{setS(Math.max(0,Math.min(N-1,k)));setRound(r=>r+1)};
  useEffect(()=>{const h=e=>{if(e.key==='ArrowRight')go(s+1);else if(e.key==='ArrowLeft')go(s-1)};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[s]);

  const last=s===N-1;
  return(<section className={'tut'+(overlay?' ov':'')} aria-label="Panduan cara bermain">
    <div className="tuthd"><b>🎬 Cara Main</b><span className="tcount">{s+1} / {N}</span>
      <button className="chip" onClick={onClose}>{overlay?'✕ Tutup':'⏭ Lewati'}</button></div>
    <div className="tutbody" key={s}>
      <div className="tutleft">
        {sl.kind==='timer'?<TimerScene playing={playing}/>:sl.kind==='ready'?<ReadyScene/>:<Demo key={s+'-'+round} variants={sl.demo} playing={playing}/>}
      </div>
      <div className="tutright">
        <h2 className="ttitle"><span aria-hidden="true">{sl.e}</span> {sl.t}</h2>
        {sl.cards&&<div className="tcards">{sl.cards.map(c=><Card key={c} c={c}/>)}</div>}
        {sl.legend&&<ul className="legend">{sl.legend.map(([a,b])=><li key={a}><span>{a}</span>{b}</li>)}</ul>}
        <div className="bubble"><span className="bav" aria-hidden="true">🤖</span><p>{sl.say}</p></div>
      </div>
    </div>
    <div className="tprog" role="tablist" aria-label="Slide">{SLIDES.map((x,i)=>
      <button key={i} role="tab" aria-selected={i===s} aria-label={'Slide '+(i+1)+': '+x.t} className={'seg'+(i<s?' done':'')+(i===s?' cur':'')} onClick={()=>go(i)}>
        {i===s&&<i key={s+'-'+round} style={{animationDuration:sl.dur+'ms',animationPlayState:playing?'running':'paused'}}/>}</button>)}</div>
    <div className="tctl">
      <button className="btn" disabled={s===0} onClick={()=>go(s-1)} aria-label="Sebelumnya">⏮</button>
      <button className="btn" onClick={()=>{setPlaying(p=>!p);setRound(r=>r+1)}} aria-label={playing?'Jeda':'Putar'}>{playing?'⏸ Jeda':'▶ Putar'}</button>
      <button className="btn" disabled={last} onClick={()=>go(s+1)} aria-label="Berikutnya">⏭</button>
      {(hasVoice||hasRec)&&<button className={'btn'+(voiceOn?' sel':'')} onClick={()=>setVoiceOn(v=>!v)} aria-pressed={voiceOn}>{voiceOn?'🔊 Suara':'🔇 Suara'}</button>}
      <button className="btn pri" onClick={onClose}>{last?doneLabel:overlay?'Kembali main ▶':'Langsung main 🚀'}</button>
    </div>
  </section>);
}
