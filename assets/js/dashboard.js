const state = {
  districtId: "",
  startDate: "",
  endDate: "",
};

let surveyTable = null;

function withFilters(url) {
  const full = new URL(url, window.location.href);

  if (state.districtId) full.searchParams.set("district_id", state.districtId);

  if (state.startDate) full.searchParams.set("start_date", state.startDate);

  if (state.endDate) full.searchParams.set("end_date", state.endDate);

  return full.toString();
}

/* ---------- LOAD MAP POINTS ---------- */

async function loadPoints() {
  const res = await fetch(withFilters("services/get_storage_final_points.php"));

  const data = await res.json();

  if (window.loadMapPoints) window.loadMapPoints(data.points || []);
}

/* ---------- LOAD TABLE ---------- */

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

    columns: [
      {
        data: null,
        title: "Sr #",
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
      { data: "username" },
      {
        data: "storgae_pic",
        render: function (data) {
          return data ? `<img src="${data}" width="60">` : "";
        },
      },
      {
        data: "queue_pic",
        render: function (data) {
          return data ? `<img src="${data}" width="60">` : "";
        },
      },
    ],

    initComplete: function () {
      $("#surveyTable").css("visibility", "visible");
    },
  });
}

/* ---------- DASHBOARD REFRESH ---------- */

async function refreshDashboard() {
  await loadPoints();
  await loadSurveyTable();
}

/* ---------- FILTER EVENTS ---------- */

document.getElementById("applyBtn").addEventListener("click", async () => {
  state.districtId = document.getElementById("districtFilter").value;

  state.startDate = document.getElementById("startDateFilter").value;

  state.endDate = document.getElementById("endDateFilter").value;

  await refreshDashboard();

  zoomToDistrict(state.districtId);
});

document.getElementById("resetBtn").addEventListener("click", async () => {
  state.districtId = "";
  state.startDate = "";
  state.endDate = "";

  await refreshDashboard();

  zoomToDistrict("");
});

refreshDashboard();
