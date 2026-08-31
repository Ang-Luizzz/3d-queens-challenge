# 3D Queens Challenge — Último estado

> Este archivo registra cambios posteriores a `CURRENT_HANDOFF.md`. Mientras exista, debe leerse **antes** de `CURRENT_HANDOFF.md` y `PROJECT_STATE.md`.
>
> Última actualización: 2026-08-31.

## Estado actual de la cámara

Después de varias pruebas se llegó a una conclusión importante de UX:

- el **movimiento original** de un dedo fue el más estable, predecible y fácil de controlar;
- el **trackball completamente libre** permitió alcanzar cualquier orientación, pero su propia libertad genera roll/ladeo acumulado y hace difícil conservar una referencia cómoda;
- los intentos de sustituirlo por turntable fijo o por ejes locales bloqueados resultaron incómodos o produjeron movimientos que no coincidían con la intención del usuario;
- las herramientas posteriores de Nivelar/twist no solucionan el problema fundamental de que el trackball está diseñado para ser libre.

Por tanto, la nueva dirección no intenta corregir el trackball. **Se abandona el trackball como sistema principal de un dedo.**

## Prueba actual pendiente de validación: movimiento original + marco de ejes rotatable

### Idea

Usar nuevamente el motor original de `size-engine.js` como único dueño de la rotación de un dedo:

```text
drag horizontal -> cambia rotY
drag vertical   -> cambia rotX
```

Ese comportamiento es deliberadamente simple y estable.

La nueva capacidad se introduce en una capa exterior llamada `.axis-frame-transform`.

Esta capa no hace trackball, no acumula cuaterniones y no interpreta el arrastre normal. Solo puede girar alrededor de Z de pantalla:

```css
rotateZ(frameAngle)
```

Conceptualmente no rota libremente el tablero: **rota el marco en el que se presentan los ejes X/Y del motor original**.

### Por qué puede resolver el ángulo buscado

Caso objetivo:

1. seleccionar `Frente`;
2. usar el movimiento original normalmente;
3. girar el marco de ejes 90°;
4. continuar usando el mismo movimiento original;
5. como el `rotateX/rotateY` interno está contenido dentro de un marco exterior rotado, esos ejes se presentan ahora desde otra orientación de pantalla;
6. esto debe permitir explorar planos que antes requerían trackball libre, pero sin convertir cada gesto normal en una rotación tridimensional arbitraria.

El usuario puede cambiar de “familia de ejes” deliberadamente y después volver a trabajar con el control original estable.

## Controles de la prueba actual

### Un dedo

**Vuelve al motor original.**

`rotation-orbit.js` ya no registra ningún `pointerdown/pointermove` para un dedo y no compite con `size-engine.js`.

### Dos dedos — pan y zoom

Se conserva lo ya existente en `view-layout.js`:

- mover dos dedos juntos → pan;
- acercar/separar dedos → pinch zoom.

### Dos dedos — girar los ejes

`view-layout.js` ya detecta el ángulo de la línea entre los dos dedos y tiene una zona muerta de 4°.

Cuando existe un twist deliberado emite:

```text
queens:twist
```

La nueva `rotation-orbit.js` interpreta ese evento **solo como cambio de `frameAngle`**.

Así, el twist ya no modifica un cuaternión libre: gira únicamente el marco de ejes.

### Botones precisos ±90°

Se añadieron dos botones de cámara:

- `↺` → girar ejes 90° a la izquierda;
- `↻` → girar ejes 90° a la derecha.

Esto permite:

- probar el concepto con precisión;
- usarlo en escritorio sin multitouch;
- evitar tener que acertar manualmente 90° con los dedos;
- saber exactamente cuándo se está cambiando de eje.

### `0°` / Nivelar

El botón existente `0°` ahora tiene un significado mucho más simple y determinista:

- devuelve `frameAngle` a 0°;
- **no cambia `rotX` ni `rotY`** del motor original;
- por tanto no vuelve a Frente/Diagonal ni pierde necesariamente la inclinación alcanzada con el movimiento original;
- solo restaura la orientación normal del marco de ejes.

## Arquitectura activa

`size-engine.js`:

- sigue siendo dueño de `rotX` y `rotY`;
- sigue siendo dueño del arrastre normal de un dedo;
- no se modificó para esta prueba.

`view-layout.js`:

- sigue manejando presets, pan, zoom y multitouch;
- sigue detectando twist con dos dedos;
- no fue necesario volver a modificarlo en esta prueba.

`rotation-orbit.js`:

- ya no implementa trackball;
- crea `.axis-frame-transform` alrededor de `#cube`;
- mantiene solo `frameAngle`;
- escucha `queens:twist`;
- escucha `queens:levelview`;
- añade botones `↺` y `↻` de ±90°;
- reinicia el marco al escoger un preset o cambiar de tamaño.

Commit principal:

- `ff44e7e39b5adcce2d96df5228c36c76869b1158` — restaura el arrastre original y convierte la capa externa en un marco de ejes rotatable.

## Estado de aprobación

**Pendiente de validación visual por el usuario.**

No considerar todavía esta cámara definitiva.

### Prueba más importante

1. seleccionar `Frente`;
2. confirmar que un dedo se siente otra vez como el movimiento original;
3. pulsar `↻` una vez para cambiar el marco exactamente +90°;
4. volver a mover con un dedo hacia arriba/abajo y hacia los lados;
5. comprobar si ahora se puede llegar al ángulo buscado donde el lateral y las capas se presentan en una orientación distinta/vertical sin la deriva del trackball;
6. repetir con `↺`;
7. probar twist real con dos dedos para comprobar que permite cambios intermedios del marco;
8. pulsar `0°` y verificar que solo se normaliza el marco, no toda la vista.

## Decisiones descartadas que no deben reintroducirse sin razón

- trackball libre como solución definitiva de un dedo;
- turntable fijo yaw/pitch como sustituto completo;
- bloqueo rígido a ejes locales por gesto como sustituto completo;
- intentar corregir la libertad del trackball mediante cada vez más restricciones.

La dirección actual es separar responsabilidades:

- **movimiento normal estable** = motor original;
- **cambiar qué ejes se usan/presentan** = acción explícita del marco.

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
