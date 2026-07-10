# Legacy Impact: Edição Livre estilo Canva

> Identificador: `001-edicao-livre-canva`
> Atualizado por `/reversa-coding` em 2026-07-09.
> Feature greenfield, sem legado pré-existente. Âncora: `prd.md` + specs SDD em `_reversa_sdd/mira-edit-livre/`.

## Arquivos afetados

| Arquivo afetado | Componente SDD | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `templates/authoring/mira-edit.js` | persistência | componente-novo | HIGH | Passa a ser o único dono da barra e da gravação combinada de ordem + elementos. |
| `templates/authoring/mira-edit-free.js` | seleção, transform, ações e persistência | componente-novo | HIGH | Expõe o estado editado ao save único, corrige o modo de texto e reaplica operações salvas. |
| `mira-serve.js` | persistência | componente-novo | HIGH | Normaliza `/` para `/index.html`, informa o destino real e devolve o caminho gravado. |
| `decks/mira-edit-livre-demo/mira/mira-edit.js` | persistência | componente-novo | MEDIUM | Cópia de validação usada pelo exemplo aberto pelo autor. |
| `decks/mira-edit-livre-demo/mira/mira-edit-free.js` | seleção, transform e ações | componente-novo | MEDIUM | Cópia de validação usada pelo exemplo aberto pelo autor. |
| `decks/mira-launch/mira/mira-edit.js` | persistência | componente-novo | LOW | Mantém o deck de validação sincronizado com a fonte canônica. |
| `decks/mira-launch/mira/mira-edit-free.js` | seleção, transform e ações | componente-novo | LOW | Mantém o deck de validação sincronizado com a fonte canônica. |

## Diff conceitual por componente

### Persistência

- Uma única barra de edição substitui os dois comandos concorrentes.
- O botão `Salvar` relê a fonte uma vez, compõe reordenação e operações livres e grava uma vez.
- Handles do File System Access são isolados pela URL de cada deck; o handle global inseguro deixou de ser consumido.
- O arquivo é validado por nome e título antes da escrita.
- O caminho completo aparece na barra e no toast; no servidor, `/` resolve para `/index.html`.

### Seleção e edição de texto

- Ao entrar em `contenteditable`, o overlay de movimento é escondido e o cursor vira texto.
- Enter/blur confirma, Esc cancela e o overlay é restaurado.
- IDs existentes não são reatribuídos ao reabrir o modo, reduzindo drift após exclusões.

### Ações de elemento

- Duplicatas são reconstruídas antes da exclusão de suas origens.
- A numeração de duplicatas salvas é reidratada para evitar colisão de IDs em sessões futuras.

## Preservadas

Não se aplica: feature greenfield, sem regras de legado confirmadas por extração.

## Modificadas

Não se aplica: feature greenfield, sem regras de legado confirmadas por extração.
