# 3D Queens Challenge — Último estado

> Este archivo registra cambios posteriores a `CURRENT_HANDOFF.md`. Mientras exista, debe leerse **antes** de `CURRENT_HANDOFF.md` y `PROJECT_STATE.md`.
>
> Última actualización: 2026-08-30.

## Cambio actual pendiente de validación: rotación por ejes locales del tablero

La implementación anterior tipo turntable estable (`yaw + pitch` respecto a ejes fijos) redujo el roll accidental, pero no permitía alcanzar el ángulo que el usuario realmente buscaba.

### Necesidad exacta

Caso de uso descrito por el usuario:

1. partir de la vista de Frente;
2. girar horizontalmente aproximadamente 90°;
3. con el tablero ya girado, arrastrar hacia arriba;
4. ese segundo gesto debe interpretarse respecto a **la orientación actual del tablero**, no respecto al eje original de la Capa 1;
5. así debe ser posible observar el lateral y después rotarlo de forma que varias capas aparezcan una sobre otra/verticalmente.

El sistema turntable no podía hacer esto porque el movimiento vertical seguía ligado a un eje fijo del mundo/pantalla.

### Nueva implementación

`rotation-orbit.js` vuelve a usar una orientación acumulada con cuaterniones, pero ya no es un trackball libre.

Principio clave:

- cada gesto se bloquea a **un solo eje local del tablero**;
- gesto predominantemente horizontal → gira alrededor del eje local Y actual;
- gesto predominantemente vertical → gira alrededor del eje local X actual;
- las rotaciones se **post-multiplican**, por lo que el eje utilizado ya está transformado por todos los giros anteriores del tablero;
- no se mezclan X e Y dentro de un mismo gesto;
- para combinar orientaciones se hacen gestos consecutivos.

Esto significa que después de girar 90° horizontalmente, un gesto vertical ya no usa el mismo eje que tenía el tablero en Frente. Usa el eje horizontal **actual** del objeto, permitiendo alcanzar orientaciones que el turntable fijo no podía producir.

### Control de movimientos accidentales

Para evitar el problema del trackball libre anterior:

- umbral inicial: 6 px antes de considerar un gesto como rotación;
- al superar el umbral se decide una sola vez si el gesto es horizontal o vertical;
- el eje queda bloqueado durante todo ese arrastre;
- pequeñas desviaciones en el otro sentido se ignoran completamente;
- sensibilidad actual: 0.30° por píxel;
- no existe un límite angular artificial: los ejes locales pueden girar completamente cuando el usuario lo hace deliberadamente.

### Interferencia del motor de rotación antiguo

Se detectó además que el motor Euler de `size-engine.js` todavía podía recibir parte de los eventos de puntero por debajo de `rotation-orbit.js`.

La nueva implementación detiene esos eventos con `stopImmediatePropagation()` después de que los listeners anteriores de cámara hayan tenido oportunidad de detectar el puntero. La intención es que durante una rotación manual real exista **un único dueño de la rotación**, evitando que dos sistemas transformen el tablero simultáneamente.

Los gestos de pan/zoom de dos dedos gestionados por `view-layout.js` deben seguir funcionando porque ese listener se registra antes y puede interceptar el gesto multitáctil.

### Presets

Se mantienen sin cambios:

- Diagonal;
- Frente;
- Atrás;
- Capas.

Seleccionar un preset o cambiar tamaño reinicia únicamente la rotación manual acumulada y vuelve a usar la orientación exacta de la vista elegida como punto de partida.

### Estado de aprobación

**Pendiente de validación visual por el usuario.**

Prueba principal recomendada:

1. elegir Frente;
2. arrastrar horizontalmente hasta quedar aproximadamente a 90°;
3. soltar;
4. iniciar un segundo gesto vertical;
5. comprobar que ahora ese segundo movimiento rota en relación con el tablero ya girado y permite convertir la disposición lateral de capas en una disposición vertical/apilada.

No considerar esta cámara definitiva hasta confirmación explícita.

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

## Después de validar la cámara

Volver al punto de investigación pendiente:

**Caballos — Evitar:** buscar una última variante intermedia y compararla contra la variante difícil que actualmente va ganando. Ver `CURRENT_HANDOFF.md` y `PROJECT_STATE.md` para reglas, resultados numéricos y roadmap completo.
