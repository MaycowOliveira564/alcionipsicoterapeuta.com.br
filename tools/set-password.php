<?php
// Uso (terminal):  php tools/set-password.php USUARIO SENHA
// Útil se esquecer a senha do painel. Requer acesso ao servidor.
if (PHP_SAPI !== 'cli') { http_response_code(403); exit; }
require __DIR__ . '/../inc/lib.php';
[$_, $u, $p] = $argv + [null, '', ''];
if ($u === '' || strlen($p) < 10) { fwrite(STDERR, "Uso: php tools/set-password.php USUARIO SENHA (mín. 10 caracteres)\n"); exit(1); }
write_json_atomic(CONFIG_FILE, ['user' => $u, 'hash' => password_hash($p, PASSWORD_DEFAULT), 'created' => date('c')]);
echo "Credenciais atualizadas.\n";
