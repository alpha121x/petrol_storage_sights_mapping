<?php
include "./db_config.php";

header('Content-Type: application/json');

/* DISTRICTS */
$districts = $conn->query("
    SELECT
        id AS district_id,
        district_name
    FROM public.administrative_districts
    ORDER BY district_name
")->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    "districts" => $districts,
]);

exit;
?>