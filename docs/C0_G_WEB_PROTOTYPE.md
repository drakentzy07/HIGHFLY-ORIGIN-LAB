# HIGHFLY ORIGIN — C0-G: primera visualización WebGL del mundo original

## Estado confirmado

- **BUILD GREEN:** [RUN #40905496710](https://github.com/drakentzy07/HIGHFLY-ORIGIN-LAB/actions/runs/40905496710). esbuild produjo HTML+JS para navegador.
- **PAGES DEPLOY GREEN:** [RUN #40906078869](https://github.com/drakentzy07/HIGHFLY-ORIGIN-LAB/actions/runs/40906078869). La acción oficial confirmó la URL:
  https://drakentzy07.github.io/HIGHFLY-ORIGIN-LAB/
- **Seguridad:** control de licencias completado con cero errores, cero archivos multimedia, cero GLB, cero texturas y cero sonidos. Avisos MIT originales preservados.
- **Fuente:** etiqueta ClaudeCraft v0.44.7 fijada al commit 493c35a108cef6c8aa290e8793107b1cd117886e. No se importó ningún código experimental de HIGHFLY ni recursos With the project only.
- **Tamaño del bundle de JavaScript minificado:** 5.109.057 bytes, procedentes de 984 módulos (incluyendo la librería Three.js y módulos originales).
- **Git:** main no se modificó. Los archivos y workflows están solo en c0-audit-claudecraft-v0447.

## Qué hace esta versión

1. Ejecuta la clase Sim y tablas reales de zonas, NPC, mobs y edificios.
2. Genera una **ventana local** de terreno real alrededor de Eastbrook usando src/sim/world.ts. No es un mapa plano artificial.
3. Dibuja en Three.js las coordenadas originales de las construcciones y los caminos que caen en esa ventana.
4. Visualiza mobs y NPC cercanos al jugador con formas 3D provisionales generadas mediante código. El simulador sigue ejecutando ticks.
5. Ofrece controles **provisionales** para desplazamiento, cámara, salto, dash y comando de ataque por target.
6. Prioriza el formato apaisado del Samsung S23 Ultra y evita descargar todos los modelos del juego.

## Qué NO hace todavía

- No muestra las 15 zonas a la vez; el render inicial es una ventana local, aunque las tablas y la simulación conservan el contenido del mundo completo.
- No usa gráficos finales de KayKit ni armaduras; la geometría es temporal y original.
- No implementa Fury 360°, combos, skills universales, editor de mundo integrado o interfaz premium. Las acciones móviles son aproximaciones del laboratorio.
- El movimiento de prueba modifica la posición de la entidad en la simulación, pero todavía no implementa toda la lógica de movilidad/colisión final de ClaudeCraft.
- No demuestra combate final, loot, misiones, guardado persistente, navegación global ni tasa de FPS móvil.
- La compilación y la publicación verdes no sustituyen la prueba en un navegador real. El smoke de Chrome se ejecuta por separado.

## Ruta técnica

- web/src/main.ts — escena Three.js programática; sin imports multimedia.
- web/index.html — interfaz móvil temporal y controles.
- scripts/c0_build_web.mjs — construye solo código del tag fuente + Three.js.
- scripts/c0_release_gate.mjs — bloquea medios no permitidos, exige procedencia/avisos.
- .github/workflows/c0-web-prototype.yml — CI con build y gate.
- .github/workflows/c0-pages-prototype.yml — CI con gate + deploy a Pages.
- scripts/c0_browser_smoke.mjs y .github/workflows/c0-browser-smoke.yml — verificación de navegador y captura para inspección (se documentará GREEN solo tras concluir).

## Próximas pruebas

1. Confirmar arranque real de la escena sin errores JavaScript o WebGL.
2. Validar visual de terreno, escala de edificios y ubicación de NPC/lobo en el S23.
3. Validar que joystick izquierdo y arrastre derecho no se invierten.
4. Revisar rendimiento y colisiones antes de expandir el radio de terreno.
5. En una siguiente fase añadir el editor original y recursos CC0 individualmente aprobados.

**C0-G es un laboratorio visual de la simulación original, NO el juego HIGHFLY terminado.**
