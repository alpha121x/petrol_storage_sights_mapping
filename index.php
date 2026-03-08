<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Petrol Storage Dashboard</title>

    <link rel="icon" href="public/gop_favicon.png" type="image/x-icon">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://js.arcgis.com/4.29/esri/themes/light/main.css">
    <style>
        body {
            margin: 0;
            background: #f3f6fb;
            color: #13243a;
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }

        .dash-header {
            color: #fff;
            background: linear-gradient(120deg, #0f3a6d, #195498, #2c73bf);
        }

        .filter-panel {
            background: #ffffff;
        }

        .kpi-card {
            border: 0;
            border-radius: 12px;
            background: #ffffff;
            box-shadow: 0 4px 18px rgba(10, 25, 41, 0.08);
            padding: 12px 14px;
            height: 100%;
        }

        .kpi-label {
            font-size: 0.85rem;
            color: #5e6f82;
        }

        .kpi-value {
            font-size: 1.7rem;
            font-weight: 700;
            color: #0f3767;
            line-height: 1.1;
        }

        .chart-card {
            border: 0;
            border-radius: 14px;
            background: #ffffff;
            box-shadow: 0 6px 24px rgba(10, 25, 41, 0.1);
            padding: 12px;
        }

        .chart-title {
            font-weight: 700;
            color: #123357;
            margin-bottom: 10px;
        }

        .chart-box {
            height: 320px;
        }

        #viewDiv {
            width: 100%;
            height: 470px;
        }

        .loader-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(8, 18, 31, 0.45);
        }

        @media (max-width: 767px) {
            .kpi-value {
                font-size: 1.45rem;
            }

            .chart-box {
                height: 280px;
            }

            #viewDiv {
                height: 390px;
            }
        }
    </style>
</head>

<body>
    <header class="dash-header py-3 px-3 px-md-4">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
                <h4 class="mb-0">Petrol Storage Analytics Dashboard</h4>
            </div>
            <div class="badge text-bg-light px-3 py-2" id="recordBadge">Pumps Surveyed: 0</div>
        </div>
    </header>

    <section class="container-fluid py-3 filter-panel border-bottom">
        <div class="row g-2 align-items-end">
            <div class="col-md-3 col-sm-6">
                <label for="districtFilter" class="form-label fw-semibold">District</label>
                <select id="districtFilter" class="form-select">
                    <option value="">All Districts</option>
                </select>
            </div>
            <div class="col-md-2 col-sm-6">
                <label for="startDateFilter" class="form-label fw-semibold">Start Date</label>
                <input type="date" id="startDateFilter" class="form-control">
            </div>
            <div class="col-md-2 col-sm-6">
                <label for="endDateFilter" class="form-label fw-semibold">End Date</label>
                <input type="date" id="endDateFilter" class="form-control">
            </div>
            <div class="col-md-auto col-sm-12 d-flex gap-2">
                <button id="applyBtn" class="btn btn-success">Apply</button>
                <button id="resetBtn" class="btn btn-outline-secondary">Reset</button>
                <button id="downloadExcelBtn" class="btn btn-primary">Download Excel</button>
            </div>
        </div>
    </section>

    <main class="container-fluid py-3">
        <div class="row g-3 mb-1">
            <div class="col-md-4 col-lg-2">
                <div class="kpi-card">
                    <div class="kpi-label">Total Pumps Surveyed</div>
                    <div class="kpi-value" id="kpiTotal">0</div>
                </div>
            </div>
            <div class="col-md-4 col-lg-2">
                <div class="kpi-card">
                    <div class="kpi-label">Sale Available</div>
                    <div class="kpi-value" id="kpiAvailable">0</div>
                </div>
            </div>
            <div class="col-md-4 col-lg-2">
                <div class="kpi-card">
                    <div class="kpi-label">Queue's Reported</div>
                    <div class="kpi-value" id="kpiQueue">0</div>
                </div>
            </div>
            <div class="col-md-4 col-lg-2">
                <div class="kpi-card">
                    <div class="kpi-label">Overpriced Pumps</div>
                    <div class="kpi-value" id="kpiOverpriced">0</div>
                </div>
            </div>
            <div class="col-md-4 col-lg-2">
                <div class="kpi-card">
                    <div class="kpi-label">Districts</div>
                    <div class="kpi-value" id="kpiDistricts">0</div>
                </div>
            </div>
            <!-- <div class="col-md-4 col-lg-2">
                <div class="kpi-card">
                    <div class="kpi-label">Active Users</div>
                    <div class="kpi-value" id="kpiUsers">0</div>
                </div>
            </div> -->
        </div>

        <div class="row g-3 mt-1">
            <div class="col-lg-6">
                <div class="chart-card">
                    <h6 class="chart-title">District-wise Records (Top 10)</h6>
                    <div id="districtChart" class="chart-box"></div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="chart-card">
                    <h6 class="chart-title">Sale Availability</h6>
                    <div id="saleChart" class="chart-box"></div>
                </div>
            </div>
            <!-- <div class="col-12">
                <div class="chart-card">
                    <h6 class="chart-title">Daily Survey Trend</h6>
                    <div id="trendChart" class="chart-box"></div>
                </div>
            </div> -->

            <div class="col-12">
                <div class="chart-card">
                    <h6 class="chart-title">Overpricing Hotspots</h6>
                    <div id="overpriceChart" class="chart-box"></div>
                </div>
            </div>
            <div class="col-12">
                <div class="chart-card p-0 overflow-hidden">
                    <h6 class="chart-title p-3 pb-0">Storage Points Map</h6>
                    <div id="viewDiv"></div>
                </div>
            </div>
        </div>
    </main>

    <div id="dashboardLoader" class="loader-overlay d-none">
        <div class="spinner-border text-light" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>
    <script src="assets/vendor/bootstrap/js/bootstrap.bundle.js"></script>
    <script src="assets/vendor/highcharts/code/highcharts.js"> </script>
    <script src="https://js.arcgis.com/4.29/"></script>

    <script src="assets/js/dashboard_v2.js?v=<?= filemtime(__DIR__ . '/assets/js/dashboard_v2.js') ?>"></script>
</body>

</html>