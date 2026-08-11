# BucleBot — Especificación del Mundo 3: CONDICIONALES

> Documento de diseño. Recoge las decisiones del Mundo 3.
> Sigue el principio rector del brief: no se puede ganar sin aplicar el concepto.
>
> NOTA: esta versión reemplaza el diseño inicial (monedas/bombas pasivas). La mecánica
> pasó a **monedas/puertas** tras detectar que la bomba pasiva no daba sentido real al
> condicional "SI bomba". Ahora cada objeto exige una acción condicional distinta.

---

## 1. Concepto
Introducir los **condicionales** (SI... ENTONCES... SI NO...) — el tercer pilar del
pensamiento computacional tras secuencias (Mundo 1) y bucles (Mundo 2).

## 2. El gancho: dos objetos, dos acciones
El dron recorre la rejilla y se encuentra objetos. Según lo que detecta en su casilla,
debe ejecutar la acción correcta:
- **Moneda** -> hay que **Recoger** (recojo lo bueno, suma al contador).
- **Puerta (cerrada)** -> hay que **Abrir** (abro para poder pasar).

El "SI... ENTONCES..." decide qué acción aplicar según el objeto. Como cada objeto
exige una acción DISTINTA, el condicional es genuinamente necesario: no vale una acción
única para todo.

## 3. La puerta bloquea (esto fuerza el condicional)
- Una **puerta cerrada bloquea el paso**: el dron NO puede avanzar más allá de una
  puerta cerrada. Si intenta avanzar hacia/sobre una puerta cerrada, se queda atrapado
  (se muestra un aviso).
- Para pasar, hay que **Abrir** la puerta primero (estando en/ante ella).
- Al abrirse, la puerta cambia visualmente de **cerrada a abierta / hueco** por el
  que se puede pasar libremente (feedback visual satisfactorio).

Esto hace la gestión de la puerta OBLIGATORIA: no se puede ignorar; hay que tratarla
con la acción correcta para continuar.

## 4. Errores simétricos e inmediatos
Ejecutar la acción equivocada sobre un objeto **falla de inmediato y reinicia** el
nivel (vuelta al inicio, como el choque del Mundo 2). Feedback inmediato = el alumno
aprende la relación causa-efecto en el acto, no de forma diferida.

| Accion \ Objeto | Moneda | Puerta cerrada | Vacio |
|-----------------|--------|----------------|-------|
| **Recoger**     | OK suma (efecto dorado) | X invalida -> reinicia | nada |
| **Abrir**       | X invalida -> reinicia | OK abre, desbloquea | nada |
| **Avanzar**     | pasa por encima | BLOQUEADO si cerrada (aviso) | pasa |

- Recoger sobre puerta / Abrir sobre moneda -> accion invalida, reinicia (con feedback
  visual de error claro).
- Avanzar contra puerta cerrada -> bloqueado, aviso ("puerta cerrada, abrela primero").

## 5. Objetivo de victoria (identidad del Mundo 3)
**Recoger todas las monedas + abrir todas las puertas + llegar al final del recorrido.**
El condicional es el corazon: recorrer el mapa aplicando la accion correcta a cada
objeto. Estilo "gestiona lo que encuentras".

## 6. El sensor (version simple, primer contacto)
- **Un solo sensor: qué hay en la casilla actual del dron** (moneda?, puerta?, vacio?).
- (Futuro, Mundo 4) sensor "qué hay delante" -> condicional de RUTA / navegacion.
  Aplazado a proposito.

## 7. Estructura del condicional
Forma completa **SI (condicion) ENTONCES (accion) SI NO (otra accion)** — el if/else.
- Selector de condicion flexible: **"SI hay moneda"** / **"SI hay puerta"**.
- Ejemplo: "SI hay moneda, recoge; SI NO, abre".

## 8. Mecanica de la UI (version simple)
- **Condicionales sueltos** (no anidados en bucle todavia).
- El alumno coloca el bloque; el bloque **decide al ejecutarse**.
- Paleta: Avanzar, Girar izq, Girar der, **Recoger**, **Abrir**, Repetir, SI...
- **Techo alto (reto opcional):** condicional dentro de bucle.

## 9. Interfaz del condicional (ya implementada, se reutiliza)
Cajon estilo Scratch de dos zonas: boton "SI...", selector de condicion (moneda /
puerta), zona ENTONCES (siempre) + zona SI NO (opcional). Se sella en la tira.

## 10. Escalera de niveles (rehacer con mecanica puerta/abrir)

| Nivel | Idea nueva | Resumen |
|-------|-----------|---------|
| 1 | El primer condicional | Monedas, sin puertas. "SI moneda: recoge". Concepto desnudo. |
| 2 | Aparece la puerta | Puerta cerrada bloquea. "SI puerta: abre" para continuar. |
| 3 | Distinguir (SI/SI NO) | Monedas Y puertas mezcladas. Cada objeto su accion. |
| 4 | Consolidacion | Varios objetos alternados. Repetitivo -> outro siembra el bucle. |
| 5 (reto) | Condicional en bucle | repite [avanzar, SI moneda recoge, SI NO abre]. Sintesis. Opcional. |

## 11. Estado de implementacion
- **Reutilizable tal cual:** motor de condicionales (executor evalua el arbol, flag
  done), modelo de datos (IfCommand, Condition), UI de crear condicionales, pintado del
  contenedor condicional, comando collect (Recoger).
- **A anadir/cambiar:**
  1. Nueva accion atomica **open** (Abrir), paralela a collect.
  2. Motor: puerta bloquea avance; abrir desbloquea; acciones invalidas -> reinicia;
     objetivo "monedas + puertas + final".
  3. Boton **Abrir** en la paleta.
  4. Feedback visual: puerta cerrada->abierta, moneda recogida, errores.
  5. Rehacer los 4 niveles, validados por codigo.
- **Renombrado:** "bomba" -> "puerta"; se elimina la explosion. Menos belico (mejor
  para app de menores) y la metafora encaja con "bloquea el paso".

## 12. Decisiones tomadas
- Concepto: condicionales. OK
- Objetos: moneda (recoger) / puerta (abrir). OK
- La puerta bloquea el paso hasta abrirla. OK
- Errores simetricos e inmediatos (accion equivocada -> reinicia). OK
- Feedback visual en aciertos y errores; puerta cerrada->abierta. OK
- Objetivo: recoger monedas + abrir puertas + llegar al final. OK
- Sensor: casilla actual; "mirar delante" -> Mundo 4. OK
- Selector de condicion flexible (moneda / puerta). OK
- Condicionales sueltos primero; condicional-en-bucle como reto opcional. OK
- Motor y UI de condicionales existentes se REUTILIZAN. OK
