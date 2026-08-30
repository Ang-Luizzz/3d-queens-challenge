# 3D Queens Challenge — Handoff actual

> Este archivo es el punto de entrada para retomar el proyecto en una conversación nueva.
>
> Leer primero este archivo y después `PROJECT_STATE.md`.
>
> `PROJECT_STATE.md` conserva la historia larga, decisiones de producto, investigación matemática, arquitectura, UX, variantes y roadmap. Este handoff registra los cambios y validaciones que ocurrieron después de crear ese documento y, cuando exista contradicción, **este archivo representa el estado más reciente**.
>
> Última actualización: 2026-08-30.

---

## 1. Estado actual

La base de **Reinas 3D** se considera nuevamente **estable y aprobada por el usuario**.

Después de crear `PROJECT_STATE.md` se probaron y aprobaron explícitamente tres correcciones que allí todavía aparecían como pendientes de validación:

1. **Deshacer / Undo** funciona correctamente.
2. **Centrado de tableros personalizados rectangulares** funciona correctamente.
3. **Rotación manual libre/orbit** funciona correctamente.

Por tanto, las secciones de `PROJECT_STATE.md` que aún digan que estas tres correcciones “deben probarse” están desactualizadas y quedan reemplazadas por este handoff.

La base estable incluye:

- modo Reinas 3D;
- tamaños 3×3×3, 4×4×4, 5×5×5 y 6×6×6;
- personalizados X×Y×Z con cada eje entero entre 3 y 6;
- validación explícita de dimensiones inválidas;
- selector de tamaños ya aprobado visualmente;
- `Personalizado` a 15 px;
- capas coloreadas y selector horizontal;
- Ayudas independientes;
- vistas Diagonal, Frente, Atrás y Capas;
- zoom, pan y centrado;
- rotación manual orbit/trackball;
- Deshacer;
- Reiniciar;
- verificador opaco `Correcto/Incorrecto`;
- Manual visual;
- overlay/confetti al resolver;
- español e inglés;
- centrado correcto de tableros personalizados.

---

## 2. Corrección importante de la cámara: la rotación real ya no es Euler fija

`PROJECT_STATE.md` registra primero que se eliminó un clamp de ±150° en `rotX`. Eso fue una corrección intermedia, pero **no resolvía el problema real**.

El problema real era que la rotación manual seguía expresada con dos ángulos Euler fijos:

- `rotateX(...)`
- `rotateY(...)`

Al inclinar bastante el tablero, un gesto que visualmente debía girar el objeto en una dirección podía empezar a producir un giro alrededor de otro eje predeterminado del modelo. El usuario describió correctamente que el cubo parecía “amarrado” a ejes específicos y que el movimiento dejaba de corresponder con la dirección indicada frente a la pantalla.

### Solución final aprobada

Se añadió `rotation-orbit.js`.

Este script crea una capa exterior `.orbit-transform` entre `.camera-transform` y `#cube`.

La orientación base de las vistas continúa siendo propiedad del sistema anterior. Esto es deliberado porque las vistas aprobadas no debían cambiar:

- Diagonal;
- Frente;
- Atrás;
- Capas.

La **rotación manual del usuario**, en cambio, ya no reescribe los Euler del cubo. Se compone en la capa exterior mediante **cuaterniones** y una rotación `rotate3d(...)`.

Para cada arrastre:

- el eje incremental se calcula perpendicular al vector de movimiento en el plano de la pantalla;
- arrastrar horizontalmente produce un giro alrededor del eje vertical visto por el usuario;
- arrastrar verticalmente produce un giro alrededor del eje horizontal visto por el usuario;
- las rotaciones incrementales se pre-multiplican para conservar ejes relativos a pantalla;
- se pueden encadenar giros desde cualquier orientación sin la sensación de que el control cambia arbitrariamente de eje.

El usuario probó esta implementación y confirmó: **“Funciona bien”.**

### Interacción con otras cámaras

La nueva capa orbit no reemplaza:

- pan;
- zoom;
- presets;
- separación de capas.

Al seleccionar una vista con nombre o cambiar tamaño se reinicia solamente la rotación manual acumulada de `.orbit-transform`, y la vista base vuelve a ser el punto de partida.

Los eventos sintéticos que usa el sistema para establecer presets no son interceptados como rotación manual porque `rotation-orbit.js` actúa únicamente sobre input real (`isTrusted`).

---

## 3. Orden real actual de scripts en GitHub Pages

El workflow `.github/workflows/pages.yml` inyecta actualmente, en este orden:

1. `size-engine.js`
2. `i18n.js`
3. `interaction-fix.js`
4. `view-layout.js`
5. `assist-layout.js`
6. `overlays.js`
7. `ui-polish.js`
8. `language-ui-fix.js`
9. `rotation-orbit.js`

CSS externo:

- `spacing-fix.css`
- `view-layout.css`

`rotation-orbit.js` debe permanecer **después** del sistema de vistas/cámara porque necesita que `.camera-transform` ya exista.

---

## 4. Deshacer aprobado

`size-engine.js` mantiene un `undoStack` con snapshots del conjunto de piezas.

Comportamiento aprobado:

- colocar una reina guarda el estado anterior;
- retirar una reina guarda el estado anterior;
- Reiniciar puede deshacerse si había piezas;
- cambiar de dimensiones limpia el historial;
- el botón se deshabilita cuando el historial está vacío;
- máximo actual: 200 estados.

No existe Redo todavía y no es una necesidad actual.

---

## 5. Tableros personalizados centrados

Los tamaños personalizados X×Y no cuadrados cambian el ancho/alto efectivo de `#cube` para conservar casillas cuadradas.

El problema anterior era que `.camera-transform` seguía siendo un marco cuadrado y el cubo más pequeño quedaba alineado hacia una esquina del marco.

La corrección centra el tablero dentro de ese marco usando layout centrado. El usuario lo probó y confirmó que **ya quedó centrado**.

---

## 6. Estado de traducción y selector personalizado

Los problemas de títulos al alternar idioma quedaron corregidos.

En especial:

- Vista/View permanece asociado a su bloque;
- Separación de capas/Layer spacing permanece asociado a su bloque;
- Ayudas/Aids tiene un guard específico porque su bloque se mueve de contenedor durante el layout.

El texto `Personalizado` quedó aprobado en **15 px**, con `X × Y × Z` como subtítulo pequeño.

---

## 7. Principios de producto que siguen vigentes

No cambiar sin solicitud explícita:

- no revelar máximos en la interfaz;
- no explicar estrategia matemática para resolver el puzzle;
- las ayudas muestran relaciones, no indican jugadas;
- Verificar responde solo Correcto/Incorrecto;
- no precolocar semillas en el modo estándar;
- no añadir vidas/puntuación;
- conservar las vistas, Manual visual y jerarquía general ya aprobadas;
- conservar el tablero utilizable en móvil;
- evitar cambios incidentales en componentes aprobados mientras se implementa otro modo.

---

## 8. Dirección siguiente: Caballos

La expansión inmediata no es torre/alfil/rey. El siguiente tema elegido es **Caballos 3D** porque la regla de L permite construir dos tipos de puzzle diferentes.

Definición base de movimiento de caballo 3D:

Ordenar las diferencias absolutas entre dos posiciones y exigir:

```text
[0, 1, 2]
```

Es decir, dos en un eje, uno en otro y cero en el tercero, con cualquier permutación de ejes.

### Caballos — Conectar

Decisión cerrada sobre la conectividad:

**Todos los caballos colocados deben formar una única red conectada mediante movimientos en L.**

No basta con que cada uno tenga al menos un vecino. No se permiten parejas o componentes aislados.

La definición candidata preferida para el modo completo es:

- las L son conexiones positivas;
- todo el conjunto debe ser un solo componente conectado por L;
- simultáneamente se prohíben todas las alineaciones que serían ataques de reina bajo la regla actual de Reinas 3D.

Por tanto se prohíben entre caballos:

- fila;
- columna;
- vertical directa entre capas;
- diagonales de cara;
- diagonales entre capas;
- diagonales espaciales de reina.

Resultados exploratorios registrados en `PROJECT_STATE.md` para esta variante:

- 3³: 4
- 4³: 7
- 5³: 13
- 6³: 21

Estos valores todavía deben tratarse como resultados de investigación y comprobarse/probarse exactamente antes de usarlos como objetivos de producción.

### Caballos — Evitar

Todavía no hay regla final cerrada.

Se descartó como modo principal “solo evitar L” por ser demasiado permisivo y presentar soluciones masivas/regulares.

La variante que **actualmente va ganando** es:

- prohibir L;
- prohibir rectas de ejes;
- prohibir diagonales de cara;
- no necesariamente prohibir todas las diagonales espaciales de reina.

Resultados exploratorios de esa variante:

- 3³: 3
- 4³: 6
- 5³: 11
- 6³: 18

El hecho de que 3³ sea sencillo/poco poblado no se considera necesariamente un problema: puede funcionar como nivel de aprendizaje y la dificultad escala automáticamente en 4, 5 y 6.

Sin embargo, antes de cerrar Evitar se decidió **buscar una última familia intermedia**.

Objetivo de esa búsqueda:

- mantener una regla clara y simétrica;
- evitar la trivialidad de “solo L”;
- evitar el patrón regular `n²` que apareció al prohibir solo L + ejes;
- conseguir un 3³ posiblemente alrededor de 4–6 piezas si existe una regla limpia que lo produzca;
- mantener 4³/5³/6³ suficientemente difíciles;
- revisar la forma de las soluciones, no solo el máximo;
- evaluar si merece existir un único modo Evitar o dos variantes seleccionables, por ejemplo estándar/estricto.

**Este es el siguiente punto exacto de trabajo del proyecto.**

---

## 9. Variantes futuras que interesa evaluar después

Una vez que Reinas + Caballos prueben la arquitectura multimodo, se quiere volver a la familia de variantes relacionadas con el problema de las reinas y evaluar cuáles merecen convertirse en juegos.

Interés alto registrado:

- dominación: mínimo número de piezas para cubrir/atacar todo el tablero;
- Reinas + Caballos;
- Reinas + Peones;
- completion como modo separado;
- toroidal;
- otras variantes relacionadas de la fuente/wiki original.

No se quiere implementar automáticamente toda pieza de ajedrez solo por existir. Cada modo debe ser realmente interesante y justificar su presencia.

---

## 10. Arquitectura prevista antes de Caballos

Antes de implementar Caballos en producción, conviene transformar el motor desde “todo es reina” hacia un concepto de `mode`.

Un modo debería poder definir:

- símbolo/pieza;
- relación local entre dos posiciones;
- relaciones prohibidas;
- condición global (ej. conectividad de red);
- objetivo de maximización/minimización;
- objetivo exacto por dimensiones;
- reglas ES/EN;
- Manual visual;
- ayudas específicas;
- verificación.

Importante: Conectar demuestra por qué una simple función `attacks(a,b)` no es suficiente para todos los modos; requiere una condición global sobre el grafo completo.

---

## 11. Deuda técnica relevante

La base funciona y está aprobada, pero se construyó incrementalmente.

Antes de que el número de modos crezca mucho conviene consolidar:

- eliminar el motor inline viejo de `index.html`;
- convertir `size-engine.js` en un motor de estado/modos más limpio;
- integrar validación personalizada nativamente y retirar intercepts temporales;
- evitar que varios scripts sean dueños del mismo texto/control;
- hacer que `view-layout.js` entienda completamente X/Y/Z y tamaño 6 sin overrides;
- conservar `rotation-orbit.js` o integrar su enfoque de cuaterniones en una cámara consolidada;
- separar claramente estado, reglas, render y cámara.

La refactorización debe mantener el comportamiento visible aprobado. No debe utilizarse como excusa para rediseñar el sitio.

---

## 12. Últimos hitos después de PROJECT_STATE.md

Además de la cronología incluida en `PROJECT_STATE.md`, registrar:

- `c9f8b28a8223f67281f57a384408ce748117a8dd` — Deshacer + primera eliminación del límite angular Euler.
- `241894b1cd870a048ecfd64c09a6a218939db25a` — centrado de tableros rectangulares personalizados.
- `8e9d352d4ae16d2bb78ba6948354ef0af05e7d81` — creación de `PROJECT_STATE.md`.
- `67b947cb5a939f06213d664473e01b2835e4d405` — README enlaza documento de continuidad.
- `47b3b69e7de564f9ed6ea9a981dd8a849f48889f` — creación de `rotation-orbit.js` con rotación manual screen-relative mediante cuaterniones.
- `084e8424631a3aa05d2859eddc279e4b5ca24308` — GitHub Pages carga `rotation-orbit.js`.

Después de estos cambios el usuario comprobó y aprobó:

- centrado personalizado;
- Deshacer;
- rotación orbit.

---

## 13. Cómo retomar en otro chat

En una conversación nueva, la instrucción mínima debería ser algo como:

> “Continúa el proyecto del repo `Ang-Luizzz/3d-queens-challenge`. Lee primero `CURRENT_HANDOFF.md` y luego `PROJECT_STATE.md`. Revisa `main` antes de cambiar nada.”

Después de leer ambos archivos se debe:

1. usar `main` como fuente real del código;
2. no asumir que el motor inline de `index.html` representa producción;
3. comprobar el workflow actual si se modifica el orden de scripts;
4. mantener las decisiones UX aprobadas;
5. continuar desde la búsqueda de la última variante intermedia de **Caballos — Evitar**, salvo que el usuario indique otra prioridad;
6. actualizar estos documentos cuando una nueva decisión estructural quede cerrada.

Con estos dos archivos no es necesario conservar el contexto de este chat para entender qué existe, qué se decidió, qué se descartó y cuál es el siguiente paso.