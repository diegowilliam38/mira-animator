# Spec: /mira-animated-typing

**Versão:** 1.0
**Status:** Aprovada para implementação
**Autor:** Sandeco
**Data:** 2026-07-07
**Reviewers:** N/A

---

## 1. Resumo

Comando (skill) do Mira que gera uma animação simulando uma pessoa digitando um comando para um agent harness (Claude Code, Codex, etc.) com o texto em zoom: fundo escuro de terminal, fonte monoespaçada gigante, digitação caractere a caractere com cursor de barra vertical piscando estilo Windows. Enquanto o texto cabe na tela ele cresce a partir da esquerda; quando o ponto de digitação alcança 100px antes da borda direita, o texto inteiro desliza para a esquerda a cada caractere, mantendo o cursor ancorado nesses 100px (janela deslizante). Zero dependências, roda por `file://`.

---

## 2. Contexto e Motivação

**Problema:**
Criadores de conteúdo sobre IA precisam mostrar em vídeo ou apresentação o prompt que dispara um agente, mas texto de terminal real é pequeno e ilegível em tela. Hoje as saídas são gravar o terminal e dar zoom na edição (trabalhoso, baixa qualidade) ou animar à mão em CSS a cada vez (repetitivo, sem padrão).

**Evidências:**
Três imagens de referência fornecidas pelo usuário em 2026-07-07 mostram os estados sucessivos: (1) texto crescendo da esquerda, (2) e (3) começo do texto cortado pela borda esquerda com o ponto de digitação ancorado à direita. Detalhes em `_reversa_sdd/animated-zoom-text/` (brief e ideation, artefatos locais).

**Por que agora:**
O Mira já tem o pipeline de skills de slide animado; falta um padrão reutilizável para a cena "prompt sendo digitado", recorrente em demos de agentes.

---

## 3. Goals (Objetivos)

- [ ] G-01: Gerar um slide animado de digitação de comando em zoom a partir de um texto passado como argumento.
- [ ] G-02: Suportar cor por trecho via tag inline `color=#HEX`, sem a tag jamais aparecer renderizada.
- [ ] G-03: Reproduzir o comportamento de janela deslizante com o cursor ancorado a 100px da borda direita.
- [ ] G-04: Rodar 100% offline por `file://`, sem nenhuma dependência externa (sem CDN, sem D3, sem GSAP).

**Métricas de sucesso:**

| Métrica | Baseline atual | Target | Prazo |
|---------|----------------|--------|-------|
| Uso em decks/vídeos reais sem retoque manual no HTML | n/a | ≥ 3 em 3 meses | v1 |
| Requisições de rede em runtime | n/a | 0 | v1 |
| Tags de cor visíveis no texto renderizado | n/a | 0 | v1 |
| Distância do cursor à borda direita após o limiar | n/a | 100px constantes | v1 |

---

## 4. Non-Goals (Fora do Escopo)

- NG-01: Não simula um terminal completo (sem prompt de shell, sem saída de comando, sem histórico).
- NG-02: Não suporta quebra automática de linha (word wrap); quebra só explícita via marcador `/n`.
- NG-03: Não grava vídeo; para virar `.mp4` usa-se `/mira-slide-to-video`.
- NG-04: Não suporta tags aninhadas (`color` dentro de `color`).
- NG-05: Não estiliza nada além de cor por trecho (sem negrito, itálico ou fonte por trecho).

---

## 5. Usuários e Personas

**Usuário primário:** criador de conteúdo dev (ex.: Sandeco) gravando vídeo ou aula sobre agentes de IA, que precisa mostrar o prompt do agente de forma legível e com impacto.
**Usuário secundário:** outro agente do Mira compondo uma apresentação.

**Jornada futura (com a feature):**
1. Invocar `/mira-animated-typing` com o texto (e tags de cor opcionais).
2. Receber o deck HTML gerado.
3. Abrir por `file://`, gravar a tela ou apresentar.
4. Reusar com outros comandos.

---

## 6. Requisitos Funcionais

### 6.1 Requisitos Principais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|--------------------|
| RF-01 | O usuário passa como argumento o texto a digitar, com trechos opcionalmente envoltos em `color=#HEX` (abertura) e `/color` (fechamento), entre sinais de menor/maior | Must | Texto renderizado nunca contém a tag; trechos marcados saem na cor indicada |
| RF-02 | Texto fora de tag renderiza em branco (#FFFFFF) sobre fundo escuro #212121 | Must | Cores conferem com a referência |
| RF-03 | Fonte monoespaçada típica de terminal Windows/Linux, com stack de fallback: Cascadia Mono, Consolas, Ubuntu Mono, DejaVu Sans Mono, Liberation Mono, monospace | Must | Em Windows renderiza Cascadia/Consolas; em Linux, Ubuntu/DejaVu |
| RF-04 | Texto em linha única, sem quebra, centralizado verticalmente, em tamanho gigante (aprox. 7.5vw, clamp 48px a 160px) | Must | Uma linha só em qualquer viewport 16:9 |
| RF-05 | Digitação caractere a caractere com cadência humana (intervalo aleatório entre 100ms e 230ms) | Must | Ritmo irregular perceptível, sem metrônomo |
| RF-06 | Cursor de barra vertical estilo Windows: fixo (aceso) durante a digitação, piscando em fase de ~530ms quando parado; pisca 2 vezes completas antes de a digitação começar | Must | Blink por `steps()`, período total ~1.06s; 2 ciclos (2.12s) antes do primeiro caractere |
| RF-07 | Janela deslizante global (câmera): enquanto a borda direita do cursor está antes de (larguraViewport - 100px), o texto cresce da esquerda; ao cruzar o limiar, **todas as linhas** deslizam juntas para a esquerda mantendo o cursor ancorado a 100px da borda direita (linhas de cima mais curtas podem quase sumir) | Must | Cursor nunca passa dos 100px; todas as linhas têm o mesmo deslocamento a qualquer instante |
| RF-08 | Deslocamento suave por caractere (transição de transform de ~90ms), nunca em saltos secos | Must | Movimento contínuo a olho nu |
| RF-09 | Loop interno: ao terminar, pausa de ~2.6s com cursor piscando e recomeça do zero (somente no modo padrão) | Must | A animação nunca fica morta (regra-mãe do Mira) |
| RF-14 | Quebra de linha simulada via `/n` no argumento: pausa de ~350ms (o "Enter"), o bloco de linhas sobe suave (~260ms) recentralizando a nova linha ativa (com N linhas, sobe a cada quebra e as antigas saem pelo topo), e a câmera volta ao início (`translateX(0)` global), fazendo o começo de todas as linhas reaparecer; a linha nova digita embaixo, alinhada à esquerda com a primeira palavra da linha anterior; o marcador nunca aparece e espaços colados a ele são consumidos | Must | Texto com `/n` gera N linhas; linha ativa centralizada na vertical; após a quebra o deslocamento global é zero |
| RF-15 | Modo esperar Enter (opt-in na invocação): cursor pisca indefinidamente até a tecla Enter; a partir dela digita uma única vez até o fim e para, sem loop, terminando com o cursor piscando; Enter repetido é ignorado | Must | Sem Enter nada é digitado; após o fim, novo Enter não reinicia |
| RF-16 | Foco na linha ativa: linhas já concluídas caem para `opacity: 0.5` (transição suave); a linha ativa permanece em opacidade cheia | Should | Em cena com 2+ linhas, só a linha ativa está com opacidade 1 |
| RF-17 | Reveal com zoom out (só no modo esperar Enter): um segundo Enter após o fim da digitação escala o bloco inteiro para caber em ~90% do viewport, centralizado horizontal e verticalmente, com todas as linhas em opacidade cheia (transição ~700ms); Enter seguinte é ignorado; resize recalcula o enquadramento | Must | Após o reveal, todo o texto está visível e centrado |
| RF-18 | Entrada por print: quando o usuário fornece uma imagem do texto em vez de (ou além de) texto, o agente reconhece o texto literal, as quebras de linha (cada linha visual vira `/n`) e as cores por palavra/trecho (mapeadas para hex), monta os segmentos e confirma a transcrição com o usuário antes de gerar quando houver incerteza | Must | Cena gerada reproduz texto, quebras e cores do print |
| RF-19 | Micro pausa via `/p<ms>` no argumento (ex.: `/p400`): a digitação congela pelo tempo indicado naquele ponto (entre palavras ou linhas), com o cursor aceso, e retoma sozinha; o marcador nunca aparece e colapsa com os espaços colados num único espaço; `/p` sem valor numérico é tratado como texto literal com aviso | Must | Pausa perceptível no ponto exato; nenhum resto do marcador renderizado |
| RF-10 | `prefers-reduced-motion`: exibe o texto completo estático, já deslocado para o estado final, cursor aceso sem piscar | Must | Sem tween com a media query ativa |
| RF-11 | Saída padrão: deck novo em `decks/<slug>/index.html`, raiz contendo somente `index.html` | Must | Estrutura de pastas conforme diretiva do projeto |
| RF-12 | Quando o usuário pedir para inserir num deck existente, a cena entra como `<section>` nova, disparada por IntersectionObserver no padrão do deck | Should | Animação inicia ao entrar na viewport |
| RF-13 | Recalcular a ancoragem no resize da janela | Should | Redimensionar não desalinha o cursor |

> Prioridades: **Must** (obrigatório no MVP) / **Should** (importante) / **Could** (desejável).

### 6.2 Fluxo Principal (Happy Path)

1. O usuário chama `/mira-animated-typing` com o texto, ex.: comando em lilás via tag de cor seguido do prompt em prosa.
2. A skill parseia o argumento em segmentos `{texto, cor}`, validando as tags.
3. A skill gera `decks/<slug>/index.html` autocontido com o skeleton da cena.
4. O usuário abre por `file://`: cursor pisca, digitação começa, texto cresce e depois desliza ancorado, loop reinicia.

### 6.3 Fluxos Alternativos

**Fluxo A, sem argumento:** a skill pergunta qual texto digitar antes de gerar.
**Fluxo B, inserir em deck existente:** a skill adiciona a `<section>` no padrão do deck alvo em vez de criar deck novo.

---

## 7. Requisitos Não-Funcionais

| ID | Requisito | Valor alvo | Observação |
|----|-----------|-----------|------------|
| RNF-01 | Offline | 0 dependência de rede em runtime e na geração | HTML único, CSS/JS inline |
| RNF-02 | Fluidez | 60 fps em notebook comum | deslocamento só por `transform: translateX` |
| RNF-03 | Acessibilidade | respeitar `prefers-reduced-motion` | estado final estático |
| RNF-04 | Compatibilidade | Chrome, Edge e Firefox atuais via `file://` | sem API exótica |

---

## 8. Design e Interface

**Comportamento esperado:**
Tela inteira escura (#212121). Linha única de texto mono gigante verticalmente centralizada, começando a ~60px da borda esquerda. O cursor é um retângulo vertical fino (barra, ~0.09em de largura, altura da linha). A medição da posição do cursor usa geometria de layout (`offsetLeft + offsetWidth`), imune ao `transform` corrente, evitando drift durante a transição.

**Estados:**
- Inicial: linha vazia, cursor piscando 2 vezes completas (2.12s) antes de digitar; no modo esperar Enter, piscando indefinidamente até a tecla.
- Digitando: cursor aceso fixo, caracteres surgindo, deslocamento após o limiar.
- Quebra (`/n`): pausa curta, bloco sobe suave, cursor volta ao início na linha de baixo.
- Final: texto completo, cursor piscando por ~2.6s.
- Loop: limpa e recomeça (modo padrão); no modo esperar Enter, permanece no estado final com o cursor piscando.

---

## 9. Modelo de Dados

> Não aplicável. O único dado é o array `SEGMENTS` de pares `{text, color}` embutido no HTML gerado.

---

## 10. Integrações e Dependências

| Dependência | Tipo | Impacto se indisponível |
|-------------|------|-------------------------|
| Nenhuma externa | n/a | n/a |
| Esqueleto de deck Mira (só no modo inserção RF-12) | Opcional | Sem deck alvo, gera deck standalone |

---

## 11. Edge Cases e Tratamento de Erros

| Cenário | Trigger | Comportamento esperado |
|---------|---------|------------------------|
| EC-01: texto curto | Cursor nunca alcança o limiar | Sem deslocamento; digita, pisca, loop |
| EC-02: tag sem fechamento | `color=#HEX` aberto até o fim | Fecha implicitamente no fim do texto e avisa o usuário na geração |
| EC-03: cor inválida | Valor que não é hex CSS válido | Ignora a tag (trecho em branco) e avisa na geração |
| EC-04: tags aninhadas | `color` dentro de `color` | Recusa na geração e pede texto sem aninhamento |
| EC-05: texto muito longo | Centenas de caracteres | Funciona; o deslocamento cresce sem limite prático |
| EC-06: sem argumento | Invocação vazia | Pergunta o texto antes de gerar |
| EC-07: reduced motion | Media query ativa | Texto completo estático no estado final, cursor aceso |
| EC-08: resize | Janela redimensionada | Reancora horizontal e vertical no novo viewport |
| EC-09: `/n` consecutivos | `... /n /n ...` | Gera linha vazia entre as duas (comportamento de terminal) |
| EC-10: Enter durante ou após a digitação (modo esperar Enter) | Tecla repetida | Ignorado; não reinicia nem acelera |
| EC-11: modo esperar Enter + reduced motion | Media query ativa | Mostra o estado final estático direto, sem esperar tecla |

---

## 12. Segurança e Privacidade

- Ferramenta local de geração; nenhum dado trafega. O texto digitado é conteúdo do próprio usuário, embutido no HTML.

---

## 13. Plano de Rollout

- **Estratégia:** comando novo opt-in, registrado nos pontos de praxe (SKILL.md, agent-sets, `files` do package.json, docs nos 3 idiomas, README).
- **Rollback:** remover a skill dos pontos de registro; decks gerados seguem funcionando (autocontidos).
- **Validação:** deck de teste em `decks/teste-animated-zoom-text/` conferido visualmente pelo usuário.

---

## 14. Open Questions

| # | Pergunta | Impacto | Dono | Prazo |
|---|----------|---------|------|-------|
| OQ-01 | Som de teclado opcional em versão futura? | Baixo | Sandeco | v2 |

---

## 15. Decisões Tomadas (Decision Log)

| Decisão | Alternativas consideradas | Racional |
|---------|---------------------------|---------|
| JS/CSS puro, sem GSAP/D3 | Reusar GSAP vendorado | A cena é typing + translateX; vendorar lib é peso sem ganho |
| Tag `color=#HEX` no argumento | Flag separada de cor, markdown | Foi a sintaxe pedida pelo usuário; marca o trecho no lugar exato |
| Medição por `offsetLeft` (layout) | `getBoundingClientRect` | Rect inclui o transform em trânsito e causaria drift na ancoragem |
| Cursor fixo digitando, piscando parado | Piscar sempre | Comportamento real do caret do Windows |
| Loop reiniciando do zero | Tocar uma vez e parar | Regra-mãe do Mira: animação nunca fica morta |
| Linha ativa sempre centrada; bloco sobe no `/n` | Empilhar do topo como terminal real | Mantém o "zoom" no que está sendo digitado, que é o foco da cena |
| Modo esperar Enter sem loop | Loop também nesse modo | Pedido do usuário: cena controlada ao vivo toca uma vez; o cursor piscando ao final mantém a cena viva |

---

## Apêndice

### Referências
- `_reversa_sdd/animated-zoom-text/newproject-brief.md` e `ideation.md` (artefatos locais do /reversa-new)
- 3 imagens de referência do usuário (estados da digitação e do scroll)
- `agents/mira-svg-morph/SKILL.md` (padrão de skill geradora de slide)

### Histórico de Revisões
| Versão | Data | Autor | Mudanças |
|--------|------|-------|----------|
| 1.0 | 2026-07-07 | Sandeco | Criação inicial |
| 1.1 | 2026-07-08 | Sandeco | Cadência 100-230ms; 2 piscadas iniciais; quebra de linha via `/n` (RF-14); modo esperar Enter sem loop (RF-15) |
| 1.2 | 2026-07-08 | Sandeco | Câmera global (RF-07); opacidade 0.5 nas linhas concluídas (RF-16); reveal com zoom out no segundo Enter (RF-17); entrada por print (RF-18) |
| 1.3 | 2026-07-08 | Sandeco | Micro pausa inline via `/p<ms>` (RF-19) |
