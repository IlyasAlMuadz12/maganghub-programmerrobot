// Otomatis memakai database Laragon (PHP+MySQL) bila server terdeteksi, jika tidak -> localStorage.
// Alamat API. Jika .env menunjuk ke "localhost" tapi halaman dibuka dari perangkat lain (HP/komputer siswa),
// "localhost" akan salah (menunjuk ke perangkat itu sendiri), jadi pakai alamat /coderbot-api pada host yang sama dengan halaman ini.
const ENV_API=import.meta.env.VITE_API_URL,DEF_API=`${location.origin}/coderbot-api/api.php`; // dev: lewat proxy Vite; build di Laragon: langsung ke Apache
const LOCAL_HOST=/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
const API=ENV_API&&(LOCAL_HOST||!/\/\/(localhost|127\.0\.0\.1)([:\/]|$)/.test(ENV_API))?ENV_API:DEF_API;
export const DEFAULTS={pack:0,bgm:0,sfxVol:.8,bgmVol:.5,bgmOn:true,speed:700,coords:true,theme:'auto'};
let mode=null;
const rd=k=>{try{return JSON.parse(localStorage.getItem(k))}catch{return null}};
const wr=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const tok=()=>{try{return localStorage.getItem('cb-token')}catch{return null}};
const adm=()=>sessionStorage.getItem('cb-admin');
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,16);
async function api(){
  if(mode)return mode==='api';
  try{const c=new AbortController();setTimeout(()=>c.abort(),4000);const r=await fetch(API+'?a=ping',{signal:c.signal});mode=(await r.json()).ok?'api':'local'}catch{mode='local'}
  return mode==='api';
}
async function call(a,body,token){
  let r;try{r=await fetch(`${API}?a=${a}`,{method:'POST',headers:{'Content-Type':'application/json',...(token?{'X-Token':token}:{})},body:JSON.stringify(body||{})})}
  catch{throw new Error('Tidak bisa terhubung ke server.')}
  const d=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(new Error(d.error||'Terjadi kesalahan'),{status:r.status});return d;
}
// Rekor waktu lama yang dulu tersimpan di perangkat ini (localStorage) dipindahkan sekali ke database, lalu dihapus dari perangkat.
async function syncOld(st){
  try{const t=rd('cb-time:'+st.id);if(t&&Object.keys(t).length){const d=await call('sync_times',{times:t},tok());try{localStorage.removeItem('cb-time:'+st.id)}catch{};return d}}catch{}
  return st;
}
const total=s=>({...s,total:Object.values(s.stars).reduce((a,b)=>a+b,0)});
export const storage={
  isApi:()=>mode==='api',
  async login(name,pin){
    if(await api()){const d=await call('login',{name,pin});try{localStorage.setItem('cb-token',d.token)}catch{};return syncOld(d.student)}
    const id=slug(name),s=rd('cb:'+id);
    if(!s)throw new Error('Nama belum terdaftar. Daftar dulu ya! 📝');
    if(s.pin!==pin)throw new Error('PIN salah. Coba ingat lagi! 🤔');
    wr('cb-last',id);return s;
  },
  async register(name,pin,av){
    if(await api()){const d=await call('register',{name,pin,av});try{localStorage.setItem('cb-token',d.token)}catch{};return d.student}
    const id=slug(name);if(rd('cb:'+id))throw new Error('Nama itu sudah dipakai. Coba nama lain atau masuk.');
    const n={id,name,pin,av,stars:{},best:{},total:0,settings:{}};wr('cb:'+id,n);wr('cb-last',id);return n;
  },
  async restore(){
    if(await api()){if(!tok())return null;try{return await syncOld(await call('me',{},tok()))}catch{return null}}
    const id=rd('cb-last');return id?rd('cb:'+id):null;
  },
  async logout(){try{localStorage.removeItem('cb-token');localStorage.removeItem('cb-last')}catch{}},
  async play(me,level,cards,result,stars,secs){
    if(await api())return call('play',{level,cards,result,stars,secs:result==='win'?secs:undefined},tok());
    const s={...me,stars:{...me.stars},best:{...me.best}};
    if(result==='win'){s.stars[level]=Math.max(stars,s.stars[level]||0);s.best[level]=Math.min(cards,s.best[level]||99);if(secs!=null)this.saveTime(me,level,secs)}
    const t=total(s);wr('cb:'+t.id,t);return t;
  },
  async saveSettings(me,settings){
    if(await api())return call('settings',{settings},tok());
    const s={...me,settings};wr('cb:'+s.id,s);return s;
  },
  async board(){
    if(await api()){try{return await call('board')}catch{return[]}}
    const out=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('cb:')){const v=rd(k);if(v?.name)out.push({id:v.id,name:v.name,av:v.av,total:v.total||0})}}}catch{}
    return out.sort((a,b)=>b.total-a.total).slice(0,10);
  },
  // Waktu tercepat per level: mode database -> dari server (me.times); mode lokal -> localStorage perangkat ini.
  times(me){return mode==='api'?(me?.times||{}):(rd('cb-time:'+(me?.id||me?.name))||{})},
  saveTime(me,level,secs){const t=rd('cb-time:'+(me?.id||me?.name))||{},prev=t[level];
    if(prev==null||secs<prev){t[level]=secs;wr('cb-time:'+(me?.id||me?.name),t)}return prev},
  tutSeen:me=>!!rd('cb-tut:'+(me?.id||me?.name)),
  setTutSeen:me=>wr('cb-tut:'+(me?.id||me?.name),1),
  apiUrl:API,
  adminToken:()=>adm(),
  async adminLogin(user,pass){
    if(!await api())throw new Error('Admin butuh server Laragon (API tidak terdeteksi di '+API+'). Buka '+API+'?a=ping di browser ini; harus muncul {"ok":true}.');
    const d=await call('admin_login',{user,pass});sessionStorage.setItem('cb-admin',d.token);sessionStorage.setItem('cb-admin-user',d.user||user);
  },
  adminData:()=>call('admin_data',{},adm()),
  adminReset:(id,pin)=>call('admin_reset',{id,pin},adm()),
  adminPin:id=>call('admin_pin',{id},adm()),
  adminDelete:id=>call('admin_delete',{id},adm()),
  async adminRecover(user,code,pass){
    if(!await api())throw new Error('Butuh server Laragon (API tidak terdeteksi).');
    return call('admin_recover',{user,code,pass});
  },
  adminUser:()=>sessionStorage.getItem('cb-admin-user')||'',
  adminList:()=>call('admin_list',{},adm()),
  adminAdd:(user,pass)=>call('admin_add',{user,pass},adm()),
  adminPass:(id,pass)=>call('admin_pass',{id,pass},adm()),
  adminEdit:(id,user,pass)=>call('admin_edit',{id,user,pass},adm()),
  adminReveal:id=>call('admin_reveal',{id},adm()),
  adminRemove:id=>call('admin_remove',{id},adm()),
  adminLogout(){sessionStorage.removeItem('cb-admin');sessionStorage.removeItem('cb-admin-user')},
};
