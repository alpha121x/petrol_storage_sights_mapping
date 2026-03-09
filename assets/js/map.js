require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/GraphicsLayer",
  "esri/layers/MapImageLayer",
  "esri/widgets/LayerList",
  "esri/Graphic",
  "esri/geometry/Extent",
], function (
  Map,
  MapView,
  GraphicsLayer,
  MapImageLayer,
  LayerList,
  Graphic,
  Extent
) {

  /* ---------------- MAP LAYERS ---------------- */

  const boundaryLayer = new MapImageLayer({
    url: "https://map3.urbanunit.gov.pk:6443/arcgis/rest/services/Punjab/PB_Petrol_Pump_Availability_Survey_8433_06032026/MapServer",
    sublayers: [
      { id: 2, title: "Districts", visible: true },
      { id: 3, title: "Tehsils", visible: false },
    ],
  });

  const fuelLayer = new GraphicsLayer({ title: "Fuel Availability" });
  const priceLayer = new GraphicsLayer({ title: "Overpriced Status", visible:false });

  /* ---------------- MAP ---------------- */

  const map = new Map({
    basemap: "gray-vector",
    layers: [boundaryLayer, fuelLayer, priceLayer],
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [72.7, 31.17],
    zoom: 6,
  });

  /* ---------------- CUSTOM LEGEND ---------------- */

function createCustomLegend() {

  const legendHTML = `
  <div style="
    background:white;
    padding:10px;
    border-radius:6px;
    box-shadow:0 2px 8px rgba(0,0,0,0.2);
    font-family:Arial;
    font-size:12px;
    max-width:200px;
  ">

    <div style="font-weight:bold;margin-bottom:6px;border-bottom:1px solid #ddd;padding-bottom:4px;">
      Fuel Availability
    </div>

    <div style="display:flex;align-items:center;margin:4px 0;">
      <div style="width:12px;height:12px;border-radius:50%;background:#2ecc71;margin-right:6px;"></div>
      Fuel Available
    </div>

    <div style="display:flex;align-items:center;margin:4px 0;">
      <div style="width:12px;height:12px;border-radius:50%;background:#f1c40f;margin-right:6px;"></div>
      Limited Fuel
    </div>

    <div style="display:flex;align-items:center;margin:4px 0;">
      <div style="width:12px;height:12px;border-radius:50%;background:#e74c3c;margin-right:6px;"></div>
      No Fuel
    </div>

    <div style="font-weight:bold;margin-top:8px;border-bottom:1px solid #ddd;padding-bottom:4px;">
      Overpriced Status
    </div>

    <div style="display:flex;align-items:center;margin:4px 0;">
      <div style="width:12px;height:12px;border-radius:50%;background:#e74c3c;margin-right:6px;"></div>
      Overpriced
    </div>

    <div style="display:flex;align-items:center;margin:4px 0;">
      <div style="width:12px;height:12px;border-radius:50%;background:#2ecc71;margin-right:6px;"></div>
      Normal Price
    </div>

  </div>
  `;

  const legendDiv = document.createElement("div");
  legendDiv.innerHTML = legendHTML;

  view.ui.add(legendDiv, "bottom-left");

}

view.when(() => {
  createCustomLegend();
});

  /* ---------------- LAYER LIST ---------------- */

  const layerList = new LayerList({
    view: view,
    listItemCreatedFunction: function (event) {
      const item = event.item;

      if (item.layer === fuelLayer || item.layer === priceLayer) {

        item.watch("visible", function (val) {

          if (item.layer === fuelLayer && val) {
            priceLayer.visible = false;
          }

          if (item.layer === priceLayer && val) {
            fuelLayer.visible = false;
          }

        });
      }
    },
  });

  view.ui.add(layerList, "top-right");

  /* ---------------- POPUP HTML ---------------- */

  function popupHtml(attrs) {

    let storageImg = attrs.storgae_pic
      ? `<img src="${attrs.storgae_pic}" width="200">`
      : "";

    let queueImg = attrs.queue_pic
      ? `<img src="${attrs.queue_pic}" width="200">`
      : "";

    return `
      <b>${attrs.storage_name || ""}</b><br>
      District: ${attrs.district || ""}<br>
      Sale: ${attrs.sale_availability || ""}<br>
      Queue: ${attrs.queue || ""}<br>
      Overpriced: ${attrs.overpriced || ""}<br><br>
      ${storageImg}<br>${queueImg}
    `;
  }

  /* ---------------- LOAD MAP POINTS ---------------- */

  window.loadMapPoints = function(points) {

    fuelLayer.removeAll();
    priceLayer.removeAll();

    points.forEach((p) => {

      const attrs = p.attributes || {};
      const lat = Number(p.lat);
      const lng = Number(p.lng);

      if (!lat || !lng) return;

      let fuelColor = [231,76,60];

      if ((attrs.sale_availability || "").toLowerCase().includes("sale"))
        fuelColor = [46,204,113];

      if ((attrs.sale_availability || "").toLowerCase().includes("limited"))
        fuelColor = [241,196,15];

      const fuelGraphic = new Graphic({
        geometry:{ type:"point", latitude:lat, longitude:lng },
        symbol:{
          type:"simple-marker",
          size:8,
          color:fuelColor,
          outline:{color:"white",width:1}
        },
        attributes:attrs,
        popupTemplate:{
          title: attrs.storage_name || "Pump",
          content: popupHtml(attrs)
        }
      });

      fuelLayer.add(fuelGraphic);

      const priceGraphic = new Graphic({
        geometry:{ type:"point", latitude:lat, longitude:lng },
        symbol:{
          type:"simple-marker",
          size:8,
          color: (attrs.overpriced || "").toLowerCase()=="yes"
            ? [231,76,60]
            : [46,204,113],
          outline:{color:"white",width:1}
        },
        attributes:attrs,
        popupTemplate:{
          title: attrs.storage_name || "Pump",
          content: popupHtml(attrs)
        }
      });

      priceLayer.add(priceGraphic);

    });

  };

  /* ---------------- ZOOM DISTRICT ---------------- */

  window.zoomToDistrict = async function(districtId){

    if(!districtId){
      view.goTo({center:[72.7,31.17],zoom:6});
      return;
    }

    const res = await fetch(`services/get_district_extent.php?district_id=${districtId}`);
    const ext = await res.json();

    view.goTo(
      new Extent({
        xmin:Number(ext.xmin),
        ymin:Number(ext.ymin),
        xmax:Number(ext.xmax),
        ymax:Number(ext.ymax),
        spatialReference:{wkid:4326}
      }).expand(1.2)
    );

  };

});