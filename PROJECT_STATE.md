# 3D Queens Challenge — Estado completo del proyecto

> Documento de continuidad del proyecto. Su propósito es permitir retomar el desarrollo sin depender del historial de ChatGPT ni de memoria externa. Debe actualizarse cuando una decisión importante cambie.
>
> Última actualización: 2026-08-30.

---

## 1. Qué es este proyecto y cómo evolucionó

El proyecto comenzó como un puzzle web relativamente pequeño inspirado en el problema de las reinas, trasladado a un espacio tridimensional. La primera idea era simple: mostrar varias capas de un tablero, permitir colocar reinas y comprobar si el jugador había encontrado el máximo número posible sin ataques.

Durante el desarrollo dejó de ser únicamente una demostración de “reinas 3D” y se convirtió en la base de una colección de puzzles de ajedrez y problemas combinatorios. El principio que ahora guía el proyecto es conservar una interfaz visual común —tablero 3D, capas, cámara, ayudas opcionales, verificación, manual visual y tamaños variables— y permitir que distintos modos cambien la pieza, las relaciones válidas/prohibidas y el objetivo matemático.

La prioridad actual sigue siendo terminar una base de Reinas 3D sólida antes de introducir un segundo modo. El siguiente candidato real es Caballos, con dos variantes conceptualmente distintas: una donde las conexiones en L se evitan y otra donde esas conexiones se buscan para formar una red.

El proyecto ya debe tratarse como un producto pequeño y no como un experimento de una sola página. Las decisiones de arquitectura, UX, reglas, traducción y cálculo de soluciones deben documentarse y preservarse.

---

## 2. Repositorio, publicación y estructura general

Repositorio:

- `Ang-Luizzz/3d-queens-challenge`
- Rama principal: `main`
- GitHub Pages: `https://ang-luizzz.github.io/3d-queens-challenge/`
- El repositorio es público.

La publicación usa GitHub Actions mediante `.github/workflows/pages.yml`.

La arquitectura actual no tiene backend. El sitio se ejecuta completamente en el navegador. El workflow copia el repositorio a `_site` e inyecta hojas de estilo y scripts externos en `index.html` antes de publicar.

Orden actual de scripts inyectados por el workflow:

1. `size-engine.js`
2. `i18n.js`
3. `interaction-fix.js`
4. `view-layout.js`
5. `assist-layout.js`
6. `overlays.js`
7. `ui-polish.js`
8. `language-ui-fix.js`

CSS externo inyectado:

- `spacing-fix.css`
- `view-layout.css`

Esto importa porque varios scripts dependen del DOM generado o reorganizado por scripts anteriores.

---

## 3. Arquitectura técnica actual y deuda heredada

### 3.1. `index.html` todavía contiene el motor original

`index.html` conserva una versión inicial del juego escrita para cubos `n×n×n`, originalmente con 3×3×3, 4×4×4 y 5×5×5.

No es el motor efectivo de la versión publicada.

`size-engine.js` se ejecuta antes de los demás scripts y hace lo siguiente:

- clona `.size-strip`;
- clona `.game-card`;
- reemplaza los nodos originales por los clones;
- deja los listeners del motor inline original conectados a nodos ya separados del DOM;
- instala un motor nuevo capaz de trabajar con dimensiones `X×Y×Z`.

Esto fue una solución deliberada para evolucionar el proyecto sin reescribir de golpe todo `index.html`, pero es deuda técnica. A largo plazo conviene consolidar el código y eliminar el motor inline antiguo.

### 3.2. Motor efectivo: `size-engine.js`

Actualmente es la fuente principal del estado del puzzle:

- dimensiones `x`, `y`, `z`;
- capa activa;
- conjunto de reinas;
- separación entre capas;
- ayudas de ataque y conflicto;
- renderizado de las capas;
- verificación de la solución;
- tamaños fijos y personalizados;
- rotación base del cubo;
- historial de deshacer.

### 3.3. Scripts de mejora acumulativos

El proyecto creció de forma incremental, por lo que varias responsabilidades están distribuidas:

- `interaction-fix.js`: evita que controles de cámara coloquen piezas accidentalmente y mejora el targeting sobre el tablero rotado.
- `view-layout.js`: reorganiza selector de capas, vistas, pan, zoom, cámara y vista trasera.
- `assist-layout.js`: mueve Ayudas a una fila independiente debajo del selector de tamaño.
- `overlays.js`: Manual visual y celebración de solución correcta.
- `ui-polish.js`: ajustes finos de cámara, tamaños, validación personalizada, icono del manual, etc.
- `language-ui-fix.js`: correcciones puntuales de traducción y presentación que surgieron al mover bloques del DOM.

Antes de añadir muchos modos nuevos debería considerarse una fase de consolidación para evitar que varias capas de scripts modifiquen el mismo elemento.

---

## 4. Principios de UX ya decididos

Estas reglas se consideran decisiones de producto y no deben cambiarse incidentalmente:

1. El puzzle no debe revelar automáticamente la cantidad máxima de piezas.
2. El verificador no debe decir “faltan”, “sobran”, “estás cerca”, etc.
3. El verificador solo responde:
   - `Correcto.` / `Correct.`
   - `Incorrecto.` / `Incorrect.`
4. El jugador siempre puede colocar una pieza en cualquier casilla de la capa activa.
5. Las ayudas no bloquean movimientos; solo muestran información.
6. No debe existir una solución precolocada ni semillas obligatorias.
7. No hay vidas, puntos ni sistema de puntuación.
8. El tiempo puede considerarse más adelante como registro personal, pero no forma parte del sistema actual.
9. No se quiere enseñar al jugador estrategia matemática para resolver el puzzle dentro de la interfaz.
10. El Manual visual explica qué relaciones cuentan como ataque, no cómo encontrar la solución óptima.
11. Las distintas capas deben permanecer visualmente comprensibles incluso cuando están inactivas.
12. La capa 1 se interpreta visualmente como la capa superior.
13. Los controles deben poder usarse tanto en escritorio como en móvil.
14. Los cambios de idioma no deben reiniciar el estado del puzzle.
15. Cambiar el tamaño sí reinicia las piezas colocadas, porque cambia el problema.
16. Los modos futuros deben reutilizar la mayor cantidad posible de infraestructura compartida en vez de crear páginas independientes por pieza.

---

## 5. Modo actual: Reinas 3D

### 5.1. Objetivo

Colocar el mayor número posible de reinas en un espacio `X×Y×Z` sin que ninguna pareja se ataque.

### 5.2. Definición exacta de ataque

Para dos posiciones `a` y `b`, se calculan:

- `|dx|`
- `|dy|`
- `|dz|`

Se eliminan las diferencias iguales a cero.

Hay ataque si:

- queda al menos una diferencia no nula; y
- todas las diferencias no nulas son iguales.

Código conceptual:

```js
function attacks(a,b){
  const nonzero = [
    Math.abs(a.x-b.x),
    Math.abs(a.y-b.y),
    Math.abs(a.z-b.z)
  ].filter(v => v !== 0);

  return nonzero.length > 0 && nonzero.every(v => v === nonzero[0]);
}
```

Esto incluye:

- filas;
- columnas;
- diagonales dentro de una capa;
- vertical directa entre capas;
- diagonales entre capas;
- diagonales espaciales del cuerpo del cubo.

No incluye pendientes arbitrarias. La relación debe ser una línea válida de reina bajo esa geometría discreta.

### 5.3. Máximos y verificador

El motor contiene una tabla exacta para todas las combinaciones ordenadas de dimensiones entre 3 y 6, incluyendo tamaños rectangulares personalizados.

El usuario no debe ver esa tabla en la interfaz.

El verificador comprueba dos condiciones:

1. que la cantidad colocada sea exactamente el máximo del tamaño actual;
2. que ninguna pareja se ataque.

La investigación de máximos se realizó principalmente con optimización exacta y restricciones de líneas. Los tamaños difíciles se verificaron adicionalmente con otros métodos de búsqueda exacta. El objetivo fue evitar usar conjeturas como valores del verificador.

---

## 6. Tamaños del puzzle

### 6.1. Tamaños fijos

Disponibles como botones:

- 3×3×3
- 4×4×4
- 5×5×5
- 6×6×6

### 6.2. Tamaño personalizado

Existe un botón `Personalizado / Custom` junto a los tamaños fijos.

Al abrirlo aparecen tres valores:

- X
- Y
- Z

Rango permitido actual:

- mínimo 3;
- máximo 6;
- solo enteros.

Una decisión importante fue **no corregir silenciosamente** valores fuera del rango. Si el usuario escribe 2, 7, 3.5 o deja un valor vacío:

- no se aplica el tamaño;
- el campo se marca como inválido;
- se muestra claramente que el rango permitido es 3–6.

Esto evita que el usuario piense que el sistema cambió el número por un fallo.

### 6.3. Presentación del selector

El título `Puzzle` ocupa su propia fila.

En escritorio los cinco botones de tamaño usan columnas iguales.

En pantallas estrechas se distribuyen en tres columnas sin hacer que los dos botones de la segunda fila se estiren de forma distinta.

`Personalizado` utiliza actualmente 15 px para su texto principal; el subtítulo `X × Y × Z` permanece pequeño.

---

## 7. Geometría de tableros personalizados

El motor admite planos X×Y rectangulares manteniendo las casillas cuadradas.

Para ello el plano se escala proporcionalmente usando como referencia la dimensión mayor de X/Y.

Ejemplo conceptual:

```js
const maxSide = Math.max(dims.x,dims.y);
cube.style.width = `calc(var(--plane-size) * ${dims.x/maxSide})`;
cube.style.height = `calc(var(--plane-size) * ${dims.y/maxSide})`;
```

### Corrección de centrado — 2026-08-30

Se detectó que los tableros personalizados rectangulares se veían desplazados.

Causa:

- `.camera-transform` conserva un marco cuadrado del tamaño completo;
- el cubo rectangular se hacía más estrecho o más bajo;
- permanecía situado hacia la esquina superior izquierda de ese marco.

Corrección:

- `.camera-transform` ahora usa `display:grid` y `place-items:center`;
- el tablero rectangular queda centrado dentro del marco de cámara.

---

## 8. Capas

Las capas se muestran en un selector horizontal por encima del viewport.

Características actuales:

- cada capa tiene un color propio;
- capa 1 aparece como `Arriba / Top`;
- última capa aparece como `Abajo / Bottom`;
- la capa activa recibe mayor énfasis;
- las demás siguen siendo suficientemente visibles para entender la estructura y las piezas existentes;
- solamente la capa activa acepta colocación directa de piezas.

Colores actuales:

1. azul claro;
2. violeta;
3. naranja;
4. turquesa;
5. rosa/rojo;
6. verde.

---

## 9. Cámara y vistas

### 9.1. Vistas con nombre

Actualmente:

- `Diagonal`
- `Frente / Front`
- `Atrás / Back`
- `Capas / Layers`

`Vista original` fue renombrada a `Diagonal`.

La vista Diagonal recibió varios ajustes manuales hasta alcanzar una perspectiva aprobada más suave y algo más alejada.

### 9.2. Zoom y desplazamiento

Controles de cámara:

- alejar `−`;
- acercar `+`;
- centrar `◎`.

También:

- rueda del mouse para zoom;
- Shift + arrastre o botón central para pan;
- gestos de dos dedos para pan y pinch zoom en touch.

El pan está limitado para impedir perder completamente el tablero fuera del viewport.

### 9.3. Rotación manual

Se puede arrastrar el tablero con un puntero para rotarlo.

#### Corrección — 2026-08-30

Existía un límite explícito de rotación vertical:

```js
rotX = Math.max(-150,Math.min(150,rotX));
```

Esto impedía alcanzar ciertos ángulos.

Se eliminó esa restricción. X e Y ahora pueden completar la vuelta y se normalizan alrededor de ±180° sin bloquear la dirección de giro.

Los presets siguen funcionando como puntos de partida, pero la rotación manual ya no debe detenerse artificialmente en ±150°.

---

## 10. Controles de juego

Orden conceptual actual:

1. introducción y reglas;
2. selector de tamaño;
3. Ayudas;
4. Vistas y Separación de capas;
5. selector horizontal de capas;
6. tablero 3D;
7. acciones y verificación.

### Acciones inferiores

Actualmente incluyen:

- `Deshacer / Undo`;
- `Reiniciar / Reset`;
- resultado de verificación;
- `Verificar intento / Check attempt`.

### Deshacer — añadido 2026-08-30

Se añadió un historial real dentro del motor del puzzle.

Comportamiento:

- antes de cada colocación o eliminación manual se guarda el estado anterior;
- `Deshacer` restaura el estado completo anterior;
- eliminar una pieza también se puede deshacer;
- `Reiniciar` guarda el tablero anterior antes de vaciarlo, por lo que el reinicio también puede deshacerse;
- al cambiar de tamaño se limpia el historial, ya que el estado anterior pertenece a otra geometría;
- el botón queda deshabilitado cuando no existe nada que deshacer;
- se limita el historial a 200 estados para evitar crecimiento indefinido.

No se ha añadido todavía `Rehacer / Redo`. Puede considerarse más adelante si demuestra ser útil.

---

## 11. Ayudas

Existen dos ayudas independientes:

### Casillas atacadas

Resalta casillas que están siendo atacadas por las reinas existentes.

### Reinas en conflicto

Resalta las reinas que actualmente se atacan entre sí.

Principios:

- pueden activarse y desactivarse independientemente;
- no impiden colocar piezas;
- no revelan el máximo;
- no convierten el puzzle en un sistema que diga dónde jugar.

---

## 12. Manual visual

El Manual visual se desarrolló porque explicar únicamente con texto las relaciones entre capas era insuficiente.

Características aprobadas:

- usa ejemplos visuales pequeños;
- parte de una reina de referencia;
- todas las casillas atacadas por esa reina aparecen resaltadas;
- si otra reina ocupa una casilla atacada, se muestra el conflicto;
- la reina de referencia conserva su identidad visual aunque entre en conflicto;
- las flechas se calculan desde los centros reales de las casillas renderizadas;
- la geometría y las piezas del manual no deben rediseñarse casualmente porque ya fueron refinadas visualmente.

Escenarios utilizados incluyen ejemplos de:

- reina sola;
- fila;
- columna;
- diagonal;
- vertical entre capas;
- desplazamientos entre capas;
- diagonales entre capas;
- posiciones seguras.

El botón de entrada al manual utiliza un icono de libro.

---

## 13. Verificación correcta y overlay de éxito

Cuando la solución es correcta:

- el resultado muestra únicamente `Correcto.` / `Correct.`;
- aparece un overlay de celebración;
- hay confetti;
- el overlay puede cerrarse;
- ESC también permite cerrarlo.

Cuando es incorrecta:

- solo aparece `Incorrecto.` / `Incorrect.`;
- no se revela por qué.

---

## 14. Idiomas

Idiomas actuales:

- español;
- inglés.

El idioma se persiste en `localStorage` con la clave `queens-language`.

Cambiar idioma no reinicia el puzzle.

### Problema histórico importante

Los bloques `Vista`, `Separación de capas` y `Ayudas` se reorganizan después de cargar la página. El traductor original identificaba sus títulos por posición (`primer .control-title`, `segundo`, etc.). Después de mover Ayudas fuera de `.top-controls`, cambiar idioma podía intercambiar títulos.

Se corrigió el traductor para asociar Vista y Separación a sus controles reales. `Ayudas / Aids` necesitó además una protección específica porque su bloque cambia de contenedor durante el layout.

La corrección actual de `language-ui-fix.js` vigila únicamente el título de Ayudas y evita que vuelva a convertirse en Vista.

Este historial es relevante porque, en una futura refactorización, los textos deben tener identificadores semánticos estables y no depender de posiciones DOM.

---

## 15. Detalles visuales que ya fueron aprobados

No deben alterarse accidentalmente al trabajar en modos nuevos:

- capas transparentes pero todavía legibles;
- color propio por capa;
- fichas circulares de reina;
- selector horizontal de capas;
- vista Diagonal actual;
- estructura del Manual visual;
- icono de libro del Manual;
- tamaño y distribución del selector de puzzle;
- validación visible de personalizado;
- separación del bloque Ayudas respecto a Vistas;
- verificador debajo del tablero;
- ausencia de ejes X/Y/Z visibles sobre el tablero;
- nombres de capa fuera de las casillas;
- tablero centrado dentro del viewport.

---

## 16. Problemas de interacción resueltos

Durante el desarrollo aparecieron varios fallos que conviene recordar:

### Controles de cámara colocaban reinas accidentalmente

Se corrigió impidiendo que clicks sobre botones, inputs y controles del stage se interpreten como clicks de casilla.

### Targeting sobre tablero rotado

El click sobre una celda en perspectiva podía no corresponder correctamente a la superficie proyectada. `interaction-fix.js` introdujo targeting basado en la geometría proyectada de las celdas de la capa activa.

### Opacidad excesiva de capas inactivas

Se incrementó la legibilidad de casillas y reinas inactivas para mantener orientación espacial.

### Vista Diagonal demasiado agresiva

Fue refinada hasta una inclinación más suave y con zoom algo más alejado.

### Personalizado corregía valores silenciosamente

Se cambió a validación explícita con error.

### Personalizado demasiado pequeño

Después de varias iteraciones, su texto principal quedó establecido en 15 px.

### Traducción cambiaba títulos equivocados

Se corrigieron asociaciones semánticas y se dejó guard específico para Ayudas.

### Tableros rectangulares descentrados

Corregido centrando el cubo dentro de `.camera-transform`.

### Rotación manual bloqueada

Corregido eliminando el clamp de ±150°.

### Falta de retroceso

Corregido añadiendo `Deshacer` con historial de estados.

---

## 17. Investigación de Caballos — dirección futura principal

Por ahora no interesa introducir automáticamente torre, alfil, rey, etc. El siguiente tema que sí resulta suficientemente diferente e interesante es Caballos.

El caballo permite algo que la reina no: la relación de ataque en L puede interpretarse como algo que hay que **evitar** o como algo que hay que **buscar**.

Se decidió explorar dos modos separados.

---

## 18. Geometría de caballo 3D

La definición natural considerada para un salto de caballo en 3D es:

Tomar las diferencias absolutas en X, Y y Z, ordenarlas y exigir:

```text
0, 1, 2
```

Es decir:

- dos casillas en un eje;
- una casilla en otro;
- cero en el tercero;
- cualquier permutación de ejes es válida.

Código conceptual:

```js
function knightAttacks(a,b){
  return [
    Math.abs(a.x-b.x),
    Math.abs(a.y-b.y),
    Math.abs(a.z-b.z)
  ].sort((x,y)=>x-y).join(',') === '0,1,2';
}
```

Esto produce hasta 24 desplazamientos posibles alrededor de una posición interior.

El caballo no necesita trayectoria libre; la relación depende solo de origen y destino.

---

## 19. Caballos — modo Conectar

### Decisión ya tomada

No basta con que cada caballo tenga un compañero.

**Todos los caballos deben formar una sola red conectada mediante movimientos en L.**

Interpretación como grafo:

- cada caballo es un nodo;
- una conexión en L entre dos caballos crea una arista;
- el grafo completo debe tener un solo componente conectado;
- desde cualquier caballo debe poder llegarse a cualquier otro siguiendo una cadena de L.

Esto evita configuraciones formadas por parejas o grupos aislados.

### Restricción candidata que mejor funcionó

Además de exigir una red L completa, se evaluó prohibir que cualquier pareja se alinee bajo las reglas de la reina 3D actual.

Por tanto:

- conexiones en L: buscadas y necesarias para conectividad;
- fila: prohibida;
- columna: prohibida;
- vertical entre capas: prohibida;
- diagonales de cara: prohibidas;
- diagonales entre capas y espaciales: prohibidas.

Esta variante fue la que produjo el concepto más limpio: construir una red de relaciones de caballo mientras se evitan relaciones de reina.

### Pruebas exploratorias

La versión estricta de Conectar sigue siendo viable incluso en 3×3×3, por lo que no requiere empezar obligatoriamente en tableros grandes.

En las comprobaciones realizadas se encontraron redes óptimas pequeñas en 3 y progresivamente mayores en 4, 5 y 6. Las configuraciones resultantes no son solo parejas: aparecen ramas, nodos con varias conexiones y caminos entre capas.

Conclusión provisional: **Conectar ya tiene una definición casi lista para implementación.**

---

## 20. Caballos — modo Evitar

Aquí apareció más incertidumbre de diseño.

### Variante 1: solo prohibir la L

Regla:

- ningún par puede conectarse por movimiento de caballo;
- cualquier otra alineación está permitida.

Problema:

Es demasiado permisiva. Debido a la paridad del movimiento de caballo, en muchos tamaños se puede llenar una porción enorme del tablero usando una estructura muy regular. Una vez descubierto el patrón, el puzzle pierde interés.

Conclusión: no debería ser el modo principal de Evitar.

### Variante 2: L + rectas de ejes

Prohibir:

- L;
- misma fila;
- misma columna;
- vertical directa entre capas.

Permitir diagonales.

Esta versión es mejor, pero en tamaños mayores produce patrones extremadamente regulares y máximos que tienden a seguir una estructura del tipo área de una sección. Puede volverse demasiado formulaica.

Conclusión: interesante como variante sencilla, pero no es la favorita actual.

### Variante 3: L + rectas + diagonales de cara

Prohibir:

- L;
- filas;
- columnas;
- verticales;
- diagonales en planos/caras.

Esta fue la opción más difícil estudiada y actualmente va ganando como candidato para Evitar.

Ventajas:

- rompe las construcciones obvias;
- las soluciones se vuelven menos regulares;
- la dificultad escala automáticamente con el tamaño;
- aunque 3×3×3 puede resultar fácil, puede funcionar como tutorial natural del modo;
- los tamaños 4, 5 y 6 se vuelven progresivamente más interesantes.

Desventaja:

- en 3×3×3 caben muy pocas piezas, por lo que el primer nivel puede sentirse breve.

El usuario considera aceptable que 3 sea sencillo si sirve para entender la regla y los siguientes tamaños escalan bien.

### Variante 4: L + todas las alineaciones de reina

Es la versión más restrictiva posible dentro de las relaciones ya existentes.

Se evaluó y en tableros pequeños deja el espacio demasiado vacío. Por eso no es la favorita para Evitar, aunque no queda descartada como variante extrema futura.

---

## 21. Posibilidad de múltiples reglas seleccionables dentro de Caballos

No se ha decidido todavía si Evitar tendrá exactamente una regla.

Existe una posibilidad válida de conservar más de un subtipo si cada uno produce un puzzle suficientemente diferente, por ejemplo:

- Evitar — estándar;
- Evitar — estricto.

Sin embargo, no deben añadirse variantes solo porque matemáticamente sean posibles. Cada una necesita una identidad clara y debe justificar su existencia en términos de experiencia de juego.

Próximo paso de investigación:

- buscar una familia intermedia para Evitar;
- probarla en 3³, 4³, 5³ y 6³;
- revisar no solo el máximo, sino la forma de las soluciones;
- evitar reglas con una construcción trivial o fórmula demasiado obvia;
- comparar esa opción con la variante difícil que actualmente va ganando.

---

## 22. Resultados de investigación que guiaron las decisiones de Caballos

Estas cifras son notas de desarrollo, no contenido para mostrar al jugador.

### Evitar solo L

Resultados en cubos 3–6:

- 3³: 15
- 4³: 32
- 5³: 63
- 6³: 108

Conclusión: demasiado permisivo.

### Evitar L + filas/columnas/vertical

Resultados observados:

- 3³: 7
- 4³: 16
- 5³: 25
- 6³: 36

Conclusión: mejor, pero excesivamente regular; desde 4 aparece claramente el patrón `n²`.

### Evitar L + rectas + diagonales de cara

Resultados estudiados:

- 3³: 3
- 4³: 6
- 5³: 11
- 6³: 18

Conclusión: candidata fuerte por dificultad y falta de patrón trivial, a pesar de que 3³ sea muy pequeño.

### Otra variante intermedia no simétrica

Prohibir L, filas/columnas/diagonales dentro de cada capa y vertical directa entre capas, pero no todas las diagonales espaciales.

Resultados estudiados:

- 3³: 3
- 4³: 8
- 5³: 17
- 6³: 24

Conclusión: numéricamente atractiva, pero conceptualmente menos limpia porque trata el eje Z de forma especial.

### Conectar: red L + prohibición de rectas

Resultados explorados:

- 3³: 9
- 4³: 16
- 5³: 25
- 6³: 36

### Conectar: red L + rectas + diagonales de cara

Resultados explorados:

- 3³: 5
- 4³: 9
- 5³: 18
- 6³: 31

### Conectar: red L + todas las alineaciones de reina prohibidas

Resultados explorados:

- 3³: 4
- 4³: 7
- 5³: 13
- 6³: 21

Conclusión: esta última fue la definición preferida para Conectar.

Antes de convertir cualquiera de estas cifras en objetivos del verificador de producción deben repetirse/probarse con un método exacto y registrarse como valores demostrados, no solo como resultados de una exploración.

---

## 23. Arquitectura prevista para múltiples piezas/modos

Antes de añadir Caballos se propuso refactorizar el motor hacia una estructura de modos, por ejemplo:

```js
const PIECES = {
  queen: {
    symbol: '♛',
    attacks: queenAttacks,
    maxima: QUEEN_MAXIMA,
    rules: ...
  },
  knight: {
    symbol: '♞',
    attacks: knightAttacks,
    maxima: KNIGHT_MAXIMA,
    rules: ...
  }
};
```

Para Caballos probablemente no baste una sola función `attacks`, porque Conectar necesita comprobar conectividad global del conjunto. Conviene pensar en un nivel superior de `mode`:

```text
piece = knight
mode = avoid | connect
```

Cada modo debería definir:

- símbolo;
- reglas;
- función de relaciones prohibidas;
- función de validez global;
- objetivo (`maximizar`, potencialmente `minimizar` en futuros modos);
- tabla exacta de objetivos por tamaño;
- textos ES/EN;
- visualización del Manual;
- comportamiento de las ayudas.

---

## 24. Manual visual futuro para Caballos

Se quiere reutilizar la identidad del Manual actual.

### Evitar

- caballo de referencia;
- todas las casillas alcanzables en L resaltadas como relaciones prohibidas;
- si se añaden otras prohibiciones, deben visualizarse sin convertir el manual en un caos de líneas.

### Conectar

La misma geometría de L puede representarse como relación positiva:

- caballo de referencia;
- destinos en L como conexiones potenciales;
- una red pequeña donde todas las piezas pertenecen a un único componente;
- ejemplo incorrecto con dos grupos desconectados.

Esto permite enseñar la diferencia entre “ataque = peligro” y “ataque = conexión buscada” sin enseñar soluciones óptimas.

---

## 25. Otras variantes futuras provenientes de la familia del problema de las reinas

La sección de problemas relacionados que inspiró parte de la expansión incluye varias familias que podrían convertirse en modos o experimentos.

No se deben implementar todas inmediatamente. Primero deben evaluarse por compatibilidad con la infraestructura actual y por valor como puzzle.

### Muy compatibles con la base

#### Dominación

En lugar de maximizar piezas no atacadas:

- colocar el mínimo número de piezas que ocupan o atacan todo el tablero.

La ayuda de `Casillas atacadas` ya proporciona una parte importante de la visualización necesaria.

Potencial: muy alto.

#### Reinas + Caballos

Colocar tipos distintos de piezas bajo restricciones combinadas.

Requeriría:

- selector de pieza al colocar;
- estado con tipos heterogéneos;
- reglas de ataque entre tipos.

Potencial: muy alto.

#### Reinas + Peones

También se mencionó como una variante interesante. Los peones pueden introducir bloqueo o reglas direccionales, lo cual haría que el problema deje de ser únicamente un conjunto de relaciones simétricas.

Potencial: muy alto, pero requiere definir con cuidado orientación y comportamiento en 3D.

#### Completion problems

Dar algunas piezas iniciales y pedir completar una configuración válida.

La base visual sirve, pero contradice la regla actual de no usar semillas en el modo principal. Debería existir como modo separado, no introducirse en Reinas estándar.

### Compatibilidad parcial

#### Tableros toroidales

Las líneas continúan al salir por un borde y reaparecen por el opuesto.

Necesitaría cambiar la geometría de relaciones, no necesariamente la interfaz completa.

#### Otras piezas: torre, alfil, rey

Se estudiaron conceptualmente, pero por ahora no generan tanto interés como Caballos. No son prioridad.

Definiciones tentativas si se retoman:

- Torre 3D: exactamente un eje cambia y los otros dos permanecen iguales.
- Alfil 3D: al menos dos ejes cambian la misma distancia no nula; decisión pendiente sobre alcance exacto.
- Rey 3D: cualquier cubo vecino a distancia Chebyshev 1.

#### Shogi y piezas no occidentales

Posible, pero requeriría nuevas reglas y probablemente otro nivel de explicación.

### Menos compatibles con la interfaz actual

- Costas arrays;
- cuadrados latinos;
- cuadrados mágicos;
- formulaciones de exact cover.

Pueden relacionarse matemáticamente con el problema, pero no necesariamente deben forzarse dentro del tablero 3D actual.

---

## 26. Filosofía para decidir si una variante merece existir

No basta con que una regla sea matemáticamente válida.

Antes de añadir un modo se debe evaluar:

1. ¿La regla se puede explicar de forma breve y clara?
2. ¿Produce decisiones visualmente interesantes?
3. ¿Funciona desde tamaños pequeños o tiene una progresión razonable?
4. ¿Evita soluciones triviales basadas en un patrón repetible?
5. ¿El máximo puede calcularse y verificarse exactamente?
6. ¿Reutiliza la interfaz sin llenarla de excepciones?
7. ¿Es suficientemente diferente de los modos existentes?
8. ¿El Manual puede explicar relaciones sin enseñar estrategia de solución?
9. ¿El jugador entiende qué está intentando maximizar/minimizar?
10. ¿La dificultad escala naturalmente con el tamaño?

---

## 27. Investigación matemática y verificación futura

Para cada modo nuevo que tenga un máximo oculto se debe obtener una tabla exacta para todas las dimensiones soportadas.

Actualmente el selector personalizado admite valores 3–6 por eje. Esto produce 20 combinaciones únicas si se consideran equivalentes las permutaciones de ejes.

Para cada modo futuro se debe:

1. definir la regla matemáticamente sin ambigüedad;
2. construir el modelo de optimización/búsqueda;
3. resolver las 20 combinaciones únicas;
4. repetir los casos difíciles con un segundo método cuando sea razonable;
5. distinguir entre “mejor solución encontrada” y “óptimo demostrado”;
6. usar en producción únicamente óptimos confiables;
7. no revelar los máximos en la interfaz.

Para Conectar, además de restricciones por pares, el modelo debe imponer conectividad global. Eso hace que el problema sea distinto de un simple máximo conjunto independiente.

---

## 28. Pendientes técnicos importantes antes de expandir mucho el proyecto

### Alta prioridad

- probar visualmente el nuevo botón Deshacer en móvil y escritorio;
- comprobar que Deshacer funciona después de colocar, quitar y Reiniciar;
- probar rotación completa después de retirar el límite de ±150°;
- verificar que al colocar una pieza después de una rotación extrema la cámara conserva la orientación;
- comprobar centrado de personalizados como 3×6×4, 6×3×5, 4×6×3, etc.;
- probar zoom/pan después de centrar cubos rectangulares;
- volver a comprobar traducción ES/EN con Ayudas tras las últimas modificaciones;
- comprobar que el nuevo cuarto elemento del actionbar se organiza bien en móvil.

### Refactor recomendado antes de múltiples modos

- eliminar dependencia del motor inline antiguo en `index.html`;
- consolidar tamaños, traducción y controles en una arquitectura única;
- dejar de tener varios scripts escribiendo sobre el mismo texto;
- añadir IDs/datos semánticos a títulos de bloques;
- mover validación de personalizado directamente a `size-engine.js` y retirar el intercept temporal de `ui-polish.js`;
- actualizar `view-layout.js` para entender dimensiones X/Y/Z, no solo cantidad de capas;
- integrar tamaño 6 nativamente en sus tablas de profundidad/altura en vez de depender de overrides posteriores;
- separar estado del juego, reglas y renderizado;
- preparar sistema de `mode` antes de implementar Caballos.

### Calidad / mantenimiento

- pruebas automatizadas para funciones de ataque;
- pruebas de verificador por tamaño;
- pruebas de cambio de idioma;
- pruebas de dimensiones personalizadas;
- revisar accesibilidad de los nuevos controles;
- revisar si Undo debe tener atajo de teclado (`Ctrl/Cmd+Z`) más adelante;
- considerar Redo únicamente si la necesidad aparece en uso real.

---

## 29. Secuencia recomendada de trabajo desde este punto

### Fase A — cerrar Reinas como base estable

1. probar las tres correcciones del 2026-08-30:
   - Deshacer;
   - centrado personalizado;
   - rotación completa.
2. corregir cualquier regresión.
3. no rediseñar elementos ya aprobados.

### Fase B — cerrar reglas de Caballos

1. mantener Conectar como red única por L + prohibición de alineaciones de reina, salvo que nuevas pruebas revelen un problema serio;
2. buscar una o dos variantes intermedias adicionales para Evitar;
3. comparar contra la variante difícil L + rectas + diagonales de cara;
4. evaluar soluciones visuales, no solo máximos;
5. decidir si Evitar tendrá un solo modo o dos niveles seleccionables.

### Fase C — refactor de modos

1. convertir el motor de Reinas en motor genérico de modos sin cambiar el comportamiento visible;
2. conservar Reinas como predeterminado;
3. crear selector de modo/pieza solo cuando Caballos esté listo;
4. mantener tamaños y cámara compartidos.

### Fase D — implementar Caballos

1. Caballos — Evitar;
2. Caballos — Conectar;
3. tablas exactas para todas las dimensiones 3–6;
4. Manual visual de Caballos;
5. ayudas específicas;
6. traducciones;
7. verificador;
8. pruebas en fijo y personalizado.

### Fase E — evaluar familia de variantes

Después de que Reinas + Caballos demuestren que la arquitectura funciona:

- dominación;
- combinaciones Reina/Caballo;
- Reina/Peón;
- completion;
- toroidal;
- solo después otras piezas si aportan algo.

---

## 30. Cronología de hitos técnicos importantes

La historia del repositorio incluye, entre otros, los siguientes hitos/commits. La lista sirve para rastrear cuándo aparecieron las capas principales del sistema.

- `91a4ee120d5ca0e285c914ca7d2ea9bf31c606a9` — versión inicial.
- `b1d88593a0b7b122904007f13b0adb79d2095d7c` — rediseño temprano.
- `986147f4f3eeaecdbf0fe63260a460e66354ba48` — soporte bilingüe.
- `01af27ec48c16b1cb9c12875fa3c64119a2c1f09` — restauración de sizing/layout.
- `f5dcf9406b5e1103451174fa044fdd60e2ceed94` — spacing y rail móvil.
- `54e815ba867b5cf06153599126d0d1f7765df480` — correcciones iniciales de interacción.
- `ee6cb0633cf602ac2a03b5cc015dd4b15854b372` / `6bed17caa62462196678a4f7af4b5c192a696c59` — sistema de vistas/layout.
- `2c8189e8ff6c3d3e62b20e668df29bda93b75b7f` — reverse/layers.
- `ef9ef6be9e5d60b2b3464dcd970ec7ec290fa823` — visibilidad de capas inactivas.
- `74072abb551484237699c6a4f18af0a6309caeea` — centrado, back, zoom y pan.
- `557411bc40c994708e8af6eeab563c4f17adc358` — multitouch.
- `9c75c896706720b2c2d57bf91f90157ab63921dd` — reorganización de Ayudas.
- `d0f290566e11cf03c3ab4425ec8d2a37ff31b3ef` — targeting proyectado.
- `a7d5f3813aa3ed56ff3bc89d4429505b112455a1` — overlays iniciales.
- `e60eab98333835f682229d7c40025016899f5b9d` — rediseño Manual visual.
- `dd21550da89656fb14046a1f5545d1b2cf0d962c` — prevención de click-through de cámara.
- `2fa7b9bb61584f1d575146920743904e1e112a55` — refinamiento del Manual, referencia, ataques y flechas.
- `bda96c61e40285bd12882825bdc77fbcf7bad4ab` — primera capa de ui-polish.
- `6abf752e973b4306fb18f7fd3c75a3f8b399c940` — motor de tamaño 6 y personalizados.
- `2f045c182289f4b2ca27fee903e99f4f0c9548fe` — carga del size engine en Pages.
- `f259d1afda3d50b4ca28116a15a8ea3289e23418` — sincronización de cámara en personalizados.
- `746722b649467345fa953174ac47eab2173e0611` — layout de tamaños y validación explícita.
- `8d6c5fad90219379cbb782fe2ccc78f25298b56c` — títulos por bloque semántico en i18n.
- `23b947dbcbbad43a722b21a184d6303849e86fbb` — estabilización de Ayudas y tipografía personalizada.
- `4023cde3a6d2643f61be222765fc7df2966f3d25` — ajuste inicial de texto Personalizado.
- `47f3726d5bf2dcfca1090b7ff780662b22287da6` — Personalizado a 15 px.
- `c9f8b28a8223f67281f57a384408ce748117a8dd` — historial Deshacer + rotación sin clamp.
- `241894b1cd870a048ecfd64c09a6a218939db25a` — centrado de tableros rectangulares personalizados.

---

## 31. Estado actual considerado estable antes de la expansión

Hasta antes de las tres correcciones más recientes, el usuario consideró que “todo hasta aquí” había quedado bien.

La base aprobada incluye:

- Reinas 3D funcional;
- tamaños 3–6;
- dimensiones personalizadas 3–6;
- validación explícita;
- interfaz ES/EN;
- Ayudas correctas;
- vistas y cámara;
- Manual visual;
- overlay de éxito;
- verificador exacto y opaco;
- diseño general aceptado.

Las correcciones añadidas inmediatamente después son:

- Deshacer;
- centrado de personalizados;
- rotación libre.

Estas tres deben probarse visualmente antes de declarar de nuevo la base completamente estable.

---

## 32. Decisiones que NO están cerradas

No asumir lo siguiente sin volver a decidirlo:

- regla final de Caballos — Evitar;
- si Evitar tendrá uno o dos submodos;
- nombre final de los modos de Caballos;
- diseño exacto del selector de pieza/modo;
- si la colección futura seguirá llamándose `3D Queens Challenge` o necesitará un nombre más general cuando ya no sea solo de reinas;
- si los modos relacionados de Wikipedia serán todos 3D o algunos tendrán tableros propios;
- si habrá récords personales/temporizador;
- si habrá algún sistema de progreso entre puzzles;
- si se añadirá Redo;
- si se ampliará el rango personalizado por encima de 6 en el futuro.

---

## 33. Regla de continuidad para futuras sesiones

Cuando se retome el proyecto en otra conversación o con otro agente:

1. leer este documento completo;
2. revisar el estado actual de `main`, no confiar en copias locales viejas;
3. comprobar el último deployment de Pages;
4. no reintroducir decisiones descartadas por desconocimiento;
5. no revelar máximos en la interfaz;
6. no rediseñar componentes aprobados salvo petición explícita;
7. registrar aquí cualquier decisión estructural nueva.

Este archivo existe precisamente para que la evolución del proyecto no dependa de conservar un chat específico.
