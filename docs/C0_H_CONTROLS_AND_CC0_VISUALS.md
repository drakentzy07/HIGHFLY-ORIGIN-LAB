# HIGHFLY C0-H — inversión horizontal corregida / plan de recuperación CC0

## Hallazgo de la prueba en Samsung S23 Ultra

El usuario reportó que **joystick y arrastre de cámara estaban invertidos izquierda/derecha**. Grabación de prueba recibida el 29 de octubre de 2026. La posición de mundo y la cámara original de C0-G funcionaban, pero el mapping de movimiento lateral usaba el vector opuesto al derecho en pantalla.

## Correcciones realmente aplicadas

- `web/src/control_math.mjs`: ejes lateral y longitudinal relativos a yaw. `right=(-cos(yaw),sin(yaw))`, `forward=(sin(yaw),cos(yaw))`.
- `web/src/main.ts`: joystick y teclado calculan la dirección de mundo a partir de esa base. El arrastre horizontal ahora usa `yaw -= deltaX*sensitivity`, de acuerdo con el comportamiento táctil solicitado. Pitch vertical no se modificó.
- `tests/c0_controls.test.mjs`: derecha/izquierda/adelante/atrás y diagonales para varios ángulos, y dirección del arrastre.
- `scripts/c0_browser_smoke.mjs`: prueba de pointer real en Chromium landscape 915 × 412 y proyección del desplazamiento contra el vector derecho de cámara.

**Prueba GREEN:** [GitHub Actions #40921403623](https://github.com/drakentzy07/HIGHFLY-ORIGIN-LAB/actions/runs/40921403623), arrastre a la derecha: cambio yaw `-0.48`; joystick a la derecha: desplazamiento proyectado `+3.85`; cero errores de JavaScript.

**Deploy GREEN:** [GitHub Actions #40921311634](https://github.com/drakentzy07/HIGHFLY-ORIGIN-LAB/actions/runs/40921311634). Enlace: https://drakentzy07.github.io/HIGHFLY-ORIGIN-LAB/

Estas pruebas confirman el comportamiento automatizado y no sustituyen una nueva prueba manual en el Samsung real.

## ¿Por qué C0-G visualmente geométrico?

La licencia MIT cubre el **código original** (por ejemplo, `src/sim/data.ts`, `src/sim/world.ts`, `src/render/props.ts`), pero no convierte todos los GLB, texturas, personajes, sonidos o renders en MIT. En C0-G se diseñó un visualizador temporal sin recursos multimedia (0 modelos/texturas/sonidos distribuidos); sus casas son geometría independiente de HIGHFLY situada según coordenadas originales.

El original sí tiene recursos CC0 atribuibles y reutilizables, registrados en CREDITS:
- KayKit Medieval Hexagon Pack (edificios, paredes, torres, puentes) — CC0 registrado.
- KayKit Character Packs y Dungeon Remastered — CC0 registrado.
- Kenney Castle Kit, Fantasy Town Kit y Watercraft Kit — CC0 registrado.
- Quaternius Medieval Village Pack y otros packs registrados como CC0 **en el momento del origen**. Verificar que las versiones exactas conservan ese permiso antes de introducir archivos procedentes de releases posteriores.
- Recursos específicos de World of ClaudeCraft señalados como 'With the project only' o 'No, permission required' — EXCLUIDOS de HIGHFLY.

## C0-I — siguiente integración (no importar proyectos HIGHFLY antiguos)

1. Seleccionar **las construcciones de Eastbrook** del layout original `src/sim/eastbrook_layout.ts`, preservando `assetId`, posición, rotación y dimensiones; comprobar correspondencia con `src/render/props.ts`.
2. Identificar archivos concretos CC0 en su repositorio de origen. Registrar URL/proveedor/licencia efectiva/versión/hash. No copiar una versión exclusiva derivada de ClaudeCraft que no pueda atribuirse con claridad.
3. Empezar con 1–3 edificios KayKit reales, un NPC y un lobo con modelo de fuente aprobada. Conservar `Sim`, AI, spawn, NPC, paths, loot y terreno exactamente como ahora. **No** importar todo el pack al navegador ni descargar `The Complete KayKit Collection v7` en el RUN.
4. Adaptar escala, origen/pivote y colisiones del modelo al layout, sin modificar las coordenadas reales del mapa.
5. Actualizar la allowlist por archivo (`config/c0_approved_assets.json`) con SHA-256, fuente, prueba de licencia y avisos; el release gate debe aprobar el `dist` que contiene los GLB seleccionados.
6. Probar en Chromium táctil y en el Samsung horizontal. Monitorear tamaño, FPS y memoria.
7. La versión privada con todo KayKit SOURCE se considerará en otra fase; **no hace falta esperar a ella** para el primer pueblo visual CC0.

**Restricciones:** `main` sin tocar; la rama de auditoría C0 aislada; sin modelos de derechos reservados; sin importar código de Fury de prototipos anteriores. Las mecánicas de Fury se usan como requisitos funcionales futuros.
