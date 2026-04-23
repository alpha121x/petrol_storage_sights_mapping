<?php
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

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
    require __DIR__ . '/db_config.php';

    $username = trim($username);
    $password = trim($password);

    if ($username === '' || $password === '') {
        return false;
    }

    $sql = "
        SELECT
            id,
            user_name,
            cell_no,
            user_password,
            district_id,
            tehsil_id,
            is_active,
            tehsil_name,
            district_name,
            assign_ddo,
            web_login
        FROM public.tbl_users_f
        WHERE user_name = :username
          AND web_login IS TRUE
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !hash_equals((string) $user['user_password'], $password)) {
        return false;
    }

    session_regenerate_id(true);
    $_SESSION['dashboard_user'] = [
        'id' => $user['id'],
        'username' => $user['user_name'],
        'cell_no' => $user['cell_no'],
        'district_id' => $user['district_id'],
        'tehsil_id' => $user['tehsil_id'],
        'is_active' => $user['is_active'],
        'tehsil_name' => $user['tehsil_name'],
        'district_name' => $user['district_name'],
        'assign_ddo' => $user['assign_ddo'],
        'web_login' => $user['web_login'],
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
