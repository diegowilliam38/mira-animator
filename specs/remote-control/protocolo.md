# Spec: protocolo do canal mira-remote

**Versão:** 1.1
**Status:** Implementada (v1), conforme `templates/remote/mira-remote-server.cjs`
**Data:** 2026-07-04
**Escopo:** contrato técnico entre servidor e clientes (notebook e celular).
Comportamento de produto na [`mira-remote.md`](./mira-remote.md). Implementação
de referência validada: `brainstormings/proto-mira-remote/server.cjs` e `deck.html`.

## 1. Arquitetura

Um processo Node puro (zero dependências) na máquina que apresenta, com dois
papéis: **servir o deck** por HTTP (resolve "de onde o celular tira o slide")
e **sincronizar estado** entre todos os conectados. O servidor é só o
carteiro: guarda o último estado e reemite para todos; o deck é a fonte da
verdade do que está na tela.

Transporte: **SSE para descer** (servidor → clientes, push) e **POST para
subir** (cliente → servidor). Escolhido no lugar de WebSocket por dispensar
dependências; latência validada no protótipo.

## 2. Endpoints

| Método e rota | Papel | Comportamento |
|---------------|-------|---------------|
| `GET /` | Serve a **shell** do remote | Mesmo HTML para todos os aparelhos; a shell roda o deck num iframe 1280×720 (seção 4) e carrega a UI do remote |
| `GET /index.html?stage=1` | Serve o deck para o iframe da shell | O HTML do deck intacto + a flag `window.__MIRA_REMOTE_STAGE__` injetada no `<head>` na hora de servir (desliga a UI local do mira-draw dentro do palco; quem desenha é a shell). Sem `?stage=1`, o deck é servido byte a byte |
| `GET /mira-draw.js` | Serve o telestrator | Cópia local do mira-draw com a API de sincronização (seção 5) |
| `GET /__mira_remote/me` | Identidade do aparelho | `{role: "stage"\|"control"\|"mirror", url}`; a shell decide a própria UI com isso |
| `GET /__mira_remote/qr.svg` | QR da sessão | SVG com a URL da LAN, gerado em runtime por encoder embutido (zero deps) |
| `GET /events` | Canal de descida (SSE) | Registra o cliente e envia imediatamente o estado completo atual (**join-state**); a cada mudança, reemite para todos |
| `POST /state` | Subida de navegação | Corpo `{slide, reveal}`; servidor guarda e faz broadcast |
| `POST /draw` | Subida de desenho | Corpo: array completo de traços em coordenadas do palco; servidor substitui e faz broadcast |
| `POST /tactics` | Subida do quadro tático | Corpo `{id, state}`: `id` é o caminho do arquivo do quadro (um deck pode ter vários), `state` é o estado completo do mira-tactics (peças, setas, zonas, orientação); servidor guarda no mapa `tactics` e faz broadcast. Limite 1 MB; mesmas regras de papel do `/draw` |
| demais `GET` | Arquivos do deck | Estáticos da pasta do deck (path traversal bloqueado) |

Regras normativas (rastreáveis a partir da spec de produto):

- RP-01: payload inválido é ignorado em silêncio (não derruba a sessão).
- RP-02: limite de corpo: 100 KB em `/state`, 2 MB em `/draw` (traços de caneta acumulam pontos).
- RP-03: resposta dos POST: `204` sem corpo, inclusive quando o comando é ignorado por falta de permissão.
- RP-04: todo cliente novo em `/events` recebe o estado completo imediatamente (join-state), antes de qualquer broadcast.
- RP-05: mensagem com `ts` mais velho que o estado atual é descartada pelo cliente.

## 3. Estado trafegado

Mensagem SSE (e join-state), JSON por linha `data:`:

```
{
  slide: 0,        // índice do slide atual (índice da seção rolada, nos decks por scroll)
  reveal: 0,       // sub-passo de revelação dentro do slide (0 nos decks por scroll)
  draw: [...],     // traços do telestrator (seção 5)
  tactics: {},     // estado dos quadros táticos por caminho de arquivo (seção 5b)
  clients: 2,      // aparelhos conectados (para a UI de status)
  externals: 1,    // IPs externos distintos conectados (a shell do palco esconde o QR quando > 0)
  url: "http://192.168.0.10:3000",  // URL da LAN (exibida sob o QR, fallback do EC-02)
  ts: 0            // carimbo para descartar mensagem mais velha que a atual
}
```

Princípios:

- **Sincroniza-se estado, não quadros.** A animação (Regra Zero) roda local
  em cada tela; o canal move o slide e a revelação.
- Cliente que recebe estado aplica sem republicar (evita eco infinito).
- Cliente que muda estado por ação local aplica e publica.
- `clients` é informativo; nenhuma lógica de papel depende dele.

## 4. Palco de referência: 1280×720

Todo cliente renderiza o slide num **quadro 16:9 fixo de 1280×720**, escalado
por `transform: scale()` para caber na tela e centralizado. Consequências:

- A geometria do slide é idêntica em qualquer aparelho (espelho de verdade).
- Escala local: `s = min(larguraTela/1280, alturaTela/720)`, com offsets de
  centralização `ox` e `oy`. Recalculada em todo resize/giro.
- Controles de UI (status, botões, barra de desenho) vivem **fora do palco**,
  sobrepostos e em tamanho nativo da tela; nunca disputam espaço com o slide.

## 5. Sincronização do desenho (telestrator)

Os traços do mira-draw trafegam **em coordenadas do palco** (espaço 1280×720),
nunca em pixels de viewport:

- Ao publicar: cada ponto `(x, y)` vira `((x - ox) / s, (y - oy) / s)`;
  espessura e tamanho de fonte dividem por `s`.
- Ao receber: transformação inversa para os pixels locais.
- No resize/giro: o cliente reaplica o último array recebido/publicado com a
  escala nova.

Contrato com o mira-draw (API mínima exposta pela cópia servida):

- `miraDraw.onchange(shapes)`: chamado quando o usuário confirma, apaga,
  desfaz ou limpa traços. O deck converte e publica em `/draw`.
- `miraDraw.setShapes(shapes)`: aplica traços vindos de fora e redesenha.
- Traço em andamento (`current`) nunca é sobrescrito por estado remoto.
- Canvas com traços fica visível (somente leitura, sem capturar toques)
  mesmo com o modo desenho desligado, para o espelho exibir o risco do outro.

Formato de um traço (o mesmo objeto interno do mira-draw):

```
{ type: 'pen'|'marker'|'line'|'arrow'|'rect'|'ellipse'|'text',
  color, width, points? | x0,y0,x1,y1 | x,y,size,text }
```

### 5a. Ciclo de vida do desenho

Trocar de slide **desliga o modo desenho e apaga os traços em todos os
aparelhos** (decisão de 2026-07-04): o telestrator anota o que está na tela
agora, e o slide novo começa limpo. Quem inicia a troca publica o slide e o
`/draw` vazio; quem recebe limpa localmente ao aplicar o slide.

### 5b. Sincronização do quadro tático (mira-tactics)

Cada slide de quadro tático expõe `window.miraTactics` com o mesmo contrato do
mira-draw: `getState()`, `setState(state)` (aplica sem reemitir) e `onchange`
(disparado em toda mutação, inclusive durante o arrasto, para movimento ao
vivo). O estado viaja completo (`pieces` em coordenadas de campo 0..1,
`arrows`, `shapes`, `orientation`) e é identificado pelo caminho do arquivo.
A shell faz o throttle (~90 ms) e descarta ecos comparando o JSON.

## 6. Papéis por origem da conexão

O servidor classifica cada requisição pelo IP de origem:

| Origem | Papel | Permissões |
|--------|-------|------------|
| `127.0.0.1` / `::1` | Palco (notebook) | Navega, desenha, reabre QR |
| Primeiro IP externo | Controle (celular do professor) | Navega, desenha |
| Demais IPs externos | Espelho | Só recebe; `POST /state` e `POST /draw` são ignorados (204, sem efeito) |

O "primeiro IP externo" é fixado na primeira conexão externa da sessão e vale
até o servidor reiniciar. Ignorar em silêncio (e não rejeitar com erro)
mantém a UI do espelho simples na v1.

## 7. Ciclo de vida da sessão

1. Launcher sobe o servidor; porta padrão 3000, tentando as seguintes se
   ocupada. Descobre os IPs IPv4 não internos para montar a URL da LAN.
2. Launcher abre `http://localhost:<porta>` no navegador padrão (o palco).
3. Palco exibe QR com `http://<ip-lan>:<porta>` enquanto `clients` externos = 0.
4. Celular conecta em `/events`, recebe join-state, QR some no palco.
5. Sessão vive enquanto o processo viver; fechar aba não derruba nada
   (reabrir recupera via join-state). `Ctrl+C`/fechar janela encerra.

## 8. Fora deste contrato (v1)

- Autenticação, ID de sessão e token no QR (entram com o suporte a plateia).
- Persistência de estado entre execuções do servidor (sessão morre com o processo).
- Compressão ou delta de traços (o array completo é pequeno o bastante na LAN).
- HTTPS (rede local, sem dados sensíveis; `getUserMedia` etc. não são usados).

## Histórico

| Versão | Data | Mudanças |
|--------|------|----------|
| 1.0 | 2026-07-04 | Extraído do protótipo validado e das decisões do brainstorm |
| 1.1 | 2026-07-04 | Como implementado (`templates/remote/mira-remote-server.cjs`): shell em `/` com deck em iframe (`?stage=1`), endpoints `/__mira_remote/me` e `/__mira_remote/qr.svg`, campos `externals` e `url` no estado |
| 1.2 | 2026-07-04 | Quadro tático sincronizado (`POST /tactics` + campo `tactics` + API `miraTactics`) e ciclo de vida do desenho (trocar de slide limpa e sai da caneta) |
