# Visuales y datos

Visuales estáticos, gráficos, códigos QR, 3D real y plantillas a partir de imagen.

## `/mira-visuals`
Imágenes estáticas para slides: paneles, diagramas, gráficos e infografías — cuando un concepto queda mejor como un visual fijo y denso que como movimiento.

## `/mira-chart`
Convierte datos en gráficos con impacto: a partir de un CSV/JSON, de una imagen de gráfico, o de un boceto a mano — y recomienda el mejor tipo de gráfico a partir de una galería.

## `/mira-qrcode`
Inserta un **código QR** grande, centrado y escaneable en un slide, generado a partir de un enlace o texto que provees. El QR se genera **localmente** en el momento del montaje (el paquete npm `qrcode`) y se incrusta como un SVG inline, sin dependencia en tiempo de ejecución, sin API externa y sin CDN, así que el slide funciona incluso desde `file://`. Card limpio, mismo patrón que `mira-3d`: solo el título del slide y el QR grande, sin leyenda con el enlace debajo. La escaneabilidad guía el estilo: módulos oscuros sobre un card blanco, zona de silencio preservada, naranja solo en el marco y el título. El QR queda estático: el bucle interno vive en el marco (pulso de glow, esquinas que respiran), nunca sobre los módulos.

## `/mira-3d`
Añade un **elemento 3D real** al canvas de un slide (profundidad real, auto-rotación continua e interacción de arrastrar para rotar / zoom) en un card limpio donde el elemento queda maximizado. Elige una de tres capas según tu pedido: CSS 3D puro (formas simples), Three.js procedural (formas abstractas como esferas de partículas y redes de nodos, u objetos low-poly construidos a partir de primitivas), o glTF (cuando provees un `.glb`, o aceptas una búsqueda de un modelo gratuito y licenciado en la web). Hereda la regla madre: el 3D nunca entra en estático, así que la auto-rotación se pausa al arrastrar y vuelve a continuar.

!!! warning "La capa glTF necesita un servidor"
    Un slide que carga un `.glb` local **no** se abre desde `file://` (el navegador bloquea la carga del modelo), solo por HTTP. En ese caso el agente arranca un servidor local, te entrega el enlace `http://localhost` y escribe un lanzador de doble clic (`abrir-slide.cmd`) para que puedas presentar después. Esta capa necesita **Node.js** instalado. Las capas CSS 3D y procedural no usan ningún asset local y se abren directo desde `file://`, sin servidor.

## `/mira-svg-morph`
Genera un slide donde una forma SVG **se transforma en otra** (morph), en bucle continuo, con GSAP + MorphSVGPlugin vendorados localmente (el deck corre offline, desde `file://`). Apuntas a 2 o más archivos `.svg` de la carpeta `assets/` del deck, en el orden del morph: 2 SVGs van y vuelven, N SVGs se encadenan (A en B en C ... vuelve a A). La skill incrusta los `<path>` inline con ids únicos (sin colisión entre varios SVGs en un mismo documento), corre `convertToPath` en formas que no son path, y arma el bucle. Card limpio, mismo patrón que `mira-3d`: solo el título y la forma transformándose grande y centrada, en naranja #FF904D. MorphSVG transforma path en path (no SVG entero en SVG entero): multi-path se transforma par a par, solo la silueta, y queda más limpio cuando ambos SVGs comparten el mismo viewBox. Para metáforas densas o emergentes (partículas, explosiones), usa `mira-animator`.

## `/mira-icon-morph`
El mismo morph, pero a partir de **conceptos en palabras** cuando no tienes los archivos. Dices "una nube que se vuelve bombilla"; la skill busca en la API de Iconify, valida la licencia, descarga los SVGs, los incrusta inline y arma el morph. Prefiere íconos de path único en viewBox 0 0 24 24 (se transforman limpio), usa solo licencias abiertas (MIT, Apache-2.0, CC0 o CC-BY), registra la atribución en el `CREDITS.md` del deck, y rechaza IP protegida (personajes de franquia), sugiriendo arte original. Internet se usa solo en la generación; el deck final queda offline. Reaprovecha el núcleo de render de `mira-svg-morph`.

## `/mira-svg-animator`
Anima un SVG que provees, dándole movimiento propio a la forma (no se convierte en otra, eso es morph). Pasas un `.svg` y describes el movimiento en palabras: batir alas, girar una rueda, deslizar, pulsar, dibujar el contorno, seguir una curva. La skill elige la técnica de GSAP: transform (rotate/scale/translate), DrawSVG (el trazo se dibuja) o MotionPath (movimiento por curva). Punto clave: para animar una parte, esta debe ser un elemento separado; si el SVG es un path único fusionado, la skill separa la parte (corte por un eje con clipPath, o edición del path para aislar/quitar un tramo, como mantener las antenas quietas). También quita fondos opacos y define el origen del movimiento (la bisagra o el centro de rotación). Bucle y `prefers-reduced-motion` respetados; GSAP vendorado, funciona desde `file://`.

## `/mira-image-template`
Crea una **nueva plantilla de deck a partir de imagen(es)**. Envías capturas de pantallas/slides y/o el logo, y el agente reconoce todo el design system (colores, fondo, tipografía, esquinas, sombras, glassmorphism, glows) y, cuando hay captura, la **disposición de los elementos**, y monta una plantilla completa: el esqueleto `mira-templates/decks/<nombre>/index.html` con la identidad incrustada, más el tema `mira-templates/themes/<nombre>.css`. Al final pide un **nombre** y guarda. La plantilla pasa a ser ofrecida por `/mira-new` junto con las existentes, y su tema del mismo nombre se vuelve el predeterminado natural. La captura manda en el layout; el logo manda en la paleta.
