<?php
include "./db_config.php";

header('Content-Type: application/json');

/* DISTRICTS */
$districts = $conn->query("
    SELECT gid as district_id, district_name
    FROM food_security.tbl_districts
    ORDER BY district_name
")->fetchAll(PDO::FETCH_ASSOC);


echo json_encode([
    "districts" => $districts,
]);
exit;