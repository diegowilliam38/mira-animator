# Agentes responsivos

Versiones cuadrada, vertical y en la regla de los tercios de un deck, más el estudio de grabación 9:16.

## `/mira-squared`
Genera una versión **cuadrada** (1:1) de un deck a partir del original 16:9, o crea slides cuadrados desde cero. Cada slide de contenido queda solo con el título arriba y la animación en un canvas cuadrado estandarizado debajo; el eje de cada animación se **reformula por metáfora para llenar el cuadrado** (sin franja negra), el título se encoge a 2 líneas y el `viewBox` se ajusta al cuadrado. El lado del cuadrado es la altura del 16:9 (`100vh`), centrado, con **márgenes laterales en gris #333**. Escribe un nuevo `index-1x1.html` al lado del original. Para feed de Instagram, LinkedIn, etc.

## `/mira-vertical`
Genera una versión **vertical** (9:16). Cada slide de contenido queda solo con el título principal arriba y una animación en un canvas alto y estandarizado debajo; el título se encoge solo para caber en máximo 2 líneas, y el eje de cada animación se reformula para el retrato (flujo horizontal pasa a vertical, comparación lado a lado pasa a apilada). Escribe `index-9x16.html`. Para Reels, Shorts, TikTok, Stories.

## `/mira-thirds`
Reencuadra un deck en la **regla de los tercios** sin cambiar la proporción. Empuja el contenido de cada slide (título + animación) a las columnas 1 y 2 de una grilla 3×3 (los dos tercios de la izquierda) y pinta la columna de la derecha de **gris #333, 100% limpia**, para que superpongas texto, lower-third o la cámara en la edición. La animación se **reformula por metáfora para llenar el box de los 2/3** (sin franja fina). Funciona sobre 16:9, 1:1 o 9:16. Escribe un archivo `-thirds`. El lado gris es la derecha por defecto; puede invertirse.

## `/mira-studio`
Crea un **deck de grabación 9:16** (1080×1920) con la webcam del presentador incrustada **en vivo dentro del slide** vía getUserMedia, sin chroma key. Cada slide de contenido declara uno de tres layouts: `camera` (webcam en toda la columna), `split` (animación cuadrada arriba + cámara abajo) o `full` (animación vertical a pantalla completa). Sin cámara, el área pasa a verde chroma #00FF00 puro. Un panel lateral (o la tecla **R**) graba solo la columna 9:16 en un MP4 nativo 1080×1920 (H.264) vía Region Capture; la captura de ventana en OBS sigue como alternativa. Para Reels, Shorts, TikTok y videolecciones con el presentador en escena.
