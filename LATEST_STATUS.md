# 3D Queens Challenge — Último estado

> Este archivo registra cambios posteriores a `CURRENT_HANDOFF.md`. Mientras exista, debe leerse **antes** de `CURRENT_HANDOFF.md` y `PROJECT_STATE.md`.
>
> Última actualización: 2026-08-31.

## Estado actual de la rotación

Las dos pruebas posteriores a la rotación libre —turntable estable y rotación por ejes locales del tablero— fueron rechazadas por el usuario por sentirse incómodas, rígidas o producir movimientos raros.

El usuario identificó que las mejores experiencias hasta ahora fueron:

1. el sistema original, por ser estable y predecible;
2. la rotación completamente libre tipo trackball/cuaterniones, por permitir alcanzar cualquier orientación.

Por esta razón `rotation-orbit.js` fue revertido a la versión de trackball libre que ya había sido probada y aprobada previamente con “Funciona bien”.

Commit del rollback:

- `034d06ed30acc8e4176ee0f025666b2389c963aa` — restaura la rotación libre aprobada.

## Nueva prueba conservadora: mantener trackball + herramientas deliberadas

En vez de volver a sustituir la geometría de un dedo, se decidió conservar exactamente la libertad del trackball y añadir dos herramientas opcionales que ataquen el problema de roll/ladeo sin imponer restricciones durante la exploración.

### 1. Nivelar / Level

Se añadió un cuarto botón a los controles de cámara con texto visual `0°` y etiqueta accesible `Nivelar / Level`.

Objetivo:

- conservar el lado desde el que se está mirando;
- conservar la inclinación actual tanto como sea posible;
- corregir únicamente el ladeo alrededor del eje que apunta hacia el usuario;
- no regresar a Frente, Diagonal, Atrás o Capas.

Implementación:

- se obtiene la matriz visual combinada de `.orbit-transform` y `#cube`;
- se proyecta el eje vertical local del tablero sobre la pantalla;
- se calcula cuánto roll hace falta para que ese eje vuelva a quedar vertical;
- se aplica únicamente una rotación screen-Z correctiva al cuaternión manual;
- si el eje vertical está casi apuntando directamente hacia la cámara y no tiene proyección suficiente, se usa como referencia el eje horizontal local.

Esta función está diseñada como una corrección bajo demanda, no como una restricción permanente.

### 2. Giro con dos dedos

El multitouch ya existente en `view-layout.js` mantenía:

- mover dos dedos juntos → pan;
- separar/acercar dedos → pinch zoom.

Ahora se añade:

- girar deliberadamente la línea formada entre los dos dedos → roll manual alrededor del eje visual/screen-Z.

La intención es que el roll, que con un dedo puede aparecer accidentalmente durante el trackball libre, también pueda controlarse de una manera explícita y precisa con dos dedos.

#### Protección contra giros accidentales

No se aplica roll apenas cambia mínimamente el ángulo entre los dedos.

Existe una zona muerta inicial de **4°**. Hasta superar ese valor:

- pinch sigue funcionando;
- pan sigue funcionando;
- pequeñas diferencias de posición no ladean el tablero.

Después de superar 4°, el gesto se considera un twist deliberado y se aplican los cambios angulares incrementales.

Esto permite combinar en un mismo gesto multitáctil:

- pan;
- zoom;
- twist.

### Arquitectura

`view-layout.js` sigue siendo dueño de los puntos multitouch porque ya controlaba pan/pinch. Cuando detecta twist deliberado emite un evento `queens:twist` con el delta angular.

`rotation-orbit.js`, que es dueño del cuaternión manual, escucha ese evento y pre-multiplica una rotación alrededor de Z de pantalla.

`view-layout.js` también emite `queens:levelview` al pulsar `0°`; `rotation-orbit.js` realiza el cálculo de nivelación.

Esto evita introducir una segunda fuente de estado de orientación.

### Commits de esta prueba

- `aa6b3339aed75ebbaf6c087b1e2933ac6dc41ae2` — añade twist multitouch y botón Nivelar al sistema de cámara.
- `33d35cbb1941f1b4c7b5181b19bb5985285ab671` — integra twist y nivelación con el cuaternión de trackball.
- `ccf98b2524eb1f0f2e8fb9a855c52fc0a125a3ad` — ajuste visual del botón `0°`.

## Estado de aprobación de esta nueva prueba

**Pendiente de validación por el usuario.**

No considerar Nivelar ni twist de dos dedos como definitivos hasta recibir confirmación explícita.

Pruebas recomendadas:

1. usar un dedo para dejar el tablero deliberadamente ladeado;
2. pulsar `0°` y verificar que se endereza sin regresar a otra vista;
3. con dos dedos hacer pinch puro y comprobar que no aparece roll por accidente;
4. mover dos dedos juntos y comprobar pan;
5. colocar dos dedos separados y girarlos como si se girara una fotografía sobre una mesa; verificar que el tablero rota en ese mismo sentido;
6. combinar trackball libre con twist de dos dedos para intentar alcanzar y corregir orientaciones difíciles.

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