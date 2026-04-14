// ===============================================================
// LST anual — referencia periferia (6 poligonos vegetacion)
// Genera 1 valor medio por anio/satelite
// Comparable con lst_anual_5km_L7_L8.csv pero usando periferia
// ===============================================================

// ===============================
// 1. GEOMETRIA: 6 poligonos de periferia
// ===============================
var periferia_poly = ee.Geometry.MultiPolygon([
  [[[-55.957983344414494,-34.711453189789005],
    [-55.95774731002118,-34.71191179875026],
    [-55.95312318167951,-34.71124152325691],
    [-55.953487962105534,-34.71063297895984],
    [-55.957983344414494,-34.711453189789005]]],

  [[[-55.97861489615705,-34.71281180684383],
    [-55.97805699668195,-34.71409941209185],
    [-55.97539624533918,-34.71461092094176],
    [-55.977177232125065,-34.7125825051763],
    [-55.97861489615705,-34.71281180684383]]],

  [[[-55.98352870307233,-34.720623641265185],
    [-55.98103961310651,-34.72415094585768],
    [-55.97747763953473,-34.721999307956835],
    [-55.97623309455182,-34.72002398451853],
    [-55.97747763953473,-34.71924795168476],
    [-55.98352870307233,-34.720623641265185]]],

  [[[-55.96744126487886,-34.72950890493726],
    [-55.96470541168367,-34.73084033698925],
    [-55.96110052276765,-34.73026720661585],
    [-55.96321410347139,-34.72786883332641],
    [-55.96744126487886,-34.72950890493726]]],

  [[[-55.97449307919544,-34.704504172476355],
    [-55.973892264376104,-34.70686794385494],
    [-55.97000842572254,-34.70625054739956],
    [-55.97075944424671,-34.70372799401062],
    [-55.97449307919544,-34.704504172476355]]],

  [[[-55.96313146059663,-34.702622827139145],
    [-55.96212295000703,-34.70422811872945],
    [-55.958196196009226,-34.70232293404855],
    [-55.959977182795114,-34.701387966259674],
    [-55.96313146059663,-34.702622827139145]]]
]);

var roi = periferia_poly;

Map.centerObject(roi, 14);
Map.addLayer(roi, {color: 'green'}, 'Periferia (6 poligonos)');

// ===============================
// 2. MODULO LST
// ===============================
var LandsatLST = require('users/sofiaermida/landsat_smw_lst:modules/Landsat_LST.js');

// ===============================
// 3. FUNCION ANUAL
// ===============================
function getAnnualLST(satellite, startYear, endYear) {

  var years = ee.List.sequence(startYear, endYear);

  var annual = ee.FeatureCollection(
    years.map(function(y) {
      y = ee.Number(y);

      var start = ee.Date.fromYMD(y, 1, 1);
      var end = ee.Date.fromYMD(y, 12, 31);

      var col = LandsatLST.collection(satellite, start, end, roi, true);
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
        lst: mean,
        satellite: satellite
      });
    })
  );

  return annual;
}

// ===============================
// 4. CALCULAR
// ===============================
var lst_L7 = getAnnualLST('L7', 2000, 2024);
var lst_L8 = getAnnualLST('L8', 2013, 2025);

var lst_all = lst_L7.merge(lst_L8);

// ===============================
// 5. FILTRAR NULOS Y EXPORTAR
// ===============================
var lst_valid = lst_all.filter(ee.Filter.notNull(['lst']));

print('LST anual periferia - total features:', lst_valid.size());
print('Datos:', lst_valid);

Export.table.toDrive({
  collection: lst_valid,
  description: 'lst_anual_periferia',
  folder: 'GEE_exports',
  fileNamePrefix: 'lst_anual_periferia_L7_L8',
  fileFormat: 'CSV',
  selectors: ['lst', 'satellite', 'year']
});
