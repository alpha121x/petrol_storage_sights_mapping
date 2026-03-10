const state = {
  districtId: "",
  startDate: "",
  endDate: "",
};

let surveyTable = null;

/* ---------- FILTER URL ---------- */

function withFilters(url) {
  const full = new URL(url, window.location.href);

  if (state.districtId) full.searchParams.set("district_id", state.districtId);
  if (state.startDate) full.searchParams.set("start_date", state.startDate);
  if (state.endDate) full.searchParams.set("end_date", state.endDate);

  return full.toString();
}

/* ---------- MAP POINTS ---------- */

async function loadPoints() {
  const res = await fetch(withFilters("services/get_storage_final_points.php"));
  const data = await res.json();

  if (window.loadMapPoints) window.loadMapPoints(data.points || []);
}

/* ---------- DASHBOARD DATA ---------- */

async function loadDashboardData() {
  const res = await fetch(
    withFilters("services/get_storage_dashboard_data.php"),
  );

  return res.json();
}

/* ---------- KPI CARDS ---------- */

function setKpis(summary) {
  document.getElementById("kpiTotal").textContent = summary.total_surveys || 0;
  document.getElementById("kpiAvailable").textContent =
    summary.sale_available_count || 0;
  document.getElementById("kpiQueue").textContent = summary.queue_count || 0;
  document.getElementById("kpiOverpriced").textContent =
    summary.overpriced_count || 0;
  document.getElementById("kpiDistricts").textContent =
    summary.total_districts || 0;

  document.getElementById("recordBadge").textContent =
    `Pumps Surveyed: ${summary.total_surveys || 0}`;
}

/* ---------- LOAD DISTRICTS ---------- */

async function loadDistricts() {
  const res = await fetch("services/get_districts.php");
  const data = await res.json();

  const districts = data.districts || [];

  const select = document.getElementById("districtFilter");

  select.innerHTML = '<option value="">All Districts</option>';

  districts.forEach((d) => {
    const option = document.createElement("option");

    option.value = d.district_id;
    option.textContent = d.district_name;

    select.appendChild(option);
  });
}

/* ---------- DISTRICT CHART ---------- */

function renderDistrictChart(rows) {
  Highcharts.chart("districtChart", {
    chart: {
      type: "column",
    },

    title: {
      text: null,
    },

    xAxis: {
      categories: rows.map((r) => r.district),
    },

    yAxis: {
      title: { text: "Surveys" },
    },

    series: [
      {
        name: "Surveys",
        data: rows.map((r) => Number(r.total)),
        color: "#2c73bf",
      },
    ],

    credits: { enabled: false },
  });
}

/* ---------- SALE PIE CHART ---------- */

function renderSaleChart(rows) {
  Highcharts.chart("saleChart", {
    chart: {
      type: "pie",
    },

    title: {
      text: null,
    },

    series: [
      {
        name: "Count",
        colorByPoint: true,
        data: rows.map((r) => ({
          name: r.label,
          y: Number(r.total),
        })),
      },
    ],

    credits: { enabled: false },
  });
}

/* ---------- OVERPRICE CHART ---------- */

function renderOverpriceChart(rows) {
  Highcharts.chart("overpriceChart", {
    chart: {
      type: "column",
    },

    title: {
      text: null,
    },

    xAxis: {
      categories: rows.map((r) => r.district),
    },

    yAxis: {
      title: { text: "Overpriced Reports" },
    },

    series: [
      {
        name: "Overpriced",
        data: rows.map((r) => Number(r.total)),
        color: "#dc3545",
      },
    ],

    credits: { enabled: false },
  });
}

/* ---------- TABLE ---------- */

async function loadSurveyTable() {
  const res = await fetch(
    withFilters("services/get_storage_records_table.php"),
  );
  const rows = await res.json();

  if (surveyTable) {
    surveyTable.clear().rows.add(rows).draw();
    return;
  }

  surveyTable = $("#surveyTable").DataTable({
    data: rows,
    pageLength: 10,
    deferRender: true,

    columns: [
      {
        data: null,
        render: function (data, type, row, meta) {
          return meta.row + meta.settings._iDisplayStart + 1;
        },
      },
      { data: "district" },
      { data: "storage_name" },
      { data: "sale_availability" },
      { data: "queue" },
      { data: "overpriced" },
      { data: "survey_time" },
      {
        data: "storgae_pic",
        render: (data) =>
          data
            ? `<img src="${data}" width="60" class="img-preview" style="cursor:pointer">`
            : "",
      },
      {
        data: "queue_pic",
        render: (data) =>
          data
            ? `<img src="${data}" width="60" class="img-preview" style="cursor:pointer">`
            : "",
      },
    ],
  });
}

$(document).on("click", ".img-preview", function () {
  const src = $(this).attr("src");

  $("#modalImage").attr("src", src);

  const modal = new bootstrap.Modal(document.getElementById("imageModal"));
  modal.show();
});

/* ---------- DASHBOARD REFRESH ---------- */

async function refreshDashboard() {
  const data = await loadDashboardData();

  setKpis(data.summary || {});

  renderDistrictChart(data.district_breakdown || []);
  renderSaleChart(data.sale_breakdown || []);
  renderOverpriceChart(data.overprice_districts || []);

  await loadPoints();
  await loadSurveyTable();
}

/* ---------- DOWNLOAD EXCEL ---------- */

async function downloadExcel() {
  const url = new URL(
    "services/download_storage_raw_excel.php",
    window.location.href,
  );

  if (state.districtId) url.searchParams.set("district_id", state.districtId);

  if (state.startDate) url.searchParams.set("start_date", state.startDate);

  if (state.endDate) url.searchParams.set("end_date", state.endDate);

  window.location.href = url.toString();
}

/* ---------- FILTER EVENTS ---------- */

document.getElementById("applyBtn").addEventListener("click", async () => {
  state.districtId = document.getElementById("districtFilter").value;
  state.startDate = document.getElementById("startDateFilter").value;
  state.endDate = document.getElementById("endDateFilter").value;

  await refreshDashboard();

  if (window.zoomToDistrict) window.zoomToDistrict(state.districtId);
});

document.getElementById("resetBtn").addEventListener("click", async () => {
  state.districtId = "";
  state.startDate = "";
  state.endDate = "";

  await refreshDashboard();

  if (window.zoomToDistrict) window.zoomToDistrict("");
});

/* ---------- DOWNLOAD EXCEL BUTTON ---------- */

document
  .getElementById("downloadExcelBtn")
  .addEventListener("click", async () => {
    state.districtId = document.getElementById("districtFilter").value;
    state.startDate = document.getElementById("startDateFilter").value;
    state.endDate = document.getElementById("endDateFilter").value;

    await downloadExcel();
  });

/* ---------- INITIAL LOAD ---------- */
loadDistricts();
refreshDashboard();
