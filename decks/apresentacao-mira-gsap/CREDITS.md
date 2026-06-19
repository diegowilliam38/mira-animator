# Créditos e licenças, deck apresentacao-mira-gsap

Deck autocontido: todas as dependências de animação estão vendoradas em `assets/`
e rodam offline (file://). Nada é buscado por CDN em tempo de execução.

## GSAP 3.13.0 (`assets/gsap/`)
- Arquivos: `gsap.min.js`, `MorphSVGPlugin.min.js`, `DrawSVGPlugin.min.js`, `MotionPathPlugin.min.js`.
- Fonte do download: cdnjs (`https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/`).
- Licença: GSAP "No Charge" Standard License. Desde abril de 2025 o GSAP e todos os
  plugins (inclusive MorphSVG, DrawSVG, MotionPath) são gratuitos, inclusive para uso
  comercial e redistribuição. https://gsap.com/community/standard-license

## Ícones, Material Design Icons (`assets/icons/`)
- Conjunto: MDI (Pictogrammers / Material Design Icons), via API do Iconify.
- viewBox 0 0 24 24, single-path (otimizados para morph par a par).
- Os `d` dos paths foram embutidos inline no `index.html` (requisito do MorphSVG).
- Licença: Apache License 2.0. https://pictogrammers.com/docs/general/license/
- Ícones usados: cloud, lightbulb-on, eye, heart, text, image, brain, monitor,
  crop-square, crop-portrait, lock, lock-open-variant, sprout, pencil,
  play-circle, star, rocket.

## Bibliotecas por CDN (apenas estilo/UI, não essenciais à animação)
- Tailwind, AOS, Lucide, fonte Inter (Google Fonts). Usadas para layout e tipografia.
