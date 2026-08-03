# BucleBot — Especificación del Mundo 3: CONDICIONALES

> Documento de diseño (en construcción). Recoge las decisiones del Mundo 3.
> Sigue el principio rector del brief: no se puede ganar sin aplicar el concepto.

---

## 1. Concepto
Introducir los **condicionales** (SI... ENTONCES... SI NO...) — el tercer pilar del
pensamiento computacional tras secuencias (Mundo 1) y bucles (Mundo 2).

## 2. El gancho: objetos que recoger
El dron se encuentra objetos en las casillas y debe decidir qué hacer según lo que
detecta. Dos tipos de objeto:
- **Monedas (buenas):** hay que recogerlas.
- **Bombas (malas):** NO hay que tocarlas (si las recoges, pierdes).

## 2b. Objetivo de victoria (identidad del Mundo 3)
**El objetivo del nivel es recoger TODAS las monedas** (esquivando bombas), no llegar
a una baliza. Esto da identidad propia al mundo (Mundo 1 y 2 = "llega a la meta";
Mundo 3 = "recoge todo", estilo coleccionar / Pac-Man) y hace el condicional el
corazón del nivel: recoger es el objetivo, y decidir bien (moneda sí, bomba no) es
cómo se gana.

**Modelo de ejecución (Modelo A):** el dron pisa las casillas de su ruta.
- SI hay moneda y ejecuta "recoge" → suma la moneda. ✓
- SI hay bomba y ejecuta "recoge" → pierde (vuelve al inicio, como el choque del M2).
- Si pasa por una casilla sin ejecutar "recoge" → la deja intacta.
- **Se gana al recoger todas las monedas.** Recoger a ciegas es inviable: cogerías
  una bomba. Hay que distinguir → condicional obligatorio.

El bloque condicional distingue **tipo de objeto** ("SI hay moneda") — así un solo
bloque "SI moneda: recoge" recoge monedas e ignora bombas en cualquier casilla.
Encaja con el scoring por eficiencia: recoger todas las monedas con los mínimos
comandos.

Esto hace el condicional **obligatorio**: no se puede "recoger siempre" a ciegas,
porque cogerías una bomba. Hay que **distinguir y decidir** → condicional real.

Encaja con el principio del brief: igual que el presupuesto hacía el bucle
obligatorio en el Mundo 2, aquí las bombas + el objetivo de recoger todo hacen el
condicional obligatorio.

## 3. El sensor (versión simple, primer contacto)
- **Un solo sensor para empezar: qué hay en la casilla actual del dron.**
  El condicional pregunta por el contenido de la casilla donde está el dron:
  ¿moneda?, ¿bomba?, ¿vacía?
- (Futuro, no ahora) sensor "qué hay delante" → condicional de RUTA
  ("SI hay muro delante, gira"), que da el superpoder de "un programa resuelve
  varios mapas". Se añadirá cuando el condicional básico esté asentado.

## 4. Estructura del condicional
Forma completa **SI (condición) ENTONCES (acción) SI NO (otra acción)** — el if/else.
Ejemplo pedagógico: "SI hay moneda, recoge; SI NO, avanza".

## 5. Mecánica del condicional (versión simple)
- **Condicionales sueltos (no anidados en bucle todavía).** El alumno coloca bloques
  condicionales en su secuencia, como colocaba comandos. Ej. de programa:
  `avanzar, [SI moneda: recoge], avanzar, [SI moneda: recoge]...`
- **El alumno coloca el bloque; el bloque decide al ejecutarse.** Cuando el bloque
  "SI hay moneda: recoge" se ejecuta en una casilla, comprueba el contenido de esa
  casilla y actúa (recoge si hay moneda; si no, no hace nada / la acción del SI NO).
- **Oportunidad pedagógica interna:** colocar condicionales casilla por casilla se
  vuelve repetitivo → recuerda el tedio del Mundo 1 → genera el deseo de meter el
  condicional DENTRO de un bucle. Ese es el techo alto del Mundo 3 (condicional en
  bucle), reservado para los últimos niveles.

## 6. Pendiente de diseñar (siguientes pasos)
- Interfaz del condicional (construir SI/ENTONCES/SI NO con toque, estilo Scratch).
- Modelo de datos (extender `Command` con tipo condicional; motor y desenrollado).
- Escalera de niveles (una idea nueva por nivel).
- Mecánica de "recoger" y de "perder" (pisar bomba → volver al inicio, como el choque).
- Techo alto: condicional dentro de bucle.

## 7. Decisiones tomadas
- Concepto: condicionales. ✓
- Gancho: objetos (monedas buenas / bombas malas). ✓
- Objetivo del nivel: recoger TODAS las monedas (identidad propia del mundo). ✓
- Sensor inicial: contenido de la casilla actual (simple). ✓
- Estructura: SI... ENTONCES... SI NO (if/else). ✓
- Modelo de ejecución: Modelo A (el dron pisa su ruta, el condicional decide). ✓
- El condicional distingue tipo de objeto (moneda vs bomba). ✓
- Empezar simple: un solo sensor; "mirar delante" (ruta) más adelante. ✓
- Condicionales sueltos primero; condicional-en-bucle como RETO OPCIONAL. ✓
- El alumno coloca el bloque; el bloque decide al ejecutarse. ✓

## 8. Escalera de niveles (4 obligatorios + 1 reto opcional)

| Nivel | Idea nueva | Resumen |
|-------|-----------|---------|
| 1 | El primer condicional | Recorrido simple con una moneda. "SI moneda: recoge". Sin bombas. El concepto desnudo. |
| 2 | Aparece el peligro | Monedas + una bomba. Recoger a ciegas = coger bomba = perder. El condicional importa: hay que distinguir. |
| 3 | El SI NO (else) | "SI moneda, recoge; SI NO, avanza". El if/else completo. |
| 4 | Muchos objetos (consolidación) | Varias monedas y bombas. Colocar un condicional por casilla se vuelve repetitivo. Su outro siembra el reto: meter el condicional en un bucle. |
| 5 (reto) | Condicional en bucle | `repite [avanzar, SI moneda recoge]` recorre y recoge todo. Síntesis de los 3 mundos: secuencia + bucle + condicional. Reto opcional. |

**Orden de implementación:** niveles 1-4 primero (jugables sin combinar con bucle);
el 5 (condicional en bucle) como pieza aparte, después, por su alta complejidad de UI
(anidar tipos distintos: condicional dentro de bucle).

**Simetría con el Mundo 2:** allí el Nivel 1 reciclaba el tedio para vender el bucle;
aquí el Nivel 4 recicla el tedio para vender el condicional-en-bucle. El Nivel 5 es la
síntesis de los tres pilares del juego.
