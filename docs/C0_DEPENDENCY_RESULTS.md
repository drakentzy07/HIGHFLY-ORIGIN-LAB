# HIGHFLY C0-B — primeros resultados del mapa de dependencias

**RUN GREEN:** [#40889864489](https://github.com/drakentzy07/HIGHFLY-ORIGIN-LAB/actions/runs/40889864489). Fuente: World of ClaudeCraft v0.44.7, commit 493c35a108cef6c8aa290e8793107b1cd117886e.

Ejecución en GitHub Actions: checkout **sparse, shallow, read-only** de src/sim, src/editor, src/game, src/render, src/world_api y src/net del tag upstream. Los ficheros fuente no se introdujeron en HIGHFLY ni se adjuntaron a los artifacts: solo se publicaron informes.

| Métrica | Resultado |
|---|---:|
| Módulos TS/JS examinados | 2.433 |
| Relaciones de importación relativas detectadas | 9.622 |
| Referencias fuera de alcance o no resueltas | 222 |
| Referencias estáticas a rutas multimedia, todas por verificar | 3.264 |

### Cierres de dependencia de entradas de interés

| Entrada | Módulos alcanzables dentro del checkout |
|---|---:|
| src/sim/world.ts | 995 |
| src/sim/data.ts | 995 |
| src/sim/sim.ts | 995 |
| src/sim/mob/locomotion.ts | 995 |
| src/editor/3d/viewport.ts | 1.999 |
| src/game/offline_world_config.ts | 997 |

**Cuidado con interpretar los resultados:** el scanner usa expresiones regulares de imports. No es un análisis completo del compilador TypeScript ni detecta con seguridad todas las importaciones dinámicas, CSS, URLs generadas, APIs de servidor o recursos cargados desde otras tablas. Los 222 bordes fuera de alcance NO significan automáticamente archivos rotos.

## Decisión de arquitectura

1. No copiar solo world.ts ni construir un mundo de prueba vacío: conservar su grafo de dependencias.
2. Separar la sim **pura de mundo / NPC / monstruos / loot / misiones** de adaptadores de servidor, cliente y render.
3. Auditar las 3.264 referencias estáticas a rutas multimedia; no afirmar que sean 3.264 archivos distintos o prohibidos.
4. Para la siguiente migración, identificar la cadena de arranque offline original y construir el primer bundle reducido sin materiales de licencia no aprobada.
5. El editor usa gran cantidad de módulos de render y UI; migrarlo junto con el cliente en una etapa controlada, no como carpeta suelta.
6. Mantener src/sim world seed, RNG, geometría y límites de aggro ya copiados en staging sin cambios, con SHA comprobable.

**Estado:** exploración técnica GREEN, migración de código de mundo completo PENDIENTE, compilación jugable PENDIENTE.
