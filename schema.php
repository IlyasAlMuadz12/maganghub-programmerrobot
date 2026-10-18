<?php
// Dipakai bersama oleh api.php dan setup.php.
// Menjamin tabel (termasuk admins & throttle) ada, dan membuat admin pertama dari config.php bila tabel admins masih kosong.
const LOGIN_MAX_TRIES = 5;   // salah berapa kali sebelum dikunci
const LOGIN_LOCK_MIN  = 5;   // lama kunci (menit)
const LOGIN_WINDOW_MIN = 15; // salah-salah dihitung dalam rentang ini

// cb_dec/cb_enc dipertahankan hanya untuk memigrasi data dari versi sebelumnya (kolom pass_enc).
function cb_key(){return hash('sha256','cb-pass-view|'.SECRET,true);}
function cb_enc($s){$iv=random_bytes(12);$c=openssl_encrypt((string)$s,'aes-256-gcm',cb_key(),OPENSSL_RAW_DATA,$iv,$tag);return base64_encode($iv.$tag.$c);}
function cb_dec($b){$x=base64_decode((string)$b,true);if($x===false||strlen($x)<29)return null;
  $r=openssl_decrypt(substr($x,28),'aes-256-gcm',cb_key(),OPENSSL_RAW_DATA,substr($x,0,12),substr($x,12,16));return $r===false?null:$r;}

function cb_schema(PDO $pdo){
  static $done=false; if($done)return; $done=true;
  foreach(array_filter(array_map('trim',explode(';',file_get_contents(__DIR__.'/database.sql')))) as $q)
    if(stripos($q,'CREATE TABLE')===0)$pdo->exec($q);
  // Rekor waktu (detik): progress.best_secs = waktu tercepat per level, plays.secs = waktu tiap permainan yang menang.
  if(!$pdo->query("SHOW COLUMNS FROM progress LIKE 'best_secs'")->fetch())$pdo->exec('ALTER TABLE progress ADD COLUMN best_secs INT NULL AFTER best_cards');
  if(!$pdo->query("SHOW COLUMNS FROM plays LIKE 'secs'")->fetch())$pdo->exec('ALTER TABLE plays ADD COLUMN secs INT NULL AFTER cards');
  if(!$pdo->query("SHOW COLUMNS FROM students LIKE 'pin'")->fetch())$pdo->exec('ALTER TABLE students ADD COLUMN `pin` VARCHAR(4) NULL AFTER pin_hash');
  // Kolom `password` (teks biasa, supaya bisa dilihat/diedit lewat HeidiSQL). Migrasi dari kolom pass_enc versi sebelumnya.
  if(!$pdo->query("SHOW COLUMNS FROM admins LIKE 'password'")->fetch())$pdo->exec('ALTER TABLE admins ADD COLUMN `password` VARCHAR(100) NULL AFTER username');
  if($pdo->query("SHOW COLUMNS FROM admins LIKE 'pass_enc'")->fetch()){
    foreach($pdo->query('SELECT id,pass_enc FROM admins WHERE `password` IS NULL AND pass_enc IS NOT NULL')->fetchAll() as $r){
      $pw=cb_dec($r['pass_enc']);if($pw!==null)$pdo->prepare('UPDATE admins SET `password`=? WHERE id=?')->execute([$pw,$r['id']]);}
    if(!(int)$pdo->query('SELECT COUNT(*) c FROM admins WHERE `password` IS NULL AND pass_enc IS NOT NULL')->fetch()['c'])$pdo->exec('ALTER TABLE admins DROP COLUMN pass_enc');
  }
  $pdo->exec("ALTER TABLE admins MODIFY pass_hash VARCHAR(255) NOT NULL DEFAULT ''");
  if(!(int)$pdo->query('SELECT COUNT(*) c FROM admins')->fetch()['c'])
    $pdo->prepare('INSERT INTO admins(username,`password`,pass_hash) VALUES(?,?,?)')->execute([ADMIN_USER,ADMIN_PASS,password_hash(ADMIN_PASS,PASSWORD_DEFAULT)]);
}
