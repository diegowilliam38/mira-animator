# Contexto: GSAP no Mira — handoff para o Claude Code

> Documento de continuidade. Resume as decisões e os padrões definidos numa
> conversa de planejamento sobre integrar **GSAP** ao **Mira** (gerador de
> apresentações HTML animadas, decks autocontidos que abrem do `file://`).
> Objetivo: o Claude Code retomar o trabalho dentro do projeto Mira.

---

## 1. Decisão central

Adotar **GSAP** como camada de coreografia de animação no Mira, ao lado do D3 e
do Three.js já usados. GSAP entra principalmente para **formas vetoriais que
morfam e se movem** (o caso de uso onde ele é imbatível).

Plugins relevantes (todos **100% grátis desde abr/2025**, inclusive uso
comercial e **redistribuição** — podem ser commitados no repo):

- **MorphSVG** — transforma um path em outro (morphing de silhueta).
- **DrawSVG** — desenha o traço como se fosse uma caneta.
- **MotionPath** — move elemento por um caminho curvo.
- **ScrollTrigger** — gatilho por scroll (se algum dia o deck virar web).

---

## 2. Regras de integração com o Mira

1. **`file://` autocontido → vendorar localmente.** Nada de CDN em runtime.
   Baixar os `.min.js` para `assets/` do deck e referenciar por caminho
   relativo. CDN só é usado em preview/render fora do projeto.

   Caminhos cdnjs (para baixar / preview):
   ```
   https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js
   https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/MorphSVGPlugin.min.js
   https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/DrawSVGPlugin.min.js
   https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/MotionPathPlugin.min.js
   ```

2. **Loop obrigatório (regra do `mira-animator`)** → toda animação conceitual
   roda em loop contínuo. No GSAP isso é `repeat: -1` na timeline mestre.

3. **`mira-size-animator`** → expor uma constante `MIRA_SIZE` (1–10, base 3)
   que controla amplitude/velocidade num único ponto.

4. **Convivência com D3** → divisão de trabalho:
   - **D3**: gera/binda o SVG a partir de dados, eixos, charts.
   - **GSAP**: coreografa o movimento (morph, draw, motionpath, timeline).
   - ⚠️ Nunca animar a **mesma propriedade do mesmo elemento** nos dois ao
     mesmo tempo (o `d3.transition()` e a tween do GSAP brigam pelo controle).

5. **Acessibilidade** → respeitar `prefers-reduced-motion`: se ativo, mostrar
   estado final estático, sem loop infinito.

6. **Cuidado com `mira-transition-dissolve` (View Transitions API)**: pausar a
   timeline do GSAP na troca de slide para evitar flicker.

---

## 3. Como SVG entra no deck (ponto que gerou dúvida)

Para o **MorphSVG** funcionar, o `<path>` precisa estar **inline no DOM**.

- ❌ `<img src="x.svg">` ou `background` CSS → o JS não alcança os paths, não morfa.
- ✅ Markup `<svg>...<path/></svg>` colado **dentro do HTML** → morfa.

**No Mira o inline é feito em tempo de geração pelo Claude Code**, não no
navegador (no `file://` o `fetch` de SVG costuma ser bloqueado). Ou seja: o
agente lê o `.svg`, cola o markup no `index.html` e fia o morph. Quando o deck
abre, o SVG já está lá — e continua 100% offline.

Cuidados ao inlinar:
- **IDs únicos** — renomear `id` de paths e gradientes para evitar colisão
  entre vários SVGs no mesmo documento.
- **Mesmo `viewBox`/escala** entre origem e destino, senão o morph "pula".
- **`MorphSVGPlugin.convertToPath("circle, rect, polygon, line")`** para formas
  que não são path.

Limites do MorphSVG:
- É **path → path** (não SVG inteiro → SVG inteiro). Multi-path = morfar par a par.
- Morfa **só a forma**; cor/fill/stroke se anima à parte com GSAP comum.
- Não morfa raster (`<image>`), texto sem converter, nem filtros.
- Formas muito diferentes: usar `shapeIndex` e `map` para morph limpo.

---

## 4. Onde buscar SVGs (sourcing automático)

Preferir **API do Iconify** em vez de raspar SVG solto da web.

- +275k ícones, +200 conjuntos open source, SVGs já limpos, **licença por conjunto**.
- Bônus: a maioria usa `viewBox 0 0 24 24` → origem e destino já compatíveis
  para morph (resolve o cuidado do mesmo sistema de coordenadas).

Endpoints:
```
Buscar:  https://api.iconify.design/search?query=carro&limit=20
Pegar:   https://api.iconify.design/mdi/car.svg   (retorna markup pronto p/ inline)
```

Regras:
- Internet **só na geração**; deck final fica offline (SVG inline).
- Preferir sets **MIT / Apache / CC0**; registrar licença/atribuição em `CREDITS.md`.
- Iconify é forte em **ícone** (poucos paths). Ilustração caprichada → desenho manual.

⚠️ **IP**: não usar personagens protegidos (Marvel/Disney/Nintendo etc.). Para
heróis/personagens, criar arte **original**.

---

## 5. Padrões de código (copiar nas skills/templates)

### Setup base + loop
```js
gsap.registerPlugin(MorphSVGPlugin, DrawSVGPlugin, MotionPathPlugin);

const MIRA_SIZE = 3;                 // 1..10
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reduce) { /* estado final estático, sem repeat */ }
else {
  const tl = gsap.timeline({ repeat: -1, defaults: { ease: "power2.inOut" } });
  // ...segmentos...
}
```

### Morph em loop
```js
tl.to("#origem", { duration: 1.6, morphSVG: "#destino" }, "+=0.6");
```

### Traço se desenhando
```js
gsap.fromTo("#contorno",
  { drawSVG: "0% 0%" },
  { drawSVG: "0% 100%", duration: 2.2, ease: "power1.inOut", repeat: -1, yoyo: true });
```

### Roda girando (SVG)
```js
gsap.to("#roda", { rotation: 360, svgOrigin: "132 156", duration: 1.2,
                   ease: "none", repeat: -1 });
```

### Inline de SVG externo (gerado pelo Claude Code, não em runtime)
```js
// pseudo-passo do agente:
// 1. ler assets/icone.svg
// 2. renomear ids para únicos
// 3. colar <svg>...</svg> dentro do index.html
// 4. opcional: MorphSVGPlugin.convertToPath(...) no <script>
```

---

## 6. Artefatos já produzidos

- `mira-gsap-morph-blueprint.html` — slide 16:9 glass, forma morfando em loop
  (documento → ideia → apresentação) + anel com DrawSVG. Blueprint do `mira-animator`.
- `mira-carro-gsap.html` — coupé esportivo desenhado em SVG (asset reaproveitável,
  `viewBox 0 0 500 230`), contorno se desenha na entrada + rodas girando em loop.

---

## 7. Tarefas em aberto / próximos passos

- [ ] **Skill `mira-svg-morph`** — recebe 2 SVGs da pasta de assets, inlina com
      ids únicos, roda `convertToPath`, gera slide com morph em loop. Padrão
      SKILL.md + scripts/.
- [ ] **Skill `mira-icon-morph`** — busca no Iconify, escolha (ou seleção
      interativa), inline com ids únicos, `CREDITS.md` com licença, slide com
      morph em loop.
- [ ] **Variantes de formato** do blueprint: 9:16 (`mira-vertical`) e 1:1
      (`mira-squared`).
- [ ] **Carro com MotionPath** — versão que atravessa a tela (abertura de vídeo).
- [ ] **Herói original voando** — arte original (capacete/armadura genérica,
      propulsores), GSAP MotionPath + rastro de jato + loop. (Sem personagem de IP.)
- [ ] Definir convenção de pasta: `assets/gsap/`, `assets/svg/`, `CREDITS.md`.

---

## 8. D3.js vs GSAP — o que cada um faz

As duas mexem com SVG, mas resolvem problemas diferentes. Resumo conceitual:
o **D3 responde "o que desenhar a partir destes dados"**; o **GSAP responde
"como isso se move"**. São camadas, não concorrentes.

| Aspecto | **D3.js** | **GSAP** |
|---|---|---|
| Propósito | Vincular dados a elementos e gerar visualização | Engine de animação — animar qualquer coisa |
| Foco | Dados → forma | Estado → estado (movimento) |
| Pontos fortes | Data join (enter/update/exit), escalas, eixos, layouts (force, árvore, treemap, sankey, chord), mapas/projeções geo, geradores de path (linha, área, arco/pizza, curvas), manipulação de dados | Timelines com sequência e sobreposição, biblioteca enorme de easings, `repeat`/`yoyo`/`stagger`, plugins (MorphSVG, DrawSVG, MotionPath, ScrollTrigger, Flip, SplitText) |
| Anima o quê | SVG e canvas, via `d3.transition()` | DOM, CSS, atributos SVG, canvas, e até valores JS puros |
| Animação | Existe, mas básica e atrelada a dados | É o core — controle fino ao milissegundo |
| Entende "dados"? | Sim, é a razão de existir | Não — você dá os elementos/valores |
| Curva de aprendizado | Íngreme, baixo nível | Suave, API direta |

**O que um faz e o outro não:**
- Só o D3: array → barras, escalas e eixos, mapas por coordenadas geo, grafos de
  força, layouts hierárquicos. O GSAP não "sabe" o que é dado.
- Só o GSAP: morph de path (MorphSVG), timeline com sobreposição precisa,
  movimento por curva (MotionPath), animação disparada por scroll, easings ricos.
  O D3 anima com `transition()`, mas é simples demais para coreografia complexa.

**O combo (o que vale pro Mira):** D3 **gera** o SVG a partir dos dados, GSAP
**move** esse SVG. Dá até para usar `d3-scale` e `d3-shape` como *calculadora*
(gerar o `d` de um path, mapear valores) e alimentar o GSAP — D3 como matemática,
GSAP como animação.

**Regra de bolso:** gráfico/mapa/layout orientado a dado → **D3**. Morph,
sequência, scroll, movimento "caro" → **GSAP**. Os dois juntos quando você quer
dado *e* movimento bonito. ⚠️ Nunca animar a mesma propriedade do mesmo elemento
nos dois ao mesmo tempo (ver seção 2.4).

---

## 9. Resumo de uma linha

GSAP entra no Mira como camada de coreografia (morph/draw/motionpath), vendorado
em `assets/` para rodar offline, com SVGs inlinados em tempo de geração pelo
Claude Code (idealmente vindos da API do Iconify), sempre em loop e respeitando
`prefers-reduced-motion`.
