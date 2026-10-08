// Logika game murni (tanpa React): data level, simulasi robot, hitung kode terpendek.
export const ARROW=['➡️','⬇️','⬅️','⬆️'];
export const DN=['kanan','bawah','kiri','atas'];
export const LBL={F:'➡️ MAJU',R:'↩️ BELOK KANAN',L:'↪️ BELOK KIRI'};
export const GOAL={'🍼':'botol susu','🔑':'kunci','🚪':'pintu'};
export const WORLDS=['Dunia 1: Taman Kecil (3×3)','Dunia 2: Kota Robot (4×4)','Dunia 3: Labirin Besar (5×5)'];
export const cn=(r,c)=>`B${r+1}-K${c+1}`;
const MV=[[0,1],[1,0],[0,-1],[-1,0]];
// [ukuran, start[b,k], arah(0=kanan,1=bawah,2=kiri,3=atas), target, ikon, bug[]]
const RAW=[[3,[0,0],0,[2,2],'🍼',[]],[3,[0,0],0,[2,0],'🔑',[[1,0]]],[3,[2,0],3,[0,2],'🚪',[[1,0],[1,1]]],[3,[0,2],2,[2,0],'🍼',[[1,1]]],[3,[1,0],0,[1,2],'🔑',[[1,1],[2,2]]],
[4,[0,0],0,[3,3],'🍼',[[1,1],[2,2]]],[4,[3,0],3,[0,3],'🔑',[[2,0],[1,1],[2,2]]],[4,[0,3],2,[3,0],'🚪',[[0,1],[1,1],[2,1]]],[4,[1,0],0,[2,3],'🍼',[[1,1],[1,2],[2,1]]],[4,[3,3],3,[0,0],'🔑',[[2,3],[1,2],[2,1]]],
[5,[0,0],0,[4,4],'🍼',[[1,1],[2,2],[3,3]]],[5,[4,0],3,[0,4],'🚪',[[3,0],[2,1],[1,2],[3,3]]],[5,[2,0],0,[2,4],'🔑',[[2,1],[2,2],[2,3],[1,2]]],[5,[0,4],2,[4,0],'🍼',[[0,2],[1,2],[2,2],[3,2]]],[5,[4,4],2,[0,0],'🚪',[[4,2],[3,1],[2,2],[1,3],[1,1]]]];

function shortest(n,s,d,t,bugs){ // BFS: jumlah kartu minimum
  const bad=new Set(bugs.map(String)),seen=new Set([s+','+d]);let q=[[s[0],s[1],d,0]];
  while(q.length){const nq=[];for(const[r,c,dd,k]of q){if(r===t[0]&&c===t[1])return k;
    for(const a of'FRL'){let nr=r,nc=c,nd=dd;
      if(a==='R')nd=(dd+1)%4;else if(a==='L')nd=(dd+3)%4;
      else{nr+=MV[dd][0];nc+=MV[dd][1];if(nr<0||nc<0||nr>=n||nc>=n||bad.has([nr,nc]+''))continue}
      const key=nr+','+nc+','+nd;if(!seen.has(key)){seen.add(key);nq.push([nr,nc,nd,k+1])}}}q=nq}
  return 99;
}
export const LEVELS=RAW.map(([n,start,dir,target,obj,bugs],i)=>({i,n,start,dir,target,obj,bugs,w:Math.floor(i/5),par:shortest(n,start,dir,target,bugs)}));
export const starsFor=(k,par)=>k<=par?3:k<=par+2?2:1;

export function simulate(L,code){ // hasil: daftar langkah + menang/tidak
  let pos=[...L.start],dir=L.dir;const steps=[];
  for(let i=0;i<code.length;i++){
    const c=code[i];
    if(c==='R')dir=(dir+1)%4;else if(c==='L')dir=(dir+3)%4;
    else{const np=[pos[0]+MV[dir][0],pos[1]+MV[dir][1]];
      if(np[0]<0||np[1]<0||np[0]>=L.n||np[1]>=L.n){steps.push({i,c,pos:[...pos],dir,error:'out'});return{steps,won:false}}
      pos=np;
      if(L.bugs.some(b=>b[0]===pos[0]&&b[1]===pos[1])){steps.push({i,c,pos:[...pos],dir,error:'bug'});return{steps,won:false}}}
    steps.push({i,c,pos:[...pos],dir});
  }
  return{steps,won:pos[0]===L.target[0]&&pos[1]===L.target[1]};
}
