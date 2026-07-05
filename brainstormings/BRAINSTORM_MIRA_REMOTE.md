# Brainstorm: skill /mira-remote (sincronizar segunda tela e controle)

> Especificação inicial salva em 2026-07-04. Objetivo: permitir que um **segundo
> aparelho** (celular ou tablet) fique sincronizado com o deck do Mira que está
> sendo projetado no computador — para espelhar, mostrar notas do apresentador
> ou virar controle remoto da apresentação.

## Ideia central

Hoje o deck do Mira é um `index.html` autocontido que abre em `file://`, sem
servidor. Isso é ótimo para portabilidade, mas é justamente o que impede dois
aparelhos de compartilharem estado sozinhos.

O `/mira-remote` adiciona um **canal** entre o computador que apresenta e um
segundo aparelho. Com esse canal, o segundo aparelho pode:

- **Espelhar** o slide atual (segunda tela).
- Mostrar **presenter view**: próximo slide, notas, cronômetro.
- Virar **controle remoto**: avançar, voltar, revelar, disparar animação — sem
  o apresentador ficar preso ao computador.

Referência mental: o *presenter view* do PowerPoint/Keynote + um controle que
cabe no bolso.

### Celular = tablet

Do ponto de vista técnico é o **mesmo caso**: é uma página web aberta no
navegador do aparelho. O que muda é só o tamanho da tela — o layout do controle
se adapta (celular = botões grandes numa coluna; tablet = presenter view com
mais informação). O mecanismo de sincronização é idêntico. Na prática, o
**celular é o caso mais comum** para professor/palestrante.

## Três modos (decidir o alvo, muda o design)

O verbo "sincronizar" tem três sentidos diferentes. A skill deve tratá-los como
modos do mesmo deck:

| Modo | O aparelho mostra | Uso típico |
|------|-------------------|------------|
| **Espelho** | o mesmo que o projetor | aluno acompanha, segunda tela |
| **Presenter view** | próximo slide, notas, timer | professor conduz (estilo PPT) |
| **Controle remoto** | só os botões de comando | andar pela sala regendo o telão |

O mais valioso para sala de aula é **presenter view + controle**: o professor vê
o que vem e as notas, e avança pelo próprio celular. Encosta direto no
`/mira-timer` do `BRAINSTORM_MIRA_EDUCACIONAL.md`.

## Análise de viabilidade dos 3 modos (2026-07-04)

A pergunta que **ordena a dificuldade**: *o segundo aparelho precisa renderizar o
conteúdo do slide, ou só mandar/receber comando?* Como o deck vive em `file://`
no PC, o celular não lê o disco do PC — então tudo que for "mostrar o slide" no
celular depende de o deck estar acessível por uma URL.

| Modo | Renderiza slide no aparelho? | Precisa hospedar/servir o deck? | Veredito |
|------|------|------|------|
| **Controle remoto** | não | não | ✅ v1, fácil (payload `{action}`, reusa o teclado) |
| **Presenter (texto)** | não (só título+notas via canal) | não | ✅ v1, exige inventar campo de notas |
| **Presenter (thumbnail)** | sim | sim | ⏳ depois |
| **Espelho (estado)** | sim | sim | ⏳ viável se o deck for servido/publicado |
| **Espelho (vídeo/pixels)** | — | — | ❌ fora de escopo (screen-share pesado) |

Conclusões:

- **Controle remoto** é o mais viável e é o núcleo: o deck já navega por teclado,
  o receptor só traduz o comando recebido no mesmo evento da tecla.
- **Presenter view em modo texto** é o sweet spot de valor: título atual/próximo,
  notas e timer trafegam como texto pequeno pelo canal, sem hospedar nada. Único
  trabalho novo: **campo de notas por slide** (o deck do Mira não tem hoje).
- **Espelho** é o mais difícil porque força o deck a estar acessível por URL —
  daí a rota do servidor local abaixo, que resolve isso de graça.

Riscos transversais a qualquer modo: **join-state** (quem entra no meio recebe o
estado atual), **lock de controle** (senão qualquer um mexe nos slides), e
degradação limpa sem rede.

## Rotas técnicas para o canal

### 1. Relay na nuvem — escolha para a v1

Um serviço realtime (Firebase Realtime DB, Supabase Realtime, Ably, PubNub) como
"quadro branco" que os dois aparelhos leem/escrevem:

- O deck no PC **publica** o estado (slide atual, sub-estado de revelação, etc.).
- O aparelho **assina** o mesmo canal e reflete/controla.
- Funciona em **qualquer rede** (PC no cabo, celular no 4G).
- Mantém o `file://` — só troca a dependência: precisa de internet.
- É a evolução natural do padrão Forms+Sheets do `mira-survey`/`mira-quiz`, mas
  com **latência baixa de verdade** em vez de polling.

### 2. Servidor local na LAN — promovida para o espelho (protótipo pronto)

O PC roda um processo leve que faz **duas coisas**: serve o deck (o celular pega
o HTML/assets pela rede local — resolve "de onde o celular tira o slide") e
mantém um canal que sincroniza estado entre todos os conectados.

- **Bidirecional e sem dono**: qualquer aparelho que muda o estado move todos,
  inclusive a tela do PC. O servidor é só o carteiro.
- **Sem chave de terceiro, sem custo, sem conta** — elimina o maior risco de
  produto da rota nuvem.
- **Offline** (basta a mesma rede/Wi-Fi), latência baixíssima. **Funciona também
  no hotspot do celular** — o que importa é PC e celular na mesma rede, não quem
  cria a rede. (Cuidado: alguns hotspots têm "AP isolation" que bloqueia.)
- Custo: sai do `file://` puro (roda `node server.cjs` / futuro `npx mira present`)
  e exige as duas máquinas na mesma rede.

**Protótipo funcional** em `brainstormings/proto-mira-remote/` (Node puro, zero
deps, SSE + POST em vez de WebSocket por simplicidade). Testado: join-state,
sincronização bidirecional em tempo real e deck servido. Ainda sem lock de
controle, QR ou presenter view.

### 3. WebRTC / BroadcastChannel — descartados para v1

- BroadcastChannel/`localStorage` só sincronizam abas na **mesma máquina**, não
  entre aparelhos. Não serve.
- WebRTC (peer-to-peer) resolveria, mas ainda exige um servidor de sinalização;
  complexidade alta demais para a v1.

## Como o aparelho entra na sessão

Reusar o que o Mira já faz bem: **QR code**.

- O deck exibe um QR (discreto ou numa tecla, ex.: `C` de "conectar").
- O QR aponta para a **página de controle** já com o ID da sessão embutido.
- O aparelho abre, entra no canal daquela sessão e passa a espelhar/controlar.
- ID de sessão curto (ex.: 4-6 caracteres) para poder digitar caso o QR falhe.

Sem login, sem app — só abrir o navegador, como no `mira-survey`.

## Direção da sincronização

Dois sentidos possíveis, e a v1 ideal cobre os dois:

- **PC → aparelho** (espelho / presenter view): o palco é o PC, o aparelho segue.
- **Aparelho → PC** (controle remoto): o aparelho manda comandos, o PC obedece.

Estado mínimo trafegado:

```js
{
  session: "AB12",
  slide: 7,          // índice do slide atual
  reveal: 2,         // sub-passo / camada revelada
  action: "next",    // comando pontual vindo do controle
  ts: 0              // carimbo para ordenar/descartar mensagens velhas
}
```

O deck continua sendo a **fonte da verdade** do que está na tela; o canal só
propaga mudança de slide/estado e recebe comandos.

## O que preservar da filosofia Mira

- **Regra Zero**: mesmo sincronizado, cada slide mantém seu loop interno vivo.
  A sincronização move o *slide/estado*, não substitui a animação.
- **`file://` sempre que possível**: a v1 (nuvem) mantém o deck em `file://`;
  só o **canal** precisa de internet. Deixar isso explícito para o usuário, como
  já se faz nas skills com dado ao vivo.
- **Degradação graciosa**: sem internet/canal, o deck continua apresentável
  normalmente pelo teclado no PC. O remote é uma camada opcional, nunca um
  requisito para a apresentação rodar.
- **Sem app, sem login**: entrada por QR + navegador, no padrão do `mira-survey`.

## Decisões da v1 (revisadas em 2026-07-04)

1. Para o **espelho**, o canal é o **servidor local na LAN** (rota 2), não a
   nuvem — porque também *serve* o deck, resolvendo a hospedagem de graça e sem
   chave de terceiro. A nuvem (rota 1) fica para quando o deck estiver publicado.
2. Ordem de entrega por viabilidade: **controle remoto** → **presenter view
   (texto)** → espelho de estado / thumbnails.
3. Entrada por **QR code** com ID de sessão curto, SVG inline (padrão dos QRs do
   Mira). No servidor local, o QR aponta para `http://<ip-lan>:porta`.
4. Deck é a fonte da verdade; canal carrega só `{slide, reveal}` (+ `action` no
   controle).
5. Layout **responsivo**: celular (botões grandes) e tablet (presenter view mais
   rico) são o mesmo código. Celular == tablet, muda só a tela.
6. Camada **opcional**: a apresentação sempre roda 100% pelo teclado sem o remote.
7. Presenter view exige **campo de notas por slide** — nova superfície de autoria
   a desenhar.

## Próximos passos

- [x] Rodar o protótipo **fora do container** e testar PC + celular na mesma
      rede de verdade (2026-07-04, no hotspot do celular: funcionou; exigiu
      liberar a porta no firewall do Windows, rede veio como "Pública").
- [x] Espelho com **palco 16:9 fixo escalado** (mesma geometria em toda tela),
      fullscreen + paisagem no celular, telestrator embutido com **desenho
      sincronizado** em coordenadas do palco (branch `mira-remote`).
- [ ] Implementar o fluxo de ativação da rodada 2: atalho de duplo clique +
      QR automático + lock do primeiro IP externo.
- [ ] Prototipar **presenter view texto** (título atual/próximo + notas + timer).

## Forma candidata da skill

```text
/mira-remote
- ativa a camada de sincronização num deck
- gera QR + ID de sessão
- modo: espelho | presenter | controle
- canal: nuvem (v1) | lan (v2)
```

## Checklist da v1

- [ ] Deck publica estado (slide, reveal) num canal realtime na nuvem.
- [ ] Segundo aparelho assina o canal e reflete o estado (espelho).
- [ ] Segundo aparelho envia comandos (next/prev/reveal) de volta (controle).
- [ ] Entrada na sessão por QR code inline + ID curto digitável.
- [ ] Mesmo layout serve celular e tablet (responsivo).
- [ ] Sem login, só navegador, no padrão do `mira-survey`.
- [ ] Deixa explícita a dependência de internet para o canal.
- [ ] Deck continua apresentável 100% pelo teclado sem o remote (degradação).
- [ ] Preserva a Regra Zero: loop interno contínuo em cada slide.
- [ ] Presenter view (notas + próximo slide + timer) mapeado para logo após a v1.

## Relações com outras frentes

- `/mira-timer` (educacional): o timer natural do presenter view.
- `/mira-quiz`, `/mira-survey`: mesma mentalidade de QR + fonte de dados; aqui o
  salto é trocar polling por canal realtime.
- `BRAINSTORM_MIRA_INTERATIVIDADE.md`, item 8 ("Controle pelo celular"): este
  documento é o aprofundamento daquela ideia.

## Rodada 2 (2026-07-04): ativação do servidor

> O usuário do Mira é leigo. Ligar o espelhamento precisa ser tão simples
> quanto "duplo clique, aponta a câmera". Esta rodada define o gesto de
> ativação para a **combinação primal**: um notebook apresentando + um
> celular. Plateia e múltiplos aparelhos ficam para depois.

### Fluxo decidido

1. **Atalho de duplo clique** gravado na pasta do deck pelo `/mira-remote`
   (nome amigável, ex.: "Apresentar com celular", nunca `server.cjs`).
   Ele sobe o servidor e abre o deck no navegador do PC já via `http://`.
   Precisa ser um arquivo executável: navegador em `file://` não consegue
   subir servidor.
2. **QR aparece sozinho** num canto do deck enquanto ninguém entrou,
   apontando para o IP da LAN. Sem tecla, sem configuração.
3. **Celular escaneia e entra**: o QR some sozinho e as opções de
   espelho/controle aparecem no celular. O professor não escolhe nada no PC;
   quem entra decide o que quer ser.
4. **Sem o atalho**, o deck abre em `file://` normal: sem QR, sem servidor,
   apresentável 100% pelo teclado. Degradação intacta.

### Identificação dos papéis (sem login, sem pareamento)

O servidor enxerga o IP de cada conexão:

- `127.0.0.1` (localhost) = o notebook, a tela do professor. Inconfundível.
- Primeiro IP externo da LAN = o celular do professor.

Disso saem duas decisões de graça:

- **Lock de controle natural (v1)**: o servidor só aceita comandos do
  primeiro IP externo. Segundo aparelho vê espelho, mas não controla.
- **Limite honesto**: IP identifica o aparelho, não a pessoa. Vira problema
  só quando abrir para plateia; aí entra ID de sessão/token no QR.

### Pontos de atenção

- **Firewall do Windows**: no primeiro uso pergunta se deixa o Node receber
  conexão (esbarramos nisso no teste real, rede de hotspot vem como
  "Pública" e bloqueia silenciosamente). O atalho deve avisar "clique em
  Permitir", ou o instalador cria a regra.
- User-Agent mobile pode reforçar a identificação do celular, mas o IP
  sozinho já resolve o caso primal.

### Decisões desta rodada

1. Gesto de ativação: atalho de duplo clique na pasta do deck (não comando
   de terminal, não tecla dentro do deck).
2. QR automático até a primeira conexão externa; depois some. Reabrir fica
   acessível por tecla/botão para quem entrar no meio.
3. localhost = palco; primeiro IP externo = controle exclusivo (lock v1).
4. Escopo: combinação primal (notebook + 1 celular). Plateia depois.

### Decisão pendente

- **DECISÃO PENDENTE, casa do servidor.** O canal vira evolução do
  `mira-serve.js` que já existe (um servidor só para autoria e apresentação)
  ou processo próprio do remote? Sugestão da mesa: evoluir o `mira-serve.js`.

## Status

Convergido como direção inicial; rodada 2 (ativação) convergida para a
combinação primal. Pronto para virar spec de implementação.
Última atualização: 2026-07-04.
