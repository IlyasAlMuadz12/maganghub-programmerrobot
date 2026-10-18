export function Ufo(){
  return(<svg className="art ufo" viewBox="0 0 150 130" aria-hidden="true">
    <defs>
      <linearGradient id="sc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F4F7FF"/><stop offset="1" stopColor="#A9B6D6"/></linearGradient>
      <radialGradient id="gl" cx=".5" cy=".3" r=".8"><stop offset="0" stopColor="#E9F7FF" stopOpacity=".95"/><stop offset="1" stopColor="#9ED8FF" stopOpacity=".55"/></radialGradient>
    </defs>
    <ellipse cx="75" cy="112" rx="34" ry="8" fill="#FF9A3C" opacity=".55"/>
    <ellipse cx="75" cy="108" rx="22" ry="6" fill="#FFC24D" opacity=".8"/>
    <rect x="50" y="46" width="50" height="40" rx="14" fill="#2A3A7A"/>
    <rect x="57" y="53" width="36" height="24" rx="9" fill="#101A44"/>
    <circle cx="67" cy="65" r="5" fill="#5CE1FF"/><circle cx="83" cy="65" r="5" fill="#5CE1FF"/>
    <circle cx="68.5" cy="63.5" r="1.6" fill="#fff"/><circle cx="84.5" cy="63.5" r="1.6" fill="#fff"/>
    <rect x="73" y="38" width="4" height="9" fill="#2A3A7A"/><circle cx="75" cy="36" r="4" fill="#FF5A5F"/>
    <path d="M32 70a43 43 0 0 1 86 0z" fill="url(#gl)" stroke="#CFE6FA" strokeWidth="2"/>
    <path d="M44 56a34 34 0 0 1 14-14" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".8"/>
    <ellipse cx="75" cy="86" rx="68" ry="20" fill="url(#sc)" stroke="#7C8BB3" strokeWidth="2.5"/>
    <ellipse cx="75" cy="80" rx="50" ry="9" fill="#fff" opacity=".35"/>
    {[[28,88,'#FF5A5F'],[48,98,'#FFC93C'],[75,102,'#3DDC97'],[102,98,'#FFC93C'],[122,88,'#4A6CF7']].map(([x,y,c])=><circle key={x} cx={x} cy={y} r="4.5" fill={c} stroke="#fff" strokeWidth="1.5"/>)}
  </svg>);
}

export function Rocket(){
  return(<svg className="art rocket" viewBox="0 0 80 100" aria-hidden="true">
    <g transform="rotate(32 40 50)">
      <path d="M40 4c14 12 18 34 14 58H26C22 38 26 16 40 4z" fill="#fff" stroke="#C9D3EE" strokeWidth="2"/>
      <path d="M40 4c7 6 11 14 13 22H27c2-8 6-16 13-22z" fill="#FF5A5F"/>
      <circle cx="40" cy="38" r="8" fill="#4A6CF7" stroke="#1F2A5C" strokeWidth="2.5"/><circle cx="37.5" cy="35.5" r="2.4" fill="#fff" opacity=".85"/>
      <path d="M26 50L12 70l14-4zM54 50l14 20-14-4z" fill="#FF5A5F"/>
      <rect x="31" y="62" width="18" height="6" rx="2" fill="#8C97B8"/>
      <path d="M32 68c1 10 4 16 8 22 4-6 7-12 8-22z" fill="#FFB02E"/><path d="M36 68c0 6 2 10 4 14 2-4 4-8 4-14z" fill="#FFE27A"/>
    </g>
  </svg>);
}

export function CardBot({kind}){
  const st={fill:'none',stroke:'#fff',strokeWidth:4.5,strokeLinecap:'round',strokeLinejoin:'round'};
  const top={
    R:<g {...st}><path d="M16 8Q40 -24 64 8"/><path d="M64 8l-10-2M64 8l-3-10"/></g>,
    L:<g {...st}><path d="M64 8Q40 -24 16 8"/><path d="M16 8l10-2M16 8l3-10"/></g>,
    B:<g {...st}><path d="M40 -14V4"/><path d="M31 -3l9 9 9-9"/></g>,
    F:<g {...st}><path d="M40 4V-14"/><path d="M31 -5l9-9 9 9"/></g>,
    U:<g {...st}><path d="M58 8C66 -18 14 -18 22 6"/><path d="M22 6l-1-10M22 6l9-6"/></g>,
    P:<text x="62" y="2" textAnchor="middle" fontSize="20">🔑</text>,
    REP:<text x="62" y="2" textAnchor="middle" fontSize="20">🔁</text>,
  }[kind];
  const walk=kind==='F'||kind==='B';
  const legs=walk?<><path d="M34 56l-10 18h11l6-16z"/><path d="M46 56l10 14H45l-6-12z"/></>:<><rect x="30" y="56" width="8" height="18" rx="3"/><rect x="42" y="56" width="8" height="18" rx="3"/></>;
  const arms=walk?<><path d="M29 38l-13 9 5 6 13-8z"/><path d="M51 38l11 8-4 6-11-6z"/></>
    :kind==='R'?<><path d="M29 38l-6 14 6 3 5-14z"/><path d="M51 38l13-11 4 5-12 15z"/></>
    :kind==='L'?<><path d="M29 38L16 27l-4 5 12 15z"/><path d="M51 38l6 14-6 3-5-14z"/></>
    :kind==='P'?<><path d="M29 38L16 27l-4 5 12 15z"/><path d="M51 38l13-11 4 5-12 15z"/></>
    :<><path d="M29 38l-9 12 6 5 11-12z"/><path d="M51 38l9 12-6 5-11-12z"/></>;
  return(<svg className="cbot" viewBox="0 -16 80 96" aria-hidden="true">{top}
    <g fill="#DDE5F6" stroke="#7F90B8" strokeWidth="2.5" strokeLinejoin="round">{legs}{arms}<rect x="26" y="32" width="28" height="26" rx="9"/><rect x="22" y="6" width="36" height="28" rx="11"/></g>
    <rect x="38.5" y="-2" width="3" height="8" fill="#7F90B8"/><circle cx="40" cy="-3" r="3.2" fill="#FF5A5F"/>
    <rect x="27" y="12" width="26" height="15" rx="7" fill="#17224F"/><circle cx="34" cy="19.5" r="3.2" fill="#5CE1FF"/><circle cx="46" cy="19.5" r="3.2" fill="#5CE1FF"/><circle cx="40" cy="46" r="4" fill="#5CE1FF"/>
  </svg>);
}

export function EnterIcon(){
  return(<svg className="enter" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M4 12h11M11 8l4 4-4 4"/>
  </svg>);
}

export default function Hero(){
  return(<header className="hero"><h1>Misi Coder-Bot</h1><Ufo/><Rocket/></header>);
}
