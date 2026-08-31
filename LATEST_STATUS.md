# 3D Queens Challenge — Último estado

> Este archivo registra cambios posteriores a `CURRENT_HANDOFF.md`. Mientras exista, debe leerse **antes** de `CURRENT_HANDOFF.md` y `PROJECT_STATE.md`.
>
> Última actualización: 2026-08-31.

## Estado actual de la cámara

Después de varias pruebas se descartó como solución definitiva:

- trackball libre de un dedo: alcanza cualquier orientación, pero su libertad produce roll/ladeo acumulado y pérdida de referencia;
- turntable fijo yaw/pitch: demasiado rígido;
- ejes locales fijos por gesto: movimientos poco naturales;
- marco de ejes manual con botones `↺/↻`: demasiados controles y el movimiento seguía sintiéndose ligado a la orientación original de Frente.

Las vistas `Diagonal`, `Frente`, `Atrás` y `Capas` siguen siendo puntos canónicos y no deben cambiar.

## Prueba actual pendiente de validación: ejes dinámicos según la cara visible

### Idea central

El problema identificado por el usuario es que el movimiento normal seguía interpretando arriba/abajo/izquierda/derecha según la orientación original de la cara Frente.

La nueva prueba elimina los botones `↺/↻` y cambia la lógica de un dedo:

1. al comenzar cada arrastre se calcula la orientación visual actual del tablero;
2. se transforman los tres ejes canónicos X/Y/Z del tablero a coordenadas de pantalla;
3. se determina cuál de los tres planos canónicos (XY, XZ o YZ) está más de frente al usuario; esto se hace buscando cuál normal local apunta con mayor componente hacia/desde Z de pantalla;
4. de los dos ejes que pertenecen a ese plano, se identifica cuál se ve más vertical y cuál más horizontal;
5. esos dos ejes se usan para ese arrastre completo;
6. al soltar y comenzar un nuevo gesto, se vuelve a analizar la nueva orientación.

Esto evita dos extremos:

- no usa un eje fijo derivado de la vista Frente;
- tampoco permite una rotación trackball arbitraria alrededor de cualquier vector.

Cada gesto sigue restringido a **dos ejes canónicos del tablero**, pero dichos ejes se seleccionan según lo que realmente está viendo el usuario.

### Comportamiento de un dedo

La sensibilidad conserva los valores del movimiento original:

- horizontal: `0.38°/px`;
- vertical: `0.34°/px`.

Al iniciar el gesto se guarda:

- orientación manual actual;
- eje canónico que visualmente funciona como vertical en la cara dominante;
- eje canónico que visualmente funciona como horizontal en la cara dominante.

Durante ese mismo arrastre esos ejes **no cambian**, para evitar saltos o movimientos impredecibles a mitad del gesto.

El movimiento se calcula siempre desde el estado inicial del gesto, no mediante acumulación incremental dependiente de la trayectoria. El siguiente gesto sí recalcula la referencia completa.

`rotation-orbit.js` intercepta el input real de un dedo para impedir que el motor antiguo de `size-engine.js` aplique simultáneamente su rotación fija de Frente. Los eventos sintéticos usados por los presets no se interceptan.

### Dos dedos

Se conserva el sistema de `view-layout.js`:

- mover dos dedos juntos → pan;
- pinch → zoom;
- twist deliberado después de la zona muerta existente → roll alrededor de Z de pantalla.

El twist de dos dedos sigue siendo la forma explícita de ladear/girar el tablero en pantalla. Ese roll también entra en el análisis del siguiente gesto de un dedo, por lo que arriba/abajo/lados deben adaptarse a la nueva orientación visible.

## Nuevo significado de `0°`

La implementación anterior intentaba nivelar usando el eje vertical original del tablero, lo cual podía producir resultados visualmente absurdos después de rotaciones complejas.

Ahora `0°` significa:

**Enderezar la cara/plano que actualmente está más de frente.**

Proceso:

1. detectar la misma cara dominante usada por el movimiento dinámico;
2. proyectar sus dos bordes/ejes sobre la pantalla;
3. para cada borde calcular qué rotación Z lo llevaría al múltiplo de 90° más cercano (`0/90/180/270`);
4. escoger la corrección de menor magnitud;
5. aplicar únicamente esa rotación alrededor de Z de pantalla.

Por tanto `0°` ya no busca Frente, Diagonal ni una orientación global abstracta. Su intención visual es simple: **mantener el lado/inclinación actual y poner recta la cara que estás mirando**.

## Controles eliminados

Los botones `↺` y `↻` de rotación de ejes fueron eliminados. No forman parte de la prueba actual.

## Arquitectura activa

`size-engine.js`:

- conserva las orientaciones base y los presets originales;
- sigue siendo fuente de las transformaciones canónicas del cubo;
- su arrastre real fijo queda bloqueado por la capa dinámica para no duplicar movimiento.

`view-layout.js`:

- presets;
- pan;
- zoom;
- multitouch;
- detección de twist;
- botón visual `0°`.

`rotation-orbit.js`:

- capa exterior `.dynamic-axis-transform`;
- orientación manual mediante cuaternión;
- selección dinámica de cara/ejes al comienzo de cada gesto;
- twist de dos dedos;
- nueva lógica de Enderezar;
- reinicio de la capa manual al escoger una vista canónica o cambiar tamaño.

Commit principal de esta prueba:

- `085949ce3a1c9a964a10ae0f04cdaebbda59e2a3` — ejes dinámicos según la cara visible y nuevo Enderezar.

## Estado de aprobación

**Pendiente de validación visual por el usuario.**

No considerar esta cámara definitiva todavía.

### Prueba recomendada

1. elegir `Frente`;
2. mover con un dedo y comprobar que el comportamiento inicial sigue siendo predecible;
3. girar deliberadamente el tablero hasta que la cara/plano visible cambie de orientación;
4. soltar;
5. iniciar un nuevo gesto y comprobar que arriba/abajo/lados ahora siguen la orientación visual actual en vez de la Frente original;
6. usar twist de dos dedos para dejar una cara girada aproximadamente 90° en pantalla;
7. volver a usar un dedo y comprobar que su lógica se adapta;
8. dejar la vista torcida y pulsar `0°`; debe enderezar la cara dominante hacia el múltiplo de 90° más cercano sin saltar a una vista canónica rara.

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
