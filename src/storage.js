// Lapisan penyimpanan. Sekarang memakai localStorage (per perangkat).
// Untuk skor bersama satu kelas, ganti isi 4 fungsi ini dengan Supabase/Firebase; App.jsx tidak perlu diubah.
const read=k=>{try{return JSON.parse(localStorage.getItem(k))}catch{return null}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
export const storage={
  async get(id){return read('cb:'+id)},
  async put(s){write('cb:'+s.id,s);write('cb-last',s.id)},
  async last(){return read('cb-last')},
  async logout(){try{localStorage.removeItem('cb-last')}catch{}},
  async all(){const out=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('cb:')){const v=read(k);if(v?.name)out.push(v)}}}catch{}
    return out.sort((a,b)=>(b.total||0)-(a.total||0)).slice(0,10)}
};
