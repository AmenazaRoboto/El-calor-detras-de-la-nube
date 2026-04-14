// =============================================================================
// EXPORT PIXELES ANUALES - datos_sat.csv
// Sitios: dc, cor, enc  |  Zonas: sitio, inner (0-150m), outer (150-300m)
// Satelites: L7 (2000-2025), L8 (2013-2025)
// Columnas finales: alan, lst, ndbi, ndvi, year, zone, sat, long, lat, site
// =============================================================================

var LandsatLST = require(
  'users/sofiaermida/landsat_smw_lst:modules/Landsat_LST.js'
);

// ─── POLIGONOS REALES ────────────────────────────────────────────────────────

var dc_poly = ee.Geometry.Polygon([[
  [-55.947901943774696,-34.724530257746615],
  [-55.9478670750575, -34.72459198395394],
  [-55.948033372016425,-34.72464930110519],
  [-55.947918037028785,-34.724860933319384],
  [-55.94775442227888,-34.72479479831064],
  [-55.94770077809858,-34.72489179630536],
  [-55.94785366401243,-34.72495352224273],
  [-55.94773296460676,-34.72516324533112],
  [-55.94756398543882,-34.72509931505731],
  [-55.9475425277667, -34.725145609398446],
  [-55.947802702041145,-34.725244811470745],
  [-55.947731228234176,-34.72536605828633],
  [-55.947468371750716,-34.725269060848085],
  [-55.94743350303352,-34.72531755958144],
  [-55.94759711778343,-34.72537708071529],
  [-55.947468371750716,-34.725579893145884],
  [-55.94730743920982,-34.725518167676206],
  [-55.94725647723854,-34.725621778259786],
  [-55.947408174207226,-34.725683503652114],
  [-55.94729015701057,-34.72589117652176],
  [-55.94712654226066,-34.72582945128451],
  [-55.94711313121559,-34.72585370049036],
  [-55.94669202440025,-34.72567954694501],
  [-55.946799312760845,-34.725500984068205],
  [-55.946509632941634,-34.725143861252526],
  [-55.946587417003066,-34.725095362417264],
  [-55.9466115568842, -34.72512622531573],
  [-55.94676686078694,-34.725013036065555],
  [-55.946925111118816,-34.72494690117851],
  [-55.9471745565572, -34.72488076623854],
  [-55.9474803283849, -34.72435886094156],
  [-55.947901943774696,-34.724530257746615]
]]);

var correo_poly = ee.Geometry.Polygon([[
  [-55.9463241725668, -34.72405693725236],
  [-55.9463429480299, -34.724070164376386],
  [-55.9461981087431, -34.72432147933098],
  [-55.94617699480841,-34.724314865789346],
  [-55.94614480830023,-34.7243765921575],
  [-55.946053613193726,-34.72433029738569],
  [-55.94592486716101,-34.72455515746298],
  [-55.945696879394745,-34.72446134965761],
  [-55.94566737509558,-34.72451425788225],
  [-55.94497536516974,-34.724234284809086],
  [-55.94499414063284,-34.7241769673701],
  [-55.94474737740347,-34.724066741414205],
  [-55.945045753225166,-34.72351787949217],
  [-55.94512621949561,-34.72355535658248],
  [-55.94515304158576,-34.72352449309758],
  [-55.94578000125273,-34.723786275721146],
  [-55.946276209920484,-34.72397145587134],
  [-55.94629498538359,-34.72392736539701],
  [-55.946380816072065,-34.72395381968443],
  [-55.9463241725668, -34.72405693725236]
]]);

// enc: solo galpon original
var enc_poly = ee.Geometry.Polygon([[
  [-55.97558411283581,-34.758080989764736],
  [-55.975026213360714,-34.75876851421227],
  [-55.97386213464825,-34.75811624756799],
  [-55.97442003412335,-34.757428717689045],
  [-55.97491892500012,-34.75771518916768],
  [-55.9747901789674, -34.75786062815337],
  [-55.974977933598446,-34.75796199456764],
  [-55.97511740846722,-34.75778570507152],
  [-55.97558411283581,-34.758080989764736]
]]);


// ─── BUFFERS: sitio, inner (0-150m), outer (150-300m) ────────────────────────

function crearBuffers(sitio_poly){
  var sitio      = sitio_poly.centroid();
  var inner      = sitio.buffer(150);
  var outer      = sitio.buffer(300);
  var innerClean = inner.difference(sitio_poly);
  var outerRing  = outer.difference(inner);
  return ee.FeatureCollection([
    ee.Feature(sitio_poly, {zone: 'sitio'}),
    ee.Feature(innerClean, {zone: 'inner'}),
    ee.Feature(outerRing,  {zone: 'outer'})
  ]);
}

// DC: excluir correo de outer
var dc_b = crearBuffers(dc_poly);
var dc_buffer = ee.FeatureCollection([
  ee.Feature(dc_b.filter(ee.Filter.eq('zone','sitio')).first().geometry(),
             {zone:'sitio'}),
  ee.Feature(dc_b.filter(ee.Filter.eq('zone','inner')).first().geometry(),
             {zone:'inner'}),
  ee.Feature(
    dc_b.filter(ee.Filter.eq('zone','outer')).first()
        .geometry().difference(correo_poly),
    {zone:'outer'}
  )
]);

// Correo: excluir DC de outer
var cor_b = crearBuffers(correo_poly);
var cor_buffer = ee.FeatureCollection([
  ee.Feature(cor_b.filter(ee.Filter.eq('zone','sitio')).first().geometry(),
             {zone:'sitio'}),
  ee.Feature(cor_b.filter(ee.Filter.eq('zone','inner')).first().geometry(),
             {zone:'inner'}),
  ee.Feature(
    cor_b.filter(ee.Filter.eq('zone','outer')).first()
         .geometry().difference(dc_poly),
    {zone:'outer'}
  )
]);

// Encatex: sin exclusion
var enc_buffer = crearBuffers(enc_poly);

var allSites = {
  dc:  {buffer: dc_buffer,  roi: dc_poly.centroid().buffer(5000)},
  cor: {buffer: cor_buffer, roi: dc_poly.centroid().buffer(5000)},
  enc: {buffer: enc_buffer, roi: enc_poly.centroid().buffer(5000)}
};
var siteKeys   = ['dc', 'cor', 'enc'];
var satellites = ['L7', 'L8'];


// ─── EXTRACCION POR SITIO / SATELITE / AÑO ──────────────────────────────────

var allSamples = ee.FeatureCollection([]);

siteKeys.forEach(function(siteKey) {
  var site = allSites[siteKey];

  satellites.forEach(function(satellite) {

    var yearStart = (satellite === 'L8') ? 2013 : 2000;
    var yearEnd   = 2025;
    var years     = ee.List.sequence(yearStart, yearEnd).getInfo();

    years.forEach(function(year) {

      var d_start = ee.Date.fromYMD(year, 1, 1);
      var d_end   = ee.Date.fromYMD(year, 12, 31);

      var l_sat = LandsatLST.collection(
        satellite, d_start, d_end, site.roi, true
      );

      var lst_col  = l_sat.select('LST');
      var ndvi_col = l_sat.select('NDVI');

      // NDBI a partir de reflectancia escalada
      var ndbi_col = l_sat.map(function(img){
        var NIR   = (satellite === 'L8') ? 'SR_B5' : 'SR_B4';
        var SWIR1 = (satellite === 'L8') ? 'SR_B6' : 'SR_B5';
        var scaled = img.select([NIR, SWIR1])
          .multiply(0.0000275)
          .add(-0.2);
        var ndbi = scaled.normalizedDifference([SWIR1, NIR])
          .rename('NDBI');
        return ndbi.copyProperties(img, ['system:time_start']);
      });

      // ALAN (luces nocturnas VIIRS)
      var alan_col = ee.ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG')
        .filterBounds(site.roi)
        .filterDate(d_start, d_end)
        .select('avg_rad');

      var meanLST  = lst_col.mean().rename('lst');
      var meanNDVI = ndvi_col.mean().rename('ndvi');
      var meanNDBI = ndbi_col.mean().rename('ndbi');
      var meanALAN = alan_col.mean().rename('alan');

      var combined = meanLST
        .addBands(meanNDVI)
        .addBands(meanALAN)
        .addBands(meanNDBI);

      var samples = combined.sampleRegions({
        collection: site.buffer,
        properties: ['zone'],
        scale: 30,
        geometries: true,
        tileScale: 4
      }).map(function(f){
        var coords = f.geometry().coordinates();
        return f.set({
          year: year,
          sat:  satellite,
          site: siteKey,
          long: ee.List(coords).get(0),
          lat:  ee.List(coords).get(1)
        });
      });

      allSamples = allSamples.merge(samples);
    });
  });
});


// ─── EXPORT: un unico CSV con el esquema de datos_sat.csv ───────────────────

print('datos_sat - total features:', allSamples.size());

Export.table.toDrive({
  collection:    allSamples,
  description:   'datos_sat',
  folder:        'GEE_exports',
  fileNamePrefix:'datos_sat',
  fileFormat:    'CSV',
  selectors: [
    'alan','lst','ndbi','ndvi','year','zone','sat','long','lat','site'
  ]
});


// ─── VISUALIZACION ──────────────────────────────────────────────────────────

Map.centerObject(dc_poly.centroid(), 14);
Map.addLayer(dc_buffer.filter(ee.Filter.eq('zone','outer')),
             {color: 'ff9900'}, 'DC outer (150-300m)');
Map.addLayer(dc_buffer.filter(ee.Filter.eq('zone','inner')),
             {color: 'ff6600'}, 'DC inner (0-150m)');
Map.addLayer(dc_poly,     {color: 'red'},    'DC sitio');
Map.addLayer(correo_poly, {color: 'cyan'},   'Correo');
Map.addLayer(enc_poly,    {color: 'purple'}, 'Encatex');
