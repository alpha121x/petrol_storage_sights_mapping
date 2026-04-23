<?php
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

const DASHBOARD_USERNAME = 'admin';
const DASHBOARD_PASSWORD = 'admin123';

function current_user(): ?array
{
    return $_SESSION['dashboard_user'] ?? null;
}

function is_logged_in(): bool
{
    return current_user() !== null;
}

function login_user(string $username, string $password): bool
{
    $username = trim($username);

    if (!hash_equals(DASHBOARD_USERNAME, $username) || !hash_equals(DASHBOARD_PASSWORD, $password)) {
        return false;
    }

    session_regenerate_id(true);
    $_SESSION['dashboard_user'] = [
        'username' => $username,
        'login_time' => date('Y-m-d H:i:s'),
    ];

    return true;
}

function logout_user(): void
{
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }

    session_destroy();
}

function require_login(): void
{
    if (is_logged_in()) {
        return;
    }

    header('Location: login.php');
    exit;
}
