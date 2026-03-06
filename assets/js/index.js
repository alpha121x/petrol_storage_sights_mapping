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
  const MAP_SERVICE_URL =
    "https://map3.urbanunit.gov.pk:6443/arcgis/rest/services/Punjab/PB_Petrol_Pump_Availability_Survey_8433_06032026/MapServer";

  let selectedDistrict = "";
  let startDate = "";
  let endDate = "";
  const imageProxyUrl = new URL(
    "services/image_proxy.php?url=",
    window.location.href,
  ).toString();

  function showLoader() {
    document.getElementById("mapLoader")?.classList.remove("d-none");
  }

  function hideLoader() {
    document.getElementById("mapLoader")?.classList.add("d-none");
  }

  function escapeHtml(value) {
    const text = String(value ?? "");
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function buildPopupHtml(attributes) {
    const entries = Object.entries(attributes || {});
    if (!entries.length) {
      return "<div>No data available.</div>";
    }

    const rows = entries
      .map(
        ([key, value]) => `
          <tr>
            <th style="text-align:left; padding:4px 8px; border:1px solid #ddd; background:#f7f7f7;">${escapeHtml(key)}</th>
            <td style="padding:4px 8px; border:1px solid #ddd;">${escapeHtml(value)}</td>
          </tr>
        `,
      )
      .join("");

    return `<table style="border-collapse:collapse; width:100%;">${rows}</table>`;
  }

  function getImageUrlFromAttributes(attributes) {
    const imageFieldCandidates = [
      "petrol_pic",
      "cash_memo_pic",
      "image",
      "photo",
      "pic",
    ];

    const urls = [];
    imageFieldCandidates.forEach((field) => {
      const value = attributes?.[field];
      if (value && String(value).trim() !== "") {
        urls.push({
          field,
          url: `${imageProxyUrl}${encodeURIComponent(String(value))}`,
        });
      }
    });

    return urls;
  }

  function buildAvailabilityPopupContent(attributes) {
    const detailsTable = buildPopupHtml(attributes);
    const images = getImageUrlFromAttributes(attributes);

    if (!images.length) {
      return detailsTable;
    }

    const imagesHtml = images
      .map(
        (item) => `
          <div style="margin-top:8px;">
            <div style="font-weight:600; margin-bottom:4px;">${escapeHtml(item.field)}</div>
            <img src="${item.url}" alt="${escapeHtml(item.field)}" style="max-width:100%; border:1px solid #ddd; border-radius:4px;" />
          </div>
        `,
      )
      .join("");

    return `${detailsTable}<div style="margin-top:8px;">${imagesHtml}</div>`;
  }

  function buildPumpPopupContent(attributes) {
    const orderedFields = [
      "pump_sr_no",
      "district",
      "petrol_pump_name",
      "pump_name",
      "brand_name",
      "other_brand_name",
      "owner_name",
      "owner_cnic",
      "owner_mobile",
      "no_of_dispenser",
      "capacity",
      "survey_date_time",
      "district_id",
      "lat",
      "lng",
      "db_date_time",
      // "petrol_pic",
      // "cash_memo_pic",
    ];

    const filteredAttributes = {};
    orderedFields.forEach((field) => {
      filteredAttributes[field] = attributes?.[field] ?? "";
    });

    const detailsTable = buildPopupHtml(filteredAttributes);
    const images = getImageUrlFromAttributes(attributes);

    if (!images.length) {
      return detailsTable;
    }

    const imagesHtml = images
      .map(
        (item) => `
          <div style="margin-top:8px;">
            <div style="font-weight:600; margin-bottom:4px;">${escapeHtml(item.field)}</div>
            <img src="${item.url}" alt="${escapeHtml(item.field)}" style="max-width:100%; border:1px solid #ddd; border-radius:4px;" />
          </div>
        `,
      )
      .join("");

    return `${detailsTable}<div style="margin-top:8px;">${imagesHtml}</div>`;
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

  const petrolPumpsLayer = new FeatureLayer({
    url: `${MAP_SERVICE_URL}/1`,
    title: "Petrol Pumps",
    outFields: ["*"],
    popupEnabled: true,
    legendEnabled: true,
    popupTemplate: {
      title: "{pump_name}",
      content: (feature) => buildPumpPopupContent(feature.graphic?.attributes),
    },
  });

  const availabilityLayer = new FeatureLayer({
    url: `${MAP_SERVICE_URL}/0`,
    title: "Petrol Availability Status",
    outFields: ["*"],
    popupEnabled: true,
    legendEnabled: true,
    visible: false,
    popupTemplate: {
      title: "{district}",
      content: (feature) =>
        buildAvailabilityPopupContent(feature.graphic?.attributes),
    },
  });

  const boundariesLayer = new MapImageLayer({
    url: MAP_SERVICE_URL,
    title: "Boundaries",
    sublayers: [
      { id: 2, title: "Districts", visible: true },
      { id: 3, title: "Tehsils", visible: true },
    ],
  });

  const map = new Map({
    basemap: "gray-vector",
    layers: [
      availabilityLayer,
      petrolPumpsLayer,
      boundariesLayer,
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

    availabilityLayer.definitionExpression = filters.length ? filters.join(" AND ") : null;

    setTimeout(hideLoader, 500);
  }

  async function downloadExcel() {
    const dateCondition = getDateCondition();
    if (dateCondition === null) {
      return;
    }

    showLoader();
    try {
      const url = new URL(
        "services/download_storage_raw_excel.php",
        window.location.href,
      );
      if (selectedDistrict) {
        url.searchParams.set("district_id", selectedDistrict);
        if (startDate) {
          url.searchParams.set("start_date", startDate);
        }
        if (endDate) {
          url.searchParams.set("end_date", endDate);
        }
      }
      window.location.href = url.toString();
    } finally {
      setTimeout(hideLoader, 500);
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
