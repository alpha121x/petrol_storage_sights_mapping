const state = {
  districtId: "",
  startDate: "",
  endDate: "",
};

let surveyTable = null;
const imageProxyBase = new URL(
  "services/image_proxy.php?url=",
  window.location.href
).toString();

function toImageProxyUrl(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) return "";

  // DB values may be protocol-relative (//host/path) and fail on HTTPS.
  const normalized = value.startsWith("//") ? `http:${value}` : value;
  return `${imageProxyBase}${encodeURIComponent(normalized)}`;
}

/* ---------- LOADER ---------- */

function showLoader() {
  document.getElementById("dashboardLoader")?.classList.remove("d-none");
}

function hideLoader() {
  document.getElementById("dashboardLoader")?.classList.add("d-none");
}

/* ---------- BACK TO TOP ---------- */

const backToTopBtn = document.getElementById("backToTopBtn");

function toggleBackToTopButton() {
  if (!backToTopBtn) return;

  if (window.scrollY > 300) {
    backToTopBtn.classList.add("show");
    return;
  }

  backToTopBtn.classList.remove("show");
}

window.addEventListener("scroll", toggleBackToTopButton);

backToTopBtn?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

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
    withFilters("services/get_storage_dashboard_data.php")
  );

  return res.json();
}

/* ---------- KPI CARDS ---------- */

function setKpis(summary) {
  document.getElementById("kpiTotal").textContent = summary.total_surveys || 0;
  document.getElementById("kpiAvailable").textContent =
    summary.sale_available_count || 0;
  document.getElementById("kpiQueue").textContent =
    summary.queue_count || 0;
  document.getElementById("kpiOverpriced").textContent =
    summary.overpriced_count || 0;
  document.getElementById("kpiDistricts").textContent =
    summary.total_districts || 0;
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
    chart: { type: "column" },
    title: { text: null },

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
  const total = rows.reduce((sum, r) => sum + Number(r.total || 0), 0);
  const percentageRows = rows.map((r) => ({
    name: r.label,
    y: total > 0 ? Number(((Number(r.total || 0) / total) * 100).toFixed(2)) : 0,
  }));

  Highcharts.chart("saleChart", {
    chart: { type: "pie" },
    title: { text: null },
    tooltip: {
      pointFormat: "<b>{point.y:.2f}%</b>",
    },

    series: [
      {
        name: "Percentage",
        colorByPoint: true,
        data: percentageRows,
      },
    ],
    plotOptions: {
      pie: {
        dataLabels: {
          enabled: true,
          format: "{point.name}: {point.y:.2f}%",
        },
      },
    },

    credits: { enabled: false },
  });
}

/* ---------- OVERPRICE CHART ---------- */

function renderOverpriceChart(rows) {
  Highcharts.chart("overpriceChart", {
    chart: { type: "column" },
    title: { text: null },

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
    withFilters("services/get_storage_records_table.php")
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
    createdRow: function (row, data) {
      const overpricedValue = String(data.overpriced || "").trim().toLowerCase();

      if (overpricedValue === "yes") {
        row.classList.add("table-danger");
      }
    },

    columns: [
      {
        data: null,
        render: function (data, type, row, meta) {
          return meta.row + meta.settings._iDisplayStart + 1;
        },
      },
      { data: "district" },
      { data: "storage_name" },
      { data: "fuel_type" },
      {
        data: null,
        render: function (data, type, row) {
          const fuelType = String(row.fuel_type || "").toLowerCase();
          const petrolPrice = row.petrol_price ?? "";
          const dieselPrice = row.diesel_price ?? "";

          if (fuelType.includes("petrol") && !fuelType.includes("diesel")) {
            return petrolPrice;
          }

          if (fuelType.includes("diesel") && !fuelType.includes("petrol")) {
            return dieselPrice;
          }

          if (fuelType.includes("petrol") && fuelType.includes("diesel")) {
            return `Petrol: ${petrolPrice} | Diesel: ${dieselPrice}`;
          }

          return petrolPrice || dieselPrice || "";
        },
      },
      { data: "sale_availability" },
      { data: "queue" },
      { data: "overpriced" },
      { data: "survey_time" },
      {
        data: "storgae_pic",
        render: (data) => {
          const src = toImageProxyUrl(data);
          return src
            ? `<img src="${src}" width="60" class="img-preview" style="cursor:pointer">`
            : "";
        },
      },

      {
        data: "queue_pic",
        render: (data) => {
          const src = toImageProxyUrl(data);
          return src
            ? `<img src="${src}" width="60" class="img-preview" style="cursor:pointer">`
            : "";
        },
      },
      {
        data: "remarks",
        render: (data) => data ?? "",
      },
    ],
  });
}

/* ---------- DASHBOARD REFRESH ---------- */

async function refreshDashboard() {
  showLoader();

  try {

    const data = await loadDashboardData();

    setKpis(data.summary || {});

    renderDistrictChart(data.district_breakdown || []);
    renderSaleChart(data.sale_breakdown || []);
    renderOverpriceChart(data.overprice_districts || []);

    await loadPoints();
    await loadSurveyTable();

  } finally {

    hideLoader();

  }
}

/* ---------- DOWNLOAD EXCEL ---------- */

async function downloadExcel() {

  showLoader();

  try {

    const url = new URL(
      "services/download_storage_raw_excel.php",
      window.location.href
    );

    if (state.districtId)
      url.searchParams.set("district_id", state.districtId);

    if (state.startDate)
      url.searchParams.set("start_date", state.startDate);

    if (state.endDate)
      url.searchParams.set("end_date", state.endDate);

    window.location.href = url.toString();

  } finally {

    setTimeout(hideLoader, 500);

  }

}

/* ---------- FILTER EVENTS ---------- */

document.getElementById("applyBtn").addEventListener("click", async () => {

  showLoader();

  state.districtId = document.getElementById("districtFilter").value;
  state.startDate = document.getElementById("startDateFilter").value;
  state.endDate = document.getElementById("endDateFilter").value;

  await refreshDashboard();

  if (window.zoomToDistrict)
    window.zoomToDistrict(state.districtId);

});

document.getElementById("resetBtn").addEventListener("click", async () => {

  showLoader();

  state.districtId = "";
  state.startDate = "";
  state.endDate = "";

  document.getElementById("districtFilter").value = "";
  document.getElementById("startDateFilter").value = "";
  document.getElementById("endDateFilter").value = "";

  await refreshDashboard();

  if (window.zoomToDistrict)
    window.zoomToDistrict("");

});

/* ---------- IMAGE PREVIEW MODAL ---------- */

$(document).on("click", ".img-preview", function () {

  const src = $(this).attr("src");

  $("#modalImage").attr("src", src);

  const modal = new bootstrap.Modal(
    document.getElementById("imageModal")
  );

  modal.show();

});

/* ---------- DOWNLOAD EXCEL BUTTON ---------- */

document.getElementById("downloadExcelBtn")
  .addEventListener("click", async () => {

    state.districtId = document.getElementById("districtFilter").value;
    state.startDate = document.getElementById("startDateFilter").value;
    state.endDate = document.getElementById("endDateFilter").value;

    await downloadExcel();

});

/* ---------- INITIAL LOAD ---------- */

async function initDashboard() {

  showLoader();

  try {

    await loadDistricts();
    await refreshDashboard();

  } finally {

    hideLoader();

  }

}

initDashboard();
