# Brainstorm: skill /mira-qrcode, QR code grande no centro do slide

> Sessão de brainstorm conceitual entre usuário e Claude, registrada em
> 2026-06-11. Sem código nesta etapa. Implementação depende apenas de
> sessão dedicada; não há decisões pendentes.

## Contexto

Os slides do ecossistema mira são cards HTML (Tailwind + glass-card) sobre fundo preto com identidade laranja (#FF904D), regidos pela Regra Zero do `agents/mira-animator/SKILL.md` (todo slide tem loop interno contínuo). O usuário quer um comando para inserir num slide, novo ou existente, um QR code gerado a partir de um link ou texto fornecido por ele, grande e centralizado. Casos de uso típicos: CTA de fim de deck, link de material complementar, inscrição.

## Pergunta central

> Como gerar e exibir um QR code escaneável, grande e central, dentro do padrão visual e das regras dos decks mira?

## Decisões tomadas (pelo usuário, 2026-06-11)

1. **Comando: `/mira-qrcode`**, skill nova. Fluxo: usuário indica o slide (novo ou número/deck existente) e fornece o link ou texto a codificar.
2. **Geração na criação do slide, SVG embutido inline.** A skill roda um gerador local no momento de criar o slide e embute o resultado direto no HTML. Método validado em 2026-06-11: `npm install qrcode` em diretório temporário + one-liner Node com `QRCode.toString(dado, {type:'svg', errorCorrectionLevel:'M', margin:0})`. Atenção: `npx qrcode` direto travou no Windows do usuário (sem saída nem erro); a skill NÃO deve usar npx para isso. Zero dependência em tempo de apresentação; o slide funciona até aberto via `file://`. Se o link mudar depois, o slide é regerado pela própria skill.
3. **Sem legenda sob o QR.** Nada de link por extenso embaixo do código. O slide leva apenas o título (padrão do deck: sem ícone, máximo 6 palavras) e o QR.
4. **QR grande e central**, seguindo o padrão visual definido no brainstorm do mira-3d: card limpo, elemento principal maximizado.

## Regras de design definidas na mesa

- **Escaneabilidade manda no estilo.** Módulos escuros sobre cartão claro (branco ou quase branco), zona de silêncio respeitada ao redor do código. A identidade laranja fica na moldura e no título, nunca dentro dos módulos do QR. Não inverter cores do QR.
- **Regra Zero sem atrapalhar o scan.** O QR fica estático; o loop interno vai na moldura: pulso de brilho no cartão, cantos animados ou partículas orbitando. Nenhum elemento animado passa por cima dos módulos.
- Nível de correção de erro confortável (M ou Q) para escaneio à distância de projeção.

## Hipóteses descartadas na mesa

- **Biblioteca JS via CDN gerando o QR no navegador**: descartada, mais um script no deck e QR refém de internet na apresentação; a geração inline resolve sem custo de runtime.
- **API externa de imagem (api.qrserver.com e similares)**: descartada, envia o dado do usuário a terceiros e o slide morre se a API cair ou faltar internet.
- **Legenda com o link por extenso sob o QR**: descartada pelo usuário, só o título do slide.

## Decisões pendentes

Nenhuma. Todas resolvidas em 2026-06-11.

## Próximos passos

- Sessão de implementação: criar `agents/mira-qrcode/SKILL.md` com o fluxo (slide indicado + dado a codificar), a geração via `npx qrcode -t svg` (ou equivalente local), as regras de escaneabilidade e o padrão de moldura animada.
- Feito em 2026-06-11: slide de teste em `decks/teste-qrcode/` com o link https://sandeco.com.br (QR versão 2, 25x25 módulos, nível M, módulos #0a0a0a sobre cartão branco, margin 0 com zona de silêncio garantida pelo padding do cartão). Loop interno: pulso de brilho laranja na moldura + cantos respirando, nada sobre os módulos.
- Lembrar: a skill só vira comando `/mira-qrcode` após instalação em `.claude/skills/` do projeto destino; registrar também no manifest do instalador (`lib/installer/manifest.js`) e no campo `files` do `package.json`.

## Restrições ativas respeitadas nesta mesa

- Simplicidade primeiro, nada especulativo (origem: CLAUDE.md global)
- Convenção de nomes de comando em minúsculo (origem: memória do projeto)
- Skills viram comando só após instalação em `.claude/skills/` (origem: memória do projeto)
- Padrão visual dos slides: card limpo, elemento central maximizado (origem: decisão do usuário no BRAINSTORM_MIRA_3D.md)
- Publicação npm feita pelo usuário, versão varia só o último dígito (origem: memória do projeto)

## Status

Convergido. Última atualização: 2026-06-11.
