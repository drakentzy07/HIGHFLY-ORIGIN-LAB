# HIGHFLY C0-C — validación real de datos y terreno de v0.44.7

**Resultado: GREEN.** [GitHub Actions #40893487392](https://github.com/drakentzy07/HIGHFLY-ORIGIN-LAB/actions/runs/40893487392) ejecutó las tablas y generador de terreno TypeScript originales con un checkout temporal de src/sim. No se trasladaron ni publicaron assets originales.

Fuente exacta: [World of ClaudeCraft v0.44.7](https://github.com/levy-street/world-of-claudecraft/tree/v0.44.7), commit 493c35a108cef6c8aa290e8793107b1cd117886e. Semilla de mundo 20061.

## Datos obtenidos en ejecución

| Elemento | Registros |
|---|---:|
| Zonas | 15 |
| Plantillas de monstruos | 270 |
| NPC | 136 |
| Ítems | 1.626 |
| Misiones | 224 |
| Campamentos | 218 |
| Caminos | 103 |
| Portales emparejados | 1 |
| Mazmorras | 14 |
| Objetos de suelo | 50 |
| Edificios | 79 |
| Puestos | 29 |
| Muros | 16 |
| Fogatas | 56 |
| Props decorativos | 324 |
| Pozos | 15 |
| Minas | 5 |

**Son registros lógicos, no garantizan 270 modelos animados distintos ni aprobación de las texturas y edificios.**

## Invariantes

- BUILTIN_WORLD y las tablas del mundo comparten el mismo registro ZONES.
- 16 muestras de terreno (spawn y una por cada zona) devuelven alturas finitas, idénticas al repetir la llamada.
- Ningún campamento refiere a una plantilla de mob inexistente.
- No hubo servidor, navegador, gráficos, medios ni compilación completa.

## Límites

No se creó un juego jugable ni se ejecutó el loop de Sim. Ningún modelo, sonido, icono ni textura se consideró aprobado. El editor, las físicas y el juego offline publicado todavía NO están migrados.

## Próximo gate

C0-D: levantar la simulación original, aparecer jugador y lobo, y ejecutar ciclos de mundo. Mantener la política de exclusión multimedia y el historial previo de HIGHFLY fuera de esta base.
