require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/GraphicsLayer",
  "esri/layers/MapImageLayer",
  "esri/widgets/Legend",
  "esri/widgets/LayerList",
  "esri/Graphic",
  "esri/geometry/Extent",
], function (Map, MapView, GraphicsLayer, MapImageLayer, Legend, LayerList, Graphic, Extent) {

  /* ---------------- FIX HIGHCHARTS ---------------- */

  if (window.Highcharts) {
    Highcharts.setOptions({
      exporting: { enabled: false },
    });
  }

  const HighchartsRef = window.Highcharts || null;

  const state = {
    districtId: "",
    startDate: "",
    endDate: "",
  };

  /* ---------------- ARCGIS BOUNDARY SERVICE ---------------- */

  const boundaryLayer = new MapImageLayer({
    url: "https://map3.urbanunit.gov.pk:6443/arcgis/rest/services/Punjab/PB_Petrol_Pump_Availability_Survey_8433_06032026/MapServer",
    sublayers: [
      { id: 2, title: "Districts", visible: true },
      { id: 3, title: "Tehsils", visible: false },
    ],
  });

  const fuelLayer = new GraphicsLayer({
    title: "Fuel Availability",
    visible: true
  });

  const priceLayer = new GraphicsLayer({
    title: "Overpriced Status",
    visible: false
  });

  /* ---------------- MAP ---------------- */

  const map = new Map({
    basemap: "gray-vector",
    layers: [boundaryLayer, fuelLayer, priceLayer],
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [69.3451, 30.3753],
    zoom: 5,
  });

  /* ---------------- LEGEND ---------------- */

 /* ---------------- LEGEND ---------------- */

const legend = new Legend({
  view: view,
  layerInfos: [
    {
      layer: fuelLayer,
      title: "Fuel Availability"
    },
    {
      layer: priceLayer,
      title: "Overpriced Status"
    }
  ]
});

view.ui.add(legend, "bottom-left");


  /* ---------------- LAYER TOGGLE CONTROL ---------------- */

  const layerList = new LayerList({
    view: view,
    listItemCreatedFunction: function(event){

  const item = event.item;

  if(item.layer === boundaryLayer){
    item.visible = true;
    item.panel = null;
  }

  if(item.layer === fuelLayer || item.layer === priceLayer){

    item.watch("visible", function(val){

      if(item.layer === fuelLayer && val){
        priceLayer.visible = false;
      }

      if(item.layer === priceLayer && val){
        fuelLayer.visible = false;
      }

    });

  }

}
  });

  view.ui.add(layerList, "top-right");

  /* ---------------- DISTRICT ZOOM ---------------- */

  async function zoomToDistrict(districtId) {

    if (!districtId) {

      await view.when();

      view.goTo({
        center: [72.7097, 31.1704],
        zoom: 6,
      });

      return;
    }

    try {

      const res = await fetch(
        `services/get_district_extent.php?district_id=${districtId}`
      );

      const ext = await res.json();

      await view.when();

      view.goTo(
        new Extent({
          xmin: Number(ext.xmin),
          ymin: Number(ext.ymin),
          xmax: Number(ext.xmax),
          ymax: Number(ext.ymax),
          spatialReference: { wkid: 4326 },
        }).expand(1.2)
      );

    } catch (e) {
      console.error("Extent load failed", e);
    }
  }

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

    if (state.startDate)
      full.searchParams.set("start_date", state.startDate);

    if (state.endDate)
      full.searchParams.set("end_date", state.endDate);

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
        categories: rows.map(x => x.district || "Unknown"),
        crosshair: true
      },
      yAxis: { min: 0, title: { text: "Surveys" } },
      legend: { enabled: false },
      credits: { enabled: false },
      series: [{
        name: "Surveys",
        color: "#2c73bf",
        data: rows.map(x => num(x.total))
      }]
    });

  }

  function renderSaleChart(rows) {

    if (!HighchartsRef) return;

    HighchartsRef.chart("saleChart", {
      chart: { type: "pie", backgroundColor: "transparent" },
      title: { text: null },
      credits: { enabled: false },
      series: [{
        name: "Count",
        colorByPoint: true,
        data: rows.map(x => ({
          name: x.label || "Unknown",
          y: num(x.total)
        }))
      }]
    });

  }

  function renderOverpriceChart(rows){

    if (!HighchartsRef) return;

    HighchartsRef.chart("overpriceChart",{

      chart:{ type:"column" },
      title:{ text:null },

      xAxis:{
        categories: rows.map(x=>x.district)
      },

      yAxis:{
        title:{ text:"Overpriced Reports"}
      },

      series:[{
        name:"Overpriced",
        data: rows.map(x=>Number(x.total)),
        color:"#dc3545"
      }],

      credits:{enabled:false}

    });

  }

  /* ---------------- POPUP CONTENT ---------------- */

  function popupHtml(attrs) {

    const fields = [
      "raw_id","district","storage_name","address",
      "sale_availability","queue","overpriced","remarks",
      "survey_time","username","user_id","district_id","lat","lng"
    ];

    const rows = fields.map(key =>
      `<tr>
      <th style="text-align:left;padding:4px 8px;border:1px solid #ddd;background:#f7f7f7;">${key}</th>
      <td style="padding:4px 8px;border:1px solid #ddd;">${attrs[key] ?? ""}</td>
      </tr>`
    ).join("");

    return `<table style="border-collapse:collapse;width:100%;">${rows}</table>`;
  }

  /* ---------------- LOAD STORAGE POINTS ---------------- */

  async function loadPoints() {

    const res = await fetch(
      withFilters("services/get_storage_final_points.php")
    );

    if (!res.ok)
      throw new Error("Map points request failed.");

    const data = await res.json();

    fuelLayer.removeAll();
    priceLayer.removeAll();

    (data.points || []).forEach(item => {

      const lat = Number(item.lat);
      const lng = Number(item.lng);

      if (!Number.isFinite(lat) || !Number.isFinite(lng))
        return;

      const attrs = item.attributes || {};

      let color = [231,76,60];

      const status = (attrs.sale_availability || "").toLowerCase();

      if(status.includes("limited"))
        color = [241,196,15];
      else if(status.includes("sale"))
        color = [46,204,113];

      const fuelGraphic = new Graphic({
        geometry:{
          type:"point",
          longitude:lng,
          latitude:lat
        },
        symbol:{
          type:"simple-marker",
          style:"circle",
          size:8,
          color:color,
          outline:{color:"white",width:1}
        },
        attributes:attrs,
        popupTemplate:{
          title:attrs.storage_name || "Storage Point",
          content:()=>popupHtml(attrs)
        }
      });

      fuelLayer.add(fuelGraphic);

      const overpriced = (attrs.overpriced || "").toLowerCase();

      const priceColor = overpriced.includes("yes")
        ? [231,76,60]
        : [46,204,113];

      const priceGraphic = new Graphic({
        geometry:{
          type:"point",
          longitude:lng,
          latitude:lat
        },
        symbol:{
          type:"simple-marker",
          style:"circle",
          size:8,
          color:priceColor,
          outline:{color:"white",width:1}
        },
        attributes:attrs,
        popupTemplate:{
          title:attrs.storage_name || "Storage Point",
          content:()=>popupHtml(attrs)
        }
      });

      priceLayer.add(priceGraphic);

    });

  }

  /* ---------------- DASHBOARD DATA ---------------- */

  async function loadDashboardData() {

    const res = await fetch(
      withFilters("services/get_storage_dashboard_data.php")
    );

    if (!res.ok)
      throw new Error("Dashboard API request failed.");

    return res.json();

  }

  /* ---------------- DOWNLOAD EXCEL ---------------- */

  async function downloadExcel(){

    showLoader();

    try{

      const url = new URL(
        "services/download_storage_raw_excel.php",
        window.location.href
      );

      if(state.districtId)
        url.searchParams.set("district_id", state.districtId);

      if(state.startDate)
        url.searchParams.set("start_date", state.startDate);

      if(state.endDate)
        url.searchParams.set("end_date", state.endDate);

      window.location.href = url.toString();

    } finally{

      setTimeout(hideLoader,500);

    }

  }

  async function refreshDashboard(){

    showLoader();

    try{

      const data = await loadDashboardData();

      setKpis(data.summary || {});

      await loadPoints();

      renderDistrictChart(data.district_breakdown || []);
      renderSaleChart(data.sale_breakdown || []);
      renderOverpriceChart(data.overprice_districts || []);

      const districtSelect = document.getElementById("districtFilter");

      if(!districtSelect.dataset.loaded){

        districtSelect.innerHTML =
          '<option value="">All Districts</option>';

        (data.districts || []).forEach(d => {

          const option = document.createElement("option");

          option.value = d.district_id;
          option.textContent = d.district;

          districtSelect.appendChild(option);

        });

        districtSelect.dataset.loaded = "1";
      }

    } finally{

      hideLoader();

    }

  }

  /* ---------------- FILTER EVENTS ---------------- */

  document.getElementById("applyBtn").addEventListener("click", async () => {

    state.districtId =
      document.getElementById("districtFilter").value;

    state.startDate =
      document.getElementById("startDateFilter").value;

    state.endDate =
      document.getElementById("endDateFilter").value;

    await refreshDashboard();

    zoomToDistrict(state.districtId);

  });

  document.getElementById("downloadExcelBtn")
  ?.addEventListener("click", async () => {

    state.districtId =
      document.getElementById("districtFilter").value;

    state.startDate =
      document.getElementById("startDateFilter").value;

    state.endDate =
      document.getElementById("endDateFilter").value;

    await downloadExcel();

  });

  document.getElementById("resetBtn").addEventListener("click", async () => {

    document.getElementById("districtFilter").value = "";
    document.getElementById("startDateFilter").value = "";
    document.getElementById("endDateFilter").value = "";

    state.districtId = "";
    state.startDate = "";
    state.endDate = "";

    await refreshDashboard();

    zoomToDistrict("");

  });

  /* ---------------- INITIAL LOAD ---------------- */

  refreshDashboard().catch((error) => {

    hideLoader();
    console.error(error);
    alert("Unable to load dashboard.");

  });

});