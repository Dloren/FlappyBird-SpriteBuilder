# Pipi Potter

Juego móvil de sigilo en pixel art (estilo portátil de 8 bits, 160×144). Pipi siempre acaba potando cuando sale de fiesta: en cada nivel tiene que **potar 3 veces sin que le vean sus amigos, su novia o la familia**.

## Entregables

| Archivo | Qué es |
|---|---|
| `../dist/pipi-potter.html` | HTML único autocontenido (JS, CSS, gráficos y sonido generados por código). Se abre directamente en el navegador del móvil, sin servidor ni conexión. |
| `../dist/pipi-potter.apk` | APK Android (debug), la compila el workflow `.github/workflows/build-apk.yml` y la publica en *Releases*. |

## Controles

- **Cruceta**: mover (8 direcciones deslizando entre flechas).
- **A (mantener ~2 s)**: potar. Solo a partir del 50 % de náusea.
- **B**: usar el objeto equipado (mechero/botella: toca la pantalla para apuntar, o pulsa B otra vez para lanzarlo hacia delante).
- **START**: pausa + inventario (elige qué objeto va en B). **SELECT**: reglas rápidas.
- Teclado (PC): flechas/WASD, Z = A, X = B, Enter = START, Shift = SELECT.

## Estructura

```
src/
  config.js        todos los valores de balance (tiempos, %, velocidades, radios)
  main.js          arranque, escalado entero de la pantalla y flujo entre escenas
  engine/          bucle de paso fijo, entrada multitouch, fuente bitmap, raycasting de visión, A*, guardado, compartir
  audio/           sintetizador chiptune WebAudio + músicas originales
  assets/          generador de sprites 16×16, tiles, iconos e ilustraciones de game over
  entities/        Pipi, NPCs (máquina de estados de detección), charcos, huellas, humo, proyectiles
  levels/          los 5 niveles como datos (mapa ASCII, rutas, objetos, zonas de staff)
  scenes/          juego, título, menú, reglas, historial, resumen, game over, nombre, victoria
  ui/              HUD, frases del game over, tarjeta PNG para compartir
android/           proyecto Capacitor (vertical, pantalla completa, vibración)
scripts/           validación de niveles, test de estrés, capturas y generación de iconos
```

### Editar niveles

Cada nivel (`src/levels/*.js`) es un mapa ASCII (1 carácter = tile de 16 px; la leyenda de tiles está en `src/assets/tiles.js`), una paleta, NPCs con rutas `[x, y, espera, dirección]` en coordenadas de tile, objetos y zonas de trabajo del staff. Tras editar, ejecuta `node scripts/validate-levels.mjs`: comprueba anchos de fila, que spawns/waypoints/objetos sean transitables y que todas las rutas tengan camino.

## Comandos

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # genera ../dist/pipi-potter.html
npm test         # valida niveles + build + test de estrés de los 5 niveles en Chromium
npm run apk      # con JDK 21 + Android SDK instalados: build + cap sync + gradlew assembleDebug → ../dist/pipi-potter.apk
```
