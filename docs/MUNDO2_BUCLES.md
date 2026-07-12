# BucleBot — Especificación del Mundo 2: BUCLES

> Documento de diseño. Recoge las decisiones tomadas para el Mundo 2.
> Pensado para guiar la implementación (propia o con Claude Code) sin perder el
> hilo pedagógico.

## Principio rector (heredado del brief)
**No se puede ganar sin aplicar el concepto.** El bucle no es un atajo opcional:
es la única llave. El momento "ahá" y el chute que engancha coinciden en el mismo
instante.

---

## 1. El gancho pedagógico

- **El Nivel 1 del Mundo 2 es el Nivel 5 del Mundo 1** (el pasillo en zigzag),
  idéntico. El alumno recuerda el tostón de escribir "avanzar" 18 veces, y ahora
  lo resuelve en tres gestos con un bucle. El contraste antes/después sobre el
  mismo mapa **es** el ahá. No se explica: se vive.
- Conecta con el `outro` ya sembrado en el Nivel 5 del Mundo 1.

## 2. Mecánica que hace el bucle OBLIGATORIO: presupuesto de comandos

- Cada nivel del Mundo 2 tiene un **límite de ranuras** (presupuesto).
- Si la solución a mano necesita 18 pasos pero solo hay 6 ranuras, escribir
  longhand es **físicamente imposible** → el bucle es la única salida.
- El presupuesto se muestra **visualmente** (huecos vacíos), no como número
  abstracto: el alumno *ve* que no le caben los comandos y deduce que necesita
  otra herramienta.
- Encaja con el pilar "puntuar por eficiencia": el bucle no solo puntúa mejor,
  es *la* solución.
- **Tope duro:** al agotar las ranuras, el alumno NO puede añadir más comandos.
  Le obliga a borrar y repensar. La mecánica fuerza el bucle, no lo sugiere.

---

## 3. Escalera de 6 niveles (una idea nueva por nivel)

| Nivel | Idea nueva | Resumen |
|-------|-----------|---------|
| 1 | Repetir UNA acción | Pasillo recto. Bucle simple `repite N [avanzar]`. El suelo más bajo: el concepto desnudo. |
| 2 | Repetir un BLOQUE | La escalera diagonal reciclada (mapa del antiguo w1-5, rediseñado loopable). El patrón `avanzar + girar` se repite. Reconoce el mapa que sufrió → el ahá. |
| 3 | La cuenta exacta | Repetir de más = chocas / te pasas. Obliga a calcular el N justo. |
| 4 | Bloque más rico | El cuerpo del bucle es una secuencia más larga (p. ej. avanzar·avanzar·girar). Dentro del bucle cabe más. |
| 5 | Bucle + cola | Bucle N veces y luego comandos sueltos para rematar. Un programa combina bucle y secuencia. |
| 6 | Bucle anidado (reto) | "repite 4: [repite 3: avanzar, girar]". Techo alto, presentado como reto opcional. Requiere 4d. Su outro siembra el Mundo 3. |

**Pareja pedagógica 1+2:** el pasillo recto (repetir una acción) y la escalera
(repetir un bloque) van seguidos a propósito: el contraste enseña que en un bucle
no solo cabe una acción, sino un grupo de acciones.

**Nota de criterio (profe):** el Nivel 6 anidado se presenta como reto opcional
(su intro lo enmarca como desafío extra), para no frustrar a quien no llegue.
Quien ya pasó 1-5 domina bucles de sobra.

---

## 4. Interfaz del bucle

- **Enfoque tipo Scratch** (contenedor visual), porque los alumnos ya conocen
  Scratch del aula → transferencia directa.
- **Interacción "tocar para meter"** (no arrastrar para meter), con aspecto de
  Scratch:
  1. Pulsar **"Repetir"** → aparece un bloque-cajón vacío con selector de veces.
  2. El cajón queda **activo/abierto**.
  3. Cada comando que el alumno toca **cae dentro del cajón**.
  4. Pulsar **"Cerrar bucle"** → el cajón se sella como una unidad en la tira.
  5. Tocar el cajón después lo **reabre** para editar.
- En Chromebook (ratón) se permite **además** el arrastre, para quien lo prefiera.
- **Número de repeticiones: libre** (2-9), elegido por el alumno.
- Representación visual en la tira: un bloque agrupado, p. ej.
  `⟳3 [ avanzar · avanzar · girar ]` — el bucle *abraza* a sus comandos.
- Al ejecutar, los comandos internos se iluminan en orden, repetición a
  repetición: el alumno ve el bucle "desenrollarse" en vivo.

### Implementación por sub-piezas (para verificar jugando cada una)

- **4a — Pintado del bloque de bucle** (solo visual). ✓ Hecho. Contenedor
  estilo Scratch que abraza sus comandos; anidado con color distinto; recursivo.
- **4b — Crear el bucle** (flujo "tocar para meter"), SIMPLE: dentro de un cajón
  solo comandos simples (avanzar/girar), sin anidar bucles en la UI todavía.
  El selector de veces usa texto explícito ("Repetir N veces"), no solo `N×`,
  para que el alumno entienda el concepto con lenguaje.
- **4c — Editar y borrar** bucles (reabrir, cambiar veces, quitar comandos).
- **4d — Anidamiento en la UI** (meter un bucle dentro de otro cajón). El motor
  YA lo soporta (unroll y pintado recursivos ya verificados); solo falta la
  interacción. La 4b debe construirse SIN cerrar la puerta a esto.


---

## 5. Modelo de datos

El programa deja de ser una **lista plana** y pasa a ser un **árbol** (estructura
anidada). Cada paso es un objeto con tipo:

```typescript
// Comandos simples
{ type: 'move' }              // avanzar
{ type: 'turn', dir: 'L' }    // girar izquierda
{ type: 'turn', dir: 'R' }    // girar derecha

// Bucle: número de veces + cuerpo (otra lista de pasos del mismo formato)
{ type: 'loop', times: 3, body: [ {type:'move'}, {type:'turn', dir:'R'} ] }
```

- Como el `body` es una lista del mismo formato, **un bucle puede contener otro
  bucle**: el Nivel 5 anidado sale gratis de la estructura.
- **El Mundo 1 no se rompe:** un nivel sin bucles es un árbol sin nodos `loop`,
  un caso particular del formato nuevo. Se migran los 5 niveles viejos a objetos
  y funcionan idénticos.

### Ejecución: "desenrollado" (clave para no tocar el motor)

El `executor.ts` actual ya ejecuta una lista plana y emite `StepEvent` que
`DroneSprite` anima. **No se toca.** Se añade una capa de *desenrollado* DELANTE
que aplana el árbol antes de ejecutar:

```
Programa con bucle:  [ loop×3 [ move, turnR ] ]
                            ↓  (desenrollar)
Lista plana:         [ move, turnR, move, turnR, move, turnR ]
```

La lista plana es exactamente lo que el ejecutor de hoy ya sabe correr. El dron
no se entera de si los pasos vienen de una secuencia o de un bucle: los anima
igual. (Esto es posible gracias a la separación motor/UI del brief.)

---

## 6. Scoring

- **Esquema (a):** un bucle cuenta como el **nº de piezas que lo forman**, no como
  su versión desenrollada.
  - `loop×6[move]` = **2** comandos (el loop + el move).
  - 18 avances a mano = **18** comandos.
- Resultado: pensar en bucles **siempre** gana en el marcador. El marcador premia
  el pensamiento computacional, como pide el brief.

---

## 7. Decisiones técnicas heredadas (ya validadas en el Mundo 1)

- Animación: `Animated` nativo de React Native (`useNativeDriver: true`), con
  rotación acumulativa para giros por el camino corto. **Sirve tal cual para el
  Mundo 2** (un bucle solo genera más pasos del mismo tipo).
- Niveles como DATOS (array/objeto), nunca hardcodeados.
- Motor separado de la UI (executor puro, sin React).
- Sin almacenamiento del navegador para el estado del juego.

---

## Próximos pasos
1. Definir el **formato exacto de un nivel del Mundo 2** (con presupuesto de
   comandos y solución de referencia).
2. Extender `types.ts` con el tipo `Command` como unión (move | turn | loop).
3. Escribir la función de **desenrollado** (árbol → lista plana).
4. Construir el **componente de bucle** en la UI (contenedor Scratch + tocar
   para meter).
5. Migrar los 5 niveles del Mundo 1 al formato de objetos.
6. Diseñar los 5 niveles del Mundo 2 sobre el motor extendido.

---

## 8. Formato de un nivel del Mundo 2 (ejemplo: Nivel 1, zigzag reciclado)

```typescript
{
  world: 2,
  id: 'w2-1',
  cols: 5, rows: 5,
  start: { x: 0, y: 0, dir: 1 },
  goal: { x: 4, y: 4 },
  open: [ /* celdas del pasillo zigzag, idénticas al w1-5 */ ],
  budget: 6,          // NUEVO: ranuras disponibles (presupuesto, tope duro)
  par: 2,             // óptimo en nº de piezas (1 loop + 1 move)
  intro: "El mismo pasillo de antes… pero ahora tienes BUCLES. ¿Recuerdas lo cansino que era?",
  solution: [         // solución de referencia (valida el nivel y fija el par)
    { type: 'loop', times: 6, body: [ { type: 'move' } ] }
  ]
}
```

Novedades respecto al formato del Mundo 1:
- **`budget`**: ranuras disponibles. Tope duro (ver §2): al agotarlas no se
  pueden añadir más comandos.
- **`solution`**: solución de referencia, útil para validar que el nivel es
  resoluble y para fijar el `par`.
El resto de campos son los del Mundo 1.

---

## 9. Los 6 niveles concretos (especificación conceptual)

> Presupuestos tentativos: afinar con el mapa real. Regla: la vía manual NO cabe
> en el presupuesto, el bucle SÍ. Cada `solution` valida el nivel y fija el `par`.

**Nivel 1 — Repetir una acción (pasillo recto)**
- Pasillo recto horizontal, 8 de ancho. start (0,2) dir 1 (mira derecha), goal (7,2).
- A mano: 7 avances. Bucle: `repite 7 [avanzar]` = 2 piezas.
- `budget: 3` (7 avances no caben; el bucle sí). `par: 2`.
- intro: "¿Otra vez a base de 'avanzar, avanzar, avanzar'? Ahora tienes REPETIR. Prueba."

**Nivel 2 — Repetir un bloque (escalera/zigzag reciclado)**
- Recorrido en zigzag o L repetida, LOOPABLE (bloque limpio `avanzar+girar…`),
  evocando el antiguo w1-5. Prioriza legibilidad del patrón sobre vistosidad.
- Bloque de ~3-4 comandos repetido 3-4 veces.
- `budget: ~6` (la vía manual ~14-16 no cabe). intro que explota el reconocimiento
  del mapa: "El pasillo que te torturó… ¿lo reconoces? Fíjate en el patrón que se repite."

**Nivel 3 — La cuenta exacta**
- Pasillo recto que termina en muro justo tras la baliza. Repetir de más = choque.
- Obliga a calcular el N exacto. `budget: 3`.
- intro: "Cuidado: si repites de más, chocas. Cuenta bien cuántas veces."

**Nivel 4 — Bloque más rico**
- Cuerpo del bucle más largo (p. ej. `avanzar+avanzar+girar`). Recorrido en U o cuadrado.
- `budget: ~5`. intro: "El patrón ahora es más largo. Métele varios comandos al bucle."

**Nivel 5 — Bucle + cola**
- Bucle para el tramo largo + comandos sueltos para el remate final. Combina bucle y secuencia.
- `budget: ~5`. intro: "Un bucle para el pasillo… y unos comandos sueltos al final para llegar. Se pueden combinar."

**Nivel 6 — Bucle anidado (reto, requiere 4d)**
- "repite 4: [repite 3: avanzar, girar]" para recorrer un cuadrado. Reto opcional.
- `budget: ~5`. intro: "⭐ RETO: un bucle… dentro de otro bucle. Para valientes."
- Su `outro` siembra el Mundo 3.

**Orden de implementación:** niveles 1-5 primero (jugables sin anidar); el 6 tras la sub-pieza 4d.
