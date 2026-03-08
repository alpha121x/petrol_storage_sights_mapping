<?php
include "./db_config.php";

header('Content-Type: application/json');

if (!isset($_GET['district_id'])) {
    echo json_encode([
        "error" => "district_id is required"
    ]);
    exit;
}

$district_id = (int) $_GET['district_id'];

/* Get district extent from geometry */

$sql = "
SELECT
    id AS district_id,
    district_name,
    ST_XMin(geom) AS xmin,
    ST_YMin(geom) AS ymin,
    ST_XMax(geom) AS xmax,
    ST_YMax(geom) AS ymax
FROM public.administrative_districts
WHERE id = :id
LIMIT 1
";

$stmt = $conn->prepare($sql);
$stmt->execute([
    "id" => $district_id
]);

$result = $stmt->fetch(PDO::FETCH_ASSOC);

echo json_encode($result);

exit;
?>