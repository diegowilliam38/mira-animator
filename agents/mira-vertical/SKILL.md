---
name: mira-vertical
description: Gera uma versão VERTICAL (9:16, 1080x1920) de um deck do Mira, a partir do deck 16:9 original, para vídeo vertical (Reels, Shorts, TikTok, Stories). Não toca no arquivo original: cria um novo arquivo index-9x16.html ao lado, fixando cada slide em 1080x1920, centralizando o conteúdo e aproveitando a altura, com moldura fixa e ajuste leve. Use SEMPRE que o usuário disser "/mira-vertical", "versão vertical", "deixa vertical", "formato 9:16", "1080x1920", "apresentação vertical", "para Reels", "para Shorts", "para Stories", "para TikTok", "vídeo vertical", "modo retrato", ou pedir o deck num formato vertical.

---

# Skill: Versão Vertical do Deck (9:16, 1080x1920)

Transforma um deck 16:9 do Mira numa versão **vertical de 1080x1920**, para gravar como vídeo vertical. A abordagem é **moldura fixa com ajuste leve**: o conteúdo já é centralizado, então no quadro alto ele fica no centro, com o palco da animação um pouco maior para aproveitar a altura.

## REGRA DE IDIOMA

Siga `agents/_shared/idioma.md`. Texto visível em português correto. Proibido travessão (—): use vírgula ou dois-pontos.

## Regra de Ouro: nunca destrua o original

- O deck 16:9 (`index.html`) **permanece intacto**.
- Você cria um **arquivo novo** ao lado: `index-9x16.html`.
- Nunca edite a lógica das animações, os textos, as cores ou a navegação. A transformação é só de **enquadramento** (CSS de moldura).

## Como o Mira monta um slide (o que você vai reenquadrar)

- Cada slide é um `body > section` com `class="min-h-screen flex flex-col items-center justify-center ..."`: ocupa a tela inteira e centraliza o conteúdo.
- O conteúdo central usa `max-w-6xl` ou `max-w-5xl` com `px-6`.
- A navegação (barra de progresso no topo, botão de próximo no canto, teclado) é fixa e continua funcionando.
- O tema e o `base.css` estão inline no `<head>`; o Tailwind vem por CDN.

## Passos

1. **Localizar o deck.** Ache o `index.html` do deck (em `decks/<deck>/` ou `slides/<tema>/`). Se houver mais de um deck e o usuário não disser qual, pergunte.
2. **Copiar para o novo arquivo.** Copie `index.html` para `index-9x16.html` na mesma pasta (mesma pasta = os caminhos relativos de logo, vídeo e imagens continuam válidos).
3. **Confirmar o seletor dos slides.** O padrão do Mira é `body > section`. Se este deck embrulhar os slides de outro jeito, ajuste o seletor do override para casar com a estrutura real.
4. **Injetar a moldura.** Logo antes de `</head>` do `index-9x16.html`, insira este bloco (depois do Tailwind, para vencer a especificidade):

```html
<style id="mira-formato-9x16">
  /* Versão vertical 1080x1920, moldura fixa */
  :root { --fmt-w: 1080px; --fmt-h: 1920px; }
  html { background: var(--mira-bg, #000); }
  body { width: var(--fmt-w); margin-left: auto; margin-right: auto; }
  body > section {
    width: var(--fmt-w) !important;
    height: var(--fmt-h) !important;
    min-height: var(--fmt-h) !important;
    overflow: hidden;
  }
  /* reduz o excesso lateral: o conteúdo usa a largura vertical */
  body > section .max-w-6xl,
  body > section .max-w-5xl { max-width: 1000px !important; }
  /* aproveita a altura: palco maior (valor fixo, não depende da janela) */
  .anim-stage { height: 800px !important; }
</style>
```

5. **Verificar o encaixe.** Confira mentalmente que, num quadro 1080x1920, o bloco central (título + card + pílulas) fica centralizado e cabe, sem cortar. No vertical sobra espaço acima e abaixo do bloco: isso é esperado no ajuste leve. Se o usuário pedir para preencher mais a altura, aí sim aumente título, palco e espaçamentos (vira reflow, fora do ajuste leve).
6. **Reportar.** Informe o caminho `index-9x16.html`, a resolução alvo 1080x1920, e como gravar: ajuste a viewport do navegador ou da ferramenta de captura (OBS browser source, device toolbar, Puppeteer) para exatamente 1080x1920. Como o arquivo já tem tamanho fixo, ele bate com o quadro.

## Observações honestas

- Os elementos fixos da navegação (barra de progresso, botão de próximo) ficam presos à viewport. Quando você grava na resolução exata 1080x1920, viewport e moldura coincidem e eles ficam no lugar certo. Numa janela menor só para pré-visualizar, podem desalinhar da moldura. É só cosmético da pré-visualização.
- A animação tem `viewBox` 16:9. Dentro do quadro alto ela aparece centralizada com `preserveAspectRatio`, ocupando a faixa do palco. As faixas acima e abaixo do bloco central são o respiro do formato vertical no ajuste leve.

## Checklist

- [ ] `index.html` original intacto.
- [ ] `index-9x16.html` criado na mesma pasta do deck.
- [ ] Bloco `<style id="mira-formato-9x16">` injetado antes de `</head>`.
- [ ] Cada `body > section` fixado em 1080x1920.
- [ ] Espaços laterais reduzidos e palco aproveitando a altura.
- [ ] Navegação, animações, textos e cores intocados.
- [ ] O bloco central fica centralizado e não corta num quadro 1080x1920.
- [ ] Nenhum travessão (—); acentuação correta.
