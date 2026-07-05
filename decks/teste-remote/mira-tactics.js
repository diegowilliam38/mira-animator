/* =====================================================================
   mira-tactics.js  ·  Quadro tático do Mira (peças arrastáveis ao vivo)
   ---------------------------------------------------------------------
   - Tecla "T" (de tático) liga/desliga o modo quadro tático.
   - Barra de ferramentas à esquerda: mover, adicionar peça, seta de
     movimento, apagar. Times (cores), tamanho da peça e superfície
     (campo de futebol · grade tática · nenhuma).
   - O apresentador arrasta as peças ao vivo e desenha setas entre elas
     para montar formações, jogadas, organogramas, fluxos, xadrez, mapas.
   - Camada por cima do slide (canvas fixo no viewport). Com a superfície
     "nenhuma", as peças ficam por cima do conteúdo (o loop/animação do
     slide segue rodando embaixo — preserva a Regra Zero).

   Filosofia (igual mira-draw.js / mira-edit.js): vanilla, zero
   dependência externa, funciona em file:// e offline. Nada de build.

   Coordenadas normalizadas (0..1 do viewport): as peças e setas mantêm
   a posição proporcional ao redimensionar a janela.
   ===================================================================== */
(function () {
    'use strict';

    var ACCENT = '#FF904D';

    /* ---------- ícones (SVG inline, viewBox 24) ---------- */
    function icon(paths, size) {
        return '<svg viewBox="0 0 24 24" width="' + (size || 20) + '" height="' + (size || 20) +
            '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
            'stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
    }
    var ICONS = {
        move: '<path d="M5 9 2 12l3 3"/><path d="M9 5l3-3 3 3"/><path d="M15 19l-3 3-3-3"/><path d="M19 9l3 3-3 3"/><path d="M2 12h20"/><path d="M12 2v20"/>',
        add: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8"/><path d="M8 12h8"/>',
        arrow: '<path d="M5 19 19 5"/><path d="M10 5h9v9"/>',
        eraser: '<path d="m7 21-4.3-4.3a1 1 0 0 1 0-1.4l9.6-9.6a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/>',
        field: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M12 5v14"/><circle cx="12" cy="12" r="2.6"/>',
        grid: '<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/>',
        blank: '<rect x="3" y="5" width="18" height="14" rx="2.5"/>',
        undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-1"/>',
        trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/>',
        x: '<path d="M18 6 6 18"/><path d="M6 6l12 12"/>'
    };

    var TOOLS = [
        { id: 'move', name: 'Mover peça (arrastar)', icon: ICONS.move },
        { id: 'add', name: 'Adicionar peça (clique no quadro)', icon: ICONS.add },
        { id: 'arrow', name: 'Seta de movimento', icon: ICONS.arrow },
        { id: 'erase', name: 'Apagar peça/seta', icon: ICONS.eraser }
    ];
    // Times: nome + cor. A cor selecionada é o time da próxima peça adicionada.
    var TEAMS = [
        { n: 'Azul', c: '#4d9fff' },
        { n: 'Vermelho', c: '#ff5a5a' },
        { n: 'Amarelo', c: '#ffd24d' },
        { n: 'Verde', c: '#55d18e' },
        { n: 'Branco', c: '#ffffff' },
        { n: 'Laranja', c: ACCENT }
    ];
    var SIZES = [{ n: 'Pequena', s: 0.022 }, { n: 'Média', s: 0.030 }, { n: 'Grande', s: 0.040 }];
    var SURFACES = [
        { id: 'campo', name: 'Campo de futebol', icon: ICONS.field },
        { id: 'grid', name: 'Grade tática', icon: ICONS.grid },
        { id: 'none', name: 'Nenhuma (por cima do slide)', icon: ICONS.blank }
    ];

    /* ---------- estado ---------- */
    var active = false;
    var tool = 'move';
    var teamColor = '#4d9fff';
    var pieceSize = 0.030;      // fração de min(W,H)
    var surface = 'campo';
    var pieces = [];            // { x, y, color, label }  (x,y normalizados 0..1)
    var arrows = [];            // { x0, y0, x1, y1, color } (normalizados)
    var history = [];           // snapshots (deep clone) p/ desfazer
    var dragging = null;        // { i, ox, oy } peça em arrasto (offset normalizado)
    var current = null;         // seta em andamento
    var labelInput = null;
    var canvas = null, ctx = null, dpr = 1, W = 0, H = 0;

    /* ---------- estilos ---------- */
    function injectStyles() {
        if (document.getElementById('mira-tactics-style')) return;
        var css = [
            '#mb-canvas{position:fixed;inset:0;z-index:99996;display:none;touch-action:none;cursor:default}',
            'body.mb-on #mb-canvas{display:block}',
            '#mb-bar{position:fixed;left:16px;top:50%;transform:translate(-140%,-50%);z-index:99997;',
            'display:flex;flex-direction:column;align-items:stretch;gap:6px;padding:10px;border-radius:18px;',
            'background:rgba(16,16,16,.92);backdrop-filter:blur(14px);border:1px solid rgba(255,144,77,.35);',
            'box-shadow:0 18px 50px rgba(0,0,0,.5);opacity:0;transition:transform .28s ease,opacity .28s ease;',
            'font-family:Inter,system-ui,sans-serif}',
            'body.mb-on #mb-bar{transform:translate(0,-50%);opacity:1}',
            '.mb-tool{display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;',
            'border-radius:12px;border:none;cursor:pointer;color:#fff;background:rgba(255,255,255,.06);',
            'transition:all .15s ease}',
            '.mb-tool:hover{background:rgba(255,255,255,.14)}',
            '.mb-tool.mb-active{color:#101010;background:' + ACCENT + '}',
            '.mb-sep{height:1px;margin:4px 2px;background:rgba(255,255,255,.12)}',
            '.mb-teams{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;padding:2px}',
            '.mb-sw{width:20px;height:20px;border-radius:50%;cursor:pointer;border:2px solid rgba(255,255,255,.2);',
            'transition:transform .12s ease}',
            '.mb-sw:hover{transform:scale(1.15)}',
            '.mb-sw.mb-active{border-color:#fff;box-shadow:0 0 0 2px ' + ACCENT + '}',
            '.mb-custom{width:20px;height:20px;padding:0;border:2px solid rgba(255,255,255,.2);border-radius:50%;',
            'background:conic-gradient(red,orange,yellow,lime,cyan,blue,magenta,red);cursor:pointer;overflow:hidden}',
            '.mb-custom::-webkit-color-swatch-wrapper{padding:0}.mb-custom::-webkit-color-swatch{border:none}',
            '.mb-sizes{display:flex;align-items:center;justify-content:space-between;gap:4px;padding:2px 4px}',
            '.mb-sbtn{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;',
            'border-radius:8px;border:none;cursor:pointer;background:rgba(255,255,255,.06)}',
            '.mb-sbtn:hover{background:rgba(255,255,255,.14)}',
            '.mb-sbtn.mb-active{background:' + ACCENT + '}',
            '.mb-sdot{border-radius:50%;background:#fff}',
            '.mb-sbtn.mb-active .mb-sdot{background:#101010}',
            '.mb-surf{display:flex;gap:4px;justify-content:space-between}',
            '.mb-surfbtn{display:inline-flex;align-items:center;justify-content:center;width:34px;height:30px;',
            'border-radius:9px;border:none;cursor:pointer;color:#fff;background:rgba(255,255,255,.06);transition:all .15s ease}',
            '.mb-surfbtn:hover{background:rgba(255,255,255,.14)}',
            '.mb-surfbtn.mb-active{color:#101010;background:' + ACCENT + '}',
            '.mb-labelinput{position:fixed;z-index:100000;background:rgba(16,16,16,.9);border:1px solid ' + ACCENT + ';',
            'border-radius:8px;outline:none;padding:2px 6px;color:#fff;text-align:center;width:64px;',
            'font-family:Inter,system-ui,sans-serif;font-weight:800}',
            /* pílula de dica no topo */
            '#mb-hint{position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:99997;display:none;',
            'align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:rgba(16,16,16,.9);',
            'border:1px solid rgba(255,144,77,.35);color:rgba(255,255,255,.85);',
            'font:600 12px/1 Inter,system-ui,sans-serif}',
            'body.mb-on #mb-hint{display:flex}',
            '#mb-hint b{color:' + ACCENT + '}'
        ].join('');
        var el = document.createElement('style');
        el.id = 'mira-tactics-style';
        el.textContent = css;
        document.head.appendChild(el);
    }

    /* ---------- UI ---------- */
    function buildUI() {
        if (document.getElementById('mb-canvas')) return;

        canvas = document.createElement('canvas');
        canvas.id = 'mb-canvas';
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d');

        var bar = document.createElement('div');
        bar.id = 'mb-bar';

        // ferramentas
        TOOLS.forEach(function (t) {
            var b = document.createElement('button');
            b.className = 'mb-tool' + (t.id === tool ? ' mb-active' : '');
            b.dataset.tool = t.id;
            b.title = t.name;
            b.innerHTML = icon(t.icon, 20);
            b.addEventListener('click', function () { setTool(t.id); });
            bar.appendChild(b);
        });

        bar.appendChild(sep());

        // times (cores)
        var teams = document.createElement('div');
        teams.className = 'mb-teams';
        TEAMS.forEach(function (t) {
            var s = document.createElement('button');
            s.className = 'mb-sw' + (t.c === teamColor ? ' mb-active' : '');
            s.dataset.color = t.c;
            s.style.background = t.c;
            s.title = 'Time ' + t.n;
            s.addEventListener('click', function () { setTeam(t.c); });
            teams.appendChild(s);
        });
        var custom = document.createElement('input');
        custom.type = 'color';
        custom.className = 'mb-custom';
        custom.title = 'Cor de time personalizada';
        custom.value = '#ffffff';
        custom.addEventListener('input', function () { setTeam(custom.value); });
        teams.appendChild(custom);
        bar.appendChild(teams);

        // tamanho da peça
        var sizes = document.createElement('div');
        sizes.className = 'mb-sizes';
        SIZES.forEach(function (o) {
            var b = document.createElement('button');
            b.className = 'mb-sbtn' + (o.s === pieceSize ? ' mb-active' : '');
            b.dataset.size = String(o.s);
            b.title = 'Peça ' + o.n;
            var d = document.createElement('span');
            d.className = 'mb-sdot';
            var px = Math.round(o.s * 400);
            d.style.width = px + 'px'; d.style.height = px + 'px';
            b.appendChild(d);
            b.addEventListener('click', function () { setSize(o.s); });
            sizes.appendChild(b);
        });
        bar.appendChild(sizes);

        bar.appendChild(sep());

        // superfície
        var surf = document.createElement('div');
        surf.className = 'mb-surf';
        SURFACES.forEach(function (s) {
            var b = document.createElement('button');
            b.className = 'mb-surfbtn' + (s.id === surface ? ' mb-active' : '');
            b.dataset.surf = s.id;
            b.title = 'Superfície: ' + s.name;
            b.innerHTML = icon(s.icon, 18);
            b.addEventListener('click', function () { setSurface(s.id); });
            surf.appendChild(b);
        });
        bar.appendChild(surf);

        bar.appendChild(sep());

        // ações
        bar.appendChild(actionBtn(ICONS.undo, 'Desfazer (Ctrl+Z)', undo));
        bar.appendChild(actionBtn(ICONS.trash, 'Limpar quadro', clearAll));
        bar.appendChild(actionBtn(ICONS.x, 'Sair (T / Esc)', function () { toggle(false); }));

        document.body.appendChild(bar);

        var hint = document.createElement('div');
        hint.id = 'mb-hint';
        hint.innerHTML = 'Quadro tático — <b>T</b>/<b>Esc</b> sai · arraste as peças · duplo-clique renomeia · <b>Ctrl+Z</b> desfaz';
        document.body.appendChild(hint);

        window.addEventListener('resize', resize);
        canvas.addEventListener('pointerdown', onDown);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        canvas.addEventListener('dblclick', onDblClick);
    }

    function sep() { var s = document.createElement('div'); s.className = 'mb-sep'; return s; }
    function actionBtn(ic, title, fn) {
        var b = document.createElement('button');
        b.className = 'mb-tool';
        b.title = title;
        b.innerHTML = icon(ic, 20);
        b.addEventListener('click', fn);
        return b;
    }

    /* ---------- seleção de ferramenta/time/tamanho/superfície ---------- */
    function setTool(id) {
        tool = id;
        commitLabel();
        Array.prototype.forEach.call(document.querySelectorAll('#mb-bar .mb-tool[data-tool]'), function (b) {
            b.classList.toggle('mb-active', b.dataset.tool === id);
        });
        if (canvas) canvas.style.cursor =
            id === 'add' ? 'copy' : id === 'erase' ? 'cell' : id === 'arrow' ? 'crosshair' : 'default';
    }
    function setTeam(c) {
        teamColor = c;
        Array.prototype.forEach.call(document.querySelectorAll('#mb-bar .mb-sw'), function (s) {
            s.classList.toggle('mb-active', s.dataset.color === c);
        });
    }
    function setSize(s) {
        pieceSize = s;
        Array.prototype.forEach.call(document.querySelectorAll('#mb-bar .mb-sbtn'), function (b) {
            b.classList.toggle('mb-active', parseFloat(b.dataset.size) === s);
        });
    }
    function setSurface(id) {
        surface = id;
        Array.prototype.forEach.call(document.querySelectorAll('#mb-bar .mb-surfbtn'), function (b) {
            b.classList.toggle('mb-active', b.dataset.surf === id);
        });
        redraw();
    }

    /* ---------- canvas / render ---------- */
    function resize() {
        if (!canvas) return;
        dpr = window.devicePixelRatio || 1;
        W = window.innerWidth; H = window.innerHeight;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        redraw();
    }

    function radiusPx() { return pieceSize * Math.min(W, H); }
    function pxX(n) { return n * W; }
    function pxY(n) { return n * H; }

    // contraste do rótulo: escuro sobre cores claras, branco sobre escuras
    function labelColor(hex) {
        var h = hex.replace('#', '');
        if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
        var lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return lum > 0.62 ? '#101010' : '#ffffff';
    }

    function drawSurface() {
        if (surface === 'none') return;
        var pad = Math.min(W, H) * 0.05;
        var x = pad, y = pad, w = W - pad * 2, h = H - pad * 2;
        if (surface === 'campo') {
            var g = ctx.createLinearGradient(0, y, 0, y + h);
            g.addColorStop(0, '#2f8f4e'); g.addColorStop(1, '#27793f');
            ctx.fillStyle = g;
            ctx.fillRect(x, y, w, h);
            // faixas do gramado
            ctx.save();
            ctx.globalAlpha = 0.06; ctx.fillStyle = '#ffffff';
            for (var i = 0; i < 10; i++) { if (i % 2 === 0) ctx.fillRect(x + (w / 10) * i, y, w / 10, h); }
            ctx.restore();
            // linhas
            ctx.save();
            ctx.strokeStyle = 'rgba(255,255,255,.75)';
            ctx.lineWidth = Math.max(2, Math.min(W, H) * 0.004);
            ctx.strokeRect(x, y, w, h);
            ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.stroke();
            ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) * 0.12, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, ctx.lineWidth * 1.2, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fill();
            // grandes áreas
            var bw = w * 0.16, bh = h * 0.5, by = y + (h - bh) / 2;
            ctx.strokeRect(x, by, bw, bh);
            ctx.strokeRect(x + w - bw, by, bw, bh);
            ctx.restore();
        } else if (surface === 'grid') {
            ctx.save();
            ctx.fillStyle = 'rgba(10,12,16,.55)';
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = 'rgba(255,255,255,.12)';
            ctx.lineWidth = 1;
            var step = Math.min(W, H) * 0.06;
            for (var gx = x; gx <= x + w + 0.5; gx += step) { ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke(); }
            for (var gy = y; gy <= y + h + 0.5; gy += step) { ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke(); }
            ctx.strokeStyle = 'rgba(255,144,77,.35)';
            ctx.lineWidth = Math.max(1.5, Math.min(W, H) * 0.002);
            ctx.strokeRect(x, y, w, h);
            ctx.restore();
        }
    }

    function drawArrow(a) {
        var x0 = pxX(a.x0), y0 = pxY(a.y0), x1 = pxX(a.x1), y1 = pxY(a.y1);
        var lw = Math.max(3, Math.min(W, H) * 0.006);
        ctx.save();
        ctx.strokeStyle = a.color; ctx.fillStyle = a.color;
        ctx.lineWidth = lw; ctx.lineCap = 'round';
        ctx.setLineDash([lw * 2.4, lw * 1.6]);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        ctx.setLineDash([]);
        var ang = Math.atan2(y1 - y0, x1 - x0);
        var len = Math.max(14, lw * 3.2);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - len * Math.cos(ang - Math.PI / 7), y1 - len * Math.sin(ang - Math.PI / 7));
        ctx.lineTo(x1 - len * Math.cos(ang + Math.PI / 7), y1 - len * Math.sin(ang + Math.PI / 7));
        ctx.closePath(); ctx.fill();
        ctx.restore();
    }

    function drawPiece(p) {
        var cx = pxX(p.x), cy = pxY(p.y), r = radiusPx();
        ctx.save();
        // sombra
        ctx.shadowColor = 'rgba(0,0,0,.45)';
        ctx.shadowBlur = r * 0.5; ctx.shadowOffsetY = r * 0.18;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.fill();
        ctx.shadowColor = 'transparent';
        // anel
        ctx.lineWidth = Math.max(2, r * 0.12);
        ctx.strokeStyle = 'rgba(255,255,255,.9)';
        ctx.stroke();
        // rótulo
        if (p.label) {
            ctx.fillStyle = labelColor(p.color);
            ctx.font = '800 ' + Math.round(r * 1.05) + 'px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(p.label, cx, cy + r * 0.04);
        }
        ctx.restore();
    }

    function redraw() {
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        drawSurface();
        for (var i = 0; i < arrows.length; i++) drawArrow(arrows[i]);
        if (current) drawArrow(current);
        for (var j = 0; j < pieces.length; j++) drawPiece(pieces[j]);
    }

    /* ---------- histórico ---------- */
    function snapshot() {
        return { pieces: JSON.parse(JSON.stringify(pieces)), arrows: JSON.parse(JSON.stringify(arrows)) };
    }
    function pushHistory() {
        history.push(snapshot());
        if (history.length > 60) history.shift();
    }
    function undo() {
        commitLabel();
        if (!history.length) return;
        var s = history.pop();
        pieces = s.pieces; arrows = s.arrows;
        redraw();
    }
    function clearAll() {
        commitLabel();
        if (!pieces.length && !arrows.length) return;
        pushHistory();
        pieces = []; arrows = [];
        redraw();
    }

    /* ---------- hit-test ---------- */
    function pieceAt(nx, ny) {
        var r = radiusPx();
        for (var i = pieces.length - 1; i >= 0; i--) {
            var dx = pxX(pieces[i].x) - pxX(nx), dy = pxY(pieces[i].y) - pxY(ny);
            if (Math.hypot(dx, dy) <= r) return i;
        }
        return -1;
    }
    function distSeg(px, py, ax, ay, bx, by) {
        var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
        var t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    }
    function arrowAt(nx, ny) {
        var px = pxX(nx), py = pxY(ny), thr = Math.max(10, Math.min(W, H) * 0.012);
        for (var i = arrows.length - 1; i >= 0; i--) {
            var a = arrows[i];
            if (distSeg(px, py, pxX(a.x0), pxY(a.y0), pxX(a.x1), pxY(a.y1)) <= thr) return i;
        }
        return -1;
    }

    function nextLabel(color) {
        var max = 0;
        for (var i = 0; i < pieces.length; i++) {
            if (pieces[i].color === color) {
                var n = parseInt(pieces[i].label, 10);
                if (!isNaN(n) && n > max) max = n;
            }
        }
        return String(max + 1);
    }

    /* ---------- rótulo editável ---------- */
    function openLabelInput(i) {
        commitLabel();
        var p = pieces[i], r = radiusPx();
        labelInput = document.createElement('input');
        labelInput.type = 'text';
        labelInput.className = 'mb-labelinput';
        labelInput.value = p.label || '';
        labelInput.style.left = (pxX(p.x) - 32) + 'px';
        labelInput.style.top = (pxY(p.y) - r - 34) + 'px';
        labelInput.dataset.i = String(i);
        document.body.appendChild(labelInput);
        setTimeout(function () { labelInput && (labelInput.focus(), labelInput.select()); }, 0);
        labelInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); commitLabel(); }
            else if (e.key === 'Escape') { e.preventDefault(); cancelLabel(); }
            e.stopPropagation();
        });
        labelInput.addEventListener('blur', commitLabel);
    }
    function commitLabel() {
        if (!labelInput) return;
        var i = parseInt(labelInput.dataset.i, 10);
        var val = labelInput.value.trim();
        var el = labelInput; labelInput = null;
        el.removeEventListener('blur', commitLabel);
        el.remove();
        if (pieces[i] && val !== pieces[i].label) {
            pushHistory();
            pieces[i].label = val;
            redraw();
        }
    }
    function cancelLabel() {
        if (!labelInput) return;
        var el = labelInput; labelInput = null;
        el.removeEventListener('blur', commitLabel);
        el.remove();
    }

    /* ---------- ponteiro ---------- */
    function nx(e) { return e.clientX / W; }
    function ny(e) { return e.clientY / H; }

    function onDown(e) {
        if (!active) return;
        e.preventDefault();
        var x = nx(e), y = ny(e);

        if (tool === 'add') {
            pushHistory();
            pieces.push({ x: x, y: y, color: teamColor, label: nextLabel(teamColor) });
            redraw();
            return;
        }
        if (tool === 'erase') {
            var pi = pieceAt(x, y);
            if (pi >= 0) { pushHistory(); pieces.splice(pi, 1); redraw(); return; }
            var ai = arrowAt(x, y);
            if (ai >= 0) { pushHistory(); arrows.splice(ai, 1); redraw(); }
            return;
        }
        if (tool === 'arrow') {
            var start = pieceAt(x, y);
            var sx = x, sy = y, col = teamColor;
            if (start >= 0) { sx = pieces[start].x; sy = pieces[start].y; col = pieces[start].color; }
            current = { x0: sx, y0: sy, x1: x, y1: y, color: col };
            try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
            return;
        }
        // mover
        var idx = pieceAt(x, y);
        if (idx >= 0) {
            // snapshot pré-arrasto guardado; só entra no histórico se mover de fato
            dragging = { i: idx, ox: pieces[idx].x - x, oy: pieces[idx].y - y, snap: snapshot(), moved: false };
            // traz a peça para o topo do desenho
            var pc = pieces.splice(idx, 1)[0];
            pieces.push(pc);
            dragging.i = pieces.length - 1;
            try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
            canvas.style.cursor = 'grabbing';
            redraw();
        }
    }
    function onMove(e) {
        if (!active) return;
        var x = nx(e), y = ny(e);
        if (dragging) {
            if (!dragging.moved) { dragging.moved = true; history.push(dragging.snap); if (history.length > 60) history.shift(); }
            var p = pieces[dragging.i];
            p.x = Math.max(0, Math.min(1, x + dragging.ox));
            p.y = Math.max(0, Math.min(1, y + dragging.oy));
            redraw();
        } else if (current) {
            var snap = pieceAt(x, y);
            if (snap >= 0) { current.x1 = pieces[snap].x; current.y1 = pieces[snap].y; }
            else { current.x1 = x; current.y1 = y; }
            redraw();
        }
    }
    function onUp() {
        if (dragging) {
            dragging = null;
            if (canvas) canvas.style.cursor = 'default';
            return;
        }
        if (current) {
            var moved = Math.hypot(pxX(current.x1) - pxX(current.x0), pxY(current.y1) - pxY(current.y0));
            if (moved > 6) { pushHistory(); arrows.push(current); }
            current = null;
            redraw();
        }
    }
    function onDblClick(e) {
        if (!active) return;
        var idx = pieceAt(nx(e), ny(e));
        if (idx >= 0) { e.preventDefault(); openLabelInput(idx); }
    }

    /* ---------- liga/desliga ---------- */
    function toggle(on) {
        if (on === active) return;
        active = on;
        if (on) {
            document.body.classList.add('mb-on');
            resize();
        } else {
            commitLabel();
            dragging = null; current = null;
            document.body.classList.remove('mb-on');
        }
    }

    /* ---------- init ---------- */
    function isTyping(t) {
        return t && (t.isContentEditable || /^(TEXTAREA|SELECT)$/.test(t.tagName) ||
            (t.tagName === 'INPUT' && !t.classList.contains('mb-labelinput')));
    }

    function init() {
        injectStyles();
        buildUI();
        document.addEventListener('keydown', function (e) {
            if (isTyping(e.target)) return;
            if ((e.key === 't' || e.key === 'T') && !e.ctrlKey && !e.metaKey) { e.preventDefault(); toggle(!active); return; }
            if (!active) return;
            if (e.key === 'Escape') { e.preventDefault(); toggle(false); }
            else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); undo(); }
        });
        try { if (/[?&]tactics=1\b/.test(location.search)) toggle(true); } catch (e) {}
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
