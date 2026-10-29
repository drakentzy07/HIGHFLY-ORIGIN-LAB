# HIGHFLY C0 — resultados confirmados de la primera auditoría

**Referencia:** World of ClaudeCraft v0.44.7, commit completo 493c35a108cef6c8aa290e8793107b1cd117886e.

**GitHub Actions:** [RUN #40889097851 — GREEN](https://github.com/drakentzy07/HIGHFLY-ORIGIN-LAB/actions/runs/40889097851). Inventario descargable desde la sección Artifacts del RUN; los artifacts tienen retención de 14 días.

## Resultado automático del árbol Git (metadata, no descarga de assets)
| Estado preliminar | Archivos |
|---|---:|
| Todos los archivos inventariados | 22.792 |
| CODE_MIT_CANDIDATE (pendiente de revisión de dependencias) | 10.513 |
| REVIEW_MEDIA (cada asset debe verificarse) | 10.700 |
| EXCLUDE_OR_REPLACE (patrones expresos iniciales, lista NO exhaustiva) | 66 |
| REVIEW_OTHER (metadatos/otros a estudiar) | 1.510 |
| NOTICE | 3 |

Se registraron 181 filas de las tablas del CREDITS.md de upstream. Ninguna de ellas se convierte automáticamente en una aprobación de un archivo concreto.

## Qué fue trasladado realmente
Solo algunos archivos MIT de código y el texto MIT original en [vendor/claudecraft-v0447/](../vendor/claudecraft-v0447/). El archivo MANIFEST.json guarda el SHA-1 Git original de cada archivo y el validador comprueba identidad de bytes, no solamente nombres.

## Qué NO se hizo
- No se copió el mapa completo ni la IA entera.
- No se compiló ningún RPG ni se publicó una versión jugable.
- No se importó ningún GLB, audio, textura, imagen, HUD o CraftPix del original.
- No se modificó main, ni se tomó código de otros repositorios HIGHFLY.
- No se aprobó legalmente ningún medio de forma individual.

## Próxima fase C0-B (orden obligatorio)
1. Crear un grafo de dependencias del boot offline, editor y mundo original, incluyendo imports de TypeScript, rutas de assets estáticos y recursos generados.
2. Cruzar cada ruta pública realmente cargada con el inventario y las licencias exactas. Aplicar política de exclusión total para "With the project only", recursos reservados, audio no comercial y assets desconocidos.
3. Preparar reemplazos CC0 verificados sin alterar coordenadas, caminos, NPC, colisiones o lógica RPG.
4. Trasladar bloques completos de simulación + pruebas, conservando el origen separado del código HIGHFLY.
5. Solo construir el modo offline de producción y la publicación web cuando la compilación no contenga material no autorizado.
6. Probar primero una región y luego validar que el resto del mundo, monstruos, NPC, loot, editor y mazmorras siguen presentes.

**Regla:** todo lo no confirmado queda pendiente; ninguna auditoría superficial es sinónimo de licencia validada ni de juego terminado.
