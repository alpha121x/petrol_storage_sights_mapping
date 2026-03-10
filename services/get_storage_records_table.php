<?php
include "./db_config.php";
header("Content-Type: application/json");

$where = ["1=1"];
$params = [];

if(!empty($_GET["district_id"])){
    $where[] = "district_id = :district_id";
    $params[":district_id"] = $_GET["district_id"];
}

if(!empty($_GET["start_date"])){
    $where[] = "survey_time::date >= :start_date";
    $params[":start_date"] = $_GET["start_date"];
}

if(!empty($_GET["end_date"])){
    $where[] = "survey_time::date <= :end_date";
    $params[":end_date"] = $_GET["end_date"];
}

$whereSql = implode(" AND ", $where);

$sql = "
	SELECT
	raw_id,
	district,
	storage_name,
	address,
	fuel_type,
	petrol_price,
	diesel_price,
	sale_availability,
	queue,
	overpriced,
	remarks,
survey_time,
username,
lat,
lng,
storgae_pic,
queue_pic
FROM petrol_storage.v_storage_final
WHERE $whereSql
ORDER BY survey_time DESC
LIMIT 500
";

$stmt = $conn->prepare($sql);
$stmt->execute($params);

echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
