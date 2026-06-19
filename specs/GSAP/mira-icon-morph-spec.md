# Spec: /mira-icon-morph

**Versão:** 1.0
**Status:** Rascunho
**Autor:** Sandeco
**Data:** 2026-06-19
**Reviewers:** N/A

---

## 1. Resumo

Comando (skill) opt-in do Mira que gera um slide com morph de silhueta a partir de conceitos descritos em palavras. O usuário diz, por exemplo, "nuvem virando lâmpada"; o sistema busca os ícones na API do Iconify, valida a licença, baixa, inlina e monta o card com as formas morfando em loop. Reaproveita o núcleo de renderização de `/mira-svg-morph`. Internet é usada só na geração; o deck final roda 100% offline.

---

## 2. Contexto e Motivação

**Problema:**
Para criar um morph hoje o usuário precisa primeiro ter os arquivos SVG na mão. Quando ele tem só a ideia ("uma semente que vira árvore") falta um caminho que ache silhuetas vetoriais limpas, com licença clara, e já entregue o slide. Raspar SVG solto da web traz arquivos sujos, com viewBox incompatível e licença incerta.

**Evidências:**
Na sessão de 2026-06-19, ao montar os protótipos em `decks/apresentacao-mira-gsap/`, os ícones vieram da API do Iconify (conjunto MDI, viewBox 0 0 24 24, path único), o que deixou o morph limpo e compatível de origem. A decisão de usar o Iconify como fonte preferencial está em `specs/GSAP/mira-gsap-contexto.md`, seção 4.

**Por que agora:**
O Iconify expõe mais de 200 conjuntos open source via API, com licença por conjunto e a maioria em viewBox 0 0 24 24, o que resolve de origem o requisito de coordenadas compatíveis para morph. Combinado ao GSAP gratuito e vendorável, fecha o ciclo offline.

---

## 3. Goals (Objetivos)

- [ ] G-01: Gerar um card de slide com morph em loop a partir de conceitos em texto, sem o usuário ter arquivos SVG.
- [ ] G-02: Garantir licença aberta e registrar atribuição para todo ícone embutido.
- [ ] G-03: Garantir execução 100% offline no deck final (GSAP e ícones vendorados/inline).
- [ ] G-04: Reusar o núcleo de `/mira-svg-morph` para inline, ids únicos, conversão de formas, loop e reduced-motion.

**Métricas de sucesso:**

| Métrica | Baseline atual | Target | Prazo |
|---------|----------------|--------|-------|
| Conceitos mínimos aceitos | n/a | ≥ 2 | v1 |
| Conjuntos de licença incompatível embutidos | n/a | 0 | v1 |
| Atribuição registrada em CREDITS.md | n/a | 100% dos conjuntos usados | v1 |
| Requisições de rede em runtime (deck final) | n/a | 0 | v1 |
| Ícones em viewBox 0 0 24 24 | n/a | preferencial em 100% das buscas | v1 |

---

## 4. Non-Goals (Fora do Escopo)

- NG-01: O sistema não usa SVG já fornecido em arquivo local pelo usuário; esse caso é do comando irmão `/mira-svg-morph`.
- NG-02: O sistema não usa conjuntos de licença proprietária ou sem licença explícita.
- NG-03: O sistema não gera personagens ou marcas de propriedade intelectual protegida (ex.: heróis de franquias).
- NG-04: O sistema não cobre DrawSVG nem MotionPath nesta versão.
- NG-05: O sistema não morfa imagem rasterizada nem texto sem conversão para path.

---

## 5. Usuários e Personas

**Usuário primário:** criador de apresentações Mira (ex.: Sandeco) que tem a ideia da metáfora em palavras, sem ter os arquivos vetoriais.
**Usuário secundário:** outro agente do Mira acionando o comando dentro de um pipeline de geração.

**Jornada atual (sem a feature):**
1. O usuário procura ícones na web por conta própria.
2. O usuário baixa SVGs de qualidade e licença variáveis.
3. O usuário limpa, normaliza viewBox e só então consegue tentar o morph.
4. A licença de cada arquivo fica sem registro, criando risco jurídico.

**Jornada futura (com a feature):**
1. O usuário descreve os conceitos na ordem do morph.
2. O sistema busca, valida licença, baixa e inlina os ícones.
3. O sistema entrega o card pronto e o CREDITS.md preenchido.

---

## 6. Requisitos Funcionais

### 6.1 Requisitos Principais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|--------------------|
| RF-01 | O usuário deve poder descrever 2 ou mais conceitos em texto, na ordem do morph | Must | O sistema aceita 2+ termos e preserva a ordem |
| RF-02 | O sistema deve buscar cada conceito na API do Iconify e apresentar opções de ícone | Must | Para cada termo há ao menos uma opção apresentada ou aviso de nada encontrado |
| RF-03 | O sistema deve preferir ícones de path único e viewBox 0 0 24 24 para morph limpo | Must | Quando há opção single-path, ela é a escolhida |
| RF-04 | O sistema deve validar a licença do conjunto e usar apenas MIT, Apache-2.0, CC0 ou CC-BY | Must | Nenhum ícone de licença incompatível é embutido |
| RF-05 | O sistema deve registrar conjunto, licença e link de atribuição em CREDITS.md do deck | Must | CREDITS.md lista todos os conjuntos usados com licença |
| RF-06 | O sistema deve inlinar os paths com ids únicos e converter formas não-path, reusando o núcleo de `/mira-svg-morph` | Must | 0 ids duplicados; nenhum elemento não-path no morph |
| RF-07 | O sistema deve gerar a timeline em loop (2 conceitos ida e volta; N encadeiam) com GSAP e MorphSVG vendorados | Must | A animação nunca para; 0 requisições de rede em runtime |
| RF-08 | O sistema deve respeitar `prefers-reduced-motion`, exibindo a forma final estática | Must | Sem tween em `repeat` com a media query ativa |
| RF-09 | O sistema deve inserir o card no padrão do deck (glass-card, título sem ícone com no máximo 6 palavras, cor #FF904D) | Must | O card segue o esqueleto do `mira-animator` |
| RF-10 | O sistema deve recusar conceitos de IP protegida e sugerir arte original | Must | Termo de IP protegida não dispara download automático |
| RF-11 | O usuário deve poder escolher entre as opções ou deixar o sistema escolher a melhor | Should | Há seleção interativa ou escolha automática da melhor single-path |
| RF-12 | O sistema deve estampar o marcador `@MIRA:SIZE n/10` (base 3) acima do palco | Should | O comentário do marcador está presente no HTML |

> Prioridades: **Must** (obrigatório no MVP) / **Should** (importante) / **Could** (desejável).

### 6.2 Fluxo Principal (Happy Path)

1. O usuário chama `/mira-icon-morph` descrevendo os conceitos na ordem do morph.
2. O sistema busca cada conceito na API do Iconify e valida a licença de cada conjunto.
3. O sistema apresenta opções; o usuário escolhe, ou o sistema escolhe a melhor opção single-path.
4. O sistema baixa os SVGs, inlina com ids únicos e converte formas em path.
5. O sistema vendora GSAP e MorphSVG, escreve o card com a timeline em loop e registra a atribuição em CREDITS.md.
6. Resultado: o deck abre por file:// com os ícones morfando em sequência, em loop.

### 6.3 Fluxos Alternativos

**Fluxo Alternativo A, sem internet na geração:**
1. O sistema detecta a falta de rede e avisa que a busca depende da API.
2. O sistema sugere usar `/mira-svg-morph` com arquivos locais.

**Fluxo Alternativo B, ícone escolhido é multi-path:**
1. O sistema pareia os paths na ordem até o menor número.
2. Os paths excedentes entram e saem por fade; o sistema avisa a assimetria.

---

## 7. Requisitos Não-Funcionais

| ID | Requisito | Valor alvo | Observação |
|----|-----------|-----------|------------|
| RNF-01 | Offline (deck final) | 0 dependência de rede em runtime | ícones inline, GSAP vendorado |
| RNF-02 | Licenciamento | 100% dos ícones com licença aberta registrada | MIT, Apache-2.0, CC0 ou CC-BY |
| RNF-03 | Acessibilidade | respeitar prefers-reduced-motion | estado final estático |
| RNF-04 | Fluidez da animação | alvo de 60 fps em notebook comum | timeline GSAP; pausa fora da viewport |

---

## 8. Design e Interface

**Componentes afetados:** um novo card glass-card no deck, a pasta `assets/gsap/`, o `CREDITS.md` do deck e o registro do trigger de animação.

**Comportamento esperado:**
Durante a geração, o sistema mostra ao usuário as opções de ícone por conceito (nome do conjunto e licença). No deck, o card segue o padrão do `mira-animator`: título sem ícone, palco central com a forma morfando em laranja #FF904D, navegação preservada.

**Estados da UI:**
- Estado vazio: o palco mostra a primeira forma estática antes de entrar na viewport.
- Estado de carregamento (geração): enquanto busca no Iconify, o sistema informa o progresso por conceito.
- Estado de erro: API indisponível ou termo sem resultado é reportado no chat, com fallback claro.
- Estado de sucesso: as formas morfam em loop e o CREDITS.md fica preenchido.

---

## 9. Modelo de Dados

> Não aplicável a dados persistidos de aplicação. O único artefato textual adicional é o `CREDITS.md` do deck, com uma linha por conjunto: nome do conjunto, licença e link. Não há banco nem migração.

---

## 10. Integrações e Dependências

| Dependência | Tipo | Impacto se indisponível |
|-------------|------|-------------------------|
| API do Iconify (`api.iconify.design`) | Obrigatória (só na geração) | Sem busca; fallback para `/mira-svg-morph` com arquivo local |
| Núcleo de `/mira-svg-morph` (render do morph) | Obrigatória | Sem renderização; este comando depende dele estar implementado |
| GSAP core e MorphSVGPlugin | Obrigatória (vendorada) | Sem animação no deck final; a geração aborta |
| Conexão à internet | Obrigatória na geração | Sem ela, usar `/mira-svg-morph` com SVG local |
| Esqueleto de deck Mira (`mira-animator`) | Obrigatória | Sem card padronizado; usar template mínimo embutido |

---

## 11. Edge Cases e Tratamento de Erros

| Cenário | Trigger | Comportamento esperado |
|---------|---------|------------------------|
| EC-01: API fora do ar ou timeout | Iconify indisponível durante a geração | O sistema avisa a falha, tenta novamente e oferece fallback para `/mira-svg-morph` com arquivo local |
| EC-02: conceito sem resultado | Busca retorna vazio para um termo | O sistema avisa nada encontrado e pede um sinônimo ou outro termo |
| EC-03: melhor ícone é multi-path | Não há opção single-path adequada | O sistema pareia até o menor número de paths, faz fade nos excedentes e avisa |
| EC-04: licença incompatível | Único resultado vem de conjunto proprietário ou sem licença clara | O sistema descarta a opção e busca alternativa de licença aberta; se não houver, avisa |
| EC-05: conceito de IP protegida | Termo é personagem ou marca de franquia | O sistema recusa o download automático e sugere criar arte original |
| EC-06: conceito único | O usuário informa só 1 termo | O sistema avisa que o morph precisa de 2 ou mais conceitos |
| EC-07: ícone sem silhueta vetorial | Resultado raro só com raster ou texto | O sistema avisa que raster/texto não morfam e busca outra opção |

---

## 12. Segurança e Privacidade

- **Autenticação:** não aplicável; ferramenta local de geração que chama uma API pública.
- **Autorização:** não aplicável.
- **Dados sensíveis:** o sistema envia apenas termos de busca à API do Iconify; não trafega PII.
- **Propriedade intelectual:** o sistema só embute conjuntos de licença aberta e recusa marcas/personagens protegidos; registra atribuição no CREDITS.md.

---

## 13. Plano de Rollout

- **Estratégia:** comando novo opt-in, registrado nos pontos de praxe (SKILL.md, agent-sets, `files` do package.json, docs nos 3 idiomas, README). Depende do núcleo de `/mira-svg-morph`, que é implementado antes.
- **Como reverter (rollback):** remover a skill dos pontos de registro. Decks já gerados seguem funcionando, pois ficam autocontidos com os ícones inline.
- **Monitoramento pós-deploy:** validar em 1 deck de teste que a busca acha ícones de licença aberta, que o CREDITS.md fica preenchido e que o deck abre por file:// com o morph em loop.

---

## 14. Open Questions

| # | Pergunta | Impacto | Dono | Prazo |
|---|----------|---------|------|-------|
| OQ-01 | Nome final do comando: `mira-icon-morph` ou `mira-morph` com origem Iconify por flag? | Médio | Sandeco | antes da implementação |
| OQ-02 | Seleção de ícone deve ser interativa por padrão, ou automática com a melhor single-path? | Médio | Sandeco | antes da implementação |
| OQ-03 | Manter cache local dos ícones já baixados para acelerar geração futura? | Baixo | Sandeco | pode ficar para v2 |

---

## 15. Decisões Tomadas (Decision Log)

| Decisão | Alternativas consideradas | Racional |
|---------|---------------------------|---------|
| Iconify como fonte de ícones | Raspar SVG solto da web | Conjuntos limpos, path único, viewBox 24 e licença por conjunto |
| Reusar o núcleo de `/mira-svg-morph` | Duplicar a lógica de render | Evita duplicação; este comando só troca a fonte do SVG |
| Só licenças abertas e guarda de IP | Aceitar qualquer ícone encontrado | Reduz risco jurídico; registra atribuição obrigatória |
| Internet só na geração | Exigir rede também em runtime | Mantém o deck final offline, requisito do Mira |

---

## Apêndice

### Referências
- specs/GSAP/mira-svg-morph-spec.md (núcleo de renderização reusado)
- specs/GSAP/mira-gsap-contexto.md (seção 4: sourcing via Iconify; IP e licenças)
- decks/apresentacao-mira-gsap/ (protótipos com ícones MDI da Iconify)
- API do Iconify, api.iconify.design (busca e SVG por conjunto)

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
