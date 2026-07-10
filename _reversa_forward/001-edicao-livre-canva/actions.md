# Actions: Edição Livre estilo Canva no Modo de Edição do MIRA

> Identificador: `001-edicao-livre-canva`
> Data: `2026-07-09`
> Roadmap: `_reversa_forward/001-edicao-livre-canva/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 17 |
| Paralelizáveis (`[//]`) | 2 |
| Maior cadeia de dependência | 9 |

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Criar `mira-edit-free.js` (IIFE vanilla): estilos do overlay, estado, e acoplamento por MutationObserver em `body.me-on` (liga/desliga) | - | - | `templates/authoring/mira-edit-free.js` | 🟢 | `[X]` |
| T002 | Definir contrato de elemento editável: walk determinístico do slide ativo atribuindo `data-me-id`, com lista de seletores e exclusão do chrome | T001 | - | `templates/authoring/mira-edit-free.js` | 🟡 | `[X]` |

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T003 | Seleção por clique + overlay ancorado na caixa (getBoundingClientRect), 8 alças + alça de rotação + mini-barra; reposição em scroll/resize; Esc/clique-vazio limpa | T002 | - | `templates/authoring/mira-edit-free.js` | 🟡 | `[X]` |
| T004 | Mover: arrastar corpo → translate; transform composto com `data-me-base-transform`; origem central | T003 | - | `templates/authoring/mira-edit-free.js` | 🟡 | `[X]` |
| T005 | Redimensionar: alças de canto (scale uniforme) e laterais (scaleX/scaleY); limite mínimo positivo | T004 | - | `templates/authoring/mira-edit-free.js` | 🟡 | `[X]` |
| T006 | Rotacionar: alça de rotação → ângulo a partir do centro; normalizar 0–360 | T005 | - | `templates/authoring/mira-edit-free.js` | 🟡 | `[X]` |
| T007 | Editar texto inline: duplo clique → contentEditable; Enter/blur confirma, Esc restaura; bloquear em não-texto | T006 | - | `templates/authoring/mira-edit-free.js` | 🟡 | `[X]` |
| T008 | Duplicar (herda transform, desloca, seleciona a cópia) e Excluir (controle + tecla Delete, limpa seleção) | T007 | - | `templates/authoring/mira-edit-free.js` | 🟡 | `[X]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T009 | Serializar edições em `<script id="mira-free-edits" type="application/json">` (ops) e injetar/substituir na fonte; salvar via transporte do mira-edit (POST `/__mira_save` http; File System Access file://), reusando handle IDB | T008 | - | `templates/authoring/mira-edit-free.js` | 🟡 | `[X]` |
| T010 | Applier no load: fora do modo edição, recomputa `data-me-id` e reaplica ops (transform, texto, duplicar, excluir); garantir que overlay nunca vaza para o HTML salvo | T009 | - | `templates/authoring/mira-edit-free.js` | 🟡 | `[X]` |
| T011 | Referenciar `<script defer src="mira/mira-edit-free.js">` no `index.html` do template authoring (após o mira-edit.js) | T010 | - | `templates/authoring/index.html` | 🟡 | `[X]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T012 | `node --check` no módulo; gerar `regression-watch.md` e receita de teste manual | T011 | `[//]` | `_reversa_forward/001-edicao-livre-canva/regression-watch.md` | 🟢 | `[X]` |

## Fase 6, Correções pós-validação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confiança | Status |
|----|-----------|--------------|-------------|--------------|-----------|--------|
| T013 | Unificar as barras do modo `e`: remover o segundo comando de salvar e fazer o botão principal persistir ordem + edições livres numa única gravação | T012 | - | `templates/authoring/mira-edit.js`, `templates/authoring/mira-edit-free.js` | 🟢 | `[X]` |
| T014 | Normalizar o destino `/` para `/index.html`, reutilizar o handle por deck e exibir o caminho de destino na barra e no feedback de sucesso | T013 | - | `templates/authoring/mira-edit.js`, `mira-serve.js` | 🟢 | `[X]` |
| T015 | Sincronizar os scripts nos decks de validação e executar E2E em `file://` e HTTP, cobrindo barra única e save combinado | T014 | - | `decks/mira-edit-livre-demo/mira/`, `decks/mira-launch/mira/` | 🟢 | `[X]` |
| T016 | Corrigir a edição inline: ao entrar em texto, retirar o overlay de movimento, exibir caret/cursor textual e restaurar as alças ao confirmar ou cancelar | T013 | - | `templates/authoring/mira-edit-free.js` | 🟢 | `[X]` |
| T017 | Permitir editar texto misto em títulos com `span`, posicionando o caret no trecho branco e persistindo `innerHTML` sem perder a formatação interna | T016 | - | `templates/authoring/mira-edit-free.js` | 🟢 | `[X]` |
| T018 | Alça de rotação sempre alcançável: sem espaço acima do elemento ela flipa para baixo; elemento cobrindo a viewport (ex.: `svg.stage` full-screen) ela fica por dentro, junto à borda superior | T017 | - | `templates/authoring/mira-edit-free.js` | 🟢 | `[X]` |

## Notas de execução

- Desenhos do `mira-draw` (canvas) fora do escopo (D-05): não são nós DOM.
- Sem runtime de navegador headless: T012 valida sintaxe + revisão + receita manual, não execução E2E automatizada.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-09 | Versão inicial gerada por `/reversa-to-do` | reversa |
| 2026-07-09 | Ações corretivas T013-T015 adicionadas após validação visual e E2E do usuário | codex |
| 2026-07-10 | T018: rotação inacessível em elemento full-screen (alça a -46px saía da viewport); reproduzido e corrigido | claude |
