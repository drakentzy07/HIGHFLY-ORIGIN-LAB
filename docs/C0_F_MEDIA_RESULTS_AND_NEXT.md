# HIGHFLY ORIGIN C0-F — licencias multimedia y prioridades para el primer mundo visible

Fuente invariable: World of ClaudeCraft v0.44.7, commit 493c35a108cef6c8aa290e8793107b1cd117886e.

## Ejecuciones comprobadas

- [C0-F, matriz completa del árbol público #40902387897](https://github.com/drakentzy07/HIGHFLY-ORIGIN-LAB/actions/runs/40902387897): GREEN.
- [C0-F, cruce con el manifiesto del renderizador #40903042796](https://github.com/drakentzy07/HIGHFLY-ORIGIN-LAB/actions/runs/40903042796): GREEN.
- [Pruebas de seguridad de publicación #40902700773](https://github.com/drakentzy07/HIGHFLY-ORIGIN-LAB/actions/runs/40902700773): GREEN.

Los artefactos de GitHub contienen media-matrix.csv, renderer-media-matrix.csv, credit-path-patterns.json y resúmenes. GitHub almacena estos artefactos temporalmente (retención de 14 días); los resultados clave de esta nota permanecen en el repositorio.

## Archivo público original, solo metadatos

- 6.443 archivos públicos, de los cuales 6.400 son multimedia según extensión.
- 3.865 archivos multimedia coincidieron con una ruta explícita del registro CREDITS.md.
- Estados preliminares: 2.535 BLOCKED_NO_EXPLICIT_CREDIT_MATCH, 2.825 EXCLUDE_PERMISSION_REQUIRED, 938 EXCLUDE_PROJECT_ONLY, 80 CC0_SOURCE_REVIEW y 22 FONT_LICENSE_REVIEW.
- Estos valores son conservadores: un wildcard de propiedad reservada puede coincidir con archivos cuyo origen finalmente sea libre. NUNCA suponen una determinación legal definitiva.

## Manifiesto de recursos del renderizador

El original usa src/render/assets/manifest.generated.ts, generado por scripts/build_media_manifest.mjs. Su manifiesto se cruzó con el árbol y las licencias sin traer recursos binarios al repositorio HIGHFLY.

| Categoría | Referencias |
|---|---:|
| Entornos / env | 79 |
| Modelos / models | 1.477 |
| Texturas / textures | 256 |
| Efectos / vfx | 26 |
| **Total** | **1.838** |

**Estado provisional de las 1.838 referencias**: 1.498 sin coincidencia suficientemente precisa, 149 con política With the project only, 111 marcadas por patrones de permiso requerido y 80 candidatas CC0. Esta clasificación no significa que los 1.498 recursos sean ilegales ni que los 260 restantes estén definitivamente prohibidos: se requiere cotejar el archivo real y el permiso, sin extrapolar licencias por marca.

El manifiesto del renderizador no incluye necesariamente UI, CSS, música, sonidos, fuentes y referencias dinámicas. Tampoco indica que todos los modelos se descarguen a la vez ni que todos sean necesarios para las zonas 1–20.

## Puntos técnicos precisos ya verificados

- src/sim/data.ts: registra ZONES, NPCS, MOBS, CAMPS, PROPS, QUESTS, ROADS y DUNGEONS. Son datos y código; no modelos 3D.
- src/sim/world.ts: terreno procedural. Sim y renderer comparten las funciones de altura; nunca separar el suelo visual del suelo de colisión.
- src/render/props.ts: render de construcciones, puestos, muelles y props. Usa diseños con piezas CC0 según sus comentarios, pero también integra reconstrucciones particulares de ciudades; verificar sus texturas y modelos de manera individual.
- src/render/eastbrook_town.ts, src/render/fenbridge_town.ts y atlas de texturas correspondientes: revisión prioritaria antes de exportar ciudades.
- src/render/characters/manifest.ts: correspondencia entre identidad del mob/NPC y GLB/animaciones. No mezclar datos de enemigo con derechos del modelo.
- src/render/characters/assets.ts: preparación, rig, clips y preloads. Mantener coherencia de skeleton/animaciones cuando reemplacemos un modelo.
- src/render/assets/preload.ts: carga diferida; no regresar a cargar todos los modelos en la pantalla de inicio.
- src/render/assets/loader.ts: carga GLTF, Meshopt y KTX2, con límites de concurrencia en equipos móviles.
- src/editor/3d/viewport.ts: usa el Sim y Renderer reales. Conservar ese puente; no construir editor paralelo.

## Prioridades de transformación C0-G

1. **Primer sector completo, no escenario vacío:** elegir entrada original y sus alrededores dentro del mundo continuo. Preservar calles, alturas, caminos, edificio, campamento y coordenadas; no introducir otros mundos ni demos externas.
2. **Visual de suelo / vegetación:** recuperar procedimientos MIT y verificar cada textura/material/GLB. Sustituir los restringidos por shader propio o recursos CC0 con procedencia documentada.
3. **Edificios / ciudades:** mantener el modelo lógico y los colliders. Sustituir cada render exclusivo de ClaudeCraft por construcción modular KayKit, Quaternius o Kenney verificada, sin forzar un modelo donde todavía no existe licencia clara.
4. **Monstruos / NPC:** conservar IA, spawn, stats, targeting, loot e interacción; reemplazar solo presentaciones visuales que no tengan licencia aprobada.
5. **Primer corte jugable:** mundo original con un NPC, un lobo, interacción, ataque y loot básico en un entorno de producción offline, sin depender del servidor original.
6. **Editor y ampliación:** verificar el editor real, persistencia y el resto de zonas. Fury 360° y Hunter Universal serán modificaciones posteriores, una vez que el motor base funcione.
7. **Publicación:** no desplegar en Pages hasta que el paquete final pase un gate de assets con hashes, procedencia y licencias. El repositorio puede seguir público mientras contenga exclusivamente material aprobado.

## Gate de publicación instalado

- scripts/c0_release_gate.mjs exige una aprobación explícita por archivo distribuido, con hash SHA-256, proveedor, evidencia y licencia aceptada.
- config/c0_approved_assets.json inicia con lista vacía, deliberadamente.
- tests/c0_release_gate.test.mjs verifica denegación de medios sin licencia, bytes cambiados, contenido embebido problemático y ausencia del aviso MIT.
- Actualmente el gate está **probado con fixtures**, pero NO se ha conectado todavía a un build de producto porque no existe tal build.

## Estado que no debemos confundir

**C0-F GREEN significa auditoría y protección verde, no juego listo.** Todavía no hay producto visual compilado, enlace de Pages ni aprobación de los 1.838 recursos. La primera construcción pública requerirá sustituciones verificadas; no copiar recursos With the project only ni de permiso exclusivo.

Todo el desarrollo sigue dentro de c0-audit-claudecraft-v0447. main permanece sin cambios.
