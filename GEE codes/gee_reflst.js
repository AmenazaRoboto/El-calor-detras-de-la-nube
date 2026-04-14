// ===============================================================
// Contexto: este script forma parte del material de reproducibilidad
// de la investigación periodística "El calor detrás de la nube",
// publicada en Amenaza Roboto (www.amenazaroboto.com), que documenta
// la isla de calor generada por el datacenter de Antel en Pando
// (Canelones, Uruguay).
// ===============================================================
//
// ===============================================================
// REFLST - Referencia LST anual en buffer 5km alrededor del DC
// Exporta directamente con el esquema de reflst.csv:
//   columnas: year, sat, ref2
// ===============================================================

// ===============================
// 1. GEOMETRIA: buffer 5km desde centroide del DC
// ===============================
var dc_poly = ee.Geometry.Polygon([[
  [-55.94823,-34.72449],[-55.94811,-34.72461],[-55.94798,-34.72471],
  [-55.94780,-34.72483],[-55.94776,-34.72488],[-55.94771,-34.72494],
  [-55.94756,-34.72510],[-55.94754,-34.72515],
  [-55.94780,-34.72524],[-55.94773,-34.72537],
  [-55.94747,-34.72527],[-55.94743,-34.72532],
  [-55.94760,-34.72538],[-55.94747,-34.72558],
  [-55.94731,-34.72552],[-55.94726,-34.72562],
  [-55.94741,-34.72568],[-55.94729,-34.72589],
  [-55.94713,-34.72583],[-55.94711,-34.72585],
  [-55.94697,-34.72579],[-55.94680,-34.72571],
  [-55.94661,-34.72563],[-55.94643,-34.72555],
  [-55.94637,-34.72546],[-55.94634,-34.72540],
  [-55.94641,-34.72528],[-55.94649,-34.72516],
  [-55.94660,-34.72502],[-55.94672,-34.72490],
  [-55.94689,-34.72475],[-55.94707,-34.72462],
  [-55.94727,-34.72451],[-55.94748,-34.72443],
  [-55.94770,-34.72438],[-55.94793,-34.72437],
  [-55.94813,-34.72440],[-55.94823,-34.72449]
]]);

var dc_center = dc_poly.centroid(1);
var roi = dc_center.buffer(5000);

Map.centerObject(roi, 13);
Map.addLayer(roi, {color: 'blue'}, 'Buffer 5km');
Map.addLayer(dc_poly, {color: 'red'}, 'DC');

// ===============================
// 2. MODULO LST
// ===============================
var LandsatLST = require('users/sofiaermida/landsat_smw_lst:modules/Landsat_LST.js');

// ===============================
// 3. FUNCION ANUAL
//    Devuelve features con columnas: year, sat, ref2
// ===============================
function getAnnualRefLST(satellite, startYear, endYear) {

  var years = ee.List.sequence(startYear, endYear);

  var annual = ee.FeatureCollection(
    years.map(function(y) {
      y = ee.Number(y);

      var start = ee.Date.fromYMD(y, 1, 1);
      var end   = ee.Date.fromYMD(y, 12, 31);

      var col   = LandsatLST.collection(satellite, start, end, roi, true);
      var count = col.size();

      var mean = ee.Algorithms.If(
        count.gt(0),
        col.select('LST').mean().reduceRegion({
          reducer: ee.Reducer.mean(),
          geometry: roi,
          scale: 30,
          maxPixels: 1e9
        }).get('LST'),
        null
      );

      return ee.Feature(null, {
        year: y,
        sat:  satellite,
        ref2: mean
      });
    })
  );

  return annual;
}

// ===============================
// 4. CALCULAR
// ===============================
var ref_L7 = getAnnualRefLST('L7', 2000, 2024);
var ref_L8 = getAnnualRefLST('L8', 2013, 2025);

var ref_all = ref_L7.merge(ref_L8);

// ===============================
// 5. FILTRAR NULOS Y EXPORTAR
//    Exporta directamente como reflst.csv:
//    columnas year, sat, ref2 (en ese orden)
// ===============================
var ref_valid = ref_all.filter(ee.Filter.notNull(['ref2']));

print('reflst - total features:', ref_valid.size());
print('Datos:', ref_valid);

Export.table.toDrive({
  collection: ref_valid,
  description: 'reflst',
  folder: 'GEE_exports',
  fileNamePrefix: 'reflst',
  fileFormat: 'CSV',
  selectors: ['year', 'sat', 'ref2']
});
