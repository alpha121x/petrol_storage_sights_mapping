<?php
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed.',
    ]);
    exit;
}

$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

if (login_user($username, $password)) {
    echo json_encode([
        'success' => true,
        'redirect' => 'index.php',
        'user' => current_user(),
    ]);
    exit;
}

http_response_code(401);
echo json_encode([
    'success' => false,
    'message' => 'Invalid username or password.',
]);
