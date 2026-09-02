# 3D Queens Challenge — Último estado

> Este archivo registra cambios posteriores a `CURRENT_HANDOFF.md`. Mientras exista, debe leerse **antes** de `CURRENT_HANDOFF.md` y `PROJECT_STATE.md`.
>
> Última actualización: 2026-09-01.

## Estado actual de la cámara

Después de varias pruebas se descartó como solución definitiva:

- trackball libre de un dedo: alcanza cualquier orientación, pero su libertad produce roll/ladeo acumulado y pérdida de referencia;
- turntable fijo yaw/pitch: demasiado rígido;
- ejes locales fijos por gesto: movimientos poco naturales;
- marco de ejes manual con botones `↺/↻`: demasiados controles y el movimiento seguía sintiéndose ligado a la orientación original de Frente.

Las vistas `Diagonal`, `Frente`, `Atrás` y `Capas` siguen siendo puntos canónicos y no deben cambiar.

## Dirección actual: ejes dinámicos según la cara visible

El usuario probó la versión de ejes dinámicos y respondió que **está bien en general**, identificando un último problema de precisión del gesto: al intentar mover exactamente arriba/abajo o izquierda/derecha, el dedo naturalmente puede desviarse un poco y esa pequeña componente diagonal también producía una segunda rotación no deseada.

La base de la cámara se conserva. No se vuelve a cambiar el modelo geométrico.

### Cómo funciona un dedo

Al comenzar cada arrastre:

1. se calcula la orientación visual actual del tablero;
2. se transforman los ejes canónicos X/Y/Z a coordenadas de pantalla;
3. se detecta qué plano canónico (XY, XZ o YZ) está más de frente;
4. de sus dos ejes se identifica cuál se ve más vertical y cuál más horizontal;
5. esos ejes quedan fijos durante ese arrastre;
6. al soltar, el siguiente gesto vuelve a analizar la nueva orientación.

Así el movimiento ya no depende permanentemente de la orientación original de `Frente`, pero tampoco se convierte en un trackball libre.

Sensibilidad conservada:

- horizontal: `0.38°/px`;
- vertical: `0.34°/px`.

## Último refinamiento: bloqueo de intención del gesto

Commit:

- `757e61656be252d7ff500b9dd4f5fb4fbc3dd527` — añade bloqueo de intención sin cambiar la geometría dinámica de la cámara.

Objetivo: permitir movimientos rectos cómodos aunque el dedo no trace una línea perfecta, sin quitar la posibilidad de hacer una diagonal deliberada.

### Clasificación

El sistema espera **7 px** de recorrido antes de decidir la intención. Esto evita clasificar el pequeño temblor inicial del dedo.

Después compara las componentes horizontal y vertical con una relación de **1.6**:

- si X domina claramente → modo `horizontal`;
- si Y domina claramente → modo `vertical`;
- si ninguna domina claramente → modo `diagonal`.

La decisión se toma una sola vez y permanece durante todo ese arrastre.

### Resultado

- gesto casi vertical → la componente horizontal accidental se ignora por completo;
- gesto casi horizontal → la componente vertical accidental se ignora por completo;
- gesto realmente diagonal → conserva ambas componentes y sigue pudiendo rotar en dos direcciones a la vez.

Esto modifica únicamente la lectura del dedo. La selección dinámica de la cara visible y de sus ejes permanece igual.

## Dos dedos

Se conserva el sistema de `view-layout.js`:

- mover dos dedos juntos → pan;
- pinch → zoom;
- twist deliberado después de la zona muerta existente → roll alrededor de Z de pantalla.

El twist también entra en el análisis del siguiente gesto de un dedo, por lo que la lógica de arriba/abajo/lados se adapta a la nueva orientación visible.

## Significado de Enderezar

La función que antes se mostraba como `0°` significa **Enderezar la cara/plano actualmente dominante**.

No intenta recuperar el eje vertical original ni regresar a `Frente`, `Diagonal`, `Atrás` o `Capas`.

Proceso:

1. detectar la cara/plano más frontal;
2. proyectar sus dos ejes en pantalla;
3. calcular para cada eje la corrección hacia el múltiplo de 90° más cercano;
4. aplicar solo la corrección Z de menor magnitud.

La intención es mantener aproximadamente el mismo lado e inclinación y solamente poner recta la cara que se está mirando.

## Barra de cámara fuera del visor

Los controles de cámara dejaron de flotar encima del tablero 3D porque ocupaban visualmente el espacio de interacción y `0°` no explicaba su función.

Nueva presentación:

- la barra se mueve al flujo normal **debajo del visor y antes del verificador**;
- `−` y `+` conservan su lectura directa de zoom;
- `◎` ahora aparece acompañado por el texto **Centrar / Center**;
- la antigua etiqueta `0°` se reemplaza visualmente por **Enderezar / Straighten**;
- la lógica interna de cámara no cambia: solo se cambia ubicación, texto y estilo;
- `camera-toolbar.js` mueve los controles ya creados por `view-layout.js`, por lo que conserva sus mismos listeners y comportamiento;
- `rotation-orbit.js` sigue cargándose después y mantiene la propiedad de la rotación.

Commits de este ajuste visual:

- `dd734fbfa0a53f2f3d9e82b96c107a3b86b7dbbc` — crea `camera-toolbar.js` y mueve/renombra los controles;
- `34720dcc8e0053e71d9b4e6cdbc42c4764a74195` — convierte los controles en barra horizontal externa;
- `3f05c58d09e7cf12b5ab9e79898764bc0f65df82` — carga la barra antes de `rotation-orbit.js`.

## Controles eliminados

Los botones `↺` y `↻` permanecen eliminados.

## Arquitectura activa

`size-engine.js`:

- conserva orientaciones base y presets;
- su arrastre fijo antiguo queda bloqueado durante input real para evitar doble rotación.

`view-layout.js`:

- presets;
- pan;
- zoom;
- multitouch;
- twist;
- crea originalmente los botones de cámara.

`camera-toolbar.js`:

- mueve los botones fuera del `stage`;
- los coloca debajo del visor y antes del verificador;
- presenta `Centrar / Center` y `Enderezar / Straighten` de forma explícita;
- no modifica la matemática de cámara.

`rotation-orbit.js`:

- `.dynamic-axis-transform`;
- orientación manual mediante cuaternión;
- selección dinámica de cara/ejes al inicio de cada gesto;
- bloqueo de intención horizontal/vertical/diagonal;
- twist de dos dedos;
- Enderezar;
- reinicio de la capa manual al elegir una vista canónica o cambiar tamaño.

Commits relevantes de esta dirección:

- `085949ce3a1c9a964a10ae0f04cdaebbda59e2a3` — ejes dinámicos según cara visible + nuevo Enderezar;
- `757e61656be252d7ff500b9dd4f5fb4fbc3dd527` — filtro de intención para movimientos rectos.

## Estado de aprobación

La versión de ejes dinámicos fue considerada **bien en general** por el usuario. El filtro de intención y la nueva barra externa son los últimos ajustes pendientes de validación visual.

No marcar todavía toda la cámara como cerrada hasta comprobar que:

1. un gesto vertical natural no introduce giro lateral;
2. un gesto horizontal natural no introduce inclinación vertical;
3. una diagonal deliberada sigue moviendo ambos ejes;
4. la referencia dinámica continúa actualizándose correctamente entre gestos;
5. la barra externa se entiende mejor y no invade el espacio del tablero.

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
