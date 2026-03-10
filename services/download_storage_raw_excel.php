<?php
include "./db_config.php";

try {

    $districtId = $_GET["district_id"] ?? "";
    $startDate  = $_GET["start_date"] ?? "";
    $endDate    = $_GET["end_date"] ?? "";

    $where = [];
    $params = [];

    if ($districtId !== "") {
        $where[] = "district_id = :district_id";
        $params[":district_id"] = $districtId;
    }

    if ($startDate !== "") {
        $where[] = "survey_time::date >= :start_date";
        $params[":start_date"] = $startDate;
    }

    if ($endDate !== "") {
        $where[] = "survey_time::date <= :end_date";
        $params[":end_date"] = $endDate;
    }

    $whereSql = "";
    if ($where) {
        $whereSql = "WHERE " . implode(" AND ", $where);
    }

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
            user_id,
            district_id,
            lat,
            lng,
            storgae_pic,
            queue_pic
        FROM petrol_storage.v_storage_final
        $whereSql
        ORDER BY survey_time DESC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    $filename = "petrol_storage_" . date("Ymd_His") . ".csv";

    header("Content-Type: text/csv; charset=UTF-8");
    header("Content-Disposition: attachment; filename=\"$filename\"");
    header("Pragma: no-cache");
    header("Expires: 0");

    $out = fopen("php://output", "w");

    fwrite($out, "\xEF\xBB\xBF"); // Excel UTF-8 fix

    $headers = [
        "raw_id",
        "district",
        "storage_name",
        "address",
        "fuel_type",
        "petrol_price",
        "diesel_price",
        "sale_availability",
        "queue",
        "overpriced",
        "remarks",
        "survey_time",
        "username",
        "user_id",
        "district_id",
        "lat",
        "lng",
        "storgae_pic",
        "queue_pic"
    ];

    fputcsv($out, $headers);

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        fputcsv($out, $row);
    }

    fclose($out);
    exit;

} catch (Throwable $e) {

    http_response_code(500);
    echo "Export failed: " . $e->getMessage();
    exit;
}
