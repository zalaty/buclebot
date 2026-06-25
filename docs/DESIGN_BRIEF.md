# Brief de proyecto — Juego educativo de programación

> Documento puente. Adjúntalo al nuevo proyecto de Claude y úsalo como semilla del `CLAUDE.md` del repo.

## Qué es
App-juego para **aprender a programar jugando**, dirigida a alumnado de secundaria.
Diana inicial: **3º-4º ESO (14-16)**. Creado por un profesor de informática y robótica.
Doble objetivo, igual de importante: **enganchar** (para tener descargas) y **enseñar de verdad**.

## Principio rector de diseño
"Adictivo" y "educativo" no son capas pegadas: **coinciden en el mismo instante**.
Regla innegociable: **no se puede ganar sin aplicar el concepto**. El momento "ahá" es a la vez el chute que engancha y el aprendizaje.

Pilares:
- **Puntuar por eficiencia** (nº de comandos), no por acierto → rejugabilidad + pensamiento computacional real.
- **Suelo bajo, techo alto**: fácil de empezar, profundo para dominar.
- **Concepto legible**: nombrar lo que se usa ("esto es un BUCLE") para que transfiera al aula y al examen.
- **Escalera bloques → código real** como progresión (puente de "juguete" a habilidad).
- **Panel del profe** (qué concepto domina cada alumno) = distribución viral profe a profe. *(Fase 2)*

## Plataformas — las dos de primera
En clase no se usan móviles, así que la **web es co-protagonista**, no opcional:
- **Web** = se juega EN CLASE (Chromebooks / PCs del aula).
- **App móvil** = casa + descargas. Android/Google Play primero (pipeline EAS), iOS después.
- **Un solo código**: Expo + React Native Web.
- Diseñar para **ratón/teclado Y táctil desde el día 1**; layouts responsive a pantalla grande y a móvil. (Ej.: encadenar comandos debe ir igual de fino con clic que con dedo.)

## MVP — primera rebanada jugable
- **Concepto:** secuencias básicas.
- **Mecánica clave:** "planifica y ejecuta" — se monta la secuencia entera y corre sin poder corregir a mitad (obliga a simular mentalmente).
- **Juego:** un dron en una rejilla; comandos `avanzar / girar izq / girar der`; llegar a la baliza en ≤ "par" comandos.
- **5 niveles** escalando; el último, **repetitivo a propósito**, para sembrar el deseo de los BUCLES (gancho hacia el Mundo 2).
- Existe un **prototipo HTML** de referencia (adjunto aparte): es solo un boceto para validar la sensación; **se reescribe en Expo**, no se despliega.

## Decisiones técnicas
- **Niveles como DATOS** (array/JSON), nunca hardcodeados → añadir niveles/mundos = añadir datos, sin tocar la lógica.
- **Editor visual de niveles** = fase 2 (cuando el núcleo esté validado).
- Motor: estado del dron `{x, y, dir}`, ejecutor de la secuencia con animación, scoring por nº de comandos vs. par, detección de choque/objetivo.
- No usar almacenamiento del navegador para el estado del juego (mantenerlo en memoria/estado de la app).

## Stack y contexto
- **Expo / React Native / EAS.** GitHub: `zalaty`. Entorno: Linux (Lubuntu).
- Desarrollador con rodaje: apps ya publicadas (Mundial 2026, clima, satélite).

## Próximos pasos
1. Crear repo nuevo en GitHub.
2. Con Claude Code: scaffold de Expo (web + móvil), portar el motor de niveles del prototipo, y los 5 niveles de secuencias.
3. Probar con alumnos reales de 3º-4º ESO; observar dónde se iluminan y dónde se aburren.
4. Diseñar el **Mundo 2: bucles** sobre el mismo motor.
