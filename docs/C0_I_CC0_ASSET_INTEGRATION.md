# HIGHFLY C0-I — cámara vertical, edificios y lobo CC0 (sin personaje externo)

## Restricción de personaje (decisión del usuario)

**NO importar personaje prediseñado ni un personaje Source de ClaudeCraft o de proyectos previos.** El personaje HIGHFLY será un diseño propio creado posteriormente a partir de KayKit Complete SOURCE. La cápsula geométrica previa es solamente una referencia temporal del simulador y no constituye la elección artística del personaje.

## Cámara vertical

- Corrección en `web/src/control_math.mjs`: `pitchAfterDrag`, límites -0.25 a 1.08 radianes y órbita esférica `orbitCameraPosition`.
- Pantalla derecha: deslizar **arriba** mira **arriba**; deslizar **abajo** mira **abajo**. Derecha/izquierda sigue corregido; joystick relativo a cámara permanece intacto.
- La posición de cámara respeta una altura mínima del terreno.
- Tests `tests/c0_controls.test.mjs` y navegador `scripts/c0_browser_smoke.mjs`.
- [RUN GREEN de controles reales #40924088729](https://github.com/drakentzy07/HIGHFLY-ORIGIN-LAB/actions/runs/40924088729): delta de pitch arriba -0.4, abajo +0.62, diferencia de altura +8.30 y arrastre lateral/joystick OK.
- [Pages GREEN con el arreglo vertical #40924005258](https://github.com/drakentzy07/HIGHFLY-ORIGIN-LAB/actions/runs/40924005258).

## Licencias: no confundir código MIT con modelo CC0

- ClaudeCraft tiene **código MIT**. Cada recurso audiovisual se rige por SU propia licencia. No existe conversión automática a MIT.
- Los modelos incorporados en este bloque son **CC0-1.0**, no MIT: Casa y taberna de KayKit Medieval Hexagon Pack, obtenidos del repositorio oficial; lobo del recurso original registrado como Quaternius CC0 en el CREDITS de ClaudeCraft v0.44.7, junto con página del pack Quaternius que sigue diciendo CC0.
- No usar recursos `With the project only`, no comerciales, CraftPix ni con permiso exclusivo del propietario.
- Los archivos vienen de commits fijados: KayKit 84fa4e91af6a88989be7c99e0891cede11f2ca38 y ClaudeCraft 493c35a108cef6c8aa290e8793107b1cd117886e.
- Auditamos los nombres, el encabezado GLB, el contenido glTF y las dependencias relativas de glTF (bin y textura), y se registraron **seis SHA-256** individuales en `config/c0_approved_assets.json`.
- [RUN GREEN de fuentes originales y hashes #40924505755](https://github.com/drakentzy07/HIGHFLY-ORIGIN-LAB/actions/runs/40924505755).

## Contenido visual de la primera integración

1. **Casa azul KayKit**: `building_home_A_blue.gltf` y `.bin`.
2. **Taberna azul KayKit**: `building_tavern_blue.gltf` y `.bin`.
3. **Textura compartida KayKit**: `hexagons_medieval.png`.
4. **Lobo**: `wolf.glb` de ClaudeCraft original, atribuido al pack Quaternius CC0.

Se obtienen y verifican en GitHub Actions, sin volcar el paquete SOURCE a la rama pública. `scripts/c0_stage_cc0_media.mjs` compara SHA-256 y comprueba dependencias glTF antes de copiar **solo** los seis archivos a `dist`. El gate comprueba de nuevo las rutas y hashes finales antes de publicar.

## Integración con el mundo

- `web/src/main.ts` conserva terreno y simulación originales.
- Para edificios con etiqueta house/home o tavern/inn, se sustituye solo el mesh, **sin mover la coordenada original ni alterar spawn, loot o colisiones**.
- Los lobos reales se conectan a las entidades originales y se reutilizan sus animaciones disponibles; no se sustituye su IA ni su combate.
- El resto de construcciones, NPC y el personaje de prueba permanecen geométricos hasta futuras decisiones de arte o material CC0 verificado.
- Las pruebas automáticas de navegador deberían verificar carga de los tres visuales, geometría real y movimiento táctil.

## Estado y calidad

**Los tests de hash/licencias y compilación no garantizan que la escala y animaciones se vean bien en S23.** Revisar captura de Chrome y prueba real en Samsung antes de escalar a todo el mundo. La app todavía no es el MMORPG final ni implementa el personaje original HIGHFLY.

La rama main permanece intacta y las ramas antiguas HIGHFLY NO han sido reutilizadas.
