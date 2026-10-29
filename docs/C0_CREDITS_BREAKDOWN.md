# HIGHFLY C0 — desglose verificado del registro CREDITS v0.44.7

Fuente: [CREDITS.md del tag oficial v0.44.7](https://github.com/levy-street/world-of-claudecraft/blob/v0.44.7/CREDITS.md). Análisis de **181 filas** del registro multimedia.

**ATENCIÓN:** cada fila describe una familia o lote; NO equivale a un archivo individual ni confirma que todos los ficheros de la familia estén efectivamente disponibles.

| Columna Redistribution (exacta) | Filas | Política de HIGHFLY |
|---|---:|---|
| Yes | 36 | Candidato; verificar procedencia y archivo |
| Yes, attribution required | 3 | Candidato; conservar avisos de crédito |
| Yes, under SIL OFL 1.1 | 1 | Fuente tipográfica; cumplir requisitos OFL |
| With the project only | 76 | **Excluir** por independencia HIGHFLY |
| **No, permission required** | 56 | **Excluir** |
| Non-commercial only, with attribution | 9 | **Excluir** por posible comercialización |

## Riesgos importantes que se deben resolver antes de una build pública

- Los 76 lotes "With the project only" pueden estar permitidos para ciertos forks de ClaudeCraft, pero **HIGHFLY los excluye de forma voluntaria**.
- Los 56 lotes "No, permission required" no son parte de nuestra licencia MIT, aunque puedan estar en una ruta pública del repositorio original.
- Los nueve lotes no comerciales tampoco entran en nuestra versión publicable.
- Hay recursos reservados en iconos de skills, objetos, profesiones, mapas, marcas visuales, texturas de ciudades, criaturas y VFX. **No basta con quitar CraftPix.**
- CREDITS declara expresamente que los medios no registrados NO se vuelven MIT por ausencia de entrada. Se bloquean hasta su revisión.
- El informe automático marca 66 rutas iniciales como EXCLUDE_OR_REPLACE; **NO es el total de material prohibido**, pues el registro describe colecciones que no se pueden reducir a rutas automáticas sin análisis adicional.

## Enfoque HIGHFLY

Conservar las funciones MIT de renderizado y simulación, ciudades y terreno generados mediante código cuando sean redistribuibles, IA, loot y NPC. Sustituir texturas, edificios, modelos, efectos y sonidos que no estén autorizados, manteniendo coordenadas, colisiones y comportamiento. KayKit/Quaternius/Kenney CC0 solo después de verificar el archivo exacto.

**Estado:** licencia estudiada a nivel de catálogo; aprobación por archivo y build de distribución siguen pendientes.
