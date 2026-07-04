# Protótipo /mira-remote — espelhamento por rede local

Prova de conceito do modo **espelho** do `BRAINSTORM_MIRA_REMOTE.md`.
Node puro, **zero dependências**. Mexeu em qualquer aparelho → move todos
(inclusive a tela do PC). O servidor é só o carteiro.

## Rodar

```bash
node server.cjs
```

O terminal mostra a URL de rede (ex.: `http://192.168.0.10:3000`).

- No PC: abra `http://localhost:3000` e use as **setas** do teclado.
- No celular (mesma Wi-Fi, ou no hotspot do celular): abra a URL de rede e use
  os **botões**.

Avance no celular e veja a tela do PC avançar junto — e vice-versa.

## Como funciona

- `GET /` serve o deck (mesmo HTML pra todos → resolve "de onde o celular tira o slide").
- `GET /events` é o push servidor→cliente (Server-Sent Events); quem entra já
  recebe o estado atual (**join-state**), incluindo os desenhos.
- `POST /state` é a subida cliente→servidor; o servidor guarda e reemite pra todos.
- `POST /draw` sincroniza os traços do telestrator (mira-draw, tecla P ou botão ✎).
  Os traços viajam em coordenadas do palco 16:9 (1280×720), então caem no mesmo
  lugar do slide em qualquer tamanho de tela.

Estado trafegado: só `{ slide, reveal }`. A animação (Regra Zero) roda local em
cada tela — sincronizamos o slide, não os quadros.

## O que isto NÃO é (ainda)

- Sem lock de controle (qualquer um mexe/desenha), sem QR, sem presenter view/notas.
- Escolhemos SSE por simplicidade; a versão real pode usar WebSocket.
