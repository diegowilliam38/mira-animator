#!/usr/bin/env node
// Protótipo /mira-remote — servidor local de espelhamento (Node puro, zero deps).
// Serve o deck e sincroniza estado entre todos os aparelhos da rede local.
// Mexeu em qualquer cliente -> move todos (inclusive a tela do PC).
//
//   node server.js         (abre em http://<ip-do-pc>:3000)

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const DECK = path.join(__dirname, 'deck.html');

// Estado único da sessão. O servidor é só o "carteiro": guarda o último
// estado e reemite para todos. Quem entra no meio já recebe o atual.
let state = { slide: 0, reveal: 0 };
let draw = []; // traços do telestrator, em coordenadas do palco (1280x720)
const clients = new Set(); // conexões SSE abertas

function broadcast() {
  const payload = JSON.stringify({ ...state, draw, clients: clients.size });
  for (const res of clients) res.write(`data: ${payload}\n\n`);
}

const server = http.createServer((req, res) => {
  // 1) Serve o deck (mesmo HTML para PC e celular).
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    fs.readFile(DECK, (err, html) => {
      if (err) { res.writeHead(500); return res.end('deck.html não encontrado'); }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    });
    return;
  }

  // 1b) Serve o telestrator (mesmo mira-draw.js dos decks do Mira).
  if (req.method === 'GET' && req.url === '/mira-draw.js') {
    fs.readFile(path.join(__dirname, 'mira-draw.js'), (err, js) => {
      if (err) { res.writeHead(404); return res.end('mira-draw.js não encontrado'); }
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
      res.end(js);
    });
    return;
  }

  // 2) Canal de push: servidor -> clientes (Server-Sent Events).
  if (req.method === 'GET' && req.url === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    clients.add(res);
    // join-state: quem acabou de entrar recebe o estado atual na hora.
    res.write(`data: ${JSON.stringify({ ...state, draw, clients: clients.size })}\n\n`);
    broadcast(); // atualiza a contagem de conectados para os demais
    req.on('close', () => { clients.delete(res); broadcast(); });
    return;
  }

  // 3) Canal de subida: cliente -> servidor. Qualquer aparelho manda o novo
  //    estado; o servidor guarda e reemite para todos.
  if (req.method === 'POST' && req.url === '/state') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 1e5) req.destroy(); });
    req.on('end', () => {
      try {
        const next = JSON.parse(body);
        state = { slide: next.slide | 0, reveal: next.reveal | 0 };
        broadcast();
      } catch { /* ignora payload inválido */ }
      res.writeHead(204); res.end();
    });
    return;
  }

  // 4) Traços do telestrator: qualquer aparelho manda a lista completa;
  //    o servidor guarda e reemite para todos.
  if (req.method === 'POST' && req.url === '/draw') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 2e6) req.destroy(); });
    req.on('end', () => {
      try {
        const next = JSON.parse(body);
        if (Array.isArray(next)) { draw = next; broadcast(); }
      } catch { /* ignora payload inválido */ }
      res.writeHead(204); res.end();
    });
    return;
  }

  res.writeHead(404); res.end();
});

server.listen(PORT, () => {
  const urls = [];
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const net of ifaces[name]) {
      if (net.family === 'IPv4' && !net.internal) urls.push(`http://${net.address}:${PORT}`);
    }
  }
  console.log('\n  Mira remote — protótipo de espelhamento');
  console.log('  ────────────────────────────────────────');
  console.log(`  No PC:        http://localhost:${PORT}`);
  urls.forEach((u) => console.log(`  No celular:   ${u}   (mesma rede/Wi-Fi)`));
  console.log('\n  Mexeu em qualquer aparelho -> move todos.  Ctrl+C para sair.\n');
});
