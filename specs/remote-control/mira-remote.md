# Spec: mira-remote (espelhamento e controle pelo celular)

**Versão:** 1.2
**Status:** Implementada (v1); falta só o teste real da combinação primal (seção 13)
**Data:** 2026-07-04
**Fontes:** `brainstormings/BRAINSTORM_MIRA_REMOTE.md` (rodadas 1 e 2) e o
protótipo validado em `brainstormings/proto-mira-remote/` (branch `mira-remote`).
Contrato técnico do canal: [`protocolo.md`](./protocolo.md).

---

## 1. Resumo

O `/mira-remote-control` liga um deck do Mira a um segundo aparelho pela rede local:
o notebook apresenta, o celular espelha e controla. Um atalho de duplo clique
sobe um servidor leve, um QR aparece no deck, o celular escaneia e entra.
Tudo sem app, sem login, sem internet (basta a mesma rede).

---

## 2. Contexto e Motivação

**Problema:** o deck do Mira é um `index.html` em `file://`, ótimo para
portabilidade, mas dois aparelhos não compartilham estado sozinhos. O
professor fica preso ao teclado do notebook.

**Evidências:** protótipo testado em 2026-07-04 num cenário real (notebook +
celular no hotspot do próprio celular): espelho bidirecional, desenho
sincronizado e fullscreen funcionaram; as fricções reais encontradas foram
firewall do Windows e proporção de tela, ambas resolvidas no protótipo.

**Por que agora:** as ferramentas de manipulação ao vivo (mira-draw,
mira-tactics) acabaram de nascer; controlar e riscar o slide andando pela
sala é a extensão natural delas.

---

## 3. Goals (Objetivos)

Escopo da v1 é a **combinação primal**: um notebook apresentando + um
celular. Todo o design otimiza esse caso.

- [ ] G-01: professor liga o espelhamento com um duplo clique e uma escaneada de QR, sem terminal e sem configuração.
- [ ] G-02: o celular espelha o slide com a mesma geometria do notebook (palco 16:9 escalado).
- [ ] G-03: o celular controla a apresentação (avançar, voltar, revelar) e o notebook obedece em tempo real.
- [ ] G-04: desenhos do telestrator aparecem nos dois aparelhos, no mesmo lugar do slide.
- [ ] G-05: sem o remote, o deck continua 100% apresentável pelo teclado em `file://`.

**Métricas de sucesso:**

| Métrica | Baseline atual | Target |
|---------|----------------|--------|
| Passos do professor até o celular controlar | Impossível hoje | 2 gestos (duplo clique + escanear) |
| Latência de comando na LAN | N/A | < 1 s percebido (tipicamente < 200 ms) |
| Dependências novas de runtime | 0 | 0 (Node puro, zero pacotes) |
| Deck sem o remote | Funciona via teclado | Continua funcionando igual (regressão zero) |

---

## 4. Non-Goals (Fora do Escopo)

- NG-01: plateia entrando na sessão (múltiplos aparelhos com papéis distintos). O lock do primeiro IP externo já bloqueia; a abertura para plateia exige ID de sessão/token no QR e fica para a v2.
- NG-02: canal via nuvem (Firebase/Supabase/Ably). A rota LAN resolve a combinação primal sem conta nem custo.
- NG-03: espelho por vídeo/pixels (screen-share). Sincronizamos estado, não quadros.
- NG-04: presenter view com notas e timer. Mapeado como evolução natural, exige campo de notas por slide que o deck não tem.
- NG-05: fullscreen programático no iPhone (Safari não suporta; o botão se esconde e o giro é manual).
- NG-06: identificar a pessoa (autenticação). IP identifica o aparelho, suficiente para a combinação primal.

---

## 5. Usuários e Personas

**Usuário primário:** professor/palestrante leigo em tecnologia. Sabe dar
duplo clique e apontar a câmera do celular. Não sabe (nem deve precisar
saber) o que é servidor, porta ou IP.

**Usuário secundário:** não há na v1 (plateia é non-goal NG-01).

**Jornada atual (sem a feature):** o professor abre o `index.html` no
notebook e apresenta preso ao teclado; não há segunda tela nem controle.

**Jornada futura (com a feature):** (1) duplo clique no atalho "Apresentar
com celular" na pasta do deck; (2) o deck abre no navegador com um QR no
canto; (3) escaneia com o celular; (4) o QR some e o celular vira espelho +
controle + caneta.

---

## 6. Requisitos Funcionais

### 6.1 Requisitos Principais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|--------------------|
| RF-01 | O launcher deve subir o servidor e abrir o deck no navegador padrão com um único duplo clique | Must | Duplo clique no atalho abre o deck via `http://localhost` com a sessão ativa |
| RF-02 | O deck servido deve exibir QR com a URL da LAN enquanto não houver conexão externa | Must | Abrir o deck pelo launcher mostra o QR; escanear conecta o celular |
| RF-03 | O QR deve sumir quando a primeira conexão externa entrar, e reabrir pela tecla `C` | Must | Conectar o celular esconde o QR; `C` no notebook o reexibe |
| RF-04 | Mudança de slide/revelação em qualquer aparelho autorizado deve refletir em todos os conectados | Must | Avançar no celular move o notebook e vice-versa, em menos de 1 s na LAN |
| RF-05 | Quem entra no meio deve receber o estado atual (slide, revelação e desenhos) na hora | Must | Recarregar a página no celular durante o slide 3 abre direto no slide 3 com os traços |
| RF-06 | O slide deve renderizar com geometria idêntica em qualquer tela: palco 16:9 fixo (1280×720) escalado para caber | Must | Screenshot do celular deitado e do notebook mostram a mesma composição, mudando só o tamanho |
| RF-07 | Traços do telestrator feitos em um aparelho devem aparecer nos demais, no mesmo lugar do slide | Must | Circular um item no celular desenha o círculo sobre o mesmo item no notebook |
| RF-08 | Comandos de aparelhos que não sejam o localhost nem o primeiro IP externo devem ser ignorados | Must | Segundo celular conectado vê o espelho mas seus toques em "Avançar" não movem nada |
| RF-09 | No celular, um botão deve levar a fullscreen e travar a orientação em paisagem (onde o navegador permitir) | Should | Toque no botão em Android/Chrome deixa o deck em tela cheia deitada; no iPhone o botão não aparece |
| RF-10 | Em telas baixas (celular deitado), controles e barra de desenho devem ser compactos e não cobrir o slide | Should | Com o modo desenho aberto no celular deitado, o slide permanece legível e todos os botões alcançáveis |
| RF-11 | O servidor deve escolher outra porta se a padrão estiver ocupada e refletir isso no QR | Should | Subir duas sessões na mesma máquina funciona, cada uma com seu QR |

### 6.2 Fluxo Principal (Happy Path)

1. O professor dá duplo clique no atalho "Apresentar com celular" na pasta do deck.
2. O sistema sobe o servidor local e abre o deck no navegador do notebook via `http://localhost:<porta>`.
3. O deck exibe um QR discreto num canto, apontando para `http://<ip-lan>:<porta>`.
4. O professor escaneia o QR com a câmera do celular e abre o link.
5. O sistema registra a primeira conexão externa: o QR some no notebook e o celular recebe o estado atual (join-state).
6. O professor toca "Avançar" no celular; o notebook avança junto em menos de 1 s.
7. O professor toca ✎ no celular e circula um item; o círculo aparece no notebook sobre o mesmo item.
8. Resultado: apresentação conduzida do celular, notebook como palco.

### 6.3 Fluxos Alternativos

**Fluxo A, aparelho entra no meio da aula:**
1. O professor aperta `C` no notebook; o QR reaparece.
2. O aparelho escaneia e entra já no slide atual, com os desenhos existentes.
3. Por ser a segunda conexão externa, entra como espelho sem controle (RF-08).

**Fluxo B, apresentação sem o remote:**
1. O professor abre o `index.html` direto (duplo clique no HTML, `file://`).
2. Nenhum QR aparece, nenhuma conexão é tentada; o deck funciona 100% pelo teclado.

**Fluxo C, celular cai e volta:**
1. O Wi-Fi do celular oscila; o indicador do deck mostra "reconectando".
2. O SSE reconecta sozinho; o celular recebe join-state e volta sincronizado, mantendo o papel de controle (mesmo IP).

---

## 7. Requisitos Não-Funcionais

| ID | Requisito | Valor alvo | Observação |
|----|-----------|-----------|------------|
| RNF-01 | Latência de comando na LAN | < 1 s percebido (tipicamente < 200 ms) | Validado no protótipo com SSE |
| RNF-02 | Dependências do servidor | Zero pacotes externos (Node puro, Node >= 18) | Padrão validado no protótipo |
| RNF-03 | Dependência de internet | Nenhuma; só a mesma rede local | Funciona no hotspot do próprio celular |
| RNF-04 | Regra Zero | O loop de animação de cada slide roda local e nunca para | Sincroniza-se estado, não quadros |
| RNF-05 | Degradação | Sem servidor/rede, o deck apresenta 100% via teclado em `file://` | O remote é camada opcional |

---

## 8. Design e Interface

**Componentes afetados:** deck servido (camada remote injetada), launcher na
pasta do deck, servidor local, cópia do `mira-draw.js` com API de sync.

**Comportamento esperado:** a UI do remote é invisível até ser necessária.
No notebook: QR no canto até o celular entrar, indicador discreto de conexão
("sincronizado", "N aparelhos"). No celular: mesmos slides do palco + botões
grandes de Voltar/Avançar, botão ✎ (desenho) e ⛶ (fullscreen) no topo.

**Estados da UI:**

- Estado vazio (nenhum aparelho externo): QR visível no palco.
- Estado conectando: indicador "conectando…" com ponto neutro.
- Estado sincronizado: ponto verde + contagem de aparelhos; QR oculto.
- Estado de erro/queda: "reconectando…" e o deck segue operável pelo teclado local.

---

## 9. Modelo de Dados

Sem persistência em disco. O estado de sessão vive em memória no servidor e
está especificado no contrato técnico: [`protocolo.md`](./protocolo.md)
(estado `{slide, reveal, draw, clients, ts}`, traços em coordenadas do palco
1280×720).

**Migrações necessárias:** Não.

---

## 10. Integrações e Dependências

| Dependência | Tipo | Impacto se indisponível |
|-------------|------|------------------------|
| Node.js >= 18 na máquina do professor | Obrigatória | Launcher orienta instalar; deck segue funcionando em `file://` |
| Navegador moderno (Chrome/Edge no PC; Chrome Android no celular) | Obrigatória | iPhone/Safari: espelho e controle funcionam, fullscreen não (NG-05) |
| Mesma rede local entre notebook e celular | Obrigatória | Sem rede comum não há sessão; deck segue em `file://` |
| `mira-draw.js` (telestrator) | Opcional | Sem ele, espelho e controle funcionam; só não há desenho sincronizado |

---

## 11. Edge Cases e Tratamento de Erros

| Cenário | Trigger | Comportamento esperado |
|---------|---------|------------------------|
| EC-01: firewall do Windows bloqueia | Rede marcada como "Pública" (hotspot cai aqui) sem regra para o Node | Launcher orienta a clicar "Permitir" no diálogo do Windows; documentar a criação de regra para a porta como alternativa |
| EC-02: AP isolation no hotspot | Roteador/hotspot bloqueia tráfego entre clientes | Celular não carrega a página; o deck mantém o QR e mostra a URL digitável + dica de trocar de rede |
| EC-03: queda momentânea de rede | Wi-Fi oscila | SSE reconecta sozinho (retry nativo do EventSource); indicador muda para "reconectando" e volta com join-state |
| EC-04: IP do notebook muda (DHCP) | Reconexão à rede durante a sessão | QR é gerado na hora a partir do IP atual; sessão antiga do celular exige reescanear |
| EC-05: segundo aparelho externo entra | Outra pessoa escaneia o QR reaberto | Vê espelho somente leitura (RF-08); nenhuma notificação de erro, opção de controle indisponível |
| EC-06: porta ocupada | Outro processo na porta padrão | Servidor tenta as portas seguintes e o launcher abre a URL certa (RF-11) |
| EC-07: comando chega fora de ordem | Rajada de toques + latência | Carimbo `ts` no estado; mensagem mais velha que a atual é descartada |
| EC-08: navegador do PC fechado | Professor fecha a aba do palco | Servidor segue vivo; reabrir `http://localhost:<porta>` volta ao estado atual via join-state |

---

## 12. Segurança e Privacidade

- **Autenticação:** nenhuma na v1; autorização por IP de origem (localhost = palco, primeiro IP externo = controle, demais = espelho).
- **Exposição:** o servidor escuta apenas na LAN; nada é exposto à internet.
- **Dados sensíveis:** nenhum. Trafega estado do deck (índices e traços) e o próprio HTML do deck.
- **Auditoria:** não requerida (sessão efêmera, morre com o processo).

---

## 13. Plano de Rollout

- **Estratégia:** skill `/mira-remote-control` opt-in por deck (grava o launcher e injeta a camada). Nenhum deck existente muda sem o usuário pedir.
- **Como reverter:** apagar o launcher e a camada injetada devolve o deck ao estado `file://` puro.
- **Monitoramento pós-implementação:** repetir o teste da combinação primal (notebook + celular em hotspot) cobrindo RF-01 a RF-08.

---

## 14. Open Questions

Todas resolvidas na implementação (2026-07-04):

| # | Pergunta | Decisão |
|---|----------|---------|
| OQ-01 | Evoluir o `mira-serve.js` ou processo próprio? | **Processo próprio** (`mira-remote-server.cjs`, copiado para a pasta do deck). O `mira-serve.js` é ferramenta de autoria com endpoint de gravação em disco e escuta só em localhost; expor isso na LAN durante uma aula seria risco desnecessário, e o launcher de duplo clique precisa de um servidor que viaje junto com a pasta do deck. Contraria a sugestão da mesa; sandeco pode reverter. |
| OQ-02 | Formato do launcher | `.bat` com console visível no Windows (mostra a URL, o aviso do firewall e erros; fechar a janela encerra a sessão) + `.command` para macOS/Linux. Sem `.vbs`: janela invisível esconderia o erro de Node ausente. |
| OQ-03 | URL digitável junto do QR | Sim: a shell exibe a URL sob o QR (fallback do EC-02). |

---

## 15. Decisões Tomadas (Decision Log)

| Decisão | Alternativas consideradas | Racional |
|---------|--------------------------|----------|
| Canal via servidor local na LAN | Relay na nuvem (exige conta/chave/internet); WebRTC (exige sinalização); BroadcastChannel (só mesma máquina) | Serve o deck e sincroniza de graça, offline, zero custo |
| SSE + POST em vez de WebSocket | WebSocket | Zero dependência em Node puro; latência suficiente comprovada no protótipo |
| Palco 16:9 fixo (1280×720) escalado | Layout fluido por tela | Layout fluido quebrou o espelho no teste real (proporções diferentes, controles cortados) |
| Traços em coordenadas do palco | Coordenadas de viewport | Viewport coloca o desenho no lugar errado em telas de tamanho diferente |
| Ativação por atalho de duplo clique | Comando de terminal; tecla dentro do deck | Usuário leigo; navegador em `file://` não sobe servidor |
| Papéis por IP (localhost = palco, 1º externo = controle) | Pareamento por código; login | Zero fricção na combinação primal e lock de controle de graça |
| QR automático que some na primeira conexão | QR permanente; QR atrás de tecla | Zero gesto para o caso comum; tecla `C` cobre reentrada |
| Deck roda num iframe 1280×720 dentro de uma shell, sem tocar no `index.html` | Injetar a camada dentro do próprio HTML do deck | O iframe entrega o palco 16:9 (RF-06) para QUALQUER deck existente sem modificá-lo: o viewport do deck é sempre 1280×720 e a shell só escala; reverter = apagar 4 arquivos; regressão zero garantida por construção |
| Slide sincronizado = índice da seção rolada (decks do Mira navegam por scroll) | Reescrever a navegação dos decks para índice explícito | A shell detecta as seções (`.fullscreen-wrapper` ou `body > section`) e usa a mesma heurística de índice dos decks; `reveal` fica 0 (as revelações disparam localmente por IntersectionObserver, Regra Zero) |
| QR gerado em runtime por encoder embutido no servidor (byte mode, ECC M, v1-4) | Pacote npm `qrcode` (padrão do mira-qrcode) | O IP e a porta só existem em runtime; zero dependências (RNF-02); encoder validado por round-trip com decodificador real (jsQR) |

---

## Apêndice

### Referências

- `brainstormings/BRAINSTORM_MIRA_REMOTE.md` (rodadas 1 e 2)
- `brainstormings/proto-mira-remote/` (implementação de referência: `server.cjs`, `deck.html`, `mira-draw.js`)
- `specs/remote-control/protocolo.md` (contrato do canal)
- `specs/manipulação/mira-draw.md` (telestrator que o remote sincroniza)

### Histórico de Revisões

| Versão | Data | Autor | Mudanças |
|--------|------|-------|----------|
| 1.0 | 2026-07-04 | sandeco + Claude | Criação a partir do brainstorm (rodadas 1 e 2) e do protótipo validado |
| 1.1 | 2026-07-04 | Claude | Reestruturação no template RFC: happy path, fluxos alternativos, métricas e integrações |
| 1.2 | 2026-07-04 | Claude | Implementada (templates/remote + agents/mira-remote): Open Questions resolvidas, decisões de iframe-palco, índice por scroll e encoder QR embutido registradas |
