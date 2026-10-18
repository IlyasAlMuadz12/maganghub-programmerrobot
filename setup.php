<?php
// Buka sekali di browser: http://localhost/programmer%20dan%20robot/setup.php
header('Content-Type: text/html; charset=utf-8');
$cfg=__DIR__.'/config.php';$made=false;
if(!file_exists($cfg)&&file_exists(__DIR__.'/config.sample.php')){$made=copy(__DIR__.'/config.sample.php',$cfg);}
require file_exists($cfg)?$cfg:__DIR__.'/config.sample.php';
require __DIR__.'/schema.php';
$log=[];$ok=true;
function step($t,$good,$info=''){global $log,$ok;$log[]=[$t,$good,$info];if(!$good)$ok=false;}
step('File config.php',file_exists($cfg),$made?'Dibuat otomatis dari config.sample.php':'Sudah ada');
try{
  $pdo=new PDO('mysql:host='.DB_HOST.';charset=utf8mb4',DB_USER,DB_PASS,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
  step('Koneksi ke MySQL Laragon',true,'Server '.$pdo->query('SELECT VERSION() v')->fetch()['v']);
  foreach(array_filter(array_map('trim',explode(';',str_replace('coderbot','`'.DB_NAME.'`',file_get_contents(__DIR__.'/database.sql'))))) as $q)$pdo->exec($q);
  step('Database "'.DB_NAME.'" dan tabel dibuat/diperiksa',true);
  $pdo->exec('USE `'.DB_NAME.'`');cb_schema($pdo);
  foreach(['students'=>'Siswa terdaftar','progress'=>'Catatan progres','plays'=>'Riwayat main','admins'=>'Akun admin'] as $t=>$n)
    step("Tabel $t ($n)",true,$pdo->query("SELECT COUNT(*) c FROM `$t`")->fetch()['c'].' baris');
}catch(Exception $e){
  step('Koneksi / pembuatan database',false,$e->getMessage());
}
$warn=[];
if(ADMIN_PASS==='admin123')$warn[]='Admin pertama dibuat dari config.php dengan password bawaan (admin123). Segera ganti lewat Dashboard Admin > tab Admin > Ganti password.';
if(!defined('RECOVERY_CODE')||strlen(RECOVERY_CODE)<8)$warn[]='Fitur "Lupa password" admin belum aktif. Tambahkan baris const RECOVERY_CODE=\'kode-rahasia-minimal-8-karakter\'; di config.php.';
if(strpos(SECRET,'ganti-teks')===0)$warn[]='SECRET masih bawaan. Ganti dengan teks acak panjang di config.php.';
?><!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Setup Coder-Bot</title>
<body style="font:17px system-ui;max-width:640px;margin:24px auto;padding:0 16px;line-height:1.5">
<h1>🛠 Setup Database Coder-Bot</h1>
<?php foreach($log as [$t,$g,$i]): ?><p><?=$g?'✅':'❌'?> <b><?=htmlspecialchars($t)?></b><?=$i?'<br><small>'.htmlspecialchars($i).'</small>':''?></p><?php endforeach; ?>
<?php if($ok): ?><h2 style="color:#0a7a3d">Database siap! 🎉</h2><p>Buka game, lalu muat ulang dengan Ctrl + F5. Di peta level akan tertulis <b>☁️ Terhubung ke database</b>.</p>
<?php else: ?><h2 style="color:#c0392b">Belum berhasil</h2><ul>
<li>Buka Laragon, klik <b>Start All</b>. MySQL harus berstatus hijau.</li>
<li>Cek <code>DB_USER</code> dan <code>DB_PASS</code> di <code>config.php</code> (bawaan Laragon: <code>root</code> dan kosong).</li></ul><?php endif; ?>
<?php foreach($warn as $w): ?><p>⚠️ <?=htmlspecialchars($w)?></p><?php endforeach; ?>
