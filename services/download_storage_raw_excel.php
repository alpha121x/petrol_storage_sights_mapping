<?php
include "./db_config.php";

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
        echo "Invalid start_date format. Use YYYY-MM-DD.";
        exit;
    }

    if ($endDate !== "" && !$isValidDate($endDate)) {
        http_response_code(400);
        echo "Invalid end_date format. Use YYYY-MM-DD.";
        exit;
    }

    if ($startDate !== "" && $endDate !== "" && $startDate > $endDate) {
        http_response_code(400);
        echo "start_date cannot be after end_date.";
        exit;
    }

    $sql = "SELECT raw_id, data::text AS data_json FROM petrol_storage.tbl_storgae_raw ORDER BY raw_id ASC";
    $stmt = $conn->query($sql);

    $filename = "petrol_storage_raw_" . date("Ymd_His") . ".csv";
    header("Content-Type: text/csv; charset=UTF-8");
    header("Content-Disposition: attachment; filename=\"{$filename}\"");
    header("Pragma: no-cache");
    header("Expires: 0");

    $out = fopen("php://output", "w");
    // UTF-8 BOM so Excel opens Urdu/special characters correctly.
    fwrite($out, "\xEF\xBB\xBF");

    $csvHeaders = [
        "raw_id",
        "district",
        "storage_name",
        "address",
        "sale_availability",
        "people_standing_in_queues",
        "prices_overpriced",
        "remarks",
        "kerosene_capacity",
        "kerosene_capacity_gallons",
        "survey_date_time",
        // "username",
        // "user_id",
        "district_id",
        // "android_id"
    ];
    fputcsv($out, $csvHeaders);

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $payloadRaw = $row["data_json"] ?? "{}";
        $payload = [];

        if (is_array($payloadRaw)) {
            $payload = $payloadRaw;
        } elseif (is_string($payloadRaw) && $payloadRaw !== "") {
            $decoded = json_decode($payloadRaw, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $payload = $decoded;
            }
        }

        if ($districtIdFilter !== null) {
            $rowDistrictId = isset($payload["district_id"]) ? (int) $payload["district_id"] : null;
            if ($rowDistrictId !== $districtIdFilter) {
                continue;
            }

            if ($startDate !== "" || $endDate !== "") {
                $surveyDateRaw = (string) ($payload["survey_date_time"] ?? "");
                $surveyDate = substr($surveyDateRaw, 0, 10);

                if (preg_match("/^\d{4}-\d{2}-\d{2}$/", $surveyDate) !== 1) {
                    continue;
                }

                if ($startDate !== "" && $surveyDate < $startDate) {
                    continue;
                }

                if ($endDate !== "" && $surveyDate > $endDate) {
                    continue;
                }
            }
        }

        $csvRow = [
            $payload["district"] ?? null,
            $payload["storage_name"] ?? null,
            $payload["address"] ?? null,
            $payload["sale_availability"] ?? null,
            $payload["people_standing_in_queues"] ?? null,
            $payload["prices_overpriced"] ?? null,
            $payload["remarks"] ?? null,
            $payload["kerosene_capacity"] ?? null,
            $payload["kerosene_capacity_gallons"] ?? null,
            $payload["survey_date_time"] ?? null,
            $payload["district_id"] ?? null,
        ];

        fputcsv($out, $csvRow);
    }

    fclose($out);
    exit;
} catch (Throwable $e) {
    http_response_code(500);
    echo "Export failed: " . $e->getMessage();
    exit;
}
