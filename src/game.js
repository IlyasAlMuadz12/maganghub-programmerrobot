// ============================================================
//  Mesin permainan Misi Coder-Bot  (papan 6×6, 15 level)
// ============================================================
export const SIZE=6;
export const ARROW=['➡️','⬇️','⬅️','⬆️'];
export const DN=['kanan','bawah','kiri','atas'];
export const MV=[[0,1],[1,0],[0,-1],[-1,0]];          // [baris, kolom] untuk arah 0=kanan 1=bawah 2=kiri 3=atas

// Semua kartu perintah
export const CMD={
  F:{n:'MAJU',e:'⬆️',how:'melangkah 1 kotak ke arah yang dihadap robot.'},
  B:{n:'MUNDUR',e:'⬇️',how:'melangkah mundur 1 kotak, badan robot tidak berputar.'},
  R:{n:'BELOK KANAN',e:'↩️',how:'memutar badan robot ke kanan. Robot tidak pindah kotak.'},
  L:{n:'BELOK KIRI',e:'↪️',how:'memutar badan robot ke kiri. Robot tidak pindah kotak.'},
  U:{n:'BALIK ARAH',e:'🔄',how:'memutar badan robot menghadap belakang (setengah putaran).'},
  P:{n:'AMBIL',e:'✋',how:'mengambil benda di kotak tempat robot berdiri, misalnya 🔑 kunci. Kunci membuka 🚪 pintu!'},
  REP:{n:'ULANGI',e:'🔁',how:'mengulang kartu di dalamnya beberapa kali. Atur banyaknya dengan ➖ dan ➕.'},
};
export const LBL=Object.fromEntries(Object.entries(CMD).map(([k,v])=>[k,`${v.e} ${v.n}`]));
export const ORDER=['F','B','R','L','U','P','REP'];
export const NEW_AT={U:2,B:3,REP:4,P:5};               // kartu baru muncul di level (indeks 0)

export const ITEM={goal:'🏁',key:'🔑',door:'🚪',open:'🔓',bug:'❌'};
export const WORLDS=['Dunia 1: Taman Kecil','Dunia 2: Kota Robot','Dunia 3: Labirin Besar'];
export const cn=(r,c)=>`B${r+1}-K${c+1}`;

// ---------- Peta level -------------------------------------------------
//  S=robot  G=finish 🏁  K=kunci 🔑  D=pintu 🚪  X=bahaya ❌  .=kosong
const RAW=[
// ===== Dunia 1: Taman Kecil =====
{dir:0,cmds:'FRL',map:[
  'S.....',
  '..X...',
  '.X.XGX',
  'X.....',
  '.X..X.',
  '.....X']},
{dir:1,cmds:'FRL',map:[
  'S.X.X.',
  '.....X',
  '..X...',
  'X.....',
  '...XGX',
  '.X..X.']},
{dir:0,cmds:'FRLU',map:[
  '..X..X',
  '....X.',
  '.GX.S.',
  '....X.',
  '..X...',
  '.X.X.X']},
{dir:0,cmds:'FBRLU',map:[
  'X..X..',
  '..X.X.',
  '.X.X..',
  '.GX..S',
  '.....X',
  'X...X.']},
{max:8,dir:0,cmds:'FBRLU+',map:[
  'S.....',
  '..X.X.',
  'X..X..',
  '..X.X.',
  'X..X..',
  '.X..XG']},
// ===== Dunia 2: Kota Robot (kunci & pintu) =====
{dir:0,cmds:'FBRLUP+',map:[
  '.X.X..',
  '..X..X',
  'S...DG',
  'X.KX.X',
  '.X....',
  '....X.']},
{dir:3,cmds:'FBRLUP+',map:[
  '.X.X..',
  '..X..X',
  'X..K..',
  'GDX.X.',
  'X.....',
  '.X.X.S']},
{dir:1,cmds:'FBRLUP+',map:[
  'SX...X',
  '......',
  '.X.X.X',
  '.K..X.',
  '.X...X',
  'X.X.DG']},
{dir:0,cmds:'FBRLUP+',map:[
  '.XGX.X',
  'X.D.X.',
  '.X....',
  'X..X.X',
  '....K.',
  'SX..X.']},
{dir:3,cmds:'FBRLUP+',map:[
  '.X.X.X',
  '.K..X.',
  '.X...X',
  '...XDG',
  '.X...X',
  'X.S.X.']},
// ===== Dunia 3: Labirin Besar =====
{dir:2,cmds:'FBRLUP+',map:[
  'GD..XS',
  'X.X...',
  '.X.K.X',
  'X.X.X.',
  '.X...X',
  'X.X...']},
{dir:0,cmds:'FBRLUP+',map:[
  '..X.X.',
  '.X.X.X',
  'X.X.K.',
  '.X..X.',
  'X.X..X',
  'S...DG']},
{dir:1,cmds:'FBRLUP+',map:[
  'K..X.X',
  '..X.X.',
  'X.SX.X',
  '....DG',
  '.X.X.X',
  'X.X...']},
{dir:2,cmds:'FBRLUP+',map:[
  '.XGX..',
  'X.D..X',
  '.X..X.',
  'K..X.X',
  '.X..X.',
  'X.X..S']},
{dir:0,cmds:'FBRLUP+',map:[
  'SX..X.',
  '...X.X',
  '.XDGX.',
  '...X.X',
  'XK..X.',
  '.X.X.X']},
];

function parse(def,i){
  const o={i,n:SIZE,dir:def.dir,bugs:[],key:null,door:null,start:null,target:null,w:Math.floor(i/5),
    cmds:def.cmds.replace('+','').split('').concat(def.cmds.includes('+')?['REP']:[]),max:def.max||30};
  def.map.forEach((row,r)=>[...row].forEach((ch,c)=>{
    if(ch==='S')o.start=[r,c];else if(ch==='G')o.target=[r,c];
    else if(ch==='K')o.key=[r,c];else if(ch==='D')o.door=[r,c];else if(ch==='X')o.bugs.push([r,c]);
  }));
  return o;
}
const same=(a,b)=>!!a&&!!b&&a[0]===b[0]&&a[1]===b[1];

// ---------- Satu langkah (dipakai simulasi & pencari kode terpendek) ------
// state: {pos,dir,has}. Mengembalikan {pos,dir,has} baru atau {error}
export function stepOnce(L,st,c){
  let {pos,dir,has}=st;
  if(c==='R')dir=(dir+1)%4;
  else if(c==='L')dir=(dir+3)%4;
  else if(c==='U')dir=(dir+2)%4;
  else if(c==='P'){
    if(L.key&&!has&&same(pos,L.key))has=true;else return{pos,dir,has,error:'nopick'};
  }else{ // F atau B
    const d=c==='F'?dir:(dir+2)%4,np=[pos[0]+MV[d][0],pos[1]+MV[d][1]];
    if(np[0]<0||np[1]<0||np[0]>=L.n||np[1]>=L.n)return{pos,dir,has,error:'out'};
    if(L.door&&same(np,L.door)&&!has)return{pos,dir,has,error:'door'};
    pos=np;
    if(L.bugs.some(b=>same(b,pos)))return{pos,dir,has,error:'bug'};
  }
  return{pos,dir,has};
}

// ---------- Kode terpendek (BFS/Dijkstra) -------------------------------
// Dengan kartu ULANGI: blok ulangi n× (n=2..9) berisi 1-2 kartu, biayanya 1 + isi.
export function shortest(L,{loops=L.cmds.includes('REP'),noKey=false}={}){
  const prims=L.cmds.filter(c=>c!=='REP'&&!(noKey&&c==='P'));
  const key=s=>s.pos+'|'+s.dir+'|'+s.has;
  const start={pos:L.start,dir:L.dir,has:false};
  const dist=new Map([[key(start),0]]);const bucket=[[start]];
  const edges=s=>{
    const out=[];
    for(const c of prims){const t=stepOnce(L,s,c);if(!t.error)out.push([t,1])}
    if(loops){
      const bodies=[...prims.map(c=>[c]),...prims.flatMap(a=>prims.map(b=>[a,b]))];
      for(const body of bodies)for(let n=2;n<=9;n++){
        let t=s,ok=true;
        for(let k=0;k<n&&ok;k++)for(const c of body){t=stepOnce(L,t,c);if(t.error){ok=false;break}}
        if(ok)out.push([t,1+body.length]);
      }
    }
    return out;
  };
  for(let d=0;d<bucket.length;d++){
    for(const s of bucket[d]||[]){
      if(dist.get(key(s))!==d)continue;
      if(same(s.pos,L.target))return d;
      for(const[t,w]of edges(s)){const k=key(t),nd=d+w;
        if(!dist.has(k)||dist.get(k)>nd){dist.set(k,nd);(bucket[nd]||(bucket[nd]=[])).push(t)}}
    }
  }
  return 99;
}

export const LEVELS=RAW.map((def,i)=>{const L=parse(def,i);L.par=shortest(L);return L});
export const starsFor=(k,par)=>k<=par?3:k<=par+4?2:1;
export const isNew=(L,c)=>NEW_AT[c]===L.i;

// ---------- Program: daftar blok  {c:'F'} atau {c:'REP',n,body:[{c}]} ----------
export const countCards=code=>code.reduce((a,it)=>a+1+(it.c==='REP'?it.body.length:0),0);
export function expand(code){
  const out=[];
  code.forEach((it,i)=>{
    if(it.c==='REP'){for(let k=0;k<it.n;k++)it.body.forEach((b,j)=>out.push({c:b.c,i,j,rep:k+1}))}
    else out.push({c:it.c,i,j:null});
  });
  return out;
}
export function simulate(L,code){
  let st={pos:[...L.start],dir:L.dir,has:false};
  const steps=[],flat=expand(code);
  for(let s=0;s<flat.length;s++){
    const f=flat[s],t=stepOnce(L,st,f.c);
    steps.push({...f,s,pos:[...t.pos],dir:t.dir,has:t.has,...(t.error?{error:t.error}:{})});
    if(t.error)return{steps,won:false};
    st=t;
  }
  return{steps,won:same(st.pos,L.target)};
}

export const RANKS=[{min:0,name:'Kadet',e:'🛰️'},{min:15,name:'Letnan',e:'🚀'},{min:30,name:'Kapten',e:'🎖️'},{min:40,name:'Laksamana',e:'👑'}];
export const rankFor=t=>{let r=RANKS[0],next=null;RANKS.forEach((x,i)=>{if(t>=x.min){r=x;next=RANKS[i+1]||null}});return{...r,next}};

// ---------- Waktu ----------------------------------------------------
export const fmtTime=s=>{s=Math.max(0,Math.floor(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
