# HIGHFLY ORIGIN K6 — GLOSARIO DE APROVECHAMIENTO Y EXCLUSIONES

Fecha: 2026-10-29. Este documento organiza la recuperación de código y datos originales, **no es un certificado de integración total ni una aprobación automática de recursos**.

## Identidad y fuentes fijadas
- HIGHFLY: `drakentzy07/HIGHFLY-ORIGIN-LAB`, rama experimental `k6-full-world-editor-license-recovery`; K5 jugable se conserva en `c0-k5-walled-city-harbor-fixes` (commit `58ed87ff2153bbb80a9f6d5543fc7dce71eec70d`).
- Upstream: `levy-street/world-of-claudecraft`, **v0.44.7** (`493c35a108cef6c8aa290e8793107b1cd117886e`).
- Licencia de código: [MIT](https://github.com/levy-street/world-of-claudecraft/blob/v0.44.7/LICENSE), copyright (c) 2026 Levy Street. Mantener avisos en copias y distribuciones.
- Medios: [CREDITS.md](https://github.com/levy-street/world-of-claudecraft/blob/v0.44.7/CREDITS.md); avisos de terceros independientes.
- **REGISTRO PRINCIPAL COMPLETO**: [config/k6_upstream_media_glossary.json](../config/k6_upstream_media_glossary.json), uno por cada fila de familia de recurso (ID WOC-CREDITS-###, autor, fuente, licencia, condiciones, decisión, verificación de archivo y reemplazo).
- Política de independencia: conservar código MIT, priorizar media CC0 y, cuando sea adecuado, MIT. **EXCLUIR voluntariamente todos los medios "With the project only"**, incluso aunque pudieran acompañar un fork autorizado. No reutilizar CraftPix ni arte reservado ni música/sonidos NC en un producto comercial. La permisividad como fork no concede derechos para desprender los recursos.
- Excepción técnica a revisar: `Basis Universal` de Apache-2.0 ya se usa como dependencia en K5, conservando avisos. Si se exige **solo MIT/CC0 literal**, habrá que reemplazar el transcodificador y verificar compatibilidad; nunca reclasificar Apache como MIT.

## Recuento actualizado del registro original
Se releyó CREDITS.md fijado en el commit indicado; sus tablas registran **255 filas de familias de medios** (incluye la sección de modelos generados). El resumen previo `docs/C0_CREDITS_BREAKDOWN.md` de 181 filas está **incompleto frente a esta lectura**. Son familias, NO archivos individuales.

| Decisión | Familias | Acción |
|---|---:|---|
| CC0_CANDIDATE_VERIFY_FILE | 36 | Auditar archivo exacto, origen, hashes, dependencias y transcodificaciones |
| MIT_CANDIDATE_KEEP_NOTICE | 1 | Verificar material exacto, conservar aviso MIT |
| RUNTIME_EXCEPTION_REVIEW | 1 | Apache-2.0 runtime: revisar si permanece o sustituir |
| EXCLUDE_PROJECT_DEPENDENCY | 137 | No copiar media; preservar lógica MIT y generar/reponer medio HIGHFLY |
| EXCLUDE_RIGHTS_RESERVED | 69 | Excluir medio con permisos reservados; reemplazarlo |
| EXCLUDE_NONCOMMERCIAL | 9 | Excluir los sonidos CC BY-NC, aunque el juego original tenga concesión especial |
| EXCLUDE_STRICT_LICENSE | 2 | CC BY 4.0 / SIL OFL 1.1 no aprobadas por política estricta MIT/CC0 |
| **Total** | **255** | **Cada archivo distribuido debe pasar verificación adicional** |

## GLOSARIO funcional: conservar código, reemplazar presentaciones restringidas

| Subsistema original | Fuente de código principal | Código | Medios/acción |
|---|---|---|---|
| Mundo/semilla/regiones | `src/sim/world.ts`, `src/sim/world_seed.ts`, `src/sim/data.ts`, `src/sim/content/` | MIT / CONSERVAR | Mantener coordenadas, caminos, quests, NPC y camps; sustituir solo recursos no independientes |
| Ciudades y edificios | `src/sim/eastbrook_layout.ts`, `src/render/eastbrook_town.ts`, `src/render/props.ts` | MIT / CONSERVAR | Preservar urbanismo original y geometría cuando el código MIT la genera; revisar texturas/GLB por archivo |
| Terreno y agua | `src/render/terrain.ts`, `src/render/water.ts`, `src/render/underwater.ts` | MIT / CONSERVAR | Preferir texturas ambientCG/Poly Haven CC0; otras bajo revisión; no inventar superficies provisionales |
| Motor de mundo | `src/sim/sim.ts`, `src/sim/mob/`, `src/sim/combat/` | MIT / CONSERVAR | Mantener reglas de combate, IA, loot, muerte, respawn, aggro y misiones |
| Animaciones | `src/render/characters/manifest.ts`, `src/render/characters/visual.ts` | MIT / CONSERVAR | Modelos/rigs/animaciones KayKit CC0 o Quaternius CC0 aprobados, no tomar por libre cualquier GLB |
| Inventario/bolsas/economía | `src/sim/`, `src/ui/` | MIT / CONSERVAR | Conservar lógica; apartar iconos de CraftPix/arte reservado. Servicios de economía online requieren adaptador offline |
| HUD e interfaces | `src/ui/`, `src/ui/hud/` | MIT / CONSERVAR | Recobrar controles funcionales, sustituir imágenes/marcas y rediseñar formato Android más tarde |
| Editor 2D/3D | `src/editor/`, `src/editor/3d/viewport.ts` | MIT / FORK HIGHFLY | Copiar y mejorar interfaz y herramientas, con catálogo filtrado. No importar todo su catálogo sin auditar |
| Editor transformaciones | `src/editor/undo_core.ts`, `camera_axes.ts`, `placement_transform_core.ts` | MIT / COPIADO EN K6 | Se vendorizan **sin modificar** en `vendor/claudecraft-v0447/src/editor/`; se empiezan adaptadores HIGHFLY separados |
| Música/SFX | `src/render/`, `public/audio/` | Código MIT / CONSERVAR | Usar audio CC0 exacto verificado; reemplazar project-only, voces reservadas y @jamiecypher CC BY-NC. **Registrar silencios temporales, nunca bloquear simulación por audio** |
| Armaduras, armas, iconos, VFX | Código de inventario/render MIT | MIT / CONSERVAR | Eliminar CraftPix, licencias personales, arte prestigio/comercial reservado, project-only; usar propios o CC0 |
| Recursos "With the project only" | `CREDITS.md` | Código relacionado MIT | No traer binarios, mapas pintados, SFX ni renders exclusivos, aunque el fork pudiera alojarlos |
| Cliente y Android | `src/game/`, `src/main.ts`, `android/` | Código MIT / ADAPTAR | Arranque offline de producción, visuales legales, rendimiento S23 Ultra horizontal. No depender del login/servidor externo |

## Editor HIGHFLY: adaptaciones obligatorias antes de darlo por integrado
1. Importar la SPA MIT original + Renderer/Sim y sus dependencias sin alterar sus contratos; probar la vista 2D/3D y el guardado.
2. **Catálogo positivo**: el browser solo debe mostrar modelos GLB/glTF en `config/c0_approved_assets.json` o nuevas aprobaciones con URL, licencia, hash y dependencias completas. El catálogo upstream tiene 1.334 modelos, NO todos autorizados.
3. **Escala física**: el `TARGET_HEIGHT=2.2` del `src/render/placed_assets.ts` original se usa como normalización uniforme de modelos; HIGHFLY requiere dimensiones reales medidas y conversión `unitsPerMeter` calibrada para el terreno de Sim. Avatar 1,70 m, puertas y muralla según registro aprobado. Sin medidas, se bloquea colocación canónica.
4. **Capa no destructiva**: no exportar un `CustomMap` que pierda los layouts especiales por `clonePropsWithoutEastbrookLayout`. Deben conservarse `BUILTIN_WORLD` y `WORLD_SEED` sin modificaciones y aplicarse `HIGHFLY_OVERLAY` independiente. Guardar/reabrir no mueve NPC, campamentos, misiones ni entradas originales.
5. Modo edición escritorio prioritario, vista cenital/tercera persona, mover/rotar/deshacer, colisiones y caminos compartidos. Android será para jugar; editor táctil después.
6. Las funciones de acceso al servidor de ClaudeCraft deben separarse de almacenamiento local, publicación independiente y prueba offline de producción.

## Personaje único sin romper el motor
- **Prototipo:** un personaje visible "Hunter HIGHFLY" sobre un solo rig CC0 y perfil de simulación existente (por ejemplo `warrior`) para probar ataque, movimiento, HP, muerte, loot, equipo, inventario, zonas, XP y NPC.
- **No colapsar todavía** las nueve clases originales ni cambiar miles de ids: `PlayerClass` controla recursos, habilidades, restricciones de equipo y reglas del motor. Las clases se preservan internamente durante recuperación.
- **Segundo paso:** diseñar `UniversalHunterAdapter` con una sola entidad física, pools HP/MP/Energía, librería de habilidades aprendidas sin clase, cuatro activas + una pasiva, skill acquisition por compra/loot/misiones. Desacoplar `CLASSES`, `abilitiesKnownAt`, equipo y recursos de las restricciones; cubrir con tests.
- No presentar "un warrior renombrado" como Hunter universal completado. Tampoco eliminar assets de otras clases hasta verificar qué NPC, enemigos y animaciones los reutilizan.

## Estado al cerrar esta fase
- Glosario de 255 familias creado (NO certificación por archivo).
- Módulos puros de editor MIT recuperados en `vendor/...`.
- Primer núcleo HIGHFLY `editor/highfly_editor_rules.mjs` con catálogo filtrado, alturas verificadas y capa de mundo independiente, más tests.
- **AÚN NO** está montado el editor completo `/editor`, la interfaz real, las ciudades restauradas ni un juego FULL recuperado. Esta rama es técnica, no está desplegada a Pages. K5 permanece intacto.
