<?php
if(!file_exists(__DIR__.'/config.php')){http_response_code(500);header('Content-Type: application/json');
  echo json_encode(['error'=>'config.php belum ada. Salin config.sample.php menjadi config.php lalu isi password dan SECRET.']);exit;}
require __DIR__.'/config.php';
header('Access-Control-Allow-Origin: *');header('Access-Control-Allow-Headers: Content-Type, X-Token');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');header('Content-Type: application/json; charset=utf-8');
if($_SERVER['REQUEST_METHOD']==='OPTIONS')exit;
function out($d,$c=200){http_response_code($c);echo json_encode($d,JSON_UNESCAPED_UNICODE);exit;}
if(($_GET['a']??'')==='ping')out(['ok'=>true]); // sebelum koneksi DB, supaya error MySQL tampil jelas di aksi berikutnya
require __DIR__.'/schema.php';
try{
  $pdo=new PDO('mysql:host='.DB_HOST.';charset=utf8mb4',DB_USER,DB_PASS,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
  if(!$pdo->query("SHOW DATABASES LIKE '".DB_NAME."'")->fetch())
    foreach(array_filter(array_map('trim',explode(';',str_replace('coderbot','`'.DB_NAME.'`',file_get_contents(__DIR__.'/database.sql'))))) as $q)$pdo->exec($q);
  $pdo->exec('USE `'.DB_NAME.'`');
}catch(Exception $e){out(['error'=>'Database: '.$e->getMessage()],500);}

function mk($id,$role){$p=rtrim(strtr(base64_encode(json_encode(['i'=>$id,'r'=>$role,'e'=>time()+86400*30])),'+/','-_'),'=');return $p.'.'.hash_hmac('sha256',$p,SECRET);}
function chk($role){$x=explode('.',$_SERVER['HTTP_X_TOKEN']??'');
  if(count($x)!==2||!hash_equals(hash_hmac('sha256',$x[0],SECRET),$x[1]))out(['error'=>'Sesi habis, masuk lagi.'],401);
  $d=json_decode(base64_decode(strtr($x[0],'-_','+/')),true);if(!$d||$d['e']<time()||$d['r']!==$role)out(['error'=>'Sesi habis, masuk lagi.'],401);return $d['i'];}
function stu($pdo,$id){
  cb_schema($pdo);
  $s=$pdo->prepare('SELECT id,name,avatar,settings FROM students WHERE id=?');$s->execute([$id]);$r=$s->fetch();if(!$r)out(['error'=>'Akun tidak ditemukan'],404);
  $p=$pdo->prepare('SELECT level,stars,best_cards,best_secs FROM progress WHERE student_id=?');$p->execute([$id]);$st=[];$b=[];$tm=[];
  foreach($p as $x){$st[$x['level']]=(int)$x['stars'];$b[$x['level']]=(int)$x['best_cards'];if($x['best_secs']!==null)$tm[$x['level']]=(int)$x['best_secs'];}
  return['id'=>(int)$r['id'],'name'=>$r['name'],'av'=>$r['avatar'],'stars'=>(object)$st,'best'=>(object)$b,'times'=>(object)$tm,'total'=>array_sum($st),'settings'=>json_decode($r['settings']?:'{}')];}
function throttle_check($pdo,$k){cb_schema($pdo);$r=rows($pdo,'SELECT TIMESTAMPDIFF(SECOND,NOW(),locked_until) s FROM throttle WHERE k=? AND locked_until>NOW()',[$k]);
  if($r)out(['error'=>'Terlalu banyak percobaan salah. Coba lagi dalam '.max(1,(int)ceil($r[0]['s']/60)).' menit. ⏳'],429);}
function throttle_fail($pdo,$k,$msg){
  $w=LOGIN_WINDOW_MIN;
  $pdo->prepare("INSERT INTO throttle(k,fails,first_at) VALUES(?,1,NOW()) ON DUPLICATE KEY UPDATE fails=IF(first_at<NOW()-INTERVAL $w MINUTE,1,fails+1), first_at=IF(first_at<NOW()-INTERVAL $w MINUTE,NOW(),first_at), locked_until=NULL")->execute([$k]);
  $pdo->prepare('UPDATE throttle SET locked_until=NOW()+INTERVAL '.LOGIN_LOCK_MIN.' MINUTE, fails=0 WHERE k=? AND fails>=?')->execute([$k,LOGIN_MAX_TRIES]);
  $r=rows($pdo,'SELECT fails,(locked_until>NOW()) lk FROM throttle WHERE k=?',[$k])[0]??['fails'=>0,'lk'=>0];
  $pdo->exec('DELETE FROM throttle WHERE first_at<NOW()-INTERVAL 1 DAY AND (locked_until IS NULL OR locked_until<NOW())');
  if($r['lk'])out(['error'=>'Terlalu banyak percobaan salah. Coba lagi dalam '.LOGIN_LOCK_MIN.' menit. ⏳'],429);
  out(['error'=>$msg.' (sisa '.(LOGIN_MAX_TRIES-(int)$r['fails']).' kali)'],401);}
function throttle_ok($pdo,$k){$pdo->prepare('DELETE FROM throttle WHERE k=?')->execute([$k]);}
function chkAdmin($pdo){$id=chk('admin');cb_schema($pdo);if(!rows($pdo,'SELECT id FROM admins WHERE id=?',[$id]))out(['error'=>'Sesi habis, masuk lagi.'],401);return $id;}
function rows($pdo,$sql,$a=[]){$q=$pdo->prepare($sql);$q->execute($a);return $q->fetchAll();}

$a=$_GET['a']??'';$in=json_decode(file_get_contents('php://input'),true)?:[];
switch($a){
case 'login': case 'register':
  cb_schema($pdo);
  $name=trim($in['name']??'');$pin=(string)($in['pin']??'');$slug=substr(preg_replace('/[^a-z0-9]/','',strtolower($name)),0,16);
  if(strlen($slug)<2||!preg_match('/^\d{4}$/',$pin))out(['error'=>'Nama minimal 2 huruf dan PIN 4 angka.'],400);
  $r=rows($pdo,'SELECT id,pin_hash FROM students WHERE slug=?',[$slug]);
  if($r){
    if($a==='register')out(['error'=>'Nama itu sudah dipakai. Coba nama lain atau masuk.'],409);
    $tk='s:'.$slug;throttle_check($pdo,$tk);
    if(!password_verify($pin,$r[0]['pin_hash']))throttle_fail($pdo,$tk,'PIN salah. Coba ingat lagi! 🤔');
    throttle_ok($pdo,$tk);
    $id=$r[0]['id'];
  }else{
    if($a==='login')out(['error'=>'Nama belum terdaftar. Daftar dulu ya! 📝'],404);
    $pdo->prepare('INSERT INTO students(slug,name,avatar,pin_hash,`pin`) VALUES(?,?,?,?,?)')->execute([$slug,substr($name,0,16),mb_substr($in['av']??'🤖',0,2),password_hash($pin,PASSWORD_DEFAULT),$pin]);$id=$pdo->lastInsertId();
  }
  $pdo->prepare('UPDATE students SET last_login=NOW(),`pin`=? WHERE id=?')->execute([$pin,$id]);
  out(['token'=>mk($id,'student'),'student'=>stu($pdo,$id)]);
case 'me': out(stu($pdo,chk('student')));
case 'play':
  $id=chk('student');$lv=(int)($in['level']??0);$cards=min(99,max(0,(int)($in['cards']??0)));$res=$in['result']??'short';$stars=min(3,max(0,(int)($in['stars']??0)));
  if(!in_array($res,['win','bug','out','short']))out(['error'=>'bad'],400);if($res!=='win')$stars=0;
  // Waktu (detik) hanya dicatat bila menang.
  $secs=($res==='win'&&isset($in['secs'])&&is_numeric($in['secs']))?min(86399,max(0,(int)$in['secs'])):null;
  $pdo->prepare('INSERT INTO plays(student_id,level,cards,secs,result) VALUES(?,?,?,?,?)')->execute([$id,$lv,$cards,$secs,$res]);
  $pdo->prepare('INSERT INTO progress(student_id,level,stars,best_cards,best_secs,attempts) VALUES(?,?,?,?,?,1) ON DUPLICATE KEY UPDATE attempts=attempts+1, stars=GREATEST(stars,VALUES(stars)), best_cards=IF(VALUES(best_cards)=0,best_cards,IF(best_cards=0,VALUES(best_cards),LEAST(best_cards,VALUES(best_cards)))), best_secs=IF(VALUES(best_secs) IS NULL,best_secs,IF(best_secs IS NULL,VALUES(best_secs),LEAST(best_secs,VALUES(best_secs))))')
      ->execute([$id,$lv,$stars,$res==='win'?$cards:0,$secs]);
  out(stu($pdo,$id));
case 'sync_times': // memindahkan rekor waktu lama yang tersimpan di perangkat (localStorage) ke database; hanya menurunkan waktu, tidak pernah menaikkan
  $id=chk('student');cb_schema($pdo);
  foreach((is_array($in['times']??null)?$in['times']:[]) as $lv=>$sc){if(!is_numeric($lv)||!is_numeric($sc)||$sc<=0)continue;
    $pdo->prepare('UPDATE progress SET best_secs=IF(best_secs IS NULL,?,LEAST(best_secs,?)) WHERE student_id=? AND level=? AND stars>0')->execute([min(86399,(int)$sc),min(86399,(int)$sc),$id,(int)$lv]);}
  out(stu($pdo,$id));
case 'settings':
  $id=chk('student');$pdo->prepare('UPDATE students SET settings=? WHERE id=?')->execute([json_encode($in['settings']??new stdClass),$id]);out(stu($pdo,$id));
case 'board':
  out(rows($pdo,'SELECT s.id,s.name,s.avatar av,COALESCE(SUM(p.stars),0)+0 total FROM students s LEFT JOIN progress p ON p.student_id=s.id GROUP BY s.id ORDER BY total DESC LIMIT 10'));
case 'admin_login':
  cb_schema($pdo);$u=trim((string)($in['user']??''));$tk='a:'.strtolower($u).'|'.($_SERVER['REMOTE_ADDR']??'');throttle_check($pdo,$tk);
  $r=rows($pdo,'SELECT id,username,`password`,pass_hash FROM admins WHERE username=?',[$u]);$pw=(string)($in['pass']??'');
  // Jika kolom `password` terisi, itulah acuannya (jadi admin yang dibuat/diubah lewat HeidiSQL bisa login). Jika kosong, pakai hash.
  $okp=$r&&(($r[0]['password']!==null&&$r[0]['password']!=='')?hash_equals((string)$r[0]['password'],$pw):($r[0]['pass_hash']!==''&&password_verify($pw,$r[0]['pass_hash'])));
  if($okp){throttle_ok($pdo,$tk);out(['token'=>mk((int)$r[0]['id'],'admin'),'user'=>$r[0]['username']]);}
  throttle_fail($pdo,$tk,'Username atau password admin salah.');
case 'admin_recover':
  cb_schema($pdo);$tk='r:'.($_SERVER['REMOTE_ADDR']??'');throttle_check($pdo,$tk);
  if(!defined('RECOVERY_CODE')||strlen(RECOVERY_CODE)<8)out(['error'=>'Kode pemulihan belum diatur. Buka config.php di folder programmer dan robot, tambahkan baris RECOVERY_CODE (contoh ada di config.sample.php), lalu coba lagi.'],400);
  if(!hash_equals(RECOVERY_CODE,(string)($in['code']??'')))throttle_fail($pdo,$tk,'Kode pemulihan salah.');
  $u=trim((string)($in['user']??''));$p=(string)($in['pass']??'');
  if(strlen($p)<6)out(['error'=>'Password baru minimal 6 karakter.'],400);
  $r=rows($pdo,'SELECT id FROM admins WHERE username=?',[$u]);if(!$r)out(['error'=>'Username admin tidak ditemukan.'],404);
  $pdo->prepare('UPDATE admins SET pass_hash=?,`password`=? WHERE id=?')->execute([password_hash($p,PASSWORD_DEFAULT),$p,$r[0]['id']]);
  throttle_ok($pdo,$tk);out(['ok'=>true]);
case 'admin_data':
  chkAdmin($pdo);
  $st=rows($pdo,'SELECT s.id,s.name,s.avatar av,s.created_at,s.last_login,COALESCE(SUM(p.stars),0)+0 total,COALESCE(SUM(p.attempts),0)+0 attempts,COALESCE(SUM(p.stars>0),0)+0 done,COALESCE(SUM(p.best_secs),0)+0 total_secs,COALESCE(SUM(p.best_secs IS NOT NULL),0)+0 timed FROM students s LEFT JOIN progress p ON p.student_id=s.id GROUP BY s.id ORDER BY total DESC');
  // Rekor waktu per siswa per level, dan siswa tercepat per level
  $tm=[];$fast=[];
  foreach(rows($pdo,'SELECT p.student_id,p.level,p.best_secs,s.name FROM progress p JOIN students s ON s.id=p.student_id WHERE p.best_secs IS NOT NULL ORDER BY p.best_secs,p.updated_at') as $x){
    $tm[$x['student_id']][(int)$x['level']]=(int)$x['best_secs'];
    if(!isset($fast[$x['level']]))$fast[$x['level']]=['name'=>$x['name'],'secs'=>(int)$x['best_secs']];}
  foreach($st as &$x)$x['times']=(object)($tm[$x['id']]??[]);unset($x);
  $lv=rows($pdo,"SELECT level,COUNT(*) plays,SUM(result='win') wins,SUM(result IN('bug','out')) bugs,ROUND(AVG(secs)) avg_secs FROM plays GROUP BY level ORDER BY level");
  foreach($lv as &$x){$f=$fast[$x['level']]??null;$x['best_secs']=$f?$f['secs']:null;$x['best_name']=$f?$f['name']:null;}unset($x);
  out(['students'=>$st,'levels'=>$lv,
       'plays'=>rows($pdo,'SELECT pl.created_at,s.name,pl.level,pl.cards,pl.secs,pl.result FROM plays pl JOIN students s ON s.id=pl.student_id ORDER BY pl.id DESC LIMIT 300')]);
case 'admin_reset':
  chkAdmin($pdo);if(!preg_match('/^\d{4}$/',(string)($in['pin']??'')))out(['error'=>'PIN harus 4 angka'],400);
  $pdo->prepare('UPDATE students SET pin_hash=?,`pin`=? WHERE id=?')->execute([password_hash($in['pin'],PASSWORD_DEFAULT),$in['pin'],(int)$in['id']]);out(['ok'=>true]);
case 'admin_pin':
  chkAdmin($pdo);$r=rows($pdo,'SELECT `pin` FROM students WHERE id=?',[(int)($in['id']??0)]);
  if(!$r)out(['error'=>'Siswa tidak ditemukan.'],404);out(['pin'=>$r[0]['pin']]);
case 'admin_delete':
  chkAdmin($pdo);$pdo->prepare('DELETE FROM students WHERE id=?')->execute([(int)$in['id']]);out(['ok'=>true]);
case 'admin_list':
  $me=chkAdmin($pdo);$l=rows($pdo,'SELECT id,username,created_at,(`password` IS NOT NULL AND LENGTH(`password`)>0) has_pass FROM admins ORDER BY id');
  foreach($l as &$x){$x['me']=((int)$x['id']===(int)$me);$x['has_pass']=(bool)$x['has_pass'];}unset($x);out(['admins'=>$l]);
case 'admin_add':
  chkAdmin($pdo);$u=trim((string)($in['user']??''));$p=(string)($in['pass']??'');
  if(!preg_match('/^[a-zA-Z0-9_.-]{3,30}$/',$u))out(['error'=>'Username 3-30 karakter (huruf, angka, _ . -).'],400);
  if(strlen($p)<6)out(['error'=>'Password minimal 6 karakter.'],400);
  if(rows($pdo,'SELECT id FROM admins WHERE username=?',[$u]))out(['error'=>'Username itu sudah dipakai.'],409);
  $pdo->prepare('INSERT INTO admins(username,`password`,pass_hash) VALUES(?,?,?)')->execute([$u,$p,password_hash($p,PASSWORD_DEFAULT)]);out(['ok'=>true]);
case 'admin_pass':
  chkAdmin($pdo);$p=(string)($in['pass']??'');if(strlen($p)<6)out(['error'=>'Password minimal 6 karakter.'],400);
  $pdo->prepare('UPDATE admins SET pass_hash=?,`password`=? WHERE id=?')->execute([password_hash($p,PASSWORD_DEFAULT),$p,(int)($in['id']??0)]);out(['ok'=>true]);
case 'admin_reveal':
  chkAdmin($pdo);$r=rows($pdo,'SELECT `password` FROM admins WHERE id=?',[(int)($in['id']??0)]);
  if(!$r)out(['error'=>'Admin tidak ditemukan.'],404);out(['pass'=>$r[0]['password']]);
case 'admin_edit':
  chkAdmin($pdo);$id=(int)($in['id']??0);$u=trim((string)($in['user']??''));$p=(string)($in['pass']??'');
  if(!rows($pdo,'SELECT id FROM admins WHERE id=?',[$id]))out(['error'=>'Admin tidak ditemukan.'],404);
  if(!preg_match('/^[a-zA-Z0-9_.-]{3,30}$/',$u))out(['error'=>'Username 3-30 karakter (huruf, angka, _ . -).'],400);
  if(rows($pdo,'SELECT id FROM admins WHERE username=? AND id<>?',[$u,$id]))out(['error'=>'Username itu sudah dipakai.'],409);
  if($p!==''){if(strlen($p)<6)out(['error'=>'Password minimal 6 karakter.'],400);
    $pdo->prepare('UPDATE admins SET username=?,pass_hash=?,`password`=? WHERE id=?')->execute([$u,password_hash($p,PASSWORD_DEFAULT),$p,$id]);}
  else $pdo->prepare('UPDATE admins SET username=? WHERE id=?')->execute([$u,$id]);
  out(['ok'=>true]);
case 'admin_remove':
  $me=chkAdmin($pdo);$id=(int)($in['id']??0);
  if($id===(int)$me)out(['error'=>'Tidak bisa menghapus akunmu sendiri.'],400);
  if((int)rows($pdo,'SELECT COUNT(*) c FROM admins')[0]['c']<2)out(['error'=>'Minimal harus ada satu admin.'],400);
  $pdo->prepare('DELETE FROM admins WHERE id=?')->execute([$id]);out(['ok'=>true]);
default: out(['error'=>'aksi tidak dikenal'],404);
}
