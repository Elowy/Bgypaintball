<?php
/* =====================================================================
 * Bgyarmatpaintball – egyszerű tartalom-backend (PHP + JSON fájl)
 * ---------------------------------------------------------------------
 * Feladata: az admin szerkesztő közvetlenül a szerverre menthet, így a
 * módosítások AZONNAL látszanak minden látogatónál (export/deploy nélkül).
 *
 *   GET  content.php?action=load           -> visszaadja a tárolt tartalmat (JSON)
 *   POST content.php?action=auth   {password}          -> {ok:true/false}
 *   POST content.php?action=save   {password, content} -> elmenti a tartalmat
 *
 * TENNIVALÓ ÉLESÍTÉSKOR:
 *   1) Töltsd fel ezt a fájlt az oldal gyökerébe (az index.html mellé).
 *   2) Cseréld le lent a $PASS_HASH-t a saját jelszavad SHA-256 hash-ére.
 *        Linux/Mac:  printf '%s' 'AZ_UJ_JELSZO' | sha256sum
 *        vagy online SHA-256 generátor.
 *   3) A content-data.json a szerveren íródik; a webkiszolgálónak írnia kell
 *      tudni ebbe a mappába (cPanel PHP általában tud).
 * ===================================================================== */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// sha256("bgyarmat-admin")  — ÉLESÍTÉS ELŐTT CSERÉLD LE!
$PASS_HASH = '4e6ed4660963acb50553558c3061e2ce3ddfc4ea81f6fb9c43596db26b0bc380';

$DATA_FILE = __DIR__ . '/content-data.json';
$action = isset($_GET['action']) ? $_GET['action'] : 'load';

function respond($arr, $code = 200) {
    http_response_code($code);
    echo json_encode($arr, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/* ---- Tartalom betöltése (bárki) ---- */
if ($action === 'load') {
    if (is_readable($DATA_FILE)) {
        echo file_get_contents($DATA_FILE);
    } else {
        echo '{}';
    }
    exit;
}

/* ---- POST műveletek: auth / save ---- */
$raw  = file_get_contents('php://input');
$body = json_decode($raw, true);
if (!is_array($body)) $body = array();
$pass = isset($body['password']) ? (string) $body['password'] : '';

$valid = hash_equals($PASS_HASH, hash('sha256', $pass));

if ($action === 'auth') {
    if (!$valid) usleep(600000); // kis késleltetés a próbálgatás lassítására
    respond(array('ok' => $valid));
}

if ($action === 'save') {
    if (!$valid) { usleep(600000); respond(array('ok' => false, 'error' => 'Hibás jelszó'), 403); }
    $content = isset($body['content']) ? $body['content'] : null;
    if (!is_array($content)) respond(array('ok' => false, 'error' => 'Hiányzó vagy hibás tartalom'), 400);

    $json = json_encode($content, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    $tmp  = $DATA_FILE . '.tmp';
    if (@file_put_contents($tmp, $json) === false || !@rename($tmp, $DATA_FILE)) {
        respond(array('ok' => false, 'error' => 'Írási hiba – a mappának írhatónak kell lennie'), 500);
    }
    respond(array('ok' => true));
}

respond(array('ok' => false, 'error' => 'Ismeretlen művelet'), 400);
