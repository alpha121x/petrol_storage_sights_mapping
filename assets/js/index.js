require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/MapImageLayer",
  "esri/layers/FeatureLayer",
  "esri/widgets/Legend",
  "esri/widgets/Expand",
  "esri/widgets/LayerList",
  "esri/widgets/Search",
  "esri/geometry/Extent",
], function (
  Map,
  MapView,
  MapImageLayer,
  FeatureLayer,
  Legend,
  Expand,
  LayerList,
  Search,
  Extent,
) {
  let selectedDistrict = "";
  let startDate = "";
  let endDate = "";

  function showLoader() {
    document.getElementById("mapLoader")?.classList.remove("d-none");
  }

  function hideLoader() {
    document.getElementById("mapLoader")?.classList.add("d-none");
  }

  function getNextDate(dateString) {
    const next = new Date(dateString);
    next.setDate(next.getDate() + 1);
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
  }

  function getDateCondition() {
    if (startDate && endDate && startDate > endDate) {
      alert("Start date cannot be after end date.");
      return null;
    }

    if (startDate && endDate) {
      const endPlusOne = getNextDate(endDate);
      return `survey_date_time >= DATE '${startDate}' AND survey_date_time < DATE '${endPlusOne}'`;
    }

    if (startDate) {
      return `survey_date_time >= DATE '${startDate}'`;
    }

    if (endDate) {
      const endPlusOne = getNextDate(endDate);
      return `survey_date_time < DATE '${endPlusOne}'`;
    }

    return "";
  }

  const violationsLayer = new FeatureLayer({
    url: "https://map3.urbanunit.gov.pk:6443/arcgis/rest/services/Punjab/PB_Price_Pop_Blocks_Price_Violations_8432_27022026/MapServer/1",
    title: "Violations Counts",
    outFields: ["*"],
    popupEnabled: true,
    labelsVisible: false,
    labelingInfo: [],
    popupTemplate: {
      title: "Block: {block_code}",
      content: [
        {
          type: "fields",
          fieldInfos: [
            { fieldName: "block_code", label: "Block Code" },
            { fieldName: "violation_count", label: "Violation Count" },
          ],
        },
      ],
    },
  });

  const populationBlockLayer = new FeatureLayer({
    url: "https://map3.urbanunit.gov.pk:6443/arcgis/rest/services/Punjab/PB_Price_Pop_Blocks_Price_Violations_8432_27022026/MapServer/4",
    title: "Population Blocks",
    outFields: ["*"],
    popupEnabled: true,
    labelsVisible: false,
    popupTemplate: {
      title: "Population Blocks",
      content: [
        {
          type: "fields",
          fieldInfos: [{ fieldName: "block_code", label: "Block Code" }],
        },
      ],
    },
  });

  const imageProxyUrl = new URL(
    "services/image_proxy.php?url=",
    window.location.href,
  ).toString();

  const shopsLayer = new FeatureLayer({
    url: "https://map3.urbanunit.gov.pk:6443/arcgis/rest/services/Punjab/PB_Price_Pop_Blocks_Price_Violations_8432_27022026/MapServer/0",
    title: "Shops Rate List Status",
    outFields: ["*"],
    popupEnabled: true,
    labelsVisible: false,
    popupTemplate: {
      title: "{shop_name}",
      content: [
        {
          type: "fields",
          fieldInfos: [
            { fieldName: "shop_name", label: "Shop Name" },
            { fieldName: "shop_owner_name", label: "Owner" },
            { fieldName: "district_name", label: "District" },
            { fieldName: "tehsil_name", label: "Tehsil" },
            { fieldName: "city_name", label: "City" },
            {
              fieldName: "commodity_violation_status",
              label: "Violation Status",
            },
            {
              fieldName: "rate_list_displayed",
              label: "Rate List Displayed",
            },
          ],
        },
        {
          type: "media",
          mediaInfos: [
            {
              title: "Shop Image",
              type: "image",
              value: {
                sourceURL: `${imageProxyUrl}{image}`,
              },
            },
          ],
        },
      ],
    },
  });

  const districtHighlightLayer = new FeatureLayer({
    url: "https://map3.urbanunit.gov.pk:6443/arcgis/rest/services/Punjab/PB_Price_Pop_Blocks_Price_Violations_8432_27022026/MapServer/2",
    title: "District Highlight",
    popupEnabled: false,
    definitionExpression: "1=0",
    renderer: {
      type: "simple",
      symbol: {
        type: "simple-fill",
        color: [180, 180, 180, 0.35],
        outline: { color: [80, 80, 80, 1], width: 2 },
      },
    },
  });

  const boundariesLayer = new MapImageLayer({
    url: "https://map3.urbanunit.gov.pk:6443/arcgis/rest/services/Punjab/PB_Price_Pop_Blocks_Price_Violations_8432_27022026/MapServer",
    title: "Boundaries",
    sublayers: [
      { id: 2, title: "Districts", visible: true },
      { id: 3, title: "Tehsils", visible: true },
    ],
  });

  const map = new Map({
    basemap: "gray-vector",
    layers: [
      violationsLayer,
      boundariesLayer,
      populationBlockLayer,
      shopsLayer,
      districtHighlightLayer,
    ],
  });

  const view = new MapView({
    container: "viewDiv",
    map,
    center: [72.7097, 31.1704],
    zoom: 6,
  });

  view.ui.add(
    new Expand({
      view,
      content: new Legend({ view }),
      expanded: true,
    }),
    "top-right",
  );

  view.ui.add(
    new Expand({
      view,
      content: new LayerList({ view }),
      expanded: false,
    }),
    "top-left",
  );

  view.ui.add(
    new Search({
      view,
    }),
    "top-left",
  );

  function applyFilters() {
    const dateCondition = getDateCondition();
    if (dateCondition === null) {
      return;
    }

    showLoader();

    const filters = [];

    if (selectedDistrict) {
      filters.push(`district_id = ${selectedDistrict}`);
    }

    if (dateCondition) {
      filters.push(dateCondition);
    }

    shopsLayer.definitionExpression = filters.length ? filters.join(" AND ") : null;

    setTimeout(hideLoader, 500);
  }

  function escapeHtml(value) {
    const text = String(value ?? "");
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatArcDate(value) {
    if (value === null || value === undefined || value === "") {
      return "";
    }

    const numeric = Number(value);
    if (!Number.isNaN(numeric) && numeric > 0) {
      const d = new Date(numeric);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }

    return String(value);
  }

  async function downloadExcel() {
    const dateCondition = getDateCondition();
    if (dateCondition === null) {
      return;
    }

    showLoader();

    try {
      const query = shopsLayer.createQuery();
      query.where = shopsLayer.definitionExpression || "1=1";
      query.outFields = [
        "shop_name",
        "shop_owner_name",
        "district_name",
        "tehsil_name",
        "city_name",
        "commodity_violation_status",
        "rate_list_displayed",
        "survey_date_time",
      ];
      query.returnGeometry = false;

      const result = await shopsLayer.queryFeatures(query);
      const features = result.features || [];

      if (!features.length) {
        alert("No records found for the selected filters.");
        return;
      }

      const rows = features
        .map((feature) => {
          const a = feature.attributes || {};
          return `
            <tr>
              <td>${escapeHtml(a.shop_name)}</td>
              <td>${escapeHtml(a.shop_owner_name)}</td>
              <td>${escapeHtml(a.district_name)}</td>
              <td>${escapeHtml(a.tehsil_name)}</td>
              <td>${escapeHtml(a.city_name)}</td>
              <td>${escapeHtml(a.commodity_violation_status)}</td>
              <td>${escapeHtml(a.rate_list_displayed)}</td>
              <td>${escapeHtml(formatArcDate(a.survey_date_time))}</td>
            </tr>
          `;
        })
        .join("");

      const html = `
        <html>
          <head><meta charset="UTF-8"></head>
          <body>
            <table border="1">
              <tr>
                <th>Shop Name</th>
                <th>Owner</th>
                <th>District</th>
                <th>Tehsil</th>
                <th>City</th>
                <th>Violation Status</th>
                <th>Rate List Displayed</th>
                <th>Survey Date Time</th>
              </tr>
              ${rows}
            </table>
          </body>
        </html>
      `;

      const blob = new Blob(["\ufeff", html], {
        type: "application/vnd.ms-excel;charset=utf-8;",
      });

      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeStart = startDate || "all";
      const safeEnd = endDate || "all";
      a.href = downloadUrl;
      a.download = `petrol_storage_sights_mappiog_${safeStart}_to_${safeEnd}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
      alert("Failed to download Excel data.");
    } finally {
      hideLoader();
    }
  }

  fetch("services/get_districts.php")
    .then((res) => res.json())
    .then((data) => {
      const select = document.getElementById("districtFilter");
      select.innerHTML = `<option value="">All Districts</option>`;

      data.districts.forEach((item) => {
        const op = document.createElement("option");
        op.value = item.district_id;
        op.textContent = item.district_name;
        op.dataset.name = item.district_name;
        select.appendChild(op);
      });

      document.getElementById("provinceName").textContent = "PUNJAB";
    });

  document.getElementById("districtFilter").addEventListener("change", function () {
    showLoader();
    selectedDistrict = this.value;

    const opt = this.options[this.selectedIndex];
    document.getElementById("provinceName").textContent = selectedDistrict
      ? opt.dataset.name
      : "PUNJAB";

    applyFilters();

    if (selectedDistrict) {
      districtHighlightLayer.definitionExpression = `district_id = ${selectedDistrict}`;

      fetch(`services/get_district_extent.php?district_id=${selectedDistrict}`)
        .then((res) => res.json())
        .then((ext) => {
          view
            .goTo(
              new Extent({
                xmin: +ext.xmin,
                ymin: +ext.ymin,
                xmax: +ext.xmax,
                ymax: +ext.ymax,
                spatialReference: { wkid: 4326 },
              }).expand(1.2),
            )
            .finally(hideLoader);
        })
        .catch(() => hideLoader());
    } else {
      districtHighlightLayer.definitionExpression = "1=0";
      view.goTo({ center: [72.7097, 31.1704], zoom: 8 }).finally(hideLoader);
    }
  });

  document.getElementById("applyDateBtn").addEventListener("click", () => {
    startDate = document.getElementById("startDateFilter").value;
    endDate = document.getElementById("endDateFilter").value;
    applyFilters();
  });

  document.getElementById("resetDateBtn").addEventListener("click", () => {
    document.getElementById("startDateFilter").value = "";
    document.getElementById("endDateFilter").value = "";
    startDate = "";
    endDate = "";
    applyFilters();
  });

  document.getElementById("downloadExcelBtn").addEventListener("click", async () => {
    startDate = document.getElementById("startDateFilter").value;
    endDate = document.getElementById("endDateFilter").value;
    applyFilters();
    await downloadExcel();
  });
});
