# Brainstorm: skill /mira-3d, elementos 3D no canvas dos slides

> Sessão de brainstorm conceitual entre usuário e Claude, registrada em
> 2026-06-11. Sem código nesta etapa. Implementação depende apenas de
> sessão dedicada; não há decisões pendentes.

## Contexto

Os slides do ecossistema mira são cards HTML (Tailwind + glass-card) com animações em D3/SVG ou CSS, regidos pela Regra Zero do `agents/mira-animator/SKILL.md`: toda animação tem loop interno contínuo. O usuário quer adicionar elementos verdadeiramente 3D dentro desses cards, tanto formas abstratas (esfera, cubo, rede de nós) quanto objetos reconhecíveis (cérebro, robô, livro). Os decks já dependem de CDN em tempo de apresentação (Tailwind, AOS, Lucide em `agents/mira-builder/templates/layout_base.html:8-11`), então carregar Three.js ou model-viewer por CDN não muda a natureza do projeto. O próprio animator já usa 3D raso (flip cards com `perspective` e `preserve-3d`).

## Pergunta central

> É possível colocar elementos 3D no canvas dos slides, e isso deve virar uma skill nova com comando próprio?

Resposta: sim e sim. Vira a skill `mira-3d`, comando `/mira-3d`.

## Decisões tomadas (pelo usuário, 2026-06-11)

1. **Sempre animado.** O elemento 3D nunca entra estático no canvas; rotação contínua, órbita de câmera ou equivalente. Isso satisfaz a Regra Zero do animator por natureza.
2. **Interativo.** O usuário final pode rotacionar, dar zoom e manipular o elemento (OrbitControls no Three.js, `camera-controls` no model-viewer). A animação automática e a interação convivem: auto-rotate pausa durante o arrasto e retoma após inatividade.
3. **Asset .glb é opcional.** Se o usuário fornecer um arquivo .glb, ele vai para o canvas (camada glTF). Se não fornecer, a LLM escolhe livremente a melhor técnica para representar o que foi pedido.
4. **Comando: `/mira-3d`** (kebab-case minúsculo, conforme convenção de nome de skill; "3D" maiúsculo não sobrevive à convenção).
5. **Padrão visual do card 3D (adicionada em 2026-06-11, após o teste).** Card limpo: sem pílulas de dica de interação e sem linha de atribuição visível no slide. O elemento 3D é maximizado dentro do card (canvas ocupando a maior parte da altura útil, modelo preenchendo o enquadramento). Atribuição de licença, quando exigida, vai em comentário HTML e no README de assets do deck, não no visual.
6. **Busca de modelo na web (adicionada em 2026-06-11, após o teste).** Quando o usuário pedir um objeto reconhecível sem fornecer .glb, a skill oferece buscar um modelo 3D gratuito na web antes de cair no procedural. Se o usuário aceitar, a skill busca, valida a licença, baixa para a pasta de assets do deck e insere a atribuição no slide. Validado na prática com o Allen Human Brain Atlas via repositório `hubmapconsortium/ccf-releases` (CC BY 4.0). Regras: só fontes com link direto e licença explícita (CC0 ou CC BY); marketplaces que exigem cadastro estão fora do download automatizado; atribuição obrigatória (em comentário HTML e README, conforme decisão 5) quando a licença pedir.
7. **Indicação de sites para o usuário (adicionada em 2026-06-11).** Quando a busca automatizada não encontrar um modelo adequado, ou quando o usuário preferir escolher visualmente, a skill indica sites de modelos gratuitos para ele mesmo baixar e fornecer o .glb: sketchfab.com (filtrar por downloadable + licença CC), poly.pizza (low-poly CC0/CC BY), e o repositório hubmapconsortium/ccf-releases para anatomia. A skill orienta a verificar a licença e o formato (.glb/.gltf) antes de baixar.

## Arquitetura escolhida: 3 camadas, seleção automática por pedido

1. **CSS 3D puro.** Cubos, cards em camadas, parallax de profundidade. Zero script novo. Para elementos simples e planos.
2. **Three.js procedural (cavalo de batalha).** Abstratos (esfera de partículas, rede de nós 3D, torus) e objetos reconhecíveis em estilo low-poly composto de primitivas (robô de caixas e esferas, livro de paralelepípedos). Não depende de nenhum asset externo; a LLM escreve o código diretamente.
3. **glTF (model-viewer ou GLTFLoader).** Quando o usuário fornece o .glb, ou quando aceita a oferta de busca na web (decisão 6). Sem lista curada estática de modelos na v1; a busca é dinâmica, por pedido. Atenção: .glb local não carrega via `file://` (CORS bloqueia o fetch), slide com glTF exige servidor HTTP local; a skill deve subir ou orientar o servidor.

O usuário não escolhe a camada; a skill decide a partir da descrição do elemento.

## Fluxo de uso

`/mira-3d` + indicação de "slide novo" ou "slide N do deck X" + descrição do elemento 3D (e opcionalmente o caminho de um .glb). Mesmo padrão de acionamento do mira-animator.

## Regras técnicas já definidas para a skill

- Loop interno obrigatório (herda a Regra Zero do mira-animator).
- Interatividade obrigatória (rotação e zoom no mínimo).
- Pausar o render quando o slide sai de tela (IntersectionObserver); vários contextos WebGL ativos num deck pesam.
- Bibliotecas via CDN, no mesmo padrão de `layout_base.html`.
- Herdar as regras transversais do animator: idioma pt-BR com UTF-8 direto, sem travessão, título sem ícone e com no máximo 6 palavras.

## Hipóteses descartadas na mesa

- **Modo novo dentro do mira-animator** em vez de skill nova: descartado, o usuário quer comando próprio.
- **Lista curada de modelos glTF gratuitos em CDN**: descartada na v1, links envelhecem. Substituída pela busca dinâmica na web por pedido (decisão 6), que não depende de lista mantida.
- **Pseudo-3D isométrico em D3/SVG como camada própria**: não vira camada da skill; se a ilusão de profundidade fixa bastar, o caso é do mira-animator comum.

## Decisões pendentes

Nenhuma. Todas resolvidas em 2026-06-11.

## Próximos passos

- Sessão de implementação: criar `agents/mira-3d/SKILL.md` no repo fonte, com a arquitetura de 3 camadas e as regras técnicas acima, mais uma reference com padrões Three.js (setup de cena, OrbitControls, pausa por IntersectionObserver, auto-rotate com retomada).
- Verificar: lembrar que a skill só vira comando `/mira-3d` após instalação em `.claude/skills/` do projeto destino; o repo fonte não instala em si mesmo.
- Verificar: registrar a skill no manifest do instalador (`lib/installer/manifest.js`), conferindo antes como as skills existentes estão registradas lá.

## Restrições ativas respeitadas nesta mesa

- Simplicidade primeiro, nada especulativo (origem: CLAUDE.md global)
- Trade-offs explícitos, perguntar antes de presumir (origem: CLAUDE.md global)
- Convenção de nomes de comando em minúsculo/inglês (origem: memória do projeto)
- Skills viram comando só após instalação em `.claude/skills/` (origem: memória do projeto)
- Publicação npm feita pelo usuário, versão varia só o último dígito (origem: memória do projeto)

## Status

Convergido. Última atualização: 2026-06-11 (decisão 5 adicionada após o slide de teste `decks/teste-3d/`).
