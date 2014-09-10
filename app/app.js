
function initMap() {
  var projection = ol.proj.get('EPSG:3857');
  var projectionExtent = projection.getExtent();
  var size = ol.extent.getWidth(projectionExtent) / 256;
  var resolutions = new Array(14);
  var matrixIds = new Array(14);
  for (var z = 0; z < 14; ++z) {
    resolutions[z] = size / Math.pow(2, z);
    matrixIds[z] = 'EPSG:900913:'+z;
  }

  map = new ol.Map({
    target: 'map',
    controls: ol.control.defaults().extend([
      new app.LayersControl({
        groups: {
          'default': {
            title: "Layers"
          }
        }
      })
    ]),
    layers: [
      new ol.layer.Tile({
        title: 'Base Map',
        opacity: 0.7,
        extent: projectionExtent,
        source: new ol.source.WMTS({
          url: '/geoserver/gwc/service/wmts',
          layer: 'oregon:osm',
          matrixSet: 'EPSG:900913',
          projection: projection,
          format: 'image/png',
          tileGrid: new ol.tilegrid.WMTS({
            origin: ol.extent.getTopLeft(projectionExtent),
            resolutions: resolutions,
            matrixIds: matrixIds
          }),
        }),
        group: 'background'
      }), 
      new ol.layer.Image({
        title: 'Protected Areas',
        visible: false,
        source: new ol.source.ImageWMS({
          url: '/geoserver/oregon/wms',
          params: {'LAYERS': 'padus', 'VERSION': '1.1.1'},
          serverType: 'geoserver'
        })
      })
    ],
    view: new ol.View({
      center: [-13656441.076885087, 5700031.1890548],
      zoom: 11
    })
  });

  overlay = new ol.FeatureOverlay({
    style: new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'rgba(128, 128, 128, 0.5)'
      }),
      stroke: new ol.style.Stroke({
        color: '#ffcc33',
        width: 2
      })
    })
  });
  overlay.getFeatures().on('add', function(e) {
    run(e.element.getGeometry());
  });
  overlay.setMap(map);

  map.addInteraction(new ol.interaction.Draw({
    features: overlay.getFeatures(),
    type: 'Polygon'
  }));
}

function renderChart(data) {
  var pieData = $.map(data, function(v,k) {
    var label = {
      '01': 'Federal',
      '02': 'Native',
      '03': 'State',
      '04': 'Special District',
      '05': 'Local Government',
      '06': 'NGO',
      '07': 'Private',
      '08': 'Joint Owned',
      '09': 'Unknown',
      '10': 'Territorial'
    }[k];
    return {label: label, value: v};
  });
  nv.addGraph(function() {
    var chart = nv.models.pieChart()
        .x(function(d) { return d.label; })
        .y(function(d) { return d.value; })
        .showLegend(false)
        .showLabels(true);

    d3.select("#chart")
        .datum(pieData)
        .transition().duration(350)
        .call(chart);

    return chart;
  });
}

function run(poly) {
  var wktFormat = new ol.format.WKT();
  var wkt = wktFormat.writeGeometry(poly);

  var xml = 
    '<Execute xmlns="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1">'+
      '<ows:Identifier>py:classify_areas</ows:Identifier>' + 
      '<DataInputs>' +
        '<Input>' +
          '<ows:Identifier>area</ows:Identifier>' +
          '<Data>' +
            '<ComplexData mimeType="application/wkt"><![CDATA['+wkt+']]></ComplexData>' +
          '</Data>' +
        '</Input>' +
      '</DataInputs>' +
      '<ResponseForm>' +
        '<RawDataOutput mimeType="application/json">' +
          '<ows:Identifier>result</ows:Identifier>' +
        '</RawDataOutput>' +
      '</ResponseForm>' +
    '</Execute>';

  $.ajax({
    url: '/geoserver/wps',
    method: 'POST',
    data: xml,
    contentType: 'application/xml',
    complete: function(xhr, status) {
      renderChart(xhr.responseJSON);
    }
  });

  var features = overlay.getFeatures();
  while (features.getLength() > 1) {
    features.removeAt(0);
  }
}

$(document).ready(function() {
  initMap();
});