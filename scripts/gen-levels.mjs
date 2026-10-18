// Alat bantu (dipakai sekali oleh pembuat game) untuk menyebar ❌ secara acak tapi terverifikasi.
import {shortest,SIZE} from '../src/game.js';
let seed=+process.argv[2]||7;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const spec=[
 // s=start d=arah g=finish k=kunci D=pintu p=X wajib, nx=jumlah X, flat=[min,max], loop=[min,max]
 {s:[0,0],d:0,g:[2,4],nx:8,cmds:'FRL',flat:[7,8]},
 {s:[0,0],d:1,g:[4,4],nx:9,cmds:'FRL',flat:[10,12]},
 {s:[2,4],d:0,g:[2,1],nx:9,cmds:'FRLU',flat:[7,10],needU:1},
 {s:[3,5],d:0,g:[3,1],nx:10,cmds:'FBRLU',flat:[6,9],needB:1},
 {s:[0,0],d:0,g:[5,5],nx:10,cmds:'FBRLU+',flat:[11,11],loop:[5,5],free:[[0,1],[0,2],[0,3],[0,4],[0,5],[1,5],[2,5],[3,5],[4,5]]},
 {s:[2,0],d:0,g:[2,5],k:[3,2],D:[2,4],p:[[1,5],[3,5]],nx:9,cmds:'FBRLUP+',flat:[9,11]},
 {s:[5,5],d:3,g:[3,0],k:[2,3],D:[3,1],p:[[2,0],[4,0]],nx:10,cmds:'FBRLUP+',flat:[11,14]},
 {s:[0,0],d:1,g:[5,5],k:[3,1],D:[5,4],p:[[4,5]],nx:10,cmds:'FBRLUP+',flat:[12,15]},
 {s:[5,0],d:0,g:[0,2],k:[4,4],D:[1,2],p:[[0,1],[0,3]],nx:11,cmds:'FBRLUP+',flat:[13,16]},
 {s:[5,2],d:3,g:[3,5],k:[1,1],D:[3,4],p:[[2,5],[4,5]],nx:11,cmds:'FBRLUP+',flat:[14,18]},
 {s:[0,5],d:2,g:[0,0],k:[2,3],D:[0,1],p:[[1,0]],nx:12,cmds:'FBRLUP+',flat:[13,17]},
 {s:[5,0],d:0,g:[5,5],k:[2,4],D:[5,4],p:[[4,5]],nx:12,cmds:'FBRLUP+',flat:[14,18]},
 {s:[2,2],d:1,g:[3,5],k:[0,0],D:[3,4],p:[[2,5],[4,5]],nx:12,cmds:'FBRLUP+',flat:[15,19]},
 {s:[5,5],d:2,g:[0,2],k:[3,0],D:[1,2],p:[[0,1],[0,3]],nx:12,cmds:'FBRLUP+',flat:[15,19]},
 {s:[0,0],d:0,g:[2,3],k:[4,1],D:[2,2],p:[[1,3],[3,3],[2,4]],nx:13,cmds:'FBRLUP+',flat:[15,20]},
];
const eq=(a,b)=>a[0]===b[0]&&a[1]===b[1];
const only=+process.argv[3]||0;
spec.forEach((sp,i)=>{
  if(only&&only!==i+1)return;
  const fixed=[sp.s,sp.g,...(sp.k?[sp.k]:[]),...(sp.D?[sp.D]:[])];
  const free=[...fixed,...(sp.free||[])];
  const cells=[];for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(!free.some(f=>eq(f,[r,c]))&&!(sp.p||[]).some(f=>eq(f,[r,c])))cells.push([r,c]);
  for(let t=0;t<150000;t++){
    const bugs=[...(sp.p||[])];const pool=[...cells];
    let guard=0;
    while(bugs.length<sp.nx&&pool.length&&guard++<80){const j=Math.floor(rnd()*pool.length);const x=pool.splice(j,1)[0];
      // tidak boleh bersebelahan (atas/bawah/kiri/kanan) kecuali X pojok pintu
      if(bugs.some(b=>Math.abs(b[0]-x[0])+Math.abs(b[1]-x[1])===1))continue;
      bugs.push(x)}
    if(bugs.length<sp.nx)continue;
    // sebaran: tiap kuadran 3×3 minimal 2 X
    const q=[0,0,0,0];bugs.forEach(([r,c])=>q[(r>2?2:0)+(c>2?1:0)]++);if(q.some(n=>n<2))continue;
    const L={n:SIZE,start:sp.s,dir:sp.d,target:sp.g,key:sp.k||null,door:sp.D||null,bugs,cmds:sp.cmds.replace('+','').split('')};
    const flat=shortest(L,{loops:false});
    if(flat<sp.flat[0]||flat>sp.flat[1])continue;
    if(sp.D&&shortest(L,{loops:false,noKey:true})<99)continue;
    if(sp.needB&&shortest({...L,cmds:L.cmds.filter(c=>c!=='B')},{loops:false})<flat+sp.needB)continue;
    if(sp.needU&&shortest({...L,cmds:L.cmds.filter(c=>c!=='U')},{loops:false})<flat+sp.needU)continue;
    let lp=flat;if(sp.cmds.includes('+')){lp=shortest({...L,cmds:[...L.cmds,'REP']});if(sp.loop&&(lp<sp.loop[0]||lp>sp.loop[1]))continue}
    const g=Array.from({length:SIZE},()=>Array(SIZE).fill('.'));
    bugs.forEach(([r,c])=>g[r][c]='X');if(sp.k)g[sp.k[0]][sp.k[1]]='K';if(sp.D)g[sp.D[0]][sp.D[1]]='D';g[sp.g[0]][sp.g[1]]='G';g[sp.s[0]][sp.s[1]]='S';
    console.log(`// Level ${i+1}: kartu datar ${flat}, dengan ulangi ${lp}, X=${bugs.length}\n{dir:${sp.d},cmds:'${sp.cmds}',map:[\n${g.map(r=>"  '"+r.join('')+"'").join(',\n')}]},`);
    return;
  }
  console.log(`// Level ${i+1}: GAGAL`);
});
