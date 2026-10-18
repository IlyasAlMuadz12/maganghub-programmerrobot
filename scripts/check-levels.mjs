// Memeriksa semua level: bisa diselesaikan, kunci/pintu masuk akal, kartu terpendek.
import {LEVELS,shortest,SIZE} from '../src/game.js';
let bad=0;
const show=L=>{const g=Array.from({length:SIZE},()=>Array(SIZE).fill('.'));
  L.bugs.forEach(([r,c])=>g[r][c]='X');if(L.key)g[L.key[0]][L.key[1]]='K';if(L.door)g[L.door[0]][L.door[1]]='D';
  g[L.target[0]][L.target[1]]='G';g[L.start[0]][L.start[1]]='SRDLU'[0];return g.map(r=>r.join(' ')).join('\n')};
for(const L of LEVELS){
  const flat=shortest(L,{loops:false}),loop=shortest(L);
  const issues=[];
  if(flat>=99)issues.push('TIDAK BISA DISELESAIKAN');
  if(L.door){ if(!L.key)issues.push('ada pintu tapi tak ada kunci'); if(shortest(L,{loops:false,noKey:true})<99)issues.push('finish bisa dicapai tanpa kunci!') }
  if(L.cmds.includes('REP')&&flat>L.max&&loop>L.max)issues.push('batas kartu terlalu kecil');
  if(flat<=L.max&&L.cmds.includes('REP')&&L.max<30)issues.push('batas kartu tidak memaksa ulangi (flat '+flat+')');
  console.log(`Level ${L.i+1}  X=${L.bugs.length}  kartu datar=${flat}  dengan ulangi=${loop}  max=${L.max}  perintah=${L.cmds.join('')}  ${issues.length?'⚠ '+issues.join('; '):'OK'}`);
  if(issues.length)bad++;
  if(process.argv.includes('-v'))console.log(show(L)+'\n');
}
// kartu baru memang menolong?
const less=(L,c)=>shortest({...L,cmds:L.cmds.filter(x=>x!==c)},{loops:false});
console.log('Level 3 tanpa BALIK ARAH:',less(LEVELS[2],'U'),' dengan:',shortest(LEVELS[2],{loops:false}));
console.log('Level 4 tanpa MUNDUR:',less(LEVELS[3],'B'),' dengan:',shortest(LEVELS[3],{loops:false}));
process.exit(bad?1:0);
