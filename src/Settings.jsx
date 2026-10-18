import {useState} from 'react';
import {PACKS,BGMS,sfx,audio} from './audio.js';

export default function Settings({cfg,onSave,onBack}){
  const [s,setS]=useState(cfg);
  const up=(k,v)=>{const n={...s,[k]:v};setS(n);audio.config(n)};
  const Seg=({k,opts})=><div className="row">{opts.map(([v,t])=><button key={v} className={'btn'+(s[k]===v?' sel':'')} onClick={()=>up(k,v)}>{t}</button>)}</div>;
  return(<section className="panel">
    <h2 style={{marginTop:0}}>⚙️ Pengaturan</h2>
    <b>🎵 Suara klik &amp; langkah robot</b>
    <div className="packs">{PACKS.map((p,i)=><div key={i} className={'pack'+(s.pack===i?' sel':'')}>
      <button className="btn" onClick={()=>up('pack',i)}>{s.pack===i?'✅':'⚪'} {p.e} {p.n}</button>
      <button className="btn" data-nosound onClick={()=>sfx.demo(i)}>▶ Coba</button></div>)}</div>
    <b>🎼 Lagu latar selama bermain</b>
    <div className="packs">{BGMS.map((b,i)=><div key={i} className={'pack'+(s.bgm===i?' sel':'')}>
      <button className="btn" data-nosound onClick={()=>{const n={...s,bgm:i,bgmOn:true};setS(n);audio.config(n)}}>{s.bgm===i?'🎧':'⚪'} {b.e} {b.n}</button></div>)}</div>
    <label className="srow">🔊 Volume efek suara: {Math.round(s.sfxVol*100)}%<input type="range" min="0" max="1" step=".05" value={s.sfxVol} onChange={e=>up('sfxVol',+e.target.value)}/></label>
    <label className="srow">🎶 Volume musik latar: {Math.round(s.bgmVol*100)}%<input type="range" min="0" max="1" step=".05" value={s.bgmVol} onChange={e=>up('bgmVol',+e.target.value)}/></label>
    <label className="srow chk"><input type="checkbox" checked={s.bgmOn} onChange={e=>up('bgmOn',e.target.checked)}/> Musik latar menyala</label>
    <b>🤖 Kecepatan robot</b>
    <Seg k="speed" opts={[[1100,'🐢 Pelan'],[700,'🚶 Normal'],[400,'🐇 Cepat']]}/>
    <label className="srow chk"><input type="checkbox" checked={s.coords} onChange={e=>up('coords',e.target.checked)}/> Tampilkan koordinat kotak (B1-K1)</label>
    <b>🎨 Tema tampilan</b>
    <Seg k="theme" opts={[['auto','Otomatis'],['terang','☀️ Terang'],['gelap','🌙 Gelap']]}/>
    <div className="row" style={{marginTop:16}}>
      <button className="btn pri" onClick={()=>onSave(s)}>💾 Simpan</button>
      <button className="btn" onClick={onBack}>Batal</button></div>
  </section>);
}
