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

    $where = ["1=1"];
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

    /* ---------------- SUMMARY KPI ---------------- */

    $summarySql = "
        SELECT
            COUNT(*)::int AS total_surveys,
            COUNT(DISTINCT district_id)::int AS total_districts,
            COUNT(DISTINCT user_id)::int AS active_users,

            SUM(
                CASE
                    WHEN lower(sale_availability) LIKE '%sale%'
                    AND lower(sale_availability) NOT LIKE '%no%'
                    THEN 1
                    ELSE 0
                END
            )::int AS sale_available_count,

            SUM(
                CASE
                    WHEN lower(COALESCE(overpriced::text,'')) LIKE '%yes%'
                    OR lower(COALESCE(overpriced::text,'')) LIKE '%over%'
                    THEN 1
                    ELSE 0
                END
            )::int AS overpriced_count,

          SUM(CASE WHEN queue ilike 'yes' THEN 1 ELSE 0 END) AS queue_count

        FROM petrol_storage.v_storage_final
        WHERE {$whereSql}
    ";

    /* ---------------- DISTRICT TOP 10 ---------------- */

    $districtSql = "
        SELECT district, COUNT(*)::int AS total
        FROM petrol_storage.v_storage_final
        WHERE {$whereSql}
        GROUP BY district
        ORDER BY total DESC
        LIMIT 10
    ";

    /* ---------------- SALE DISTRIBUTION ---------------- */

    $saleSql = "
        SELECT
        CASE
            WHEN lower(sale_availability) LIKE '%limited%' THEN 'Limited Sale'
            WHEN lower(sale_availability) LIKE '%sale%' 
                 AND lower(sale_availability) NOT LIKE '%no%' THEN 'Sale Available'
            WHEN lower(sale_availability) LIKE '%no%' THEN 'No Sale'
            ELSE 'Unknown'
        END AS label,
        COUNT(*)::int AS total
        FROM petrol_storage.v_storage_final
        WHERE {$whereSql}
        GROUP BY 1
        ORDER BY total DESC
    ";

    /* ---------------- DAILY TREND ---------------- */

    $trendSql = "
        SELECT
            survey_time::date AS survey_date,
            COUNT(*)::int AS total
        FROM petrol_storage.v_storage_final
        WHERE {$whereSql}
        GROUP BY survey_time::date
        ORDER BY survey_time::date ASC
    ";

    /* ---------------- TOP USERS ---------------- */

    $userSql = "
        SELECT
            username,
            COUNT(*)::int AS total
        FROM petrol_storage.v_storage_final
        WHERE {$whereSql}
        GROUP BY username
        ORDER BY total DESC
        LIMIT 10
    ";

    /* ---------------- OVERPRICE HOTSPOTS ---------------- */

    $overpriceSql = "
        SELECT
            district,
            COUNT(*)::int AS total
        FROM petrol_storage.v_storage_final
        WHERE {$whereSql}
        AND (
            lower(COALESCE(overpriced::text,'')) LIKE '%yes%'
            OR lower(COALESCE(overpriced::text,'')) LIKE '%over%'
        )
        GROUP BY district
        ORDER BY total DESC
    ";

    /* ---------------- DISTRICT LIST ---------------- */

    $districtListSql = "
        SELECT DISTINCT district_id, district
        FROM petrol_storage.v_storage_final
        WHERE district_id IS NOT NULL
        ORDER BY district
    ";

    /* ---------------- EXECUTION ---------------- */

    $run = function ($sql, $params) use ($conn) {
        $stmt = $conn->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->execute();
        return $stmt;
    };

    $summary = $run($summarySql, $params)->fetch(PDO::FETCH_ASSOC) ?: [];
    $districts = $run($districtSql, $params)->fetchAll(PDO::FETCH_ASSOC);
    $sale = $run($saleSql, $params)->fetchAll(PDO::FETCH_ASSOC);
    $trend = $run($trendSql, $params)->fetchAll(PDO::FETCH_ASSOC);
    $users = $run($userSql, $params)->fetchAll(PDO::FETCH_ASSOC);
    $overprice = $run($overpriceSql, $params)->fetchAll(PDO::FETCH_ASSOC);
    $districtList = $run($districtListSql, [])->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "summary" => $summary,
        "district_breakdown" => $districts,
        "sale_breakdown" => $sale,
        "daily_trend" => $trend,
        "top_users" => $users,
        "overprice_districts" => $overprice,
        "districts" => $districtList
    ]);

    exit;

} catch (Throwable $e) {

    http_response_code(500);

    echo json_encode([
        "error" => "Failed to fetch dashboard analytics.",
        "message" => $e->getMessage(),
    ]);

    exit;
}