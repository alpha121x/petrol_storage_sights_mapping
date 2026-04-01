<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Petrol Storage Dashboard</title>

    <link rel="icon" href="public/gop_favicon.png" type="image/x-icon">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://js.arcgis.com/4.29/esri/themes/light/main.css">
    <link rel="stylesheet" href="https://cdn.datatables.net/1.13.7/css/dataTables.bootstrap5.min.css">
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

        .header-nav .btn {
            border-color: rgba(255, 255, 255, 0.5);
            color: #fff;
            background: transparent;
        }

        .header-nav .btn:hover,
        .header-nav .btn:focus {
            color: #0f3a6d;
            background: #fff;
            border-color: #fff;
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
            height: 480px;
        }

        .chart-box.chart-box-tall {
            height: 480px;
        }

        .reference-board {
            padding: 0;
            overflow: hidden;
        }

        .reference-grid {
            display: grid;
            grid-template-columns: 130px minmax(0, 1fr);
        }

        .reference-tabs {
            background: linear-gradient(180deg, #2b6da8, #256196);
            padding: 12px 0;
        }

        .reference-tab {
            display: block;
            width: 100%;
            padding: 14px 16px;
            border: 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.16);
            background: transparent;
            color: #fff;
            text-align: left;
            font-weight: 600;
            line-height: 1.15;
        }

        .reference-tab.active {
            background: linear-gradient(90deg, #56be1f, #67cb2f);
            position: relative;
        }

        .reference-tab.active::after {
            content: "";
            position: absolute;
            top: 50%;
            right: -12px;
            transform: translateY(-50%);
            border-top: 12px solid transparent;
            border-bottom: 12px solid transparent;
            border-left: 12px solid #67cb2f;
        }

        .reference-main {
            background: #f5f5f6;
            padding: 14px;
        }

        .reference-panel {
            display: none;
        }

        .reference-panel.active {
            display: block;
        }

        .reference-stage {
            border: 1px solid #d8dde6;
            background: #fff;
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.7);
        }

        .reference-header {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            padding: 16px 18px 12px;
        }

        .reference-subtitle {
            margin: 6px 0 0;
            color: #566677;
            font-size: 0.9rem;
        }

        .reference-legend {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            align-items: center;
            padding: 12px 18px;
            margin: 0 18px 14px;
            border: 1px solid #ded9d9;
            background: #f4f1f1;
        }

        .reference-legend-item {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #3a434d;
            font-weight: 700;
        }

        .reference-dot {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            display: inline-block;
        }

        .reference-body {
            display: grid;
            grid-template-columns: minmax(0, 1.7fr) minmax(260px, 0.45fr);
            gap: 0;
            padding: 0 18px 18px;
            align-items: start;
            border: 1px solid #d8dde6;
            background: #fff;
            overflow: hidden;
        }

        .map-card,
        .ranking-card,
        .sale-card {
            background: #fff;
        }

        .map-card {
            padding: 10px;
            border-right: 1px solid #d8dde6;
        }

        .ranking-card {
            padding: 8px 6px 6px 0;
        }

        .sale-card {
            margin: 0 18px 18px;
            padding: 14px 18px;
        }

        .section-card {
            margin: 0 18px 18px;
            padding: 14px 18px;
            border: 1px solid #d8dde6;
            background: #fff;
        }

        .ranking-note {
            padding: 0 14px 8px 14px;
            color: #617283;
            font-size: 0.82rem;
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

        @media (max-width: 991px) {
            .reference-grid {
                grid-template-columns: 1fr;
            }

            .reference-body {
                grid-template-columns: 1fr;
            }

            .map-card {
                border-right: 0;
                border-bottom: 1px solid #d8dde6;
            }

            .reference-tabs {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                padding: 0;
            }

            .reference-tab.active::after {
                display: none;
            }
        }

        .img-preview {
            transition: transform .2s;
        }

        .img-preview:hover {
            transform: scale(1.2);
        }

        #backToTopBtn {
            position: fixed;
            right: 20px;
            bottom: 20px;
            z-index: 1040;
            display: none;
            border-radius: 20px;
            box-shadow: 0 6px 20px rgba(10, 25, 41, 0.2);
        }

        #backToTopBtn.show {
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
    </style>
</head>

<body>
    <header class="dash-header py-2 px-3 px-md-4">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
                <h4 class="mb-0" href="index.php">Petrol Storage Analytics Dashboard</h4>
            </div>
            <!-- <div class="d-flex flex-wrap gap-2 header-nav">
                <a href="#graphicalViewSection" class="btn btn-sm btn-outline-light">Graphicial View</a>
                <a href="#mapViewSection" class="btn btn-sm btn-outline-light">Map View</a>
                <a href="#surveyRecordsSection" class="btn btn-sm btn-outline-light">Survey Records</a>
                <a href="#surveyProgressSection" class="btn btn-sm btn-outline-light">Survey Progress</a>
            </div> -->
        </div>
    </header>

    <section class="container-fluid py-1 filter-panel border-bottom">
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
        <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-5 g-3 mb-1">
            <div class="col">
                <div class="kpi-card">
                    <div class="kpi-label">Total Pumps Surveyed</div>
                    <div class="kpi-value" id="kpiTotal">0</div>
                </div>
            </div>
            <div class="col">
                <div class="kpi-card">
                    <div class="kpi-label">Sale Available</div>
                    <div class="kpi-value" id="kpiAvailable">0</div>
                </div>
            </div>
            <div class="col">
                <div class="kpi-card">
                    <div class="kpi-label">Queue's Reported</div>
                    <div class="kpi-value" id="kpiQueue">0</div>
                </div>
            </div>
            <div class="col">
                <div class="kpi-card">
                    <div class="kpi-label">Overpricing Reported</div>
                    <div class="kpi-value" id="kpiOverpriced">0</div>
                </div>
            </div>
            <div class="col">
                <div class="kpi-card">
                    <div class="kpi-label">Districts Coverage</div>
                    <div class="kpi-value" id="kpiDistricts">0</div>
                </div>
            </div>
        </div>

        <div class="row g-3 mt-1" id="graphicalViewSection">
            <div class="col-12">
                <div class="chart-card reference-board" id="mapViewSection">
                    <div class="reference-grid">
                        <div class="reference-tabs">
                            <button type="button" class="reference-tab" data-panel-target="recordsPanel">Storage<br>Overview</button>
                            <button type="button" class="reference-tab active" data-panel-target="overpricingPanel">District Vs<br>Overpricing</button>
                            <button type="button" class="reference-tab" data-panel-target="progressPanel">Survey<br>Progress</button>
                            <button type="button" class="reference-tab" data-panel-target="salePanel">Sale<br>Distribution</button>
                        </div>
                        <div class="reference-main">
                            <div class="reference-stage">
                                <div class="reference-panel active" id="overpricingPanel">
                                    <div class="reference-header">
                                        <div>
                                            <h6 class="chart-title mb-0">District Wise Overpricing Distribution</h6>
                                        </div>
                                    </div>
                                    <div class="reference-body">
                                        <div class="map-card">
                                            <h6 class="chart-title mb-2">Punjab Storage Map</h6>
                                            <div id="viewDiv"></div>
                                        </div>
                                        <div class="ranking-card">
                                            <h6 class="chart-title ps-3 mb-2">District Ranking</h6>
                                            <div id="overpriceChart" class="chart-box chart-box-tall"></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="reference-panel" id="salePanel">
                                    <div class="section-card">
                                        <h6 class="chart-title">Sale Availability</h6>
                                        <div id="saleChart" class="chart-box"></div>
                                    </div>
                                </div>
                                <div class="reference-panel" id="progressPanel">
                                    <div class="section-card">
                                        <h6 class="chart-title">District-wise Survey Progress (Top 10)</h6>
                                        <div id="districtChart" class="chart-box"></div>
                                    </div>
                                </div>
                                <div class="reference-panel" id="recordsPanel">
                                    <div class="section-card">
                                        <h6 class="chart-title">Survey Records</h6>
                                        <div class="table-responsive">
                                            <table class="table table-sm table-bordered" id="surveyTable">
                                                <thead class="table-dark">
                                                    <tr>
                                                        <th>Sr.</th>
                                                        <th>District</th>
                                                        <th>Pump</th>
                                                        <th>Fuel Type</th>
                                                        <th>Price</th>
                                                        <th>Sale</th>
                                                        <th>Queue</th>
                                                        <th>Overpriced</th>
                                                        <th>Date Time</th>
                                                        <th>Storage Pic</th>
                                                        <th>Queue Pic</th>
                                                        <th>Remarks</th>
                                                    </tr>
                                                </thead>
                                                <tbody></tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <div id="dashboardLoader" class="loader-overlay d-none">
        <div class="spinner-border text-light" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>

    <div class="modal fade" id="imageModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-body text-center">
                    <img id="modalImage" src="" class="img-fluid rounded">
                </div>
            </div>
        </div>
    </div>

    <button id="backToTopBtn" class="btn btn-primary" type="button" aria-label="Back to top" title="Back to top">
         ↑
    </button>


    <script src="assets/vendor/bootstrap/js/bootstrap.bundle.js"></script>
    <script src="assets/vendor/highcharts/code/highcharts.js"></script>

    <!-- jQuery FIRST -->
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>

    <!-- DataTables -->
    <script src="https://cdn.datatables.net/1.13.7/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.7/js/dataTables.bootstrap5.min.js"></script>

    <!-- ArcGIS ALWAYS LAST -->
    <script src="https://js.arcgis.com/4.29/"></script>

    <script src="assets/js/map.js"></script>
    <script src="assets/js/dashboard.js"></script>
</body>

</html>
