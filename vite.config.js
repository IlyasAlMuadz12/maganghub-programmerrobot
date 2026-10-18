import {defineConfig,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';

// HP/komputer lain cukup membuka http://IP-LAPTOP:5173. Permintaan ke /coderbot-api/api.php diteruskan oleh Vite
// ke server API yang dipakai laptop ini:
//  - jika .env berisi VITE_API_URL=http://localhost:8081/api.php  -> diteruskan ke alamat itu (server PHP terpisah)
//  - jika tidak ada .env                                          -> diteruskan ke Apache Laragon (http://127.0.0.1/coderbot-api/api.php)
export default defineConfig(({mode})=>{
  const env=loadEnv(mode,process.cwd(),'');
  let target='http://127.0.0.1',rewrite;
  try{
    const u=new URL(env.VITE_API_URL||'');
    if(/^(localhost|127\.0\.0\.1)$/.test(u.hostname)){target=u.origin;rewrite=p=>p.replace(/^\/coderbot-api\/api\.php/,u.pathname)}
  }catch{}
  const proxy={'/coderbot-api':{target,changeOrigin:true,...(rewrite?{rewrite}:{})}};
  return{plugins:[react()],server:{host:true,proxy},preview:{host:true,proxy}};
});
