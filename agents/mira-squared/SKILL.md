---
name: mira-squared
description: Gera uma versão QUADRADA (1:1, 1080x1080) de um deck do Mira, a partir do deck 16:9 original, para vídeo em formato quadrado (feed do Instagram, LinkedIn, etc.). Não toca no arquivo original: cria um novo arquivo index-1x1.html ao lado, fixando cada slide em 1080x1080 e reduzindo os espaços laterais, com moldura fixa e ajuste leve. Use SEMPRE que o usuário disser "/mira-squared", "versão quadrada", "deixa quadrado", "formato 1:1", "1080x1080", "apresentação quadrada", "corta os lados", "reduz os espaços laterais", "vídeo quadrado", ou pedir o deck num formato quadrado para outra rede.

---

# Skill: Versão Quadrada do Deck (1:1, 1080x1080)

Transforma um deck 16:9 do Mira numa versão **quadrada de 1080x1080**, reduzindo os espaços laterais de todos os slides. Útil para gravar a apresentação como vídeo quadrado. A abordagem é **moldura fixa com ajuste leve**: o conteúdo já é centralizado, então o quadrado corta a sobra lateral e encaixa o bloco central.

## REGRA DE IDIOMA

Siga `agents/_shared/idioma.md`. Texto visível em português correto. Proibido travessão (—): use vírgula ou dois-pontos.

## Regra de Ouro: nunca destrua o original

- O deck 16:9 (`index.html`) **permanece intacto**.
- Você cria um **arquivo novo** ao lado: `index-1x1.html`.
- Nunca edite a lógica das animações, os textos, as cores ou a navegação. A transformação é só de **enquadramento** (CSS de moldura).

## Como o Mira monta um slide (o que você vai reenquadrar)

- Cada slide é um `body > section` com `class="min-h-screen flex flex-col items-center justify-center ..."`: ocupa a tela inteira e centraliza o conteúdo.
- O conteúdo central usa `max-w-6xl` ou `max-w-5xl` com `px-6`.
- A navegação (barra de progresso no topo, botão de próximo no canto, teclado) é fixa e continua funcionando.
- O tema e o `base.css` estão inline no `<head>`; o Tailwind vem por CDN.

## Passos

1. **Localizar o deck.** Ache o `index.html` do deck (em `decks/<deck>/` ou `slides/<tema>/`). Se houver mais de um deck e o usuário não disser qual, pergunte.
2. **Copiar para o novo arquivo.** Copie `index.html` para `index-1x1.html` na mesma pasta (mesma pasta = os caminhos relativos de logo, vídeo e imagens continuam válidos).
3. **Confirmar o seletor dos slides.** O padrão do Mira é `body > section`. Se este deck embrulhar os slides de outro jeito, ajuste o seletor do override para casar com a estrutura real.
4. **Injetar a moldura.** Logo antes de `</head>` do `index-1x1.html`, insira este bloco (depois do Tailwind, para vencer a especificidade):

```html
<style id="mira-formato-1x1">
  /* Versão quadrada 1080x1080, moldura fixa */
  :root { --fmt-w: 1080px; --fmt-h: 1080px; }
  html { background: var(--mira-bg, #000); }
  body { width: var(--fmt-w); margin-left: auto; margin-right: auto; }
  body > section {
    width: var(--fmt-w) !important;
    height: var(--fmt-h) !important;
    min-height: var(--fmt-h) !important;
    overflow: hidden;
  }
  /* reduz o excesso lateral: o conteúdo passa a usar a largura do quadrado */
  body > section .max-w-6xl,
  body > section .max-w-5xl { max-width: 1000px !important; }
  /* palco coerente com a altura do quadrado (valor fixo, não depende da janela) */
  .anim-stage { height: 560px !important; }
</style>
```

5. **Verificar o encaixe.** Confira mentalmente que, num quadro 1080x1080, cada slide cabe sem cortar conteúdo na vertical (título + card + pílulas) e que o conteúdo não estoura na horizontal. Se um slide específico ficar apertado na altura, reduza só o palco dele (ex.: `#st-XXXX { height: 480px !important; }`) dentro do mesmo bloco.
6. **Reportar.** Informe o caminho `index-1x1.html`, a resolução alvo 1080x1080, e como gravar: ajuste a viewport do navegador ou da ferramenta de captura (OBS browser source, device toolbar, Puppeteer) para exatamente 1080x1080. Como o arquivo já tem tamanho fixo, ele bate com o quadro.

## Observações honestas

- Os elementos fixos da navegação (barra de progresso, botão de próximo) ficam presos à viewport. Quando você grava na resolução exata 1080x1080, viewport e moldura coincidem e eles ficam no lugar certo. Numa janela maior só para pré-visualizar, eles podem encostar na borda da janela, não da moldura. É só cosmético da pré-visualização.
- A animação tem `viewBox` 16:9. Dentro do quadrado ela aparece centralizada com `preserveAspectRatio`, podendo sobrar uma faixa fina acima e abaixo. Isso é esperado no ajuste leve.

## Checklist

- [ ] `index.html` original intacto.
- [ ] `index-1x1.html` criado na mesma pasta do deck.
- [ ] Bloco `<style id="mira-formato-1x1">` injetado antes de `</head>`.
- [ ] Cada `body > section` fixado em 1080x1080.
- [ ] Espaços laterais reduzidos (max-width do conteúdo trazido para a largura do quadrado).
- [ ] Navegação, animações, textos e cores intocados.
- [ ] Nenhum slide corta conteúdo na vertical num quadro 1080x1080.
- [ ] Nenhum travessão (—); acentuação correta.
