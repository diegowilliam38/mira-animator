# SPEC: Mesa Tática Interativa (mira-tactics)

Data: 05/07/2026 · Origem: sessão sandeco + Claude · Implementação de referência: `templates/decks/mesa-tatica/index.html` (motor oficial embarcado no pacote; nos projetos instalados chega como `mira-templates/decks/mesa-tatica/index.html`)

Este documento especifica o que foi construído nesta sessão para o alterador do Mira absorver na skill `mira-tactics`. O arquivo de referência é um HTML único, sem nenhuma dependência externa (sem CDN, sem D3), que roda por `file://`.

## 1. Visão geral

Slide independente com um campo de futebol cinematográfico onde dois times aparecem já posicionados na formação real. O apresentador manipula tudo ao vivo (mover, desenhar, gravar e reproduzir jogadas). Só o bloco `var TACTICS = {...}` no topo do `<script>` muda de um confronto para outro; o motor abaixo é fixo.

## 2. Visual ("bonitona")

- Gramado escuro com faixas de corte em xadrez, vinheta escura nas bordas, moldura azul iluminada estilo mesa, varredura de luz em loop perpétuo (Regra Zero do Mira atendida no cenário).
- Setas com glow dourado e um filete de luz branca correndo dentro (animação infinita). Zonas com brilho na cor escolhida.
- Título no SVG (não em HTML), alinhado à linha lateral ESQUERDA do campo, caixa alta com o "x" minúsculo ("BRASIL x NORUEGA"), levemente descolado da moldura. Crédito discreto "MIRA Animator by sandeco" na mesma linha de base, alinhado à linha lateral direita.
- Sem eyebrow por padrão (só se `TACTICS.eyebrow` for preenchido).

## 3. Peças (jogadores)

Dois estilos, alternáveis em runtime pelo botão ●/⛹ da barra:

- **boneco** (padrão): miniatura chibi desenhada proceduralmente em SVG: cabeça com cabelo, camisa na cor do time SEM número (borda da camisa na cor do calção), calção, bracinhos, pernas que TROTAM no lugar em loop perpétuo (cada jogador com fase e ritmo próprios). Número em branco com contorno escuro FLUTUANDO acima da cabeça. Tons de pele e cabelo variam deterministicamente por jogador. Corpo magro: camisa com 12.8 de largura no viewBox.
- **botao**: disco clássico na cor do time com número no centro.

Comum aos dois: sombra e halo pulsante na cor do time sob a peça, goleiro com cor própria (`goalie`), seleção escurece a peça e mostra balão com o nome, entrada com pop escalonado.

**Aparência real dos jogadores:** cada player aceita `skin` e `hair` opcionais para refletir a aparência real do atleta na mesa (ex.: Vini Jr., Gabriel Magalhães, Danilo e Rayan negros = 'escura'; Marquinhos, Casemiro e Matheus Cunha pardos = 'media'; Haaland, Ødegaard e Sørloth loiros; Alisson ruivo; Nusa pele média com cachos descoloridos de loiro). Tons nomeados: `skin: 'clara' | 'media' | 'escura'`, `hair: 'preto' | 'castanho' | 'loiro' | 'ruivo' | 'grisalho'`; hex direto também é aceito nos dois campos. Sem o campo, o motor cai na variação determinística. Ao montar um confronto real, o gerador DEVE preencher skin/hair do onze com base na aparência pública conhecida de cada jogador, marcando dúvidas como aproximação.

**Semântica dos tons (calibrada com o sandeco):** jogador negro = 'escura'; pardo = 'media'; 'media' NÃO serve para quem é negro (fica caramelo e não reflete a realidade). Em caso de dúvida entre media e escura para um atleta negro, use 'escura'.

## 4. CONFIG `TACTICS` (schema)

```js
var TACTICS = {
  sport: 'futebol',
  orientation: 'horizontal',      // ou 'vertical' (tecla V vira em runtime; ?vertical=1 na URL)
  eyebrow: '',                    // oculto se vazio
  title: 'Brasil x Noruega',
  teams: [{
    name, color, shorts, goalie,  // shorts é usado no calção e na borda da camisa
    formation: '4-3-3',           // 4-3-3 | 4-4-2 | 3-5-2 | 4-2-3-1 (11); fora disso, grade
    side: 'left'|'right',
    players: [{ num:'1', name:'Alisson', gk:true,
                skin:'clara', hair:'ruivo' }, ...]        // ordem casa com os slots da formação
  }, { ...time 2 }],
  arrows: [],                     // setas iniciais {u1,v1,u2,v2,color} — padrão: vazio
  shapes: []                      // zonas iniciais {type:'rect'|'ellipse',u0,v0,u1,v1,color} — padrão: vazio
};
```

Coordenadas de campo normalizadas: `u` 0..1 no comprimento (gol esquerdo → direito), `v` 0..1 na largura. Virar para vertical é só remapear (u,v); nada é recalculado.

### 4.1 OBRIGATÓRIO na criação de times (regra inegociável)

Quando o usuário pedir para criar os times, CADA jogador do onze tem 4 atributos obrigatórios, e os 4 devem ser CONFIRMADOS (pesquisados e validados) na criação, nunca deduzidos de memória:

1. **Nome** — o titular que de fato começou (último jogo disputado ou escalação do jogo do dia), não "escalação provável de memória" nem time-base.
2. **Número** — da numeração oficial do torneio (ex.: lista da CBF); sem fonte confiável, aproximar e MARCAR como não confirmado no reporte.
3. **Posição** — o slot real na formação (ponta esquerda x direita, lateral, volante, centroavante), confirmado na fonte; a ordem do array `players` codifica isso (ex. real: Vini Jr. é ponta ESQUERDA).
4. **Aparência pública** — `skin` e `hair` refletindo a aparência real e amplamente conhecida do atleta (ex.: Vini Jr., Gabriel Magalhães e Danilo negros; Haaland, Ødegaard e Sørloth loiros; Alisson ruivo; Nusa pele média com cachos descoloridos). Em dúvida, usar o tom mais provável e marcar como aproximação.

**Método de confirmação da aparência (validado na sessão):** baixar a foto oficial de cada jogador (API da Wikipédia: `action=query&prop=pageimages&pithumbsize=330`, com o título URL-encoded) e OLHAR a imagem, cruzando com mídia especializada quando houver (ex.: Alma Preta lista os atletas negros da seleção). Memória não vale como fonte: nesta sessão a memória errou Gabriel Magalhães, Casemiro, Cunha (mais escuros que o lembrado) e Pedersen, Heggem, Wolfe e Nusa (loiros, não castanhos).

O reporte final da criação deve citar as fontes usadas e listar explicitamente o que ficou como aproximação. Um jogador sem qualquer um dos 4 atributos é um erro de geração, não uma opção.

## 5. Barra de ferramentas (janela flutuante)

- Só ícones, com tooltip; sem rótulos de texto. `zoom: 1.21` no painel inteiro.
- Ferramentas: ✥ mover/selecionar (arrasto no vazio = seleção em caixa; grupo move junto), botões de adicionar jogador com um MINI BONECO nas cores de cada time (gerado da config), ➜ seta, ✎ paint (desenho livre à mão com glow, tecla P), ▭/◯ zonas, ✕ apagar (jogador, seta, zona ou traço), paleta de 6 cores (setas/zonas/paint), ●/⛹ estilo das peças, ⟳ virar, ↺ desfazer, ⌧ limpar (setas+zonas+traços), ? help.
- Janela arrastável pela alça ⠿. SEM botão de ocultar (decisão explícita: usuário se trancava para fora); ocultar/mostrar é só pela tecla F.
- No modo vertical a barra cola no rodapé do slide (bottom 2px) e re-centraliza.

## 6. Painel de ajuda

Botão `?` abre painel central "COMANDOS" listando atalhos, com botão de fechar estilo macOS (bolinha vermelha com ✕ SEMPRE visível). Esc fecha.

## 7. Gravação de jogada (keyframes)

Janela flutuante própria "JOGADA" (alça ⠿, arrastável), aberta/fechada pela tecla R. Posição inicial: dentro do campo, canto inferior esquerdo (left 14%, bottom 12%).

- Ao abrir com R pela primeira vez (nenhum quadro), a cena atual é capturada automaticamente como quadro 1.
- ⏺ Quadro: captura snapshot das posições (jogadores + bola). Contador `atual/total`.
- ▶ Play / ⏸ (barra de espaço): interpola entre quadros (1,2s por trecho, ease in-out cúbico), movendo os nós DOM direto por transform (o trote dos bonecos continua rodando). Pausa em qualquer ponto; tocar no campo também pausa; Play no fim recomeça do início.
- ✓ ATUALIZA o quadro atual com as posições da tela (navegue até o quadro com ◀/▶|, ajuste as peças, clique ✓; pisca verde ao confirmar). ⌫ APAGA só o quadro atual (a jogada se reconecta no quadro seguinte).
- ⏮ volta ao quadro 1; ◀ / ▶| passo a passo; ✕ apaga TODOS os quadros.
- **Ordem dos botões (decisão de UX):** ⏺ Quadro · contador · ✓ · ⏮ ◀ ▶ Play ▶| · ⌫ ✕ · | · 💾 ▤. Os destrutivos (⌫ e ✕) ficam JUNTOS no fim do grupo de navegação; o ⌫ não pode ficar ao lado do ⏮ (ícones parecidos confundem).
- Fluxo de edição de uma jogada salva: ▶ carrega → ◀/▶| até o quadro → arrasta as peças → ✓ atualiza o quadro → 💾 da linha sobrescreve o arquivo.
- 💾 salvar e ▤ listar (seção 8).

## 8. Persistência de jogadas: `data/` com um JSON por jogada

As jogadas são salvas como ARQUIVOS, um `.json` por jogada, na pasta `data/` dentro do deck (`decks/<deck>/data/<nome-slug>.json`).

**Contrato do arquivo (é também o formato de saída do futuro pipeline de vídeo/YOLO):**

```json
{
  "schema": "mira-tactics-play/1",
  "name": "contra-ataque pela esquerda",
  "title": "Brasil x Noruega",
  "frames": [
    { "players": { "1": [0.045, 0.5], "2": [0.15, 0.8] }, "ball": [0.5, 0.5] },
    { "players": { "...": [0, 0] }, "ball": [0.6, 0.4] }
  ]
}
```

- `frames` = quadros-chave; ids de jogador são os do motor (sequenciais na ordem da config: time 1 depois time 2); coordenadas u,v normalizadas 0..1.
- Escrita/leitura pelo slide via File System Access API do Chrome: botão 📂 conecta a pasta `data/` uma vez (handle fica na sessão), aí 💾 grava direto, ▤ lista os .json da pasta (carregar ▶ / excluir ✕).
- **PADRÃO OBRIGATÓRIO: ao apertar R, a lista de jogadas é carregada automaticamente da pasta `data/` do deck.** Na primeira vez da sessão o picker de pasta abre sozinho (o R é gesto de usuário, então a API permite; o Chrome já sugere a última pasta usada) e o usuário só confirma; conectada, a lista fica disponível a sessão inteira e os R seguintes recarregam a lista direto, sem picker. Se o usuário cancelar o picker, o painel mostra o estado desconectado e o 📂 refaz a conexão.
- **Atualizar uma jogada existente:** ao carregar (▶) o nome dela já fica preenchido no campo de salvar, então 💾 Salvar sobrescreve o mesmo arquivo; e cada linha da lista tem um 💾 próprio que sobrescreve aquele arquivo com a jogada atual da tela (pisca verde ao confirmar).
- Fallback sem a API: 💾 baixa o .json (usuário move para `data/`) e ⇪ importa um .json avulso.

## 9. Atalhos

| Tecla | Ação |
|---|---|
| F | mostra/oculta a barra de ferramentas |
| P | liga/desliga o paint |
| R | abre/fecha o painel de jogada (1ª vez grava o quadro 1) |
| V | vira o campo |
| espaço | play/pausa da jogada |
| Ctrl+Z | desfazer |
| Delete | apaga selecionados |
| Esc | fecha help/lista ou limpa seleção |
| duplo clique | renomeia o jogador (input flutuante) |

## 10. Pipeline futuro: vídeo → jogada (YOLO)

Ver `BRAINSTORM_VIDEO_PARA_JOGADA.md` neste mesmo deck. Resumo do requisito: um script externo (Ultralytics YOLO + ByteTrack + keypoints de campo do Roboflow + homografia) processa um vídeo real e gera NO FIM exatamente o JSON da seção 8, detectando VÁRIOS quadros-chave da movimentação (não um dump denso: quadros-chave nos momentos de inflexão da jogada, o replay interpola o resto). O slide carrega esse arquivo pela lista ▤ ou pelo ⇪ sem nenhuma mudança no motor.

## 11. Decisões de produto tomadas na sessão (não regredir)

1. Escalações reais pesquisadas (último jogo/jogo do dia) validando os 4 atributos obrigatórios de cada jogador: nome, número, posição e aparência pública (seção 4.1), com aproximações marcadas ao reportar.
2. Campo abre limpo: sem setas/zonas pré-desenhadas.
3. Sem nomes de ferramentas na barra; times como mini bonecos.
4. Sem botão de ocultar painel; teclas F/R são a única via.
5. Número acima da cabeça, camisa limpa (borda da camisa na cor do calção).
6. Painel de jogada nasce dentro do campo, embaixo à esquerda.
7. Título e crédito dentro do SVG, alinhados às linhas laterais.
8. Aparência pública é o 4º atributo obrigatório do jogador, confirmada por FOTO (seção 4.1); negro = 'escura', pardo = 'media'.
9. R carrega a lista de jogadas da pasta data/ automaticamente (seção 8); primeiro R também grava o quadro 1.
10. Botões destrutivos do painel de jogada (⌫ ✕) agrupados, longe do ⏮.
11. Jogada salva é atualizável: nome pré-preenchido ao carregar + 💾 de sobrescrever em cada linha da lista.
12. Barra de ferramentas com zoom 1.21 e painéis flutuantes SEM botão de ocultar (teclas F/R são a única via).
