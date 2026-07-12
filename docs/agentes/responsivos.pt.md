# Agentes responsivos

Versões quadrada, vertical e na regra dos terços de um deck, mais o estúdio de gravação 9:16.

## `/mira-squared`
Gera uma versão **quadrada** (1:1) de um deck a partir do original 16:9, ou cria slides quadrados do zero. Cada slide de conteúdo fica só com o título no topo e a animação num canvas quadrado padronizado abaixo; o eixo de cada animação é **reformulado por metáfora para preencher o quadrado** (sem faixa preta), o título encolhe para 2 linhas e o `viewBox` é casado ao quadrado. O lado do quadrado é a altura do 16:9 (`100vh`), centralizado, com **margens laterais em cinza #333**. Escreve um novo `index-1x1.html` ao lado do original. Para feed do Instagram, LinkedIn, etc.

## `/mira-vertical`
Gera uma versão **vertical** (9:16). Cada slide de conteúdo fica só com o título principal no topo e uma animação num canvas alto e padronizado abaixo; o título encolhe sozinho para caber em no máximo 2 linhas, e o eixo de cada animação é reformulado para o retrato (fluxo horizontal vira vertical, comparação lado a lado vira empilhada). Escreve `index-9x16.html`. Para Reels, Shorts, TikTok, Stories.

## `/mira-thirds`
Reenquadra um deck na **regra dos terços** sem mudar a proporção. Empurra o conteúdo de cada slide (título + animação) para as colunas 1 e 2 de um grid 3×3 (os dois terços da esquerda) e pinta a coluna da direita de **cinza #333, 100% limpa**, para você sobrepor texto, lower-third ou a câmera na edição. A animação é **reformulada por metáfora para preencher o box dos 2/3** (sem faixa fina). Funciona por cima do 16:9, 1:1 ou 9:16. Escreve um arquivo `-thirds`. Lado cinza é a direita por padrão; pode ser invertido.

## `/mira-studio`
Cria um **deck de gravação 9:16** (1080×1920) com a webcam do apresentador embutida **ao vivo dentro do slide** via getUserMedia, sem chroma key. Cada slide de conteúdo declara um de três layouts: `camera` (webcam na coluna inteira), `split` (animação quadrada em cima + câmera embaixo) ou `full` (animação vertical em tela cheia). Sem câmera, a área vira verde chroma #00FF00 puro. Um painel lateral (ou a tecla **R**) grava só a coluna 9:16 num MP4 nativo 1080×1920 (H.264) via Region Capture; a captura de janela no OBS segue como alternativa. Para Reels, Shorts, TikTok e videoaulas com o apresentador em cena.
