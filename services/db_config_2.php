<?php

$host = "172.20.82.84";
$db   = "price_control_punjab";
$user = "postgres";
$pass = "diamondx";
$port = "5432";

try {

    $dsn = "pgsql:host=$host;port=$port;dbname=$db";

    $conn = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    // echo "Connected successfully";

} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}