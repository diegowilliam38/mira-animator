# Spec: /mira-svg-animator

**Versão:** 1.0
**Status:** Rascunho
**Autor:** Sandeco
**Data:** 2026-06-19
**Reviewers:** N/A

---

## 1. Resumo

Comando (skill) opt-in do Mira que anima um SVG fornecido pelo usuário dentro de um slide, com GSAP vendorado localmente. Diferente do morph: aqui a forma não vira outra, ela ganha movimento próprio (bater asas, girar, deslizar, pulsar, ter o traço desenhado, percorrer uma curva). O deck final roda 100% offline (file://).

---

## 2. Contexto e Motivação

**Problema:**
O Mira sabe gerar morph de silhueta (`mira-svg-morph`, `mira-icon-morph`), porém não há um caminho para o caso mais comum de "dar vida a um desenho": pegar um SVG que o usuário já tem e fazê-lo se mover (uma borboleta que bate asas, uma roda que gira, um contorno que se desenha). Escrever isso na mão em GSAP a cada slide repete trabalho e esconde uma dificuldade real: animar uma parte exige que a parte seja um elemento separado, e a maioria dos SVGs vem como um path único fundido.

**Evidências:**
Na sessão de 2026-06-19, ao animar uma borboleta de path único, foi necessário remover o fundo branco, cortar a silhueta no eixo do corpo para separar as asas e remover as antenas de dentro do path da asa para elas não se moverem em cópia. O resultado validado está em `decks/apresentacao-mira-gsap/borboleta-bate-asas.html`. Esse aprendizado é o coração desta skill.

**Por que agora:**
GSAP e plugins (DrawSVG, MotionPath) são gratuitos e redistribuíveis desde abril de 2025, então podem ser vendorados no deck para rodar offline. As specs irmãs de morph já definiram o padrão de card, vendoração e qualidade.

---

## 3. Goals (Objetivos)

- [ ] G-01: Animar um SVG fornecido pelo usuário dentro de um card de slide, em loop contínuo.
- [ ] G-02: Separar a parte a animar quando o SVG vier como path único fundido (corte por eixo ou edição do path).
- [ ] G-03: Garantir execução 100% offline (file://), com GSAP e os plugins necessários vendorados.
- [ ] G-04: Manter aderência às regras transversais do Mira (Regra Zero de loop, pt-BR, sem travessão, título sem ícone, cor #FF904D).

**Métricas de sucesso:**

| Métrica | Baseline atual | Target | Prazo |
|---------|----------------|--------|-------|
| Requisições de rede em runtime | n/a | 0 | v1 |
| Arquivos SVG de entrada | n/a | 1 | v1 |
| Tweens em loop sob prefers-reduced-motion | n/a | 0 | v1 |
| Partes animadas que arrastam o resto do desenho | n/a | 0 | v1 |
| Deck abre por file:// sem servidor | n/a | 100% dos casos | v1 |

---

## 4. Non-Goals (Fora do Escopo)

- NG-01: O sistema não morfa uma forma em outra; transformar uma silhueta em outra é do `mira-svg-morph`.
- NG-02: O sistema não busca SVG na web; o usuário fornece o arquivo (buscar ícone é do `mira-icon-morph`).
- NG-03: O sistema não anima raster por partes (PNG/JPG); no máximo aplica transform global a uma imagem.
- NG-04: O sistema não redesenha nem corrige arte malfeita; anima o que o SVG já contém.
- NG-05: O sistema não cobre 3D, vídeo nem áudio; profundidade real é do `mira-3d`.

---

## 5. Usuários e Personas

**Usuário primário:** criador de apresentações Mira (ex.: Sandeco) que tem um SVG e quer dar movimento a ele, sem programar GSAP.
**Usuário secundário:** outro agente do Mira acionando a skill dentro de um pipeline de geração de deck.

**Jornada atual (sem a feature):**
1. O usuário escreve o HTML, registra o GSAP e vendora os plugins na mão.
2. O usuário descobre que o SVG é um path único e não consegue mover só uma parte.
3. O usuário tenta separar partes manualmente, sem método, com tentativa e erro.
4. O fundo do SVG e a origem do movimento ficam errados, e a animação sai torta.

**Jornada futura (com a feature):**
1. O usuário coloca o SVG na pasta `assets/` e descreve o movimento em palavras.
2. O sistema remove fundo, separa a parte certa e define a origem do movimento.
3. O sistema entrega o card pronto, com a animação em loop e offline garantido.

---

## 6. Requisitos Funcionais

### 6.1 Requisitos Principais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|--------------------|
| RF-01 | O usuário deve poder informar 1 arquivo `.svg` e descrever o movimento em palavras (bater, girar, deslizar, pulsar, desenhar, percorrer curva) | Must | A skill aceita o arquivo e a descrição e escolhe a técnica |
| RF-02 | O sistema deve remover elementos de fundo opacos do SVG (ex.: `<rect>` branco) antes de animar | Must | O SVG renderizado não tem retângulo de fundo |
| RF-03 | O sistema deve garantir que a parte a animar seja um elemento separado; se o SVG vier como path único fundido, o sistema separa a parte (corte por eixo com clipPath ou edição do path) | Must | A parte animada se move sozinha, sem arrastar o resto |
| RF-04 | O sistema deve escolher a técnica GSAP conforme o movimento: transform (rotate/scale/scaleX/translate/skew), DrawSVG para o traço se desenhar, MotionPath para curva | Must | A técnica aplicada corresponde ao movimento pedido |
| RF-05 | O sistema deve definir a origem do movimento no ponto correto (eixo da dobradiça ou centro de rotação), via `svgOrigin` ou equivalente | Must | A rotação/escala ocorre em torno do ponto certo, não do canto |
| RF-06 | O sistema deve gerar o movimento em loop contínuo (`repeat: -1`), com `yoyo` quando o movimento for de vai e volta | Must | A animação nunca para |
| RF-07 | O sistema deve vendorar `gsap.min.js` e os plugins usados (`DrawSVGPlugin`, `MotionPathPlugin`) em `assets/gsap/` e referenciar por caminho relativo | Must | 0 requisições de rede em runtime; o deck abre por file:// |
| RF-08 | O sistema deve respeitar `prefers-reduced-motion`: quando ativo, exibir o SVG em estado final estático, sem loop | Must | Com a media query ativa, não há tween em `repeat` |
| RF-09 | O sistema deve inserir o resultado como card no padrão do deck (glass-card, título sem ícone com no máximo 6 palavras, cor #FF904D, navegação preservada) | Must | O card segue o esqueleto do `mira-animator` |
| RF-10 | O usuário deve poder controlar ritmo e amplitude do movimento por um ponto único (`MIRA_SIZE`) | Should | Alterar `MIRA_SIZE` muda velocidade/amplitude sem editar a timeline |
| RF-11 | O sistema deve estampar o marcador `@MIRA:SIZE n/10` (base 3) acima do palco | Should | O comentário do marcador está presente no HTML |

> Prioridades: **Must** (obrigatório no MVP) / **Should** (importante) / **Could** (desejável).

### 6.2 Fluxo Principal (Happy Path)

1. O usuário coloca o `.svg` na pasta `assets/` do deck e chama `/mira-svg-animator` descrevendo o movimento.
2. O sistema lê o SVG, remove o fundo e inspeciona a estrutura (partes separadas ou path único fundido).
3. O sistema separa a parte a animar quando necessário (corte por eixo com clipPath ou edição do path) e define a origem do movimento.
4. O sistema escolhe a técnica GSAP adequada e vendora os arquivos necessários em `assets/gsap/`.
5. O sistema escreve o card com a animação em loop e registra o trigger de animação do deck.
6. Resultado: o deck abre por file:// e o SVG se anima em loop contínuo.

### 6.3 Fluxos Alternativos

**Fluxo Alternativo A, SVG já vem em camadas:**
1. O sistema detecta partes separadas (grupos/ids nomeados) e pula a etapa de separação.
2. O sistema anima a parte direto, pela técnica escolhida.

**Fluxo Alternativo B, movimento de traço:**
1. O usuário pede que o contorno se desenhe.
2. O sistema aplica DrawSVG ao contorno, com loop, e adiciona stroke quando a forma só tiver preenchimento.

---

## 7. Requisitos Não-Funcionais

| ID | Requisito | Valor alvo | Observação |
|----|-----------|-----------|------------|
| RNF-01 | Fluidez da animação | alvo de 60 fps em notebook comum | timeline GSAP; pausa fora da viewport |
| RNF-02 | Offline | 0 dependência de rede em runtime | GSAP e plugins vendorados |
| RNF-03 | Acessibilidade | respeitar prefers-reduced-motion | estado final estático |
| RNF-04 | Portabilidade | abre por file:// em Chromium e Firefox atuais | sem servidor HTTP |

---

## 8. Design e Interface

**Componentes afetados:** um novo card glass-card no deck, a pasta `assets/gsap/`, o arquivo SVG copiado para `assets/` e o registro do trigger de animação do deck.

**Comportamento esperado:**
O card segue o esqueleto do `mira-animator`: título sem ícone no topo, palco central com o SVG animado em loop, navegação preservada. O SVG ocupa boa parte da altura útil, em fundo escuro, com a identidade laranja #FF904D quando fizer sentido recolorir (sem alterar a arte sem pedido).

**Estados da UI:**
- Estado vazio: antes de entrar na viewport, o palco mostra o SVG parado no quadro inicial.
- Estado de carregamento: o GSAP local carrega de imediato; não há spinner.
- Estado de erro (em geração): falha de leitura/parse do SVG interrompe a geração com mensagem no chat; o deck não é escrito quebrado.
- Estado de sucesso: ao entrar na viewport, o SVG se anima em loop.

---

## 9. Modelo de Dados

> Não aplicável. A feature não cria nem modifica dados persistidos; a saída é um arquivo HTML autocontido mais o SVG copiado para `assets/`. Não há migração.

---

## 10. Integrações e Dependências

| Dependência | Tipo | Impacto se indisponível |
|-------------|------|-------------------------|
| GSAP core (`gsap.min.js`) | Obrigatória (vendorada) | Sem animação; a geração aborta antes de escrever o card |
| DrawSVGPlugin / MotionPathPlugin | Obrigatória conforme a técnica (vendorada) | Sem traço/curva; o sistema cai para transform simples e avisa |
| Esqueleto de deck Mira (`mira-animator` / templates) | Obrigatória | Sem card padronizado; usar template mínimo embutido |
| `mira-size-animator` | Opcional | Marcador @MIRA:SIZE é só estampado; ajuste posterior segue manual |
| Conexão à internet | Opcional (só na 1ª vez, para baixar e vendorar o GSAP) | Fallback: usar a cópia já vendorada no deck |

---

## 11. Edge Cases e Tratamento de Erros

| Cenário | Trigger | Comportamento esperado |
|---------|---------|------------------------|
| EC-01: path único e movimento de parte | SVG fundido, pedido de mover uma asa/roda | O sistema separa a parte (clipPath por eixo ou edição do path); se não isolar, avisa e oferece animar o SVG inteiro (rotação/pulso global) |
| EC-02: arquivo ausente ou inválido | Caminho errado ou SVG corrompido (falha de leitura/parse) | O sistema aborta a geração indicando o arquivo; nenhum card quebrado é escrito |
| EC-03: SVG só com raster | Arquivo contém apenas `<image>` | O sistema avisa que não há vetor por partes e oferece só transform global da imagem |
| EC-04: DrawSVG sem stroke | Pedido de traço em forma só com preenchimento | O sistema adiciona um stroke temporário para o traço, ou avisa quando não couber |
| EC-05: fundo não trivial | Fundo é gradiente ou imagem, não `<rect>` simples | O sistema identifica e oculta o elemento de fundo; se ambíguo, pergunta qual elemento é o fundo |
| EC-06: origem do movimento ambígua | Não há eixo/dobradiça óbvio | O sistema usa o centro geométrico da parte e documenta o ponto usado, ou pergunta |
| EC-07: viewBox gigante | SVG em coordenadas grandes (ex.: 1440x810) | O sistema ajusta enquadramento (viewBox/escala) para o palco do card |

---

## 12. Segurança e Privacidade

- **Autenticação:** não aplicável; ferramenta local de geração.
- **Autorização:** não aplicável.
- **Dados sensíveis:** o sistema não processa PII; lê apenas o arquivo SVG local fornecido pelo usuário.
- **Auditoria:** não aplicável; o artefato gerado é versionável em git como qualquer deck.

---

## 13. Plano de Rollout

- **Estratégia:** comando novo opt-in, registrado nos pontos de praxe (SKILL.md, agent-sets, `files` do package.json, docs nos 3 idiomas, README). Não altera nenhum comportamento existente do Mira.
- **Como reverter (rollback):** remover a skill dos pontos de registro. Decks já gerados continuam funcionando, pois são autocontidos.
- **Monitoramento pós-deploy:** validar no exemplo `decks/apresentacao-mira-gsap/borboleta-bate-asas.html` que abre por file:// e que a parte certa se move sem arrastar o resto.

---

## 14. Open Questions

| # | Pergunta | Impacto | Dono | Prazo |
|---|----------|---------|------|-------|
| OQ-01 | Nome final do comando: `mira-svg-animator` ou unificar a família num só `/mira-svg` com modos? | Médio | Sandeco | antes da implementação |
| OQ-02 | Quando a parte não isola sozinha, abortar ou cair para animação global (rotação/pulso do SVG inteiro)? | Médio | Sandeco | antes da implementação |
| OQ-03 | Oferecer um conjunto fixo de movimentos nomeados (bater, girar, pulsar, deslizar, desenhar, orbitar), ou movimento livre por descrição? | Baixo | Sandeco | pode evoluir na v2 |

---

## 15. Decisões Tomadas (Decision Log)

| Decisão | Alternativas consideradas | Racional |
|---------|---------------------------|---------|
| Skill separada do morph | Juntar morph e animação numa skill só | Morph (forma vira forma) e animação (forma se move) são intenções diferentes; o usuário escolhe pelo verbo |
| Separar partes via clipPath ou edição do path | Exigir SVG já em camadas | A maioria dos SVGs vem fundida; validado na borboleta (corte por eixo + remoção das antenas do path) |
| Vendorar GSAP e plugins no deck | Carregar via CDN | Offline file:// é requisito inegociável do Mira |
| Remover fundo antes de animar | Manter o SVG como veio | Fundo opaco (ex.: `<rect>` branco) tampa o card escuro do Mira |

---

## Apêndice

### Referências
- specs/GSAP/mira-gsap-contexto.md (decisões de integração GSAP no Mira)
- specs/GSAP/mira-svg-morph-spec.md e specs/GSAP/mira-icon-morph-spec.md (specs irmãs, mesmo padrão)
- decks/apresentacao-mira-gsap/borboleta-bate-asas.html (exemplo validado: asas batendo, fundo removido, antenas estáticas)
- agents/mira-animator/SKILL.md (esqueleto de card e Regra Zero)
- GSAP, DrawSVG e MotionPath, gsap.com (licença gratuita desde abril/2025)

### Histórico de Revisões
| Versão | Data | Autor | Mudanças |
|--------|------|-------|----------|
| 1.0 | 2026-06-19 | Sandeco | Criação inicial |

---

## Relatório de Avaliação (SDD scorer)

**Score total: 100.0/100, Excelente, pronta para implementação.**

| Dimensão | Score | Peso | Contribuição |
|----------|-------|------|--------------|
| Completude | 100% | 30% | 30.0 |
| Testabilidade | 100% | 25% | 25.0 |
| Clareza | 100% | 20% | 20.0 |
| Escopo | 100% | 15% | 15.0 |
| Edge Cases | 100% | 10% | 10.0 |

Sem gaps críticos e sem sugestões pendentes. Avaliado por `sdd-spec/scripts/spec_scorer.py` em 2026-06-19.
