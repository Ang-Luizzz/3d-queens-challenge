# 3D Queens Challenge — Último estado

> Este archivo registra cambios posteriores a `CURRENT_HANDOFF.md`. Mientras exista, debe leerse **antes** de `CURRENT_HANDOFF.md` y `PROJECT_STATE.md`.
>
> Última actualización: 2026-08-30.

## Cambio actual pendiente de validación: rotación híbrida estable

La implementación libre de `rotation-orbit.js` mediante trackball/cuaterniones resolvió el problema de ejes fijos y fue inicialmente aprobada, pero durante uso más prolongado apareció una nueva limitación de UX: demasiada libertad de rotación permite acumular pequeños giros laterales (roll), voltear el tablero con facilidad y perder la referencia espacial.

El usuario describió el caso típico: estando de frente quiere inclinar un poco hacia arriba y después mirar ligeramente de lado; las pequeñas desviaciones involuntarias de cada gesto se acumulan y las tarjetas terminan torcidas, haciendo difícil volver a una orientación cómoda sin seleccionar otra vista completa.

### Decisión de diseño

Se acordó sustituir el trackball libre por un sistema híbrido tipo **turntable orbit**:

- giro horizontal libre de 360°;
- inclinación vertical controlada;
- sin roll deliberado;
- sin volteos verticales fáciles;
- bloqueo de intención de gesto para ignorar pequeñas desviaciones laterales en movimientos claramente horizontales o verticales;
- movimientos genuinamente diagonales pueden modificar yaw y pitch al mismo tiempo;
- sensibilidad menor para ajustes finos;
- vistas Diagonal, Frente, Atrás y Capas permanecen como presets exactos;
- zoom, pan, centrado y separación de capas no cambian.

### Implementación actual

`rotation-orbit.js` ya fue modificado.

Estado manual acumulado:

- `yaw`: giro horizontal;
- `pitch`: inclinación vertical;
- no existe estado de `roll`.

Transformación manual:

```css
rotateY(yaw) rotateX(pitch)
```

Parámetros actuales:

- umbral para considerar un gesto como rotación: 6 px;
- relación para bloquear intención horizontal/vertical: 1.45;
- sensibilidad horizontal: 0.30°/px;
- sensibilidad vertical: 0.27°/px;
- sensibilidad de gesto diagonal: 0.25°/px;
- pitch manual limitado a ±68°;
- yaw normalizado pero sin límite efectivo de vueltas.

### Bloqueo de intención

Al superar el umbral inicial, el gesto se clasifica una vez:

- `horizontal`: si el movimiento X domina claramente; solo cambia yaw;
- `vertical`: si Y domina claramente; solo cambia pitch;
- `free`: si el movimiento es realmente diagonal; cambia ambos.

La clasificación permanece durante ese arrastre completo. Esto evita que una desviación pequeña del dedo introduzca gradualmente una orientación no deseada.

### Estado de aprobación

**Pendiente de validación visual por el usuario.**

No considerar esta cámara estable/aprobada hasta recibir confirmación explícita. Si funciona como se espera, este archivo debe integrarse en `CURRENT_HANDOFF.md` y marcar la rotación híbrida como la solución definitiva.

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

Volver al punto de investigación que estaba pendiente:

**Caballos — Evitar:** buscar una última variante intermedia y compararla contra la variante difícil que actualmente va ganando. Ver `CURRENT_HANDOFF.md` y `PROJECT_STATE.md` para reglas, resultados numéricos y roadmap completo.
