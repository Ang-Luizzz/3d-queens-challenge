# 3D Queens Challenge — Último estado

> Este archivo registra cambios posteriores a `CURRENT_HANDOFF.md`. Mientras exista, debe leerse **antes** de `CURRENT_HANDOFF.md` y `PROJECT_STATE.md`.
>
> Última actualización: 2026-08-30.

## Estado actual de la rotación

Las dos pruebas posteriores a la rotación libre —turntable estable y rotación por ejes locales del tablero— fueron rechazadas por el usuario por sentirse incómodas, rígidas o producir movimientos raros.

El usuario identificó que las mejores experiencias hasta ahora fueron:

1. el sistema original, por ser estable y predecible;
2. la rotación completamente libre tipo trackball/cuaterniones, por permitir alcanzar cualquier orientación.

Por esta razón se revirtió `rotation-orbit.js` exactamente a la versión de trackball libre que ya había sido probada y aprobada previamente con “Funciona bien”.

### Implementación activa

La rotación manual vuelve a usar una orientación acumulada mediante cuaterniones.

Para cada movimiento del puntero:

- el eje incremental es perpendicular al vector del gesto en el plano de la pantalla;
- la rotación incremental se pre-multiplica;
- el movimiento se interpreta respecto a la pantalla en cada instante;
- no existe un límite artificial de orientación;
- se puede alcanzar cualquier vista espacial;
- los presets Diagonal, Frente, Atrás y Capas siguen siendo puntos de partida exactos;
- pan, zoom y centrado permanecen separados.

Commit del rollback:

- `034d06ed30acc8e4176ee0f025666b2389c963aa` — restaura la rotación libre aprobada.

### Problema conocido que queda sin resolver

La libertad completa permite acumular pequeñas cantidades de roll y puede dejar el tablero ladeado después de muchos movimientos. También puede ser fácil perder una orientación cómoda.

No se debe volver a resolver este problema sustituyendo toda la geometría de la rotación por sistemas rígidos de yaw/pitch o ejes locales bloqueados; esas alternativas ya fueron probadas y rechazadas.

La siguiente dirección de UX recomendada es **conservar la rotación libre** y añadir una corrección opcional pequeña, por ejemplo:

- `Nivelar / Straighten`: eliminar únicamente el ladeo/roll conservando lo máximo posible la dirección actual de observación;
- o una asistencia/snap opcional, nunca obligatoria.

La idea es reparar la orientación cuando el usuario quiera sin quitarle libertad durante la exploración.

No implementar todavía esa ayuda sin evaluar su comportamiento.

## Estado de las demás correcciones

Siguen aprobadas:

- Deshacer / Undo;
- centrado de tableros personalizados;
- tamaños fijos 3–6;
- personalizados X×Y×Z de 3–6;
- selector y validación de tamaños;
- Manual visual;
- idiomas;
- ayudas;
- vistas base;
- resto de la interfaz de Reinas 3D.

## Después de cerrar la cámara

Volver al punto de investigación pendiente:

**Caballos — Evitar:** buscar una última variante intermedia y compararla contra la variante difícil que actualmente va ganando. Ver `CURRENT_HANDOFF.md` y `PROJECT_STATE.md` para reglas, resultados numéricos y roadmap completo.
