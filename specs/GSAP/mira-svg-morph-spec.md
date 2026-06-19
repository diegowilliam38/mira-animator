# Spec: /mira-svg-morph

**Versão:** 1.0
**Status:** Rascunho
**Autor:** Sandeco
**Data:** 2026-06-19
**Reviewers:** N/A

---

## 1. Resumo

Comando (skill) opt-in do Mira que gera um slide onde uma ou mais formas SVG morfam em sequência, em loop contínuo, usando GSAP e o MorphSVGPlugin vendorados localmente. O usuário fornece 2 ou mais arquivos `.svg` e recebe o card animado pronto, 100% offline (file://). É o ato visual de uma metáfora: uma silhueta vira outra diante do espectador.

---

## 2. Contexto e Motivação

**Problema:**
O padrão atual do Mira (skill `mira-animator`, base D3.js) é forte para movimento denso e emergente (partículas, projeção 3D, física no requestAnimationFrame), e não cobre bem a metáfora "uma forma vira outra" (morphing de silhueta). Escrever esse morph à mão em GSAP a cada slide é repetitivo e sujeito a erro: ids que colidem entre SVGs no mesmo documento, plugin não vendorado (quebra offline), loop esquecido (viola a Regra Zero do Mira).

**Evidências:**
Na sessão de 2026-06-19 foram validados 3 protótipos em `decks/apresentacao-mira-gsap/` (`morph-demo.html`, `morph-sequencia.html`, `historia-alma.html`) que comprovaram o valor do recurso e o funcionamento offline com o GSAP vendorado em `assets/gsap/`. Ficou decidido confinar o GSAP a um comando opt-in para não enfraquecer o padrão D3 (ver `specs/GSAP/mira-gsap-contexto.md`, seções 1, 2 e 8).

**Por que agora:**
Desde abril de 2025 o GSAP e todos os plugins (inclusive MorphSVG) são gratuitos e redistribuíveis, inclusive comercialmente. Isso permite vendorar os `.min.js` no deck e rodar 100% offline, requisito inegociável do Mira.

---

## 3. Goals (Objetivos)

- [ ] G-01: Gerar um card de slide com morph de silhueta em loop a partir de arquivos SVG fornecidos pelo usuário.
- [ ] G-02: Garantir execução 100% offline (file://), com GSAP e MorphSVG vendorados no deck.
- [ ] G-03: Eliminar trabalho manual repetitivo e propenso a erro (ids únicos, conversão de formas, loop, reduced-motion são automáticos).
- [ ] G-04: Manter aderência total às regras transversais do Mira (Regra Zero de loop, pt-BR, sem travessão, título sem ícone, cor #FF904D, navegação do deck).

**Métricas de sucesso:**

| Métrica | Baseline atual | Target | Prazo |
|---------|----------------|--------|-------|
| Requisições de rede em runtime | n/a | 0 | v1 |
| Mínimo de arquivos SVG aceitos | n/a | ≥ 2 | v1 |
| Ids duplicados no HTML final | n/a | 0 | v1 |
| Tweens em loop sob prefers-reduced-motion | n/a | 0 | v1 |
| Deck abre por file:// sem servidor | n/a | 100% dos casos | v1 |

---

## 4. Non-Goals (Fora do Escopo)

- NG-01: O sistema não busca SVG na internet; sourcing por busca é responsabilidade do comando irmão `/mira-icon-morph`.
- NG-02: O sistema não morfa imagem rasterizada (`<image>`, PNG embutido) nem texto (`<text>`) sem conversão prévia para path.
- NG-03: O sistema não substitui o `mira-animator` para metáforas densas ou emergentes (partículas, chuva, explosão, órbitas de vários elementos, projeção 3D); essas continuam em D3.
- NG-04: O sistema não trata cor/fill como recurso central do morph; a cor é secundária e fixa no laranja Mira por padrão.
- NG-05: O sistema não cobre DrawSVG nem MotionPath nesta versão; esses recursos do GSAP ficam para specs futuras.

---

## 5. Usuários e Personas

**Usuário primário:** criador de apresentações Mira (ex.: Sandeco), confortável em apontar arquivos e descrever a ordem do morph; não precisa saber programar GSAP.
**Usuário secundário:** outro agente do Mira (ou o próprio Claude Code) acionando o comando dentro de um pipeline de geração de deck.

**Jornada atual (sem a feature):**
1. O usuário precisa escrever na mão o HTML, registrar o GSAP, baixar e vendorar os plugins.
2. O usuário cola os paths inline e renomeia ids de cabeça para evitar colisão.
3. O usuário escreve a timeline de morph e lembra de pôr loop e reduced-motion.
4. Erros silenciosos (id colidido, plugin via CDN) só aparecem ao abrir o deck.

**Jornada futura (com a feature):**
1. O usuário coloca os SVGs na pasta `assets/` do deck.
2. O usuário chama `/mira-svg-morph` apontando os arquivos na ordem desejada.
3. O sistema entrega o card pronto, com morph em loop e offline garantido.

---

## 6. Requisitos Funcionais

### 6.1 Requisitos Principais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|--------------------|
| RF-01 | O usuário deve poder informar 2 ou mais arquivos `.svg`, na ordem do morph | Must | Ao chamar com 2+ caminhos, o sistema reconhece todos na ordem dada |
| RF-02 | O sistema deve ler cada arquivo e extrair os elementos de forma, colando os `<path>` inline no HTML gerado | Must | Os paths de cada arquivo aparecem inline no HTML final |
| RF-03 | O sistema deve converter formas que não são path (circle, rect, ellipse, polygon, polyline, line) via `MorphSVGPlugin.convertToPath` antes do morph | Must | Nenhum elemento não-path participa do morph; todos viram `<path>` |
| RF-04 | O sistema deve renomear ids de paths, gradientes, filtros e clipPaths para valores únicos por arquivo | Must | 0 ids duplicados no HTML final |
| RF-05 | O sistema deve gerar uma timeline GSAP em loop contínuo (`repeat: -1`): 2 SVGs fazem ida e volta (A para B para A); N SVGs encadeiam A para B para ... para N e voltam a A | Must | A animação nunca para; com N entradas há N transições por ciclo |
| RF-06 | O sistema deve vendorar `gsap.min.js` e `MorphSVGPlugin.min.js` em `assets/gsap/` do deck e referenciá-los por caminho relativo | Must | 0 requisições de rede em runtime; o deck abre por file:// |
| RF-07 | O sistema deve respeitar `prefers-reduced-motion`: quando ativo, exibir a forma final estática, sem loop | Must | Com a media query ativa, não há tween em `repeat` |
| RF-08 | O sistema deve inserir o resultado como card no padrão do deck (glass-card, título sem ícone com no máximo 6 palavras, cor #FF904D, navegação preservada) | Must | O card segue o esqueleto do `mira-animator` |
| RF-09 | O usuário deve poder informar título e legenda; na ausência, o sistema deve gerar um título padrão coerente | Should | Há sempre título no card, com no máximo 6 palavras |
| RF-10 | O sistema deve estampar o marcador `@MIRA:SIZE n/10` (base 3) na linha acima do palco | Should | O comentário do marcador está presente no HTML |
| RF-11 | O usuário deve poder controlar ritmo e amplitude do morph por um ponto único (`MIRA_SIZE`) | Could | Alterar `MIRA_SIZE` muda velocidade/escala sem editar a timeline |

> Prioridades: **Must** (obrigatório no MVP) / **Should** (importante) / **Could** (desejável).

### 6.2 Fluxo Principal (Happy Path)

1. O usuário coloca os arquivos `.svg` na pasta `assets/` do deck.
2. O usuário chama `/mira-svg-morph` apontando os arquivos na ordem do morph.
3. O sistema lê cada arquivo, converte formas em path e renomeia os ids para únicos.
4. O sistema vendora o GSAP e o MorphSVG em `assets/gsap/`, se ainda não estiverem presentes.
5. O sistema escreve o card com a timeline em loop e registra o trigger de animação do deck.
6. Resultado: o deck abre por file:// e as formas morfam em sequência, em loop contínuo.

### 6.3 Fluxos Alternativos

**Fluxo Alternativo A, contagem de paths diferente entre SVGs:**
1. O sistema pareia os paths na ordem até o menor número de paths entre os dois SVGs.
2. Os paths excedentes entram e saem por fade durante a transição.
3. O sistema avisa a assimetria no relatório de geração.

**Fluxo Alternativo B, viewBox diferente entre SVGs:**
1. O sistema normaliza os SVGs para um viewBox comum (escala e translada).
2. O sistema avisa que houve normalização para o morph não saltar.

---

## 7. Requisitos Não-Funcionais

| ID | Requisito | Valor alvo | Observação |
|----|-----------|-----------|------------|
| RNF-01 | Fluidez da animação | alvo de 60 fps em notebook comum | timeline GSAP; pausa fora da viewport |
| RNF-02 | Offline | 0 dependência de rede em runtime | GSAP e plugin vendorados |
| RNF-03 | Acessibilidade | respeitar prefers-reduced-motion | estado final estático |
| RNF-04 | Portabilidade | abre por file:// em Chromium e Firefox atuais | sem servidor HTTP |

---

## 8. Design e Interface

**Componentes afetados:** um novo card (`<section>`/`<div>` glass-card) dentro do deck, mais a pasta `assets/gsap/` e o registro do trigger de animação do deck.

**Comportamento esperado:**
O card segue o esqueleto do `mira-animator`: título sem ícone no topo, palco da animação no centro, navegação card a card preservada. O palco contém um único `<svg>` com a forma morfando; a cor padrão é o laranja #FF904D, com glow suave.

**Estados da UI:**
- Estado vazio: antes de entrar na viewport, o palco mostra a primeira forma estática.
- Estado de carregamento: o GSAP local carrega de imediato; não há spinner.
- Estado de erro (em geração): falha de leitura/parse de um arquivo interrompe a geração com mensagem no chat; o deck não é escrito quebrado.
- Estado de sucesso: ao entrar na viewport, as formas morfam em sequência, em loop.

---

## 9. Modelo de Dados

> Não aplicável. A feature não cria nem modifica dados persistidos; a saída é um arquivo HTML autocontido. Não há migração.

---

## 10. Integrações e Dependências

| Dependência | Tipo | Impacto se indisponível |
|-------------|------|-------------------------|
| GSAP core (`gsap.min.js`) | Obrigatória (vendorada) | Sem animação; a geração aborta antes de escrever o card |
| MorphSVGPlugin (`MorphSVGPlugin.min.js`) | Obrigatória (vendorada) | Sem morph; a geração aborta |
| Esqueleto de deck Mira (`mira-animator` / templates) | Obrigatória | Sem card padronizado; usar template mínimo embutido |
| `mira-size-animator` | Opcional | Marcador @MIRA:SIZE é só estampado; ajuste posterior segue manual |
| Conexão à internet | Opcional (só na 1ª vez, para baixar e vendorar o GSAP) | Fallback: usar a cópia já vendorada no deck |

---

## 11. Edge Cases e Tratamento de Erros

| Cenário | Trigger | Comportamento esperado |
|---------|---------|------------------------|
| EC-01: SVG único | O usuário informa apenas 1 arquivo | O sistema avisa que o morph precisa de 2 ou mais formas e pergunta se quer animar só a entrada; não gera card incompleto |
| EC-02: contagem de paths diferente | Dois SVGs com número de paths distinto | O sistema pareia até o menor número; paths excedentes entram/saem por fade; avisa a assimetria |
| EC-03: arquivo ausente ou inválido | Caminho errado ou SVG corrompido (falha de leitura/parse) | O sistema aborta a geração indicando o arquivo problemático; nenhum card quebrado é escrito |
| EC-04: viewBox divergente | SVGs com viewBox diferentes | O sistema normaliza para um viewBox comum e avisa; evita o morph "saltar" |
| EC-05: SVG sem silhueta vetorial | Arquivo só com `<image>` raster ou `<text>` | O sistema avisa que raster/texto não morfam e pede um contorno vetorial; não tenta morfar |
| EC-06: colisão de ids/gradientes | Dois SVGs com mesmo id interno | O sistema renomeia tudo com prefixo por índice; 0 colisão (reforça RF-04) |
| EC-07: morph "líquido" | Formas de complexidade muito diferente | O sistema aplica o mapeamento padrão (shapeIndex) e documenta o ajuste manual disponível |

---

## 12. Segurança e Privacidade

- **Autenticação:** não aplicável; ferramenta local de geração.
- **Autorização:** não aplicável.
- **Dados sensíveis:** o sistema não processa PII; lê apenas arquivos SVG locais fornecidos pelo usuário.
- **Auditoria:** não aplicável; o artefato gerado é versionável em git como qualquer deck.

---

## 13. Plano de Rollout

- **Estratégia:** comando novo opt-in, registrado nos pontos de praxe (SKILL.md, agent-sets, `files` do package.json, docs nos 3 idiomas, README). Não altera nenhum comportamento existente do Mira.
- **Como reverter (rollback):** remover a skill dos pontos de registro. Decks já gerados continuam funcionando, pois são autocontidos.
- **Monitoramento pós-deploy:** validar em 1 deck de teste (`decks/apresentacao-mira-gsap`) que abre por file:// e que as formas morfam em loop.

---

## 14. Open Questions

| # | Pergunta | Impacto | Dono | Prazo |
|---|----------|---------|------|-------|
| OQ-01 | Nome final do comando: `mira-svg-morph` ou `mira-morph`? | Médio | Sandeco | antes da implementação |
| OQ-02 | Sem par (1 SVG), abortar ou cair para animação de entrada (escala/fade)? | Médio | Sandeco | antes da implementação |
| OQ-03 | Tween de cor entre os fills originais dos SVGs deve ser opção liga/desliga? | Baixo | Sandeco | pode ficar para v2 |

---

## 15. Decisões Tomadas (Decision Log)

| Decisão | Alternativas consideradas | Racional |
|---------|---------------------------|---------|
| Uma skill por fonte (local em `svg-morph`, busca em `icon-morph`) | Skill única com branch interno | A fonte muda a jornada e a questão de licença; separar deixa cada uso claro |
| Vendorar GSAP e plugin no deck | Carregar via CDN | Offline file:// é requisito inegociável do Mira |
| Preferir SVG de path único | Aceitar qualquer SVG sem aviso | Path único morfa limpo; multi-path assimétrico é tratado por fallback com aviso |
| Confinar GSAP a comando opt-in | GSAP como novo padrão do deck | D3 vence em metáfora densa; GSAP entra cirúrgico, sem enfraquecer o padrão |

---

## Apêndice

### Referências
- specs/GSAP/mira-gsap-contexto.md (decisões de integração GSAP no Mira)
- decks/apresentacao-mira-gsap/ (protótipos validados e GSAP vendorado)
- agents/mira-animator/SKILL.md (esqueleto de card e Regra Zero)
- GSAP e MorphSVG, gsap.com (licença gratuita desde abril/2025)

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
