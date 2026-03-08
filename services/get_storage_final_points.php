<?php
include "./db_config.php";

header("Content-Type: application/json");

try {
    $districtIdFilter = null;
    if (isset($_GET["district_id"]) && $_GET["district_id"] !== "") {
        $districtIdFilter = (int) $_GET["district_id"];
    }

    $startDate = isset($_GET["start_date"]) ? trim((string) $_GET["start_date"]) : "";
    $endDate = isset($_GET["end_date"]) ? trim((string) $_GET["end_date"]) : "";

    $isValidDate = function ($value) {
        return preg_match("/^\d{4}-\d{2}-\d{2}$/", $value) === 1;
    };

    if ($startDate !== "" && !$isValidDate($startDate)) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid start_date format. Use YYYY-MM-DD."]);
        exit;
    }

    if ($endDate !== "" && !$isValidDate($endDate)) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid end_date format. Use YYYY-MM-DD."]);
        exit;
    }

    if ($startDate !== "" && $endDate !== "" && $startDate > $endDate) {
        http_response_code(400);
        echo json_encode(["error" => "start_date cannot be after end_date."]);
        exit;
    }

    $where = ["lat IS NOT NULL", "lng IS NOT NULL"];
    $params = [];

    if ($districtIdFilter !== null) {
        $where[] = "district_id = :district_id";
        $params[":district_id"] = $districtIdFilter;
    }

    if ($startDate !== "") {
        $where[] = "survey_time::date >= :start_date";
        $params[":start_date"] = $startDate;
    }

    if ($endDate !== "") {
        $where[] = "survey_time::date <= :end_date";
        $params[":end_date"] = $endDate;
    }

    $whereSql = implode(" AND ", $where);

    $sql = "
        SELECT
            raw_id,
            district,
            storage_name,
            address,
            sale_availability,
            \"queue\",
            overpriced,
            remarks,
            survey_time,
            username,
            user_id,
            district_id,
            lat,
            lng
        FROM petrol_storage.v_storage_final
        WHERE {$whereSql}
        ORDER BY raw_id ASC
    ";

    $stmt = $conn->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->execute();

    $points = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $lat = (float) $row["lat"];
        $lng = (float) $row["lng"];

        if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
            continue;
        }

        $points[] = [
            "lat" => $lat,
            "lng" => $lng,
            "attributes" => $row,
        ];
    }

    echo json_encode([
        "count" => count($points),
        "points" => $points,
    ]);
    exit;
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Failed to fetch storage points.",
        "message" => $e->getMessage(),
    ]);
    exit;
}

