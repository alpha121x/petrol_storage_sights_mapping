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
$fallbackBaseUrl = 'http://172.20.81.86:8083/PETROL_PUMP/PICS/';
$targetUrls = [];

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

    $targetUrls[] = $decodedUrl;

    $path = (string) ($parts['path'] ?? '');
    $query = isset($parts['query']) ? ('?' . $parts['query']) : '';
    if ($path !== '') {
        $targetUrls[] = 'http://172.20.81.86:8083' . $path . $query;
    }
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

    $encodedFileName = rawurlencode($decodedFileName);
    $targetUrls[] = $defaultBaseUrl . $encodedFileName;
    $targetUrls[] = $fallbackBaseUrl . $encodedFileName;
}

// Try primary target first, then fallback(s) to handle server-side routing differences.
$attempts = array_values(array_unique($targetUrls));
$body = false;
$status = 0;
$contentType = '';
$effectiveUrl = '';
$errno = 0;
$err = '';
$usedUrl = '';

foreach ($attempts as $attemptUrl) {
    $ch = curl_init($attemptUrl);
    if ($ch === false) {
        continue;
    }

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_HTTPHEADER => ['Accept: image/*,*/*;q=0.8'],
    ]);

    $candidateBody = curl_exec($ch);
    $candidateStatus = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $candidateType = (string) curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $candidateEffective = (string) curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
    $candidateErrno = curl_errno($ch);
    $candidateErr = curl_error($ch);
    curl_close($ch);

    if ($candidateBody !== false && $candidateStatus >= 200 && $candidateStatus < 300) {
        $body = $candidateBody;
        $status = $candidateStatus;
        $contentType = $candidateType;
        $effectiveUrl = $candidateEffective;
        $errno = $candidateErrno;
        $err = $candidateErr;
        $usedUrl = $attemptUrl;
        break;
    }

    $status = $candidateStatus;
    $contentType = $candidateType;
    $effectiveUrl = $candidateEffective;
    $errno = $candidateErrno;
    $err = $candidateErr;
    $usedUrl = $attemptUrl;
}

if ($body === false || $status < 200 || $status >= 300) {
    http_response_code(502);
    header('Content-Type: application/json');
    $payload = [
        'error' => 'Failed to fetch image.',
        'upstream_status' => $status,
        'curl_errno' => $errno,
    ];
    if ($debug) {
        $payload['upstream_url'] = $usedUrl;
        $payload['attempts'] = $attempts;
        $payload['effective_url'] = $effectiveUrl;
        $payload['curl_error'] = $err;
    }
    error_log(
        'image_proxy fetch failed'
        . ' upstream=' . $usedUrl
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
