# Requirements: Edição Livre estilo Canva no Modo de Edição do MIRA

> Identificador: `001-edicao-livre-canva`
> Data: `2026-07-09`
> Pasta das specs: `_reversa_sdd/mira-edit-livre/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

Estende o modo de edição do MIRA (tecla `e`, hoje só reordena slides) para edição livre estilo Canva: clicar em qualquer elemento do slide, ver alças e manipulá-lo — mover, redimensionar, rotacionar, duplicar, excluir e editar texto — e salvar as edições em arquivo. Alvo: o autor de decks MIRA (sandeco), no polimento fino de um deck já pronto, sem abrir o código.

## 2. Contexto a partir do legado (specs SDD e código real)

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/mira-edit-livre/prd.md#4` | Escopo: selecionar, editar texto, redimensionar, mover, rotacionar, duplicar, excluir, persistir | 🟡 |
| `_reversa_sdd/mira-edit-livre/sdd/selecao-de-elemento.md` | Contrato de elemento editável + seleção por clique | 🟡 |
| `_reversa_sdd/mira-edit-livre/sdd/transform-direto.md` | Mover/redimensionar/rotacionar sem brigar com animação | 🟡 |
| `_reversa_sdd/mira-edit-livre/sdd/acoes-de-elemento.md` | Editar texto inline, duplicar, excluir | 🟡 |
| `_reversa_sdd/mira-edit-livre/sdd/persistencia.md` | Salvar em arquivo (sobrescrever/novo), padrão mesa-tática | 🟡 |
| `templates/authoring/mira-edit.js` (código real) | Modo `e`, `body.me-on`, save via `POST /__mira_save` (http) ou File System Access API (file://); NÃO serializa DOM, relê a fonte | 🟢 |
| `templates/authoring/mira-draw.js` (código real) | Desenhos são bitmap num `<canvas>` único, sem nó DOM por traço, sem id, não persistem (`window.miraDraw` em memória) | 🟢 |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| sandeco (autor de decks MIRA) | Ajustar um deck pronto sem código | Entra no modo `e`, clica num título, arrasta/redimensiona/edita o texto e salva |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** O modo de edição (`body.me-on`) passa a expor, além da reordenação de slides, a manipulação direta de elementos individuais do slide ativo. 🟡
   - Tipo: alterada (estende `mira-edit.js`)
2. **RN-02:** "Elemento editável" = nó DOM dentro de um slide (`.me-slide`) que casa a lista de seletores de conteúdo (títulos, textos, ícones SVG, imagens, blocos com `data-me-editable`), excluindo o chrome do editor. 🟡
3. **RN-03:** Desenhos do `mira-draw` (canvas bitmap) **não** são elementos editáveis nesta versão, por não existirem como nó DOM addressável. 🟢
4. **RN-04:** As edições são persistidas como um bloco de overrides embutido na fonte (`<script id="mira-free-edits" type="application/json">`) + um applier que as reaplica no load — **não** por serialização do DOM animado, coerente com a filosofia do `mira-edit.js`. 🟡

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | No modo `e`, clicar num elemento editável do slide o seleciona com contorno e alças | Must | Clique seleciona texto, ícone e imagem; overlay ancora na caixa real | 🟡 |
| RF-02 | Mover o elemento selecionado arrastando o corpo | Must | Elemento acompanha o cursor e fica na nova posição | 🟡 |
| RF-03 | Redimensionar pelas 8 alças (cantos = uniforme, laterais = um eixo) | Must | Arrastar alça amplia/reduz o elemento | 🟡 |
| RF-04 | Rotacionar pela alça de rotação | Must | Arrastar a alça gira o elemento em torno do centro | 🟡 |
| RF-05 | Editar texto inline por duplo clique (Enter/blur confirma, Esc cancela) | Must | Novo conteúdo reflete no slide; Esc restaura | 🟡 |
| RF-06 | Duplicar o elemento selecionado | Must | Cópia deslocada e já selecionada, herda transform | 🟡 |
| RF-07 | Excluir o elemento selecionado (controle ou tecla Delete) | Must | Elemento some, seleção limpa | 🟡 |
| RF-08 | Salvar as edições em arquivo (sobrescrever o mesmo ou novo), reusando o transporte do `mira-edit.js` | Must | Deck salvo reabre com as edições aplicadas | 🟡 |
| RF-09 | O overlay de edição não vaza para o HTML salvo nem para a apresentação | Must | HTML salvo não contém alças/contornos | 🟡 |
| RF-10 | A edição livre coexiste com a reordenação de slides sem conflito de teclas/eventos | Should | `e` liga ambos; desenho (tecla `P`) não colide | 🟡 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Desempenho | Resposta visual da seleção < 100 ms; arraste fluido (~60 fps) | `sdd/transform-direto.md#RNF` | 🟡 |
| Stack | Vanilla JS puro, offline-first, sem libs novas; apoio em `mira/` | PRD restrição técnica confirmada | 🟢 |
| Compatibilidade | Não modificar o comportamento do `mira-edit.js` existente; acoplar por observação de `body.me-on` | `mira-edit.js` real | 🟢 |
| Integridade | Arquivo salvo em UTF-8, sem corromper scripts/assets/marcação | `sdd/persistencia.md#RNF` | 🟡 |

## 7. Critérios de Aceitação

```gherkin
Cenário: Ajustar um título e salvar
  Dado um deck MIRA aberto e servido por http (mira-serve/remote)
  Quando pressiono "e", clico no título, arrasto, redimensiono e edito o texto
  E aciono salvar escolhendo sobrescrever
  Então o arquivo é regravado e, ao recarregar, o título aparece movido, redimensionado e com o novo texto

Cenário: Duplicar e excluir
  Dado um elemento selecionado no modo de edição
  Quando aciono duplicar e depois excluo a cópia
  Então a cópia aparece deslocada e some ao excluir, sem afetar o original

Cenário: Elemento de desenho (fora do escopo)
  Dado um traço feito pelo mira-draw no canvas
  Quando clico sobre ele no modo de edição
  Então nada é selecionado (desenhos de canvas não são editáveis nesta versão), sem erro

Cenário: Salvar sem servidor nem File System Access
  Dado um deck aberto em navegador sem gravação direta
  Quando aciono salvar
  Então recebo aviso claro de como habilitar a gravação, sem corromper nada
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01..RF-08 | Must | Núcleo da edição livre + persistência |
| RF-09 | Must | HTML salvo não pode conter artefatos de edição |
| RF-10 | Should | Coexistência; risco baixo por namespaces distintos |
| Desenhos de canvas editáveis | Won't (esta versão) | Não são nós DOM; exige hit-test no canvas e persistência inexistente no mira-draw |

## 9. Esclarecimentos

> Nenhuma sessão de dúvidas registrada ainda. As lacunas foram resolvidas com premissas seguras (goal "conclua tudo") e registradas na seção 10.

## 10. Lacunas

- 🔴 [DÚVIDA] Composição do transform de edição com elementos **em animação ativa** (GSAP reescreve `transform` inline): o MVP captura o transform-base e compõe; elementos com animação contínua podem não fixar a edição. Aceito como limitação conhecida — alvo principal é o polimento de elementos estáticos.
- 🔴 [DÚVIDA] Redimensionar texto: o MVP usa `scale` (visualmente amplia/reduz tudo), em vez de reflow de caixa + font-size. Decisão de simplicidade; revisar se o autor preferir reflow.
- 🔴 [DÚVIDA] Backup ao sobrescrever `index.html`: o MVP não gera backup automático (reusa o transporte do `mira-edit.js`, que sobrescreve direto). Avaliar `.bak` numa próxima iteração.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-09 | Versão inicial gerada por `/reversa-requirements` (goal forward: conclua tudo) | reversa |
