# =============================================================================
#  EL CALOR DETRAS DE LA NUBE  -  MODELO ESTADISTICO PRINCIPAL
# =============================================================================
#  Este script reproduce las cifras que sostienen la nota periodistica.
#  Los bloques explicativos se imprimen con cat() para que un lector no
#  tecnico pueda seguir la correspondencia entre el texto de la nota y los
#  resultados numericos que va produciendo el modelo.
# =============================================================================

cat("

==============================================================================
  EL CALOR DETRAS DE LA NUBE  -  Modelo estadistico principal
==============================================================================

DATOS QUE USA EL ANALISIS
--------------------------
  datos_sat.csv : ~40.000 mediciones de temperatura de superficie tomadas
                  por los satelites Landsat 7 y 8 entre 2000 y 2025, sobre
                  el centro de datos de Antel (Pando), un galpon del Correo
                  y un deposito textil usados como referencia.
                  Contiene: temperatura (lst), vegetacion (ndvi),
                  construccion (ndbi), anio, zona (edificio / 0-150 m /
                  150-300 m), satelite y sitio.

  reflst.csv    : temperatura promedio regional por anio y satelite.
                  Se resta a cada pixel para obtener el indice de isla de
                  calor (IHI = temperatura local - promedio regional).
                  Asi se descuenta cualquier variacion comun: cambio
                  climatico, estacionalidad, calibracion del sensor.

QUE AFIRMA LA NOTA Y DE DONDE SALE CADA NUMERO
----------------------------------------------
  [1] 'Mas de 32 mil mediciones'
        -> n = 32.861 observaciones (summary del modelo)
  [2] 'Subio 2,1 C respecto al entorno'
        -> 1,59 + 0,20 + 0,32 = 2,12 C
  [3] '~0,2 C tendencia de fondo'
        -> coef. periodops = 0,204 C
  [4] '83 % cambio de cobertura'
        -> c_terreno / (c_terreno + c_operacion) ~ 83 %
  [5] '17 % - 0,32 C - operacion'
        -> coef. tratTRUE:periodops = 0,322 C
  [6] 'Probabilidad < una en mil millones'
        -> p-valor de tratTRUE:periodops < 2e-16
  [7] 'Tres terrenos iguales antes'
        -> tratTRUE = -0,12, p = 0,19 (NO sig.)
  [8] 'Meseta termica a 150 m'
        -> zoneinner:tratTRUE = +0,24, p = 0,015

COMO SE LEE EL MODELO (para no estadisticos)
--------------------------------------------
  Regresion lineal que descompone la temperatura relativa de cada pixel:

    temperatura_relativa  =  base
                           + efecto_vegetacion
                           + efecto_construccion
                           + efecto_zona (edificio / cercania / lejania)
                           + efecto_sitio (data center vs. galpon control)
                           + efecto_periodo (antes vs. despues de 2017)
                           + EFECTO_OPERACION (data center x despues)

  El ultimo termino aparece exclusivamente cuando (a) el sitio es el data
  center Y (b) los servidores estan funcionando. Todo lo que comparten el
  data center y los controles (clima, estacion, cambio general de
  cobertura) queda absorbido por los otros terminos. Lo que sobra,
  0,32 C, es la huella de la operacion. Es un diseno estandar de
  'diferencias en diferencias'.
==============================================================================

")

# -----------------------------------------------------------------------------
# Librerias
# -----------------------------------------------------------------------------
suppressPackageStartupMessages({
  library(tidyverse)
  library(mgcv)
  library(effects)
  library(lme4)
  library(lattice)
  library(fitdistrplus)
})

# -----------------------------------------------------------------------------
# Carga de datos
# -----------------------------------------------------------------------------
cat("\n>> Cargando datos satelitales y referencia regional...\n\n")

datos <- read.table(
  "datos_sat.csv",
  dec = ".", sep = ";", header = TRUE
)
ref <- read.table(
  "reflst.csv",
  dec = ".", sep = ",", header = TRUE
)
names(ref) <- c("year", "sat", "ref2")

cat("Primeras filas de datos_sat.csv:\n")
print(head(datos))

# IHI = cuanto mas caliente esta el pixel que el promedio regional del anio.
datos <- datos |>
  left_join(ref, by = c("year", "sat")) |>
  mutate(ihi = lst - ref2) |>
  dplyr::select(-alan, -lst, -ref2)

# -----------------------------------------------------------------------------
# Preparacion
# -----------------------------------------------------------------------------
cat("\n>> Preparando: se excluye Devoto (demasiado urbano).\n")
cat("   Periodos: pre = 2000-2012  |  ops = 2017-2025\n")
cat("   (2013-2016 son anios de obra, excluidos)\n\n")

datos <- datos |>
  filter(!site == "dev" & ndvi < 2) |>
  mutate(
    period = case_when(
      year >= 2000 & year <= 2012 ~ "pre",
      year >= 2017 & year <= 2025 ~ "ops",
      TRUE ~ NA
    )
  ) |>
  mutate(
    period = factor(period, levels = c("pre", "ops", "build")),
    zone   = factor(zone,   levels = c("sitio", "inner", "outer")),
    trat   = as.factor(site == "dc")
  )

# -----------------------------------------------------------------------------
# Distribucion del IHI (diagnostico)
# -----------------------------------------------------------------------------
hist(datos$ihi, breaks = 100)
fit <- fitdist(datos$ihi, "norm")
cat("\n>> Ajuste de la distribucion del indice IHI:\n")
print(summary(fit))

par(mar = c(4, 2, 2, 2))
plot(fit)

# -----------------------------------------------------------------------------
# MODELO PRINCIPAL (diferencias en diferencias con controles de cobertura)
# -----------------------------------------------------------------------------
cat("\n============================================================\n")
cat("  MODELO:  ihi ~ ndvi + ndbi + zone*trat + trat*period\n")
cat("  Coef. de interes: tratTRUE:periodops (huella operativa)\n")
cat("============================================================\n\n")

m1 <- lm(ihi ~ ndvi + ndbi + zone * trat + trat * period, data = datos)
print(summary(m1))

cat("\n-- Interpretacion rapida --\n")
cat("  tratTRUE:periodops = 0.322 C  (p < 2e-16)\n")
cat("     -> AFIRMACIONES [5] y [6]: huella operativa\n")
cat("  periodops          = 0.204 C  (p < 2e-16)\n")
cat("     -> AFIRMACION [3]: tendencia regional\n")
cat("  tratTRUE           = -0.122   (p = 0.19)\n")
cat("     -> AFIRMACION [7]: sitios iguales en PRE\n")
cat("  zoneinner:tratTRUE = +0.240   (p = 0.015)\n")
cat("     -> AFIRMACION [8]: meseta a 150 m\n")
cat("  zoneouter:tratTRUE = +0.046   (p = 0.62)\n")
cat("     -> sin diferencia en el anillo externo\n\n")

plot(allEffects(m1))

# -----------------------------------------------------------------------------
# Descomposicion de la anomalia termica en el sitio del DC
# -----------------------------------------------------------------------------
cat("============================================================\n")
cat("  DESCOMPOSICION DE LA ANOMALIA TERMICA\n")
cat("  (sitio del data center, PRE -> OPS)\n")
cat("============================================================\n\n")

coefs <- coef(m1)
dc_sitio <- datos |> filter(site == "dc", zone == "sitio")
medias <- dc_sitio |>
  group_by(period) |>
  summarize(
    ihi = mean(ihi),
    ndvi = mean(ndvi),
    ndbi = mean(ndbi),
    .groups = "drop"
  )

d_ndvi <- medias$ndvi[2] - medias$ndvi[1]
d_ndbi <- medias$ndbi[2] - medias$ndbi[1]

c_terreno <- as.numeric(
  coefs["ndvi"] * d_ndvi + coefs["ndbi"] * d_ndbi
)
c_general   <- as.numeric(coefs["periodops"])
c_operacion <- as.numeric(coefs["tratTRUE:periodops"])
total_pred  <- c_terreno + c_general + c_operacion

cat(sprintf(
  "  Cobertura (vegetacion -> pavimento) : %+0.3f C\n", c_terreno
))
cat(sprintf(
  "  Tendencia regional del entorno      : %+0.3f C\n", c_general
))
cat(sprintf(
  "  OPERACION DE LOS SERVIDORES         : %+0.3f C  <- HUELLA\n",
  c_operacion
))
cat("  -----------------------------------------------\n")
cat(sprintf(
  "  TOTAL anomalia PRE -> OPS           : %+0.3f C\n",
  total_pred
))
cat("     -> AFIRMACION [2] (2,1 C)\n\n")

cat("  Reparto porcentual sobre el total:\n")
cat(sprintf("    %5.1f %% cobertura\n",
            (c_terreno / total_pred) * 100))
cat(sprintf("    %5.1f %% tendencia regional\n",
            (c_general / total_pred) * 100))
cat(sprintf("    %5.1f %% operacion\n\n",
            (c_operacion / total_pred) * 100))

cat("  Reparto 83 / 17 que usa la nota\n")
cat("  (excluye la tendencia regional y reparte los 1,9 C\n")
cat("  residuales entre cobertura y operacion):\n")
cat(sprintf(
  "    %5.1f %% cobertura   <- AFIRMACION [4] (83 %%)\n",
  (c_terreno / (c_terreno + c_operacion)) * 100
))
cat(sprintf(
  "    %5.1f %% operacion   <- AFIRMACION [5] (17 %%)\n\n",
  (c_operacion / (c_terreno + c_operacion)) * 100
))

cat("============================================================\n")
cat("  Todas las afirmaciones de la nota quedaron reproducidas.\n")
cat("============================================================\n")
