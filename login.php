<?php
require_once __DIR__ . '/services/auth.php';

if (is_logged_in()) {
    header('Location: index.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Login</title>

    <link rel="icon" href="public/gop_favicon.png" type="image/x-icon">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            margin: 0;
            color: #13243a;
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }

        .login-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: #eef4fb;
        }

        .login-card {
            width: 100%;
            max-width: 420px;
            padding: 28px;
            border-radius: 12px;
            background: #fff;
            box-shadow: 0 14px 40px rgba(10, 25, 41, 0.14);
        }

        .login-title {
            color: #0f3767;
            font-weight: 700;
        }
    </style>
</head>

<body>
    <main class="login-page">
        <form class="login-card" id="loginForm" method="post">
            <div class="text-center mb-4">
                <img src="public/gop_favicon.png" alt="Dashboard logo" width="54" height="54" class="mb-3">
                <h4 class="login-title mb-1">Dashboard Login</h4>
                <div class="text-muted">Petrol Storage Analytics</div>
            </div>

            <div class="alert alert-danger py-2 d-none" id="loginError" role="alert"></div>

            <div class="mb-3">
                <label for="username" class="form-label fw-semibold">Username</label>
                <input type="text" class="form-control" id="username" name="username" autocomplete="username" required autofocus>
            </div>

            <div class="mb-4">
                <label for="password" class="form-label fw-semibold">Password</label>
                <input type="password" class="form-control" id="password" name="password" autocomplete="current-password" required>
            </div>

            <button type="submit" class="btn btn-primary w-100" id="loginBtn">Login</button>
        </form>
    </main>

    <script>
        const loginForm = document.getElementById("loginForm");
        const loginError = document.getElementById("loginError");
        const loginBtn = document.getElementById("loginBtn");

        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            loginError.classList.add("d-none");
            loginBtn.disabled = true;
            loginBtn.textContent = "Logging in...";

            try {
                const response = await fetch("services/login_api.php", {
                    method: "POST",
                    body: new FormData(loginForm),
                });
                const result = await response.json();

                if (result.success) {
                    window.location.href = result.redirect || "index.php";
                    return;
                }

                loginError.textContent = result.message || "Login failed.";
                loginError.classList.remove("d-none");
            } catch (error) {
                loginError.textContent = "Login request failed.";
                loginError.classList.remove("d-none");
            } finally {
                loginBtn.disabled = false;
                loginBtn.textContent = "Login";
            }
        });
    </script>
</body>

</html>
