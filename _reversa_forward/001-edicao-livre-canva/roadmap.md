# Roadmap: Edição Livre estilo Canva no Modo de Edição do MIRA

> Identificador: `001-edicao-livre-canva`
> Data: `2026-07-09`
> Requirements: `_reversa_forward/001-edicao-livre-canva/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

Novo módulo **`mira-edit-free.js`** (arquivo novo em `templates/authoring/`, apoio em `mira/` nos decks), acoplado ao modo de edição existente por **observação da classe `body.me-on`** (MutationObserver) — sem modificar o `mira-edit.js`. Quando a edição liga, o módulo torna selecionáveis os nós DOM de conteúdo do slide ativo (texto, ícone SVG, imagem, blocos `data-me-editable`), desenha um overlay único com 8 alças de resize + 1 de rotação + mini-barra (duplicar/excluir), e aplica transform de edição (translate/scale/rotate) inline compondo com um transform-base capturado. Texto edita por `contentEditable` no duplo clique. A **persistência** grava um bloco `<script id="mira-free-edits" type="application/json">` na fonte do `index.html` e o próprio módulo reaplica no load (applier), reusando o transporte do `mira-edit.js` (POST `/__mira_save` em http; File System Access API em file://). Não serializa o DOM animado.

## 2. Princípios aplicados

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| Vanilla/offline-first, apoio em `mira/` | Módulo em JS puro, sem lib, sem CDN | respeita |
| Não serializar DOM mutado por animação | Persistência por overrides + applier, não por snapshot do DOM | respeita |
| Raiz do deck só `index.html` + launchers | `mira-edit-free.js` vai para `mira/`, carregado por `<script src="mira/mira-edit-free.js">` | respeita |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | Módulo separado acoplado por `body.me-on` (MutationObserver) | Não tocar no `mira-edit.js`; preferência por arquivo novo | Editar `mira-edit.js` direto | 🟢 |
| D-02 | Transform de edição = `translate() rotate() scale()` inline, composto com `data-me-base-transform` capturado | Não afeta layout; padrão Canva; origem central | left/top (afeta layout); wrapper por elemento (invasivo) | 🟡 |
| D-03 | Persistência via `<script id="mira-free-edits" type="application/json">` + applier no load | Evita snapshot do DOM animado; deck autocontido e reabrível | Serializar DOM (quebra com GSAP); arquivo de estado à parte | 🟡 |
| D-04 | Endereçamento de elemento por `data-me-id` determinístico (`s<slide>-<indice-no-walk>`) | Reidentificar o mesmo nó no load sem id no autor | ids no source (poluição do HTML autoral) | 🟡 |
| D-05 | Desenhos do `mira-draw` (canvas) fora do escopo | Não são nó DOM, sem id, não persistem | Hit-test no canvas + `window.miraDraw` (grande, incerto) | 🟢 |
| D-06 | Reusar transporte de save do `mira-edit.js` (server/FSA), reusando o handle IndexedDB `mira-edit/kv/indexHandle` | Autor aponta o arquivo uma vez para os dois | Novo transporte próprio | 🟡 |

## 4. Premissas

| Premissa | Origem (`requirements.md` seção) | Risco se errada |
|----------|----------------------------------|-----------------|
| Elementos-alvo do polimento são majoritariamente estáticos (não em animação contínua) | §10 [DÚVIDA] composição com animação | Edição de elemento animado pode não fixar; limitação conhecida |
| `scale` é aceitável para "aumentar/reduzir" (inclusive texto), sem reflow de font-size | §10 [DÚVIDA] resize de texto | Autor pode preferir reflow; ajuste em iteração futura |
| Sobrescrever direto (sem `.bak`) é aceitável no MVP | §10 [DÚVIDA] backup | Perda do original se autor errar; reversível via git |

## 5. Delta arquitetural

| Componente | Arquivo de origem | Tipo de mudança | Resumo |
|------------|-------------------|-----------------|--------|
| Modo de edição | `templates/authoring/mira-edit.js` | componente-novo (acoplado, sem editar) | Ganha camada de edição livre por módulo irmão |
| Edição livre | `templates/authoring/mira-edit-free.js` | componente-novo | Seleção, transform, ações, persistência, applier |
| Deck HTML | `templates/authoring/index.html` (e decks) | contrato-alterado | Adiciona `<script src="mira/mira-edit-free.js">` |

## 6. Delta no modelo de dados

- Resumo das mudanças: nenhum banco. Novo artefato embutido no HTML: `<script id="mira-free-edits" type="application/json">` com o mapa de overrides (`{ ops: [ {id, tx,ty,sx,sy,rot,text?,deleted?,dupOf?} ] }`).
- Detalhe completo em: n/a (documentado aqui e no código).

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| `POST /__mira_save` (mira-serve/remote) | HTTP | reusado do `mira-edit.js`, sem alteração de contrato |

## 8. Plano de migração

1. Decks antigos sem `mira-edit-free.js` continuam funcionando (feature ausente, sem regressão).
2. Ao rodar `npx mira-animator edit <deck>`, o `<script>` do módulo pode ser adicionado (fora do escopo deste ticket; aqui só o template `authoring`).

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Transform de edição brigar com animação GSAP | alto | médio | Capturar transform-base; documentar limitação; alvo = estáticos |
| `data-me-id` divergir entre edição e load (DOM muda por animação) | alto | médio | Walk determinístico sobre elementos autorais estáveis; ids só em memória, recomputados igual no applier |
| Overlay vazar para o HTML salvo | alto | baixo | Overlay fora dos slides + saneamento; salvar só o bloco de overrides, nunca o overlay |
| Canvas do `mira-draw` interceptar cliques (z-index 99998) | médio | baixo | Edição livre só seleciona quando `md-on` está desligado; documentar |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `mira-edit-free.js` passa `node --check` (sintaxe)
- [ ] `<script>` do módulo referenciado no `index.html` do template authoring
- [ ] `regression-watch.md` gerado
- [ ] Receita de teste manual no navegador documentada (sem runtime headless disponível)

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-09 | Versão inicial gerada por `/reversa-plan` | reversa |
