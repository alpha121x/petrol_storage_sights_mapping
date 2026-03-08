<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Petrol Storage Sights Mapping</title>

    <link rel="icon" href="public/gop_favicon.png" type="image/x-icon">

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://js.arcgis.com/4.29/esri/themes/light/main.css">

    <style>
        body {
            margin: 0;
        }

        #viewDiv {
            width: 100%;
            height: calc(100vh - 175px);
        }

        .loader-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }

        .loader-spinner {
            width: 80px;
            height: 80px;
            border-width: 8px;
        }
    </style>
</head>

<body>

    <header class="bg-dark text-white text-center py-3">
        <h4 class="mb-0">Petrol Storage Sights Mapping</h4>
    </header>

    <div class="container-fluid bg-light py-2 border-bottom">
        <div class="row g-2 justify-content-center align-items-end">

            <div class="col-md-3 col-sm-6">
                <label for="districtFilter" class="fw-bold mb-1">Select District</label>
                <select id="districtFilter" class="form-select">
                    <option value="">Loading districts...</option>
                </select>
            </div>

            <div class="col-md-2 col-sm-6">
                <label for="startDateFilter" class="fw-bold mb-1">Start Date</label>
                <input type="date" id="startDateFilter" class="form-control">
            </div>

            <div class="col-md-2 col-sm-6">
                <label for="endDateFilter" class="fw-bold mb-1">End Date</label>
                <input type="date" id="endDateFilter" class="form-control">
            </div>

            <div class="col-md-auto col-sm-12 d-flex gap-2">
                <button id="applyDateBtn" class="btn btn-success">Apply</button>
                <button id="resetDateBtn" class="btn btn-outline-secondary">Reset</button>
                <button id="downloadExcelBtn" class="btn btn-primary">Download Excel</button>
            </div>

        </div>
    </div>

    <div class="container-fluid bg-white py-2 border-bottom">
        <div class="text-center fw-bold" id="provinceName"></div>
    </div>

    <div id="viewDiv"></div>

    <div id="mapLoader" class="loader-overlay d-none">
        <div class="spinner-border text-success loader-spinner" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://js.arcgis.com/4.29/"></script>
    <script src="assets/js/index.js?v=<?= filemtime(__DIR__ . '/assets/js/index.js') ?>"></script>

</body>

</html>
