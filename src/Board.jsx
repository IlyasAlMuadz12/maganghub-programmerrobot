import {ARROW,ITEM,cn} from './game.js';

const same=(a,b)=>!!a&&a[0]===b[0]&&a[1]===b[1];

// Papan permainan (dipakai di level dan di tutorial)
export default function Board({L,pos,dir,has=false,boom,won,coords}){
  const cells=[];
  for(let r=0;r<L.n;r++){
    cells.push(<div className="hd" key={'h'+r}>B{r+1}</div>);
    for(let c=0;c<L.n;c++){
      const p=[r,c],isR=same(pos,p),isT=same(L.target,p),isB=L.bugs.some(b=>same(b,p)),
            isK=same(L.key,p)&&!has,isD=same(L.door,p);
      const under=isK?ITEM.key:isD?(has?ITEM.open:ITEM.door):isT?ITEM.goal:null;
      const cls='cell'+(isR&&won?' win':'')+(isR&&boom?' boom':'')+(isT&&!isR?' tgt':'')+(isB&&!isR?' bugc':'')+(isK&&!isR?' keyc':'')+(isD&&!isR?' doorc':'');
      cells.push(<div key={r+'-'+c} className={cls}>
        {coords&&<small>{cn(r,c)}</small>}
        {isR?<span className="robot">🤖<span className="ar">{ARROW[dir]}</span>{has&&<span className="hk">{ITEM.key}</span>}</span>
          :isT?ITEM.goal:isB?ITEM.bug:isK?ITEM.key:isD?(has?ITEM.open:ITEM.door):null}
        {isR&&under&&<i className="under">{under}</i>}
      </div>);
    }
  }
  return<div className={'gridwrap'+(L.n>=5?' big':'')} style={{gridTemplateColumns:`24px repeat(${L.n},minmax(0,1fr))`,'--n':L.n}}>
    <div/>{Array.from({length:L.n},(_,c)=><div className="hd" key={c}>K{c+1}</div>)}{cells}</div>;
}
