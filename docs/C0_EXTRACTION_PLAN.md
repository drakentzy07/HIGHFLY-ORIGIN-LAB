# HIGHFLY ORIGIN — C0: extracción limpia de ClaudeCraft v0.44.7

Estado: **AUDITORÍA INICIAL / sin código importado**. Esta fase es de inventario y decisiones, no de despliegue.
Base de referencia: [World of ClaudeCraft v0.44.7](https://github.com/levy-street/world-of-claudecraft/tree/v0.44.7), exclusivamente ese tag. No utilizar ramas ni repositorios experimentales anteriores de HIGHFLY.

## Objetivo
Conservar, previa revisión de licencias y dependencias, el mundo jugable, su editor, ciudades y edificios autorizados, NPC, monstruos y su IA, misiones, loot, inventario, skills, crafteo, progresión y mazmorras. Mantener el funcionamiento offline y preparar una publicación web con **solo** código y recursos redistribuibles.

## Restricciones no negociables
1. No importar recursos 'With the project only', CraftPix, imágenes reservadas, audio CC BY-NC ni assets sin procedencia/licencia verificada. **Incluso si un fork pudiera conservar ciertos recursos, HIGHFLY decide excluirlos.**
2. Mantener el aviso de copyright y licencia MIT de Levy Street para el código derivado. Verificar avisos de dependencias de terceros.
3. No mezclar versiones previas HIGHFLY ni importar Fury 360° como código; usar únicamente sus requerimientos como especificación futura.
4. No implementar de inmediato el Hunter universal ni reemplazar toda la interfaz: primero verificar la funcionalidad original autorizada.
5. No publicar una build si contiene referencias a assets prohibidos, dependencias de servidores de ClaudeCraft o recursos ausentes críticos.
6. No asumir que 'está en GitHub' implica que es MIT; cada recurso multimedia requiere licencia propia.

## Primer inventario de módulos: candidatos, no aprobaciones automáticas
| Grupo | Referencia original | Función y tratamiento C0 |
|---|---|---|
| Simulación | `src/sim/` | Preservar núcleo determinista y evaluar dependencias |
| Mundo | `src/sim/world.ts`, `src/sim/content/` | Terreno, zonas, distribución, entidades, datos |
| Monstruos | `src/sim/mob/` | IA, aggro, targeting, combate y aparición |
| Combate y skills | `src/sim/combat/` | Reglas y efectos de código; auditar dependencias multimedia |
| Renderizado | `src/render/` | Separar geometría/código de texturas, GLB y efectos restringidos |
| Editor | `src/editor/` | Editor 2D/3D y playtest local |
| Cliente | `src/game/` | Entrada, movimiento y arranque, especialmente modo offline |
| Servidor | `server/`, `src/net/` | No integrar online en C0; conservar referencias para etapa futura |
| Android | `android/` | Reservar empaquetado móvil para una build funcional |
| Pruebas | `tests/` | Recuperar tests de módulos trasladados y evitar regresiones |

## Características verificadas en código original
- El editor monta el `Sim` y el `Renderer` reales (véase `src/editor/CLAUDE.md`).
- El modo offline del original está limitado al desarrollo por `src/game/offline_mode_gate.ts`; HIGHFLY deberá implementar **su propia opción offline de producción**, sin asumir que basta con subir el build a Pages.
- `src/sim/data.ts` reúne tablas de abilities, mobs, NPC, quests, items, camps y dungeons.
- La simulación y los renderizadores consumen funciones de terreno compartidas: deben permanecer coordinadas para que suelo y colisiones coincidan.

## Secuencia de trabajo y criterios de aceptación

### C0-A — Inventario de dependencias y licencias
- Enumerar código, datos, GLB, imágenes, audio, fuentes, shaders y assets embebidos o generados.
- Cruzar cada medio con `CREDITS.md`, `THIRD_PARTY_NOTICES.md` y licencia del proveedor.
- Producir manifiesto con: ruta, tipo, origen, licencia verificada, permiso de redistribución, referencias desde código y decisión.
- Definir sustitución por assets CC0 verificados o recursos propios para cada elemento prohibido.

**Aprobación:** ningún recurso usado en el build carece de procedencia verificable.

### C0-B — Dependencias mínimas para mundo jugable
- Construir grafo de imports del juego offline y editor, diferenciar lógica, UI y recursos estáticos.
- Mantener intacta la referencia original; importar en commits pequeños para poder revertir cada cambio.
- Preservar leyes de terreno, colocación, colisiones, NPC/mobs, spawn y loot antes de modificar apariencias.

**Aprobación:** la build compilable puede abrir un sector de mundo con un NPC y un mob, sin recursos prohibidos.

### C0-C — Prueba extendida y publicación
- Auditar zona por zona el mundo completo; **no** confundir mundo inventariado con mundo ya probado.
- Verificar camino, edificios autorizados, NPC, enemigos, loot, misiones, portales/mazmorras.
- Probar editor y guardado; publicar solo cuando pase la verificación del bundle distribuible.

**Aprobación:** build navegable en móvil, sin logins externos ni assets no autorizados.

## Por qué C0 es una rama aparte
`main` queda sin tocar hasta que el plan y las pruebas estén revisados. Los cambios de C0 deben ser auditables y nunca importar el historial de repositorios experimentales.

## Referencias primarias
- [ClaudeCraft v0.44.7](https://github.com/levy-street/world-of-claudecraft/tree/v0.44.7)
- [Licencias multimedia](https://github.com/levy-street/world-of-claudecraft/blob/v0.44.7/CREDITS.md)
- [Avisos de terceros](https://github.com/levy-street/world-of-claudecraft/blob/v0.44.7/THIRD_PARTY_NOTICES.md)
- [Código MIT](https://github.com/levy-street/world-of-claudecraft/blob/v0.44.7/LICENSE)
