<?php
declare(strict_types=1);

// Simple image proxy to avoid browser mixed-content blocking on HTTPS pages.
header('X-Content-Type-Options: nosniff');
header('Cache-Control: public, max-age=300');

$rawUrl = $_GET['url'] ?? '';
$debug = isset($_GET['debug']) && $_GET['debug'] === '1';
if ($rawUrl === '') {
    http_response_code(400);
    echo 'Missing url parameter.';
    exit;
}

$decodedUrl = urldecode($rawUrl);
$parts = parse_url($decodedUrl);

$allowedHosts = [
    'content2.urbanunit.gov.pk',
    '172.20.81.86',
];

$defaultBaseUrl = 'http://content2.urbanunit.gov.pk:8083/PETROL_PUMP/PICS/';
$targetUrl = '';

if (is_array($parts) && isset($parts['scheme'], $parts['host'])) {
    $scheme = strtolower((string) $parts['scheme']);
    $host = strtolower((string) $parts['host']);

    if (!in_array($scheme, ['http', 'https'], true)) {
        http_response_code(400);
        echo 'Unsupported URL scheme.';
        exit;
    }

    if (!in_array($host, $allowedHosts, true)) {
        http_response_code(400);
        echo 'Host not allowed.';
        exit;
    }

    $targetUrl = $decodedUrl;
} else {
    // If only filename is passed, map it to the known image base.
    $fileName = basename((string) $decodedUrl);
    if ($fileName === '' || $fileName === '.' || $fileName === '..') {
        http_response_code(400);
        echo 'Invalid image path.';
        exit;
    }

    $decodedFileName = rawurldecode($fileName);
    if (!preg_match('/^[A-Za-z0-9._-]+$/', $decodedFileName)) {
        http_response_code(400);
        echo 'Invalid image filename.';
        exit;
    }

    $targetUrl = $defaultBaseUrl . rawurlencode($decodedFileName);
}

$ch = curl_init($targetUrl);
if ($ch === false) {
    http_response_code(500);
    echo 'Failed to initialize proxy request.';
    exit;
}

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_HTTPHEADER => ['Accept: image/*,*/*;q=0.8'],
]);

$body = curl_exec($ch);
$status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
$contentType = (string) curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$effectiveUrl = (string) curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
$errno = curl_errno($ch);
$err = curl_error($ch);
curl_close($ch);

if ($body === false || $status < 200 || $status >= 300) {
    http_response_code(502);
    header('Content-Type: application/json');
    $payload = [
        'error' => 'Failed to fetch image.',
        'upstream_status' => $status,
        'curl_errno' => $errno,
    ];
    if ($debug) {
        $payload['upstream_url'] = $targetUrl;
        $payload['effective_url'] = $effectiveUrl;
        $payload['curl_error'] = $err;
    }
    error_log(
        'image_proxy fetch failed'
        . ' upstream=' . $targetUrl
        . ' status=' . $status
        . ' errno=' . $errno
        . ' error=' . $err
    );
    echo json_encode($payload);
    exit;
}

if ($contentType === '' || stripos($contentType, 'image/') !== 0) {
    // Keep fallback to octet-stream if upstream omits headers.
    $contentType = 'application/octet-stream';
}

header('Content-Type: ' . $contentType);
echo $body;
