# Regression Watch: Edição Livre estilo Canva

> Identificador: `001-edicao-livre-canva`
> Gerado por `/reversa-coding` em 2026-07-09.

## Pontos de atenção (o que pode quebrar e como vigiar)

| # | Risco de regressão | Como verificar |
|---|--------------------|----------------|
| R1 | Modo edição (reordenar slides) do `mira-edit.js` deixa de funcionar | Pressionar `e`, conferir setas ↑↓ e "Salvar ordem" intactos |
| R2 | Overlay/alças vazam para o HTML salvo | Após salvar, abrir o `index.html` e conferir que não há `#mef-overlay`/alças no arquivo — só o `<script id="mira-free-edits">` |
| R3 | Transform de edição briga com animação GSAP num elemento animado | Editar um elemento animado; se a edição "escorregar", é a limitação conhecida (elementos estáticos são o alvo) |
| R4 | Canvas do `mira-draw` (tecla P) intercepta cliques de seleção | Selecionar deve funcionar com o modo desenho (P) desligado; com `md-on`, o canvas come o clique (documentado) |
| R5 | `data-me-id` desalinha após reordenar slides + editar no mesmo arquivo | Fazer reordenação e edição livre em sessões separadas; recarregar e conferir |
| R6 | Salvar corrompe o arquivo (encoding, `</script>` no texto) | Coberto por teste automatizado de injeção/escape (12/12); revalidar se mudar `injectOps`/`serialize` |
| R7 | Texto com filhos (ícone dentro do título) perde o filho ao editar | Edição inline só habilita em folhas de texto (`children.length === 0`) — conferir que títulos com ícone não entram em modo texto |

## Cobertura de teste desta entrega

- ✅ `node --check` em `mira-edit-free.js` (template e cópia do deck), `new.js`, `edit.js`.
- ✅ Teste automatizado das funções puras críticas (`injectOps` + `serialize`): 12 asserts, 0 falhas — idempotência, preservação de `</body>` e scripts de apoio, escape de `</script>`/`<`, round-trip por `JSON.parse`.
- ⚠️ **Sem teste E2E de navegador** (não há runtime headless/jsdom no ambiente). Seleção, alças, drag, rotação, texto, duplicar/excluir e persistência real precisam de validação manual — ver receita abaixo.

## Receita de teste manual (navegador)

1. Servir o deck para salvar sem diálogo:
   `node mira-serve.js decks/mira-launch` (ou o servidor remoto do MIRA).
2. Abrir o deck no Chrome. Pressionar **`e`** (modo edição liga; barra "Edição livre" aparece no topo).
3. **Clicar** num título → aparece contorno laranja + 8 alças + alça de rotação + mini-barra (duplicar/excluir).
4. **Arrastar** o corpo (mover); **arrastar** uma alça de canto (redimensiona uniforme); uma lateral (um eixo); a bolinha superior (rotaciona).
5. **Duplo clique** no título → editar o texto; **Enter** confirma, **Esc** cancela.
6. Botão **duplicar** e botão **excluir** (ou tecla **Delete**).
7. Clicar **"Salvar edições"** → toast de sucesso.
8. **Recarregar** a página (sem entrar no modo edição): as edições devem reaparecer aplicadas (applier).
9. Conferir no arquivo `index.html` que só foi adicionado `<script id="mira-free-edits" type="application/json">`.

## Próximos passos sugeridos

- Rodar a receita manual e reportar desvios.
- Se a limitação de composição com animação (R3) incomodar, avaliar uma camada de wrapper por elemento numa iteração futura.
- Avaliar backup `.bak` ao sobrescrever (item [DÚVIDA] do requirements).

## Observações pós-validação de 2026-07-09 (sem peso de regressão)

Feature greenfield: os requisitos abaixo ainda são 🟡 até uma futura re-extração confirmar o comportamento no código.

| ID | Origem | Comportamento implementado | Evidência desta rodada |
|---|---|---|---|
| O001 | persistência RF-01/RF-02 | Existe um único botão `Salvar`, responsável por ordem e edições livres | E2E encontrou exatamente 1 controle de save e ausência de `#mef-bar` |
| O002 | persistência RF-06 | A barra mostra o destino e o toast confirma o caminho gravado | HTTP exibiu o caminho absoluto retornado por `mira-serve`; `file://` exibiu o caminho da URL local |
| O003 | persistência EC-01 | Handle de arquivo é isolado por deck e arquivo é validado antes da escrita | Chave `indexHandle:<protocolo>//<pathname>` + validação de nome/título |
| O004 | persistência RF-02 | Ordem e operações livres são compostas numa única escrita | E2E salvou permutação `[1,0,2,3]` e transform `translate(70px,30px)`; ambos sobreviveram ao reload |
| O005 | ações RF texto | O modo texto esconde o overlay de mover e mostra caret/cursor textual | E2E confirmou `contentEditable=true`, foco no texto, cursor `text`, overlay oculto e restauração no Enter |
| O006 | persistência G-04 | Texto editado persiste após recarregar | E2E gravou `Texto realmente salvo pelo MIRA` e recuperou o mesmo conteúdo após reload |
| O007 | ações de texto | Títulos com texto misto permitem caret nos trechos fora do `span` e preservam o HTML formatado | Persistência passou a serializar `html` com fallback compatível para operações antigas em `text` |

## Cobertura automatizada acrescentada

- ✅ `node --check` em `mira-edit.js`, `mira-edit-free.js`, cópias do demo e `mira-serve.js`.
- ✅ E2E Chrome headless em HTTP pela URL raiz `/`: barra única, destino, move, reorder, save combinado e reload.
- ✅ Inspeção Chrome headless em `file://`: barra única, rótulo `Salvar`, caminho completo e API da edição livre carregada.
- ✅ E2E de texto por interação real: seleção, duplo clique no overlay, caret, digitação, Enter, save e reload.

## Histórico de re-extrações

Ainda não executado.

## Arquivadas

- O texto anterior de R1 que exigia manter o botão `Salvar ordem` foi superado pela decisão validada pelo usuário: o contrato atual é um único botão `Salvar` para ordem + elementos.
- A observação anterior de ausência de E2E está superada pelos testes Chrome headless desta rodada.
