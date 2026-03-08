require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/GraphicsLayer",
  "esri/layers/FeatureLayer",
  "esri/Graphic",
], function (Map, MapView, GraphicsLayer, FeatureLayer, Graphic) {
  const HighchartsRef = window.Highcharts || null;

  const state = {
    districtId: "",
    startDate: "",
    endDate: "",
  };

  /* ---------------- ARCGIS SERVICE ---------------- */

  const districtsLayer = new FeatureLayer({
    url: "https://map3.urbanunit.gov.pk:6443/arcgis/rest/services/Punjab/PB_Petrol_Pump_Availability_Survey_8433_06032026/MapServer/2",
    title: "Punjab Districts",
    opacity: 1,
    renderer: {
      type: "simple",
      symbol: {
        type: "simple-fill",
        color: [255, 255, 255, 0], // transparent fill
        outline: {
          color: [0, 0, 0, 1], // strong visible boundary
          width: 1.5,
        },
      },
    },
  });

  const tehsilLayer = new FeatureLayer({
    url: "https://map3.urbanunit.gov.pk:6443/arcgis/rest/services/Punjab/PB_Petrol_Pump_Availability_Survey_8433_06032026/MapServer/3",
    title: "Punjab Tehsils",
    visible: false,
    renderer: {
      type: "simple",
      symbol: {
        type: "simple-fill",
        color: [255, 255, 255, 0],
        outline: {
          color: [150, 150, 150, 0.8],
          width: 0.7,
        },
      },
    },
  });

  const pointLayer = new GraphicsLayer({
    title: "Storage Points",
  });

  /* ---------------- MAP ---------------- */

  const map = new Map({
    basemap: "gray-vector",
    layers: [districtsLayer, tehsilLayer, pointLayer],
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [69.3451, 30.3753],
    zoom: 5,
  });

  /* ---------------- ZOOM TO PUNJAB ---------------- */

  districtsLayer.when(() => {
    districtsLayer.queryExtent().then(function (response) {
      if (response.extent) {
        view.goTo(response.extent.expand(1.15));
      }
    });
  });

  view.when(() => {
    districtsLayer.queryExtent().then((response) => {
      if (response.extent) {
        view.goTo(response.extent.expand(1.1));
      }
    });
  });

  /* Zoom map to Punjab automatically */

  view.when(() => {
    districtsLayer.queryExtent().then((response) => {
      if (response.extent) {
        view.goTo(response.extent);
      }
    });
  });

  /* ---------------- LOADER ---------------- */

  function showLoader() {
    document.getElementById("dashboardLoader")?.classList.remove("d-none");
  }

  function hideLoader() {
    document.getElementById("dashboardLoader")?.classList.add("d-none");
  }

  /* ---------------- FILTER HANDLER ---------------- */

  function withFilters(url) {
    const full = new URL(url, window.location.href);

    if (state.districtId)
      full.searchParams.set("district_id", state.districtId);

    if (state.startDate) full.searchParams.set("start_date", state.startDate);

    if (state.endDate) full.searchParams.set("end_date", state.endDate);

    return full.toString();
  }

  function num(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function setCard(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = Intl.NumberFormat().format(num(value));
  }

  /* ---------------- KPI CARDS ---------------- */

  function setKpis(summary) {
    setCard("kpiTotal", summary.total_surveys);
    setCard("kpiAvailable", summary.sale_available_count);
    setCard("kpiQueue", summary.queue_count);
    setCard("kpiOverpriced", summary.overpriced_count);
    setCard("kpiDistricts", summary.total_districts);
    setCard("kpiUsers", summary.active_users);

    document.getElementById("recordBadge").textContent =
      `Records: ${Intl.NumberFormat().format(num(summary.total_surveys))}`;
  }

  /* ---------------- CHARTS ---------------- */

  function renderDistrictChart(rows) {
    if (!HighchartsRef) return;

    HighchartsRef.chart("districtChart", {
      chart: { type: "column", backgroundColor: "transparent" },
      title: { text: null },
      xAxis: {
        categories: rows.map((x) => x.district || "Unknown"),
        crosshair: true,
      },
      yAxis: { min: 0, title: { text: "Surveys" } },
      legend: { enabled: false },
      credits: { enabled: false },
      series: [
        {
          name: "Surveys",
          color: "#2c73bf",
          data: rows.map((x) => num(x.total)),
        },
      ],
    });
  }

  function renderSaleChart(rows) {
    if (!HighchartsRef) return;

    HighchartsRef.chart("saleChart", {
      chart: { type: "pie", backgroundColor: "transparent" },
      title: { text: null },
      credits: { enabled: false },
      series: [
        {
          name: "Count",
          colorByPoint: true,
          data: rows.map((x) => ({
            name: x.label || "Unknown",
            y: num(x.total),
          })),
        },
      ],
    });
  }

  function renderTrendChart(rows) {
    if (!HighchartsRef) return;

    HighchartsRef.chart("trendChart", {
      chart: { type: "spline", backgroundColor: "transparent" },
      title: { text: null },
      credits: { enabled: false },
      xAxis: { categories: rows.map((x) => x.survey_date) },
      yAxis: { title: { text: "Surveys" }, min: 0 },
      series: [
        {
          name: "Daily surveys",
          color: "#0f8b6d",
          data: rows.map((x) => num(x.total)),
        },
      ],
    });
  }

  /* ---------------- POPUP CONTENT ---------------- */

  function popupHtml(attrs) {
    const fields = [
      "raw_id",
      "district",
      "storage_name",
      "address",
      "sale_availability",
      "queue",
      "overpriced",
      "remarks",
      "survey_time",
      "username",
      "user_id",
      "district_id",
      "lat",
      "lng",
    ];

    const rows = fields
      .map(
        (key) =>
          `<tr>
      <th style="text-align:left;padding:4px 8px;border:1px solid #ddd;background:#f7f7f7;">${key}</th>
      <td style="padding:4px 8px;border:1px solid #ddd;">${attrs[key] ?? ""}</td>
      </tr>`,
      )
      .join("");

    return `<table style="border-collapse:collapse;width:100%;">${rows}</table>`;
  }

  /* ---------------- LOAD STORAGE POINTS ---------------- */

  async function loadPoints() {
    const res = await fetch(
      withFilters("services/get_storage_final_points.php"),
    );

    if (!res.ok) throw new Error("Map points request failed.");

    const data = await res.json();

    const graphics = (data.points || [])
      .map((item) => {
        const lat = Number(item.lat);
        const lng = Number(item.lng);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        const attrs = item.attributes || {};

        return new Graphic({
          geometry: {
            type: "point",
            longitude: lng,
            latitude: lat,
          },
          symbol: {
            type: "simple-marker",
            style: "circle",
            size: 8,
            color: [26, 136, 54, 0.9],
            outline: {
              color: [255, 255, 255, 0.9],
              width: 1.2,
            },
          },
          attributes: attrs,
          popupTemplate: {
            title: attrs.storage_name || attrs.district || "Storage Point",
            content: () => popupHtml(attrs),
          },
        });
      })
      .filter(Boolean);

    pointLayer.removeAll();

    if (graphics.length) {
      pointLayer.addMany(graphics);
    }
  }

  /* ---------------- DASHBOARD DATA ---------------- */

  async function loadDashboardData() {
    const res = await fetch(
      withFilters("services/get_storage_dashboard_data.php"),
    );

    if (!res.ok) throw new Error("Dashboard API request failed.");

    return res.json();
  }

  async function refreshDashboard() {
    showLoader();

    try {
      const data = await loadDashboardData();

      setKpis(data.summary || {});

      await loadPoints();

      renderDistrictChart(data.district_breakdown || []);
      renderSaleChart(data.sale_breakdown || []);
      renderTrendChart(data.daily_trend || []);

      const districtSelect = document.getElementById("districtFilter");

      if (!districtSelect.dataset.loaded) {
        districtSelect.innerHTML = '<option value="">All Districts</option>';

        (data.districts || []).forEach((d) => {
          const option = document.createElement("option");

          option.value = d.district_id;
          option.textContent = d.district;

          districtSelect.appendChild(option);
        });

        districtSelect.dataset.loaded = "1";
      }
    } finally {
      hideLoader();
    }
  }

  /* ---------------- FILTER EVENTS ---------------- */

  document.getElementById("applyBtn").addEventListener("click", async () => {
    state.districtId = document.getElementById("districtFilter").value;

    state.startDate = document.getElementById("startDateFilter").value;

    state.endDate = document.getElementById("endDateFilter").value;

    await refreshDashboard();
  });

  document.getElementById("resetBtn").addEventListener("click", async () => {
    document.getElementById("districtFilter").value = "";
    document.getElementById("startDateFilter").value = "";
    document.getElementById("endDateFilter").value = "";

    state.districtId = "";
    state.startDate = "";
    state.endDate = "";

    await refreshDashboard();
  });

  /* ---------------- INITIAL LOAD ---------------- */

  refreshDashboard().catch((error) => {
    hideLoader();
    console.error(error);
    alert("Unable to load dashboard.");
  });
});
