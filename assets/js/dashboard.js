const state = {
  districtId: "",
  startDate: "",
  endDate: "",
};

let surveyTable = null;
let districtLookup = new Map();
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

/* ---------- LEFT NAV PANELS ---------- */

function showReferencePanel(panelId) {
  document.querySelectorAll(".reference-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === panelId);
  });

  document.querySelectorAll(".reference-tab[data-panel-target]").forEach((button) => {
    button.classList.toggle(
      "active",
      button.getAttribute("data-panel-target") === panelId
    );
  });

  if (panelId === "overpricingPanel") {
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 50);
  }
}

function initReferencePanels() {
  document.querySelectorAll(".reference-tab[data-panel-target]").forEach((button) => {
    button.addEventListener("click", () => {
      showReferencePanel(button.getAttribute("data-panel-target"));
    });
  });
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

/* ---------- DISTRICT LOOKUP ---------- */

function setDistrictLookup(rows) {
  districtLookup = new Map(
    (rows || []).map((row) => [
      String(row.district || "").trim().toLowerCase(),
      String(row.district_id || "").trim(),
    ])
  );
}

function getDistrictIdByName(name) {
  return districtLookup.get(String(name || "").trim().toLowerCase()) || "";
}

async function zoomChartDistrict(districtName) {
  const districtId = getDistrictIdByName(districtName);

  if (!districtId || !window.zoomToDistrict) return;

  state.districtId = districtId;

  const districtFilter = document.getElementById("districtFilter");
  if (districtFilter) districtFilter.value = districtId;

  await window.zoomToDistrict(districtId);
}

/* ---------- DISTRICT CHART ---------- */

function renderDistrictChart(rows) {
  const sortedRows = [...rows].sort((a, b) => Number(b.total) - Number(a.total));

  Highcharts.chart("districtChart", {
    chart: {
      type: "bar",
      backgroundColor: "transparent",
      spacingTop: 10,
      spacingLeft: 10,
      spacingRight: 18,
      spacingBottom: 10,
    },
    title: { text: null },

    xAxis: {
      categories: sortedRows.map((r) => r.district),
      lineColor: "#d9e2ec",
      tickColor: "#d9e2ec",
      labels: {
        style: {
          color: "#35506e",
          fontSize: "11px",
          fontWeight: "600",
        },
      },
    },

    yAxis: {
      title: { text: "Surveys" },
      gridLineColor: "#e8eef5",
      labels: {
        style: {
          color: "#5f7186",
        },
      },
    },

    series: [
      {
        name: "Surveys",
        data: sortedRows.map((r) => ({
          y: Number(r.total),
          color: "#2c73bf",
        })),
        borderRadius: 6,
        pointPadding: 0.12,
        groupPadding: 0.08,
        dataLabels: {
          enabled: true,
          inside: false,
          style: {
            color: "#123357",
            textOutline: "none",
            fontWeight: "600",
          },
        },
      },
    ],

    legend: { enabled: false },
    tooltip: {
      pointFormat: "<b>{point.y}</b> surveys",
    },
    credits: { enabled: false },
  });
}

/* ---------- SALE PIE CHART ---------- */

function renderSaleChart(rows) {
  const total = rows.reduce((sum, r) => sum + Number(r.total || 0), 0);
  const saleColors = {
    "No Sale": "#dc3545",
    "Limited Sale": "#fd7e14",
    "Sale Available": "#198754",
  };
  const percentageRows = rows.map((r) => ({
    name: r.label,
    y: total > 0 ? Number(((Number(r.total || 0) / total) * 100).toFixed(2)) : 0,
    color: saleColors[r.label] || "#6c757d",
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

function getSeverityColor(value, max) {
  if (!max || value <= 0) return "#d9dee5";

  const ratio = value / max;

  if (ratio >= 0.85) return "#ef2b2d";
  if (ratio >= 0.65) return "#ff9800";
  if (ratio >= 0.45) return "#ffe433";
  return "#5eb91e";
}

function renderOverpriceChart(rows) {
  const sortedRows = [...rows].sort((a, b) => Number(b.total) - Number(a.total));
  const maxValue = Math.max(...sortedRows.map((r) => Number(r.total || 0)), 0);
  const totalValue = sortedRows.reduce((sum, r) => sum + Number(r.total || 0), 0);
  const axisMax = maxValue > 0 ? Math.ceil(maxValue * 1.12) : 1;
  const chartHeight = Math.max(380, sortedRows.length * 12 + 84);
  const chartContainer = document.getElementById("overpriceChart");

  if (chartContainer) {
    chartContainer.style.height = `${chartHeight}px`;
  }

  Highcharts.chart("overpriceChart", {
    chart: {
      type: "bar",
      backgroundColor: "transparent",
      height: chartHeight,
      spacingTop: 0,
      spacingLeft: 0,
      spacingRight: 12,
      spacingBottom: 4,
    },
    title: { text: null },

    xAxis: {
      categories: sortedRows.map((r) => r.district),
      lineWidth: 0,
      tickWidth: 0,
      offset: 0,
      labels: {
        step: 1,
        reserveSpace: true,
        autoRotation: [0],
        x: -2,
        style: {
          color: "#1e3550",
          fontSize: "9px",
          fontWeight: "700",
        },
      },
    },

    yAxis: {
      title: { text: null },
      min: 0,
      max: axisMax,
      tickPositions: [0, Math.round(axisMax / 2), axisMax],
      gridLineColor: "#e8eef5",
      gridLineWidth: 1,
      lineColor: "#3c434a",
      lineWidth: 1,
      endOnTick: true,
      labels: {
        style: {
          color: "#475866",
          fontSize: "10px",
        },
      },
    },

    series: [
      {
        name: "Overpriced",
        data: sortedRows.map((r) => {
          const total = Number(r.total || 0);
          const percentage = totalValue > 0 ? (total / totalValue) * 100 : 0;

          return {
            y: total,
            color: getSeverityColor(total, maxValue),
            custom: {
              percentage,
              district: r.district,
            },
          };
        }),
        borderRadius: 0,
        pointWidth: 7,
        dataLabels: {
          enabled: true,
          allowOverlap: true,
          crop: false,
          overflow: "allow",
          inside: false,
          align: "left",
          x: 4,
          style: {
            color: "#20354b",
            textOutline: "none",
            fontWeight: "600",
            fontSize: "8px",
          },
          formatter() {
            return `${Highcharts.numberFormat(this.point.custom.percentage, 2)}%`;
          },
        },
      },
    ],

    legend: { enabled: false },
    tooltip: {
      pointFormatter() {
        return `<b>${this.y}</b> overpriced reports<br><b>${Highcharts.numberFormat(this.custom.percentage, 2)}%</b> of all overpricing reports`;
      },
    },
    plotOptions: {
      series: {
        animation: {
          duration: 500,
        },
        cursor: "pointer",
        point: {
          events: {
            click: function () {
              zoomChartDistrict(this.custom?.district);
            },
          },
        },
      },
      bar: {
        groupPadding: 0.01,
        pointPadding: 0.005,
      },
    },
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

    setDistrictLookup(data.districts || []);
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

    initReferencePanels();
    await loadDistricts();
    await refreshDashboard();

  } finally {

    hideLoader();

  }

}

initDashboard();











