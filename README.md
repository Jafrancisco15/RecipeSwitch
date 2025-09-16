# Conversor de recetas de espresso

Esta herramienta web te ayuda a traducir una receta de espresso existente a un
nuevo set up. Introduces tu receta base y describes los cambios en equipo o
accesorios (puck screen, filtros de papel, tipo de canasta, molino, etc.) y la
app sugiere ajustes de dosis, molienda, rendimiento y tiempo a partir de
principios documentados por Scott Rao, Jonathan Gagné, Barista Hustle y estudios
de extracción.

## Uso

No requiere instalación. Solo abre `index.html` en tu navegador y completa los
datos:

1. **Receta de referencia**: dosis, rendimiento en taza y tiempo actual.
2. **Configuración actual**: características del equipo con el que lograste esa
   receta.
3. **Configuración objetivo**: selecciona los cambios que vas a introducir.

La tarjeta de resultados mostrará la dosis y rendimiento sugeridos, la dirección
en la que conviene ajustar la molienda y un resumen de las razones detrás de los
cambios.

## Qué obtienes

- Un plan de ajuste que resume cómo mover la molienda, la dosis y el tiempo al
  nuevo escenario.
- Un listado de los cambios detectados (máquina, canasta, accesorios, molino,
  preinfusión) para que tengas claro qué modificaste.
- Argumentos citados de Rao, Gagné, Barista Hustle y publicaciones técnicas que
  fundamentan cada recomendación.

## Notas

- Las recomendaciones son orientativas. Ajusta siempre a partir de la cata y,
  cuando sea posible, midiendo TDS o rendimiento de extracción.
- Los ajustes de molienda se expresan en términos relativos para que puedan
  aplicarse tanto a molinos con pasos como a molinos continuos.
- El conversor asume recetas de espresso estándar (relaciones 1:1.5 a 1:3) y
  tiempos comprendidos entre 20 y 35 segundos. Para estilos muy fuera de ese
  rango, usa los resultados como punto de partida.
