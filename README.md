# El calor detrás de la nube

Material de reproducibilidad de la investigación periodística **"El calor detrás de la nube"**, publicada en [Amenaza Roboto](https://amenazaroboto.com/el-calor-detras-de-la-nube), que documenta la isla de calor generada por el datacenter de Antel en Pando (Canelones, Uruguay).

## Qué contiene este repositorio

```
.
├── GEE codes/     Scripts de Google Earth Engine para extraer datos satelitales
│   ├── gee_datos_sat.js            pixeles anuales por sitio y zona
│   ├── gee_lst_anual_periferia.js  referencia regional (periferia)
│   └── gee_reflst.js               promedios regionales por año y satélite
│
└── Analisis/      Datos procesados y modelo estadístico
    ├── datos_sat.csv               ~40.000 mediciones LST / NDVI / NDBI (2000-2025)
    ├── reflst.csv                  temperatura regional por año y satélite
    ├── modelo_anual_comentado.R    modelo principal (diferencias en diferencias)
    └── Modelación del efecto térmico ... .pdf   informe metodológico
```

## Datos

- **Satélites:** Landsat 7 (2000–2025) y Landsat 8 (2013–2025).
- **Sitios:** datacenter de Antel (Pando), galpón del Correo y depósito textil (referencia).
- **Zonas:** edificio, 0–150 m y 150–300 m.
- **Variables:** LST (temperatura de superficie), NDVI (vegetación), NDBI (construcción).

El índice de isla de calor (IHI) se calcula como LST local menos el promedio regional, descontando cambio climático, estacionalidad y calibración del sensor.


## Principales hallazgos

Modelo de diferencias en diferencias sobre 32.861 observaciones:

- **+2,1 °C** de aumento térmico del datacenter respecto al entorno.
- **~0,2 °C** corresponde a tendencia regional de fondo.
- **83 %** del salto se explica por cambio de cobertura del suelo.
- **17 % (0,32 °C)** es atribuible a la operación de los servidores (p < 2×10⁻¹⁶).
- Antes de 2017 los tres terrenos eran estadísticamente equivalentes.
- Meseta térmica detectable hasta ~150 m del predio.

## Licencia y uso

Publicado como material de reproducibilidad. Si usás estos datos o código, citá la investigación original en Amenaza Roboto.
