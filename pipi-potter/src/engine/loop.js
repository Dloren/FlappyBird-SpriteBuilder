// Bucle de paso fijo a 60 Hz con acumulador
import { STEP } from '../config.js';

export function startLoop(update, render) {
  let last = performance.now();
  let acc = 0;
  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25; // evita la espiral de la muerte al volver de segundo plano
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) { update(STEP); acc -= STEP; steps++; }
    if (steps === 5) acc = 0;
    render(acc / STEP);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
