# HIGHFLY C0 — política de assets y primera matriz de decisiones

**Alcance:** exclusivamente materiales del tag [v0.44.7 de World of ClaudeCraft](https://github.com/levy-street/world-of-claudecraft/tree/v0.44.7). Esta matriz es una decisión de política, no una auditoría individual completa.

## Principio
El código fuente MIT y los assets NO comparten necesariamente la misma licencia. Consultar el [registro CREDITS original](https://github.com/levy-street/world-of-claudecraft/blob/v0.44.7/CREDITS.md) y los avisos de terceros. HIGHFLY evita deliberadamente los assets 'With the project only' aunque la licencia permita ciertos usos en forks.

| Categoría | Decisión | Nota |
|---|---|---|
| Código fuente con MIT de Levy Street | Incluir | Conservar copyright, texto MIT y avisos requeridos |
| Recursos etiquetados CC0 y origen comprobado | Incluir | Verificar rutas, versiones y fuente |
| Recurso comercial con permiso y atribución clara | Evaluar caso por caso | Preferencia por CC0; conservar todos los avisos |
| 'With the project only' | Excluir | Política de independencia de HIGHFLY |
| CraftPix comprado por Levy Street | Excluir | No transferible a HIGHFLY |
| Arte y renders comerciales reservados de ClaudeCraft | Excluir | No MIT |
| Arte/sonidos concedidos exclusivamente a Levy Street | Excluir | No transferible |
| Audio CC BY-NC / uso no comercial | Excluir | Proyecto previsto para uso comercial |
| Fuente o asset no documentado | Bloquear | Falta licencia no equivale a libre uso |
| Logos y marcas de ClaudeCraft y terceros | Sustituir | No asumir que la licencia del código incluye marcas |

## Bibliotecas ya registradas en CREDITS (verificación por archivo pendiente)
- KayKit: personajes, esqueletos, animaciones, dungeon kits y Medieval Hexagon etiquetados CC0.
- Quaternius: criaturas animadas, vegetación, arquitectura y props específicos etiquetados CC0 en ese registro.
- Kenney: kits de naturaleza, pueblos, castillos, barcos y mazmorras etiquetados CC0.
- ambientCG y Poly Haven: texturas y HDRI etiquetados CC0.
- Otras fuentes: comprobar cada licencia y archivo de manera independiente.

**Importante:** las condiciones de packs nuevos o descargados ahora pueden no coincidir con la versión exacta usada en ClaudeCraft. No extrapolar el permiso a todos los recursos de un creador.

## Reglas de build para C0
1. Solo copiar materiales aprobados y usados realmente por la compilación.
2. Escanear imports y manifiestos en busca de rutas no aprobadas (incluyendo `public/`, CSS, código generado, sonidos y VFX).
3. Reemplazar contenido restringido antes de publicar; temporalmente se admite un placeholder propio o CC0.
4. Preservar la procedencia y el hash de la fuente de cada asset aprobado.
5. Cuando una referencia legal esté pendiente, la build debe fallar antes de publicarse, no reemplazar silenciosamente ni aceptar el riesgo.
6. GitHub Pages y cualquier otro hosting público entregan archivos accesibles; cumplir las licencias incluso cuando el repositorio sea privado.

## Pendientes C0
- Inventario exhaustivo del árbol de v0.44.7 y tablas de `CREDITS.md`.
- Validación de la lista exacta de archivos multimedia que carga el juego y el editor.
- Mapa de reemplazos por rutas; no asumir que quitar solo CraftPix basta.
- Retención de avisos MIT y de terceros en el material distribuido.
- Prueba real en móvil antes de declarar GREEN.

**Estado:** documento de política creado; ninguna extracción completa, reemplazo de medios ni ejecución fue realizada aún.
