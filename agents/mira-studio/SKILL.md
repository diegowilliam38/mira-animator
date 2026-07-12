---
name: mira-studio
description: >-
  Gera um deck VERTICAL 9:16 (1080x1920) pronto para gravar no OBS Studio, onde
  cada slide declara um de três layouts: camera (webcam ao vivo em tela cheia),
  split (animação quadrada estilo mira-squared em cima + câmera embaixo) e full
  (animação vertical estilo mira-vertical). A câmera do apresentador é embutida
  ao vivo no slide via getUserMedia (módulo mira/mira-camera.js), sem chroma
  key: no OBS basta capturar a janela. Sem câmera, a área vira verde chroma
  #00FF00 como plano B. Use SEMPRE que o usuário disser /mira-studio,
  deck para OBS, deck com câmera, slide com câmera, meio a meio, câmera
  embutida, deck para gravar vídeo comigo falando, ou pedir slides que misturam
  câmera e animação num vídeo vertical.
---

# Skill: Mira Studio (9:16 com câmera embutida, pronto para OBS)

Cria decks verticais 9:16 para gravação de vídeo (Reels, Shorts, TikTok, videoaula) em que o apresentador aparece AO VIVO dentro do próprio slide. Cada slide declara um layout, e o usuário escolhe **slide a slide, na conversa**:

- **`camera`** — a webcam preenche a coluna inteira (você falando).
- **`split`** — quadrado 1:1 no topo com título + animação (padrão `mira-squared`) e a câmera preenchendo o resto embaixo (você + a metáfora).
- **`full`** — animação vertical em tela cheia (padrão `mira-vertical`, sem câmera).

> **Fonte da verdade:** o padrão desta skill está congelado no deck de referência (validado em 2026-07-11). Resolva o arquivo nesta ordem:
> 1. `mira-templates/decks/mira-studio-demo/index.html` (projeto com Mira instalado)
> 2. `templates/decks/mira-studio-demo/index.html` (repositório fonte do Mira)
> 3. `node_modules/mira-animator/templates/decks/mira-studio-demo/index.html`
>
> Se nenhum existir, peça para rodar `npx mira-animator update`. Em dúvida sobre um valor exato, o resultado deve bater com o deck de referência.

## O resultado, em uma frase

Uma coluna 9:16 central (laterais `#333333`) onde cada slide de CONTEÚDO (`body > section`) declara `data-layout="camera|split|full"` (capa e encerramento, sem `data-layout`, mantêm layout próprio): nas áreas `.cam-area` o módulo `mira/mira-camera.js` injeta o feed da webcam ao vivo (`object-fit: cover`, espelhado estilo selfie), nas áreas de animação valem as regras congeladas das skills irmãs, e o deck inteiro está pronto para o OBS capturar a janela sem chroma key.

## Fluxo conversacional (como o usuário monta o deck)

O usuário descreve o roteiro e diz o layout de cada slide, por exemplo: "slide 1 só câmera, slide 2 meio a meio sobre X, slide 3 só animação sobre Y". Para cada slide:

1. `camera` → gere só `<section data-layout="camera"><div class="cam-area"></div></section>`. Nada de texto por cima (a fala é do apresentador).
2. `split` → título curto (máx. 6 palavras) + metáfora animada PENSADA PARA O QUADRADO (radial/orbital/hub rende mais) + `.cam-area` embaixo.
3. `full` → título curto + metáfora animada PENSADA PARA O RETRATO (eixo dominante vertical: fluxo desce, comparação empilha).

Se o usuário não declarar o layout de um slide, pergunte. A capa é opcional (deck de gravação pode começar direto no primeiro slide do roteiro); quando houver capa, ela segue a diretiva do título com `text-wrap: balance`.

## Dimensão

O quadro é **9:16 cravado e generalista para a tela**: `--fmt-w: calc(100vh * 9 / 16)`, `--fmt-h: 100vh` (numa tela 1080p, ~607x1080; o OBS recorta a coluna e grava em 1080x1920). Não fixe pixels. Diferente do `mira-vertical` clássico (`100vw/3`), aqui a proporção exata importa porque a saída é vídeo 9:16.

## As regras herdadas (não reinvente)

- **Área de animação do `split`:** é um quadrado (`aspect-ratio: 1/1`, lado = largura da coluna) com área segura proporcional de `4.63%` (50/1080), título dentro no topo e animação preenchendo o resto com `casarPalco` + `fitToArea` (código canônico em `agents/mira-squared/SKILL.md`). Vale o CRITÉRIO Nº 1: a animação preenche a maior parte do quadrado.
- **Slide `full`:** título no topo (máx. 2 linhas, IIFE `fitTitles`), palco ocupando todo o resto, metáfora com eixo vertical, `casarPalco` + `fitToArea` (playbook de composição em `agents/mira-vertical/SKILL.md`).
- **Regra Zero:** toda animação tem loop interno infinito com generation counter (`window.__slugGen`).
- **Idioma:** `agents/_shared/idioma.md`. Proibido travessão; acentuação correta.
- **Fonte mínima:** nenhum texto renderiza abaixo de 13px (SVG: `font-size >= 24` para `W = 960`).
- **Cor:** laranja da marca `#FF904D`; sem arco-íris.
- **Todo deck:** os 5 módulos em `mira/` referenciados antes de `</body>`, nesta ordem: `mira-edit.js`, `mira-edit-free.js`, `mira-draw.js`, `mira-camera.js`, `mira-record.js`. Libs vendoradas em `assets/vendor/`.

## O módulo mira/mira-camera.js (contrato)

Fonte canônica em `templates/authoring/mira-camera.js`; copie para `mira/` do deck. O que ele garante:

- **Stream único por sessão:** um só `getUserMedia({video, audio: false})` memoizado; todas as `.cam-area` compartilham o mesmo `MediaStream` (uma permissão, sem flicker).
- **Vídeo sempre mudo:** o áudio da gravação é do OBS/microfone.
- **Fallback verde chroma:** sem câmera (contexto `file://`, permissão negada, sem dispositivo), cada `.cam-area` ganha `.cam-fallback` (fundo `#00FF00` PURO, nada por cima) e um aviso discreto aparece FORA da área, sumindo em 5s. Plano B: filtro Chroma Key do OBS.
- **Tecla C:** alterna espelhamento (`body.cam-mirror`, padrão LIGADO, estilo selfie). Fica quieto durante os modos E/P e digitação.
- **Encerramento:** tracks paradas no `pagehide`.

A skill NÃO reimplementa nada disso: só marca as áreas com `.cam-area` e inclui o script.

## O módulo mira/mira-record.js (gravação nativa, sem OBS)

Fonte canônica em `templates/authoring/mira-record.js`; copie para `mira/` do deck. Painel de gravação no lado DIREITO da tela (fora da coluna, portanto fora do vídeo):

- **Grava SOMENTE a área dos slides:** captura a própria aba (`getDisplayMedia` com `preferCurrentTab`) e recorta a track para a coluna 9:16 via **Region Capture** (`CropTarget.fromElement` + `track.cropTo`) — recorte na GPU. A track recortada alimenta um canvas fixo de **1080x1920**, desenhado só a cada frame novo (`requestVideoFrameCallback`), então o MP4 sai na resolução nativa de Reels/Shorts, constante do início ao fim e em H.264 `avc1` — aceito direto por WhatsApp, Instagram e YouTube, sem reencode. Sem `CropTarget`, o recorte é feito no próprio `drawImage`.
- **MP4 primeiro:** `MediaRecorder` em `video/mp4` (H.264 `avc1`, 12 Mbps) quando o Chrome suportar; senão WebM, com aviso no painel.
- **Diagnóstico de lentidão:** mede o FPS efetivo nos primeiros 2s; abaixo de ~20 fps o painel avisa para checar `chrome://gpu` (aceleração de hardware LIGADA) e fechar outras abas. Em notebook, grave na tomada.
- **Microfone opcional:** toggle no painel, mixado na gravação (a câmera já está composta no slide).
- **Controles:** botão Gravar/Parar no painel ou tecla **R** (quieta nos modos E/P e digitação). Ao iniciar, o usuário escolhe "Esta guia" no seletor do navegador. O arquivo baixa sozinho ao parar (`mira-reels-<timestamp>.mp4`).
- O painel some em telas estreitas (a coluna ocupa tudo) e nunca aparece na gravação.

O OBS continua como alternativa (captura de janela + recorte); a gravação nativa é o caminho sem instalação.

## Bloco `<style id="mira-formato-multi">` canônico (gerar exatamente isto)

```html
<style id="mira-formato-multi">
  /* Coluna 9:16 cravada, generalista para a tela (saída OBS 1080x1920). */
  :root { --fmt-w: calc(100vh * 9 / 16); --fmt-h: 100vh; }
  html { background: #333333; }
  body { background: #333333; display: flex; flex-direction: column; align-items: center; }
  body > section {
    position: relative;
    width: var(--fmt-w); height: var(--fmt-h); min-height: var(--fmt-h);
    overflow: hidden; background: var(--mira-bg, #0d0d0f);
    display: flex; flex-direction: column;
  }
  /* camera: webcam na coluna inteira */
  section[data-layout="camera"] .cam-area { flex: 1 1 auto; min-height: 0; }
  /* split: quadrado 1:1 no topo (área segura proporcional 50/1080) + câmera no resto */
  section[data-layout="split"] .split-top {
    width: 100%; aspect-ratio: 1 / 1; flex: 0 0 auto;
    display: flex; flex-direction: column; padding: 4.63%;
  }
  section[data-layout="split"] .split-top h2 { flex: 0 0 auto; }
  section[data-layout="split"] .cam-area { flex: 1 1 auto; min-height: 0; }
  /* full: animação vertical na coluna inteira */
  section[data-layout="full"] .full-wrap {
    flex: 1 1 auto; min-height: 0;
    display: flex; flex-direction: column; padding: 4.63% 4.63% 3%;
  }
  section[data-layout="full"] h2 { flex: 0 0 auto; }
  /* palco: preenche todo o resto (viewBox casado em runtime pelo casarPalco) */
  .anim-stage { flex: 1 1 auto; min-height: 0; width: 100%; }
  .anim-stage svg { width: 100%; height: 100%; display: block; }
</style>
```

Injete também o IIFE `fitTitles` (auto-ajuste de título para máx. 2 linhas) e a navegação por teclado quieta durante E/P (ambos no deck de referência).

## Passos

1. **Colher o roteiro.** Liste com o usuário os slides e o layout de cada um. Sem layout declarado, pergunte.
2. **Criar a estrutura.** `decks/<nome>/` com `index.html`, `mira/` (edit, edit-free, draw, camera copiados de `templates/authoring/`) e `assets/vendor/d3.v7.min.js` quando houver animação.
3. **Gerar os slides.** Um `body > section` por slide com `data-layout` correto; `.cam-area` nas áreas de câmera; animações nativas da geometria (quadrado no `split`, retrato no `full`) com `casarPalco` + `fitToArea` e loop interno.
4. **Injetar os blocos canônicos.** `<style id="mira-formato-multi">`, `fitTitles`, navegação, e os cinco `<script defer src="mira/...">` antes de `</body>` (`mira-edit.js` → `mira-edit-free.js` → `mira-draw.js` → `mira-camera.js` → `mira-record.js`).
5. **Verificar.** Servido em localhost: câmera nas áreas certas, permissão pedida uma vez, animações preenchendo, títulos em máx. 2 linhas. Em `file://`: áreas verdes `#00FF00` puras.
6. **Reportar.** Caminho do deck, layout de cada slide (uma linha por slide) e a receita OBS: servir com `node lib/mira-serve.js decks/<nome>` (ou `npx mira-animator serve`), Chrome em tela cheia, Captura de Janela no OBS, recorte na coluna, gravação 1080x1920.

## Edge cases (do mais comum ao menos)

- **Aberto em `file://`:** `getUserMedia` não existe; todas as áreas de câmera ficam verde chroma e o aviso ensina a servir em localhost. O deck continua navegável e gravável (keying manual).
- **Permissão negada / sem webcam:** mesmo fallback verde; aviso específico.
- **Webcam 16:9 numa área 9:16 ou quadrada:** `object-fit: cover` corta as sobras, nunca distorce.
- **Título longo no `split`/`full`:** `fitTitles` reduz até 2 linhas; o `casarPalco` re-casa o palco à altura restante.
- **Vários slides com câmera:** todos compartilham o MESMO stream; trocar de slide não repete o prompt.
- **Tecla C durante edição (modo E) ou digitação:** o módulo ignora, sem conflito.
- **Deck sem nenhuma `.cam-area`:** o módulo fica inerte (não pede permissão à toa).

## Checklist

**Os que mais falham (cheque primeiro):**
- [ ] Cada slide com o `data-layout` que o usuário pediu, na ordem do roteiro.
- [ ] `split`: quadrado 1:1 exato no topo, animação PREENCHENDO o quadrado (Critério nº 1), câmera no resto.
- [ ] `full`: animação vertical preenchendo o palco, sem faixa fina.
- [ ] Câmera: stream único, mudo, espelhado por padrão, tecla C alternando.
- [ ] Fallback: em `file://` as áreas ficam `#00FF00` PURO, sem texto por cima.

- [ ] Coluna `calc(100vh * 9/16)` x `100vh`, laterais `#333333`, centralizada via flex.
- [ ] `mira/` com os 5 módulos e tags na ordem certa antes de `</body>`.
- [ ] Loop interno em toda animação; generation counter presente.
- [ ] Nenhum texto abaixo de 13px renderizados; título máx. 2 linhas.
- [ ] Capa (se houver) com `text-wrap: balance`; sem travessão em texto visível.
- [ ] Receita OBS reportada ao final.
