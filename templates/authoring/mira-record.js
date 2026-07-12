/* =====================================================================
   mira-record.js  ·  Gravação nativa do MIRA (decks reels-studio)
   ---------------------------------------------------------------------
   Painel de gravação no lado DIREITO da tela (fora da coluna 9:16,
   portanto fora do vídeo) que grava SOMENTE a área dos slides e baixa
   o arquivo pronto, sem OBS.

   Como funciona:
     - Captura a própria aba via getDisplayMedia (preferCurrentTab).
     - Region Capture (CropTarget.fromElement + track.cropTo) recorta a
       coluna no compositor do navegador (GPU), quando disponível;
       sem CropTarget, o recorte é feito no próprio drawImage.
     - A track (recortada ou não) alimenta um canvas FIXO de 1080x1920
       (resolução nativa de Reels/Shorts), redesenhado só a cada frame
       NOVO da captura (requestVideoFrameCallback) — um drawImage por
       frame, geometria cacheada fora do loop. Resolução constante na
       saída: sem o ramp-up de resolução da captura de aba, o MP4 sai
       avc1 e é aceito por WhatsApp/Instagram/YouTube sem reencode; o
       upscale acontece aqui, com filtro bom, e não no encoder da
       plataforma.
     - MediaRecorder em MP4 (H.264/AAC) quando o Chrome suportar;
       senão cai para WebM e avisa no painel.
     - Diagnóstico: mede o FPS efetivo nos primeiros 2s; se < 20 fps,
       avisa no painel (aceleração de hardware desligada, CPU saturada).
     - Microfone opcional (toggle no painel), mixado na gravação.
     - Tecla R liga/desliga a gravação (quieta nos modos E/P e digitação).

   Requisitos: Chrome/Edge atuais. Ao iniciar, escolha "Esta guia"
   no seletor de captura do navegador.
   ===================================================================== */
(function () {
    'use strict';
    if (typeof document === 'undefined') return;

    var FPS = 30, BITRATE = 12000000, OUT_W = 1080, OUT_H = 1920;

    /* ---------- estilos ---------- */
    function injectCss() {
        if (document.getElementById('mira-record-css')) return;
        var st = document.createElement('style');
        st.id = 'mira-record-css';
        st.textContent = [
            '#mrc-panel { position: fixed; right: 18px; top: 50%; transform: translateY(-50%);',
            '  z-index: 2147483000; width: 216px; padding: 16px; border-radius: 14px;',
            '  background: rgba(13, 13, 15, .94); border: 1px solid rgba(255, 144, 77, .5);',
            '  color: #f4f4f5; font: 500 13px/1.5 Inter, system-ui, sans-serif;',
            '  display: flex; flex-direction: column; gap: 10px; }',
            '#mrc-panel h4 { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: .14em;',
            '  text-transform: uppercase; color: #FF904D; }',
            '#mrc-btn { border: 0; border-radius: 10px; padding: 12px 10px; cursor: pointer;',
            '  font: 800 15px Inter, system-ui, sans-serif; color: #0d0d0f; background: #FF904D; }',
            '#mrc-btn.rec { background: #e5484d; color: #fff; animation: mrcPulse 1.2s ease-in-out infinite; }',
            '@keyframes mrcPulse { 0%, 100% { opacity: 1; } 50% { opacity: .72; } }',
            '#mrc-status { font-variant-numeric: tabular-nums; font-weight: 700; font-size: 15px; }',
            '#mrc-mic { display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none;',
            '  color: rgba(244, 244, 245, .8); }',
            '#mrc-note { font-size: 11.5px; color: rgba(244, 244, 245, .55); }',
            '#mrc-panel.mrc-tight { display: none; }'   /* painel sobreporia a coluna (e entraria no vídeo): some; tecla R continua */
        ].join('\n');
        document.head.appendChild(st);
    }

    /* ---------- painel ---------- */
    var ui = {};
    function buildPanel() {
        var p = document.createElement('div');
        p.id = 'mrc-panel';
        p.innerHTML =
            '<h4>Gravação</h4>' +
            '<button id="mrc-btn" type="button">&#9679; Gravar</button>' +
            '<div id="mrc-status">pronto</div>' +
            '<label id="mrc-mic"><input type="checkbox" checked> microfone</label>' +
            '<div id="mrc-note">Grava só a coluna dos slides. Tecla R também liga/desliga. Ao iniciar, escolha "Esta guia".</div>';
        document.body.appendChild(p);
        ui.panel = p;
        ui.btn = p.querySelector('#mrc-btn');
        ui.status = p.querySelector('#mrc-status');
        ui.mic = p.querySelector('#mrc-mic input');
        ui.note = p.querySelector('#mrc-note');
        ui.btn.addEventListener('click', toggle);
    }
    function note(msg) { ui.note.textContent = msg; }

    /* ---------- formato de saída ----------
       A gravação passa por um canvas fixo de 1080x1920, então a
       resolução NUNCA muda no meio do arquivo — avc1 (parameter sets
       no header, a variante que WhatsApp e players exigem) é seguro e
       vem primeiro. avc3 fica de reserva para Chromes sem avc1. */
    function pickMime() {
        var prefs = [
            'video/mp4;codecs="avc1.640028,mp4a.40.2"',
            'video/mp4;codecs=avc1',
            'video/mp4;codecs="avc3.640028,mp4a.40.2"',
            'video/mp4;codecs=avc3',
            'video/mp4',
            'video/webm;codecs=vp9,opus',
            'video/webm'
        ];
        for (var i = 0; i < prefs.length; i++) {
            if (window.MediaRecorder && MediaRecorder.isTypeSupported(prefs[i])) return prefs[i];
        }
        return '';
    }

    /* ---------- geometria: cacheada fora do loop de desenho ----------
       getBoundingClientRect força reflow; aqui ela roda só no init e em
       resize/scroll (com rAF-throttle), nunca a cada frame. */
    var geo = { left: 0, width: 0, ok: false };
    function readGeo() {
        var sec = document.querySelector('body > section');
        if (!sec) { geo.ok = false; return; }
        var r = sec.getBoundingClientRect();
        geo.left = r.left; geo.width = r.width; geo.ok = true;
        placeCropOverlay();
        /* o vídeo grava o que sobrepõe a coluna (z-index não protege no
           Region Capture): sem 240px livres à direita, o painel some */
        if (ui.panel) ui.panel.classList.toggle('mrc-tight', window.innerWidth - (geo.left + geo.width) < 240);
    }
    var geoRaf = 0;
    function queueGeo() {
        if (geoRaf) return;
        geoRaf = requestAnimationFrame(function () { geoRaf = 0; readGeo(); });
    }

    /* ---------- crop target: overlay fixo com a geometria da coluna ----
       As <section> rolam verticalmente (recortar uma delas seguiria o
       slide para fora da tela); o overlay fixo cobre a coluna no
       viewport inteiro e o cropTo o acompanha em qualquer resize.
       NUNCA esconda o overlay com visibility/display: a spec do Region
       Capture não emite frame nenhum quando o alvo não é renderizado —
       um div transparente sem fundo já é invisível. */
    var cropEl = null;
    function ensureCropOverlay() {
        if (!cropEl) {
            cropEl = document.createElement('div');
            cropEl.id = 'mrc-crop';
            cropEl.style.cssText = 'position:fixed;top:0;bottom:0;pointer-events:none;';
            document.body.appendChild(cropEl);
        }
        placeCropOverlay();
        return cropEl;
    }
    function placeCropOverlay() {
        if (!cropEl || !geo.ok) return;
        cropEl.style.left = geo.left + 'px';
        cropEl.style.width = geo.width + 'px';
    }

    /* ---------- estado ---------- */
    var S = { rec: null, vid: null, rvfc: 0, raf: 0, chunks: [], tab: null, mic: null, cvs: null, t0: 0, timer: null, busy: false, abort: false };

    function fmtTime(ms) {
        var s = Math.floor(ms / 1000);
        return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    }

    /* ---------- diagnóstico: FPS efetivo ----------
       Captura de aba só emite frame quando a tela MUDA: zero frames num
       trecho estático é normal, não lentidão. Por isso a métrica são os
       intervalos entre frames consecutivos (< 250ms; gap maior = pausa
       de conteúdo, ignorado): encoder lento entrega frames espaçados
       uniformemente e é pego; slide parado não gera falso alarme.
       "Sem vídeo" só depois de 10s sem NENHUM frame. Tudo amarrado à
       gravação que criou o monitor (myRec): timer velho vira no-op. */
    function monitorFps(track) {
        if (!('requestVideoFrameCallback' in HTMLVideoElement.prototype)) return;
        var myRec = S.rec;
        var mv = document.createElement('video');
        mv.muted = true;
        mv.srcObject = new MediaStream([track]);
        mv.play().catch(function () { });
        var gaps = [], last = 0, done = false;
        function alive() { return !done && S.rec === myRec; }
        function finish(msg) {
            if (done) return;
            done = true;
            mv.srcObject = null;
            if (S.rec === myRec && msg) note(msg);
        }
        function evaluate() {
            var sum = 0;
            for (var i = 0; i < gaps.length; i++) sum += gaps[i];
            var fps = 1000 / (sum / gaps.length);
            finish(fps < 20 ? 'Gravação lenta (' + Math.round(fps) + ' fps): verifique chrome://gpu (aceleração de hardware) e feche outras abas.' : null);
        }
        function tick() {
            if (!alive()) { finish(); return; }
            var t = performance.now();
            if (last) { var g = t - last; if (g < 250) gaps.push(g); }
            last = t;
            if (gaps.length >= 30) { evaluate(); return; }
            mv.requestVideoFrameCallback(tick);
        }
        mv.requestVideoFrameCallback(tick);
        setTimeout(function () {
            if (!alive()) { finish(); return; }
            if (gaps.length >= 10) { evaluate(); return; }
            finish(last === 0 ? 'Nenhum frame de vídeo capturado: o arquivo pode sair sem vídeo. Pare, recarregue a página e tente de novo.' : null);
        }, 10000);
    }

    async function start() {
        if (S.busy || S.rec) return;
        S.busy = true;
        S.abort = false;
        try {
            var mime = pickMime();
            if (!mime) { note('MediaRecorder indisponível neste navegador.'); S.busy = false; return; }

            if (ui.mic.checked) {
                try { S.mic = await navigator.mediaDevices.getUserMedia({ audio: true, video: false }); }
                catch (e) { S.mic = null; note('Sem microfone: gravando só o vídeo.'); }
            }

            S.tab = await navigator.mediaDevices.getDisplayMedia({
                video: { frameRate: FPS },
                audio: false,
                preferCurrentTab: true,
                selfBrowserSurface: 'include'
            });
            var vt = S.tab.getVideoTracks()[0];

            /* slides são conteúdo estático de alta nitidez: 'detail' manda o
               capturador preservar a RESOLUÇÃO e degradar framerate quando
               precisar — sem isso ele derruba a resolução da fonte no meio
               da gravação e o upscale para 1080x1920 sai borrado */
            try { vt.contentHint = 'detail'; } catch (eHint) { /* navegador sem contentHint */ }

            /* o recorte só é válido capturando ESTA guia: janela/tela teria outra geometria */
            var surface = vt.getSettings && vt.getSettings().displaySurface;
            if (surface && surface !== 'browser') {
                cleanup();
                note('Escolha "Esta guia" no seletor de captura (não janela nem tela inteira) e tente de novo.');
                ui.status.textContent = 'pronto';
                S.busy = false;
                return;
            }

            /* "Parar compartilhamento" do Chrome: durante o setup só sinaliza; gravando, para */
            vt.addEventListener('ended', function () { if (S.rec) { stop(); } else { S.abort = true; } });

            readGeo();
            var usedCrop = false;
            if (typeof CropTarget !== 'undefined' && typeof CropTarget.fromElement === 'function' &&
                typeof vt.cropTo === 'function' && geo.ok) {
                /* --- Region Capture: a fonte já chega recortada (GPU) --- */
                try {
                    var target = await CropTarget.fromElement(ensureCropOverlay());
                    await vt.cropTo(target);
                    usedCrop = true;
                } catch (eCrop) { /* falha em runtime (ex.: aba errada): recorta no drawImage */ }
            }

            var vid = document.createElement('video');
            vid.srcObject = usedCrop ? new MediaStream([vt]) : S.tab;
            vid.muted = true;
            await vid.play();
            S.vid = vid;

            /* canvas fixo 1080x1920: resolução constante na saída (ver
               pickMime); upscale feito aqui com filtro bom, não pela
               plataforma. A coluna é 9:16 cravado, então não há distorção. */
            var cv = document.createElement('canvas');
            cv.width = OUT_W; cv.height = OUT_H;
            var ctx = cv.getContext('2d', { alpha: false, desynchronized: true });
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            function draw() {
                if (vid.videoWidth) {
                    if (usedCrop) {
                        ctx.drawImage(vid, 0, 0, vid.videoWidth, vid.videoHeight, 0, 0, OUT_W, OUT_H);
                    } else if (geo.ok) {
                        var sx = vid.videoWidth / window.innerWidth;
                        ctx.drawImage(vid, geo.left * sx, 0, geo.width * sx, vid.videoHeight, 0, 0, OUT_W, OUT_H);
                    }
                }
                schedule();
            }
            function schedule() {
                if (vid.requestVideoFrameCallback) { S.rvfc = vid.requestVideoFrameCallback(draw); }
                else { S.raf = requestAnimationFrame(draw); }
            }
            draw();

            S.cvs = cv.captureStream(FPS);
            var recVideoTrack = S.cvs.getVideoTracks()[0];

            if (S.abort || vt.readyState !== 'live') {
                cleanup();
                note('Captura encerrada antes de a gravação começar.');
                ui.status.textContent = 'pronto';
                S.busy = false;
                return;
            }

            var tracks = [recVideoTrack];
            if (S.mic) tracks = tracks.concat(S.mic.getAudioTracks());
            S.chunks = [];
            S.rec = new MediaRecorder(new MediaStream(tracks), { mimeType: mime, videoBitsPerSecond: BITRATE });
            S.rec.ondataavailable = function (e) { if (e.data && e.data.size) S.chunks.push(e.data); };
            S.rec.onstop = save;
            S.rec.onerror = function (e) {
                note('Erro na gravação: ' + ((e && e.error && e.error.name) || 'desconhecido') + '.');
                stop();
            };
            S.rec.start(250);
            monitorFps(recVideoTrack);

            S.t0 = Date.now();
            ui.btn.classList.add('rec');
            ui.btn.innerHTML = '&#9632; Parar';
            ui.mic.disabled = true;
            note((mime.indexOf('mp4') !== -1 ? 'Saída: MP4 (H.264) 1080x1920' : 'Este Chrome não grava MP4: salvando WebM 1080x1920') +
                (usedCrop ? ' · recorte na GPU.' : ' · recorte no canvas.'));
            S.timer = setInterval(function () { ui.status.innerHTML = '&#128308; ' + fmtTime(Date.now() - S.t0); }, 500);
            ui.status.innerHTML = '&#128308; 00:00';
        } catch (e) {
            cleanup();
            note(e && e.name === 'NotAllowedError' ? 'Captura cancelada.' : 'Falha ao iniciar: ' + (e && e.message || e));
            ui.status.textContent = 'pronto';
        }
        S.busy = false;
    }

    function stop() {
        if (!S.rec) return;
        try { S.rec.stop(); } catch (e) { /* já parado */ }
    }

    function save() {
        var mime = S.rec && S.rec.mimeType || '';
        var ext = mime.indexOf('mp4') !== -1 ? 'mp4' : 'webm';
        var blob = new Blob(S.chunks, { type: mime || 'video/webm' });
        cleanup();
        if (!blob.size) { note('Nada gravado.'); ui.status.textContent = 'pronto'; return; }
        var d = new Date();
        var pad = function (n) { return String(n).padStart(2, '0'); };
        var name = 'mira-reels-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
            '-' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) + '.' + ext;
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
        ui.status.textContent = 'pronto';
        note('Baixado: ' + name);
    }

    function cleanup() {
        if (S.rvfc && S.vid && S.vid.cancelVideoFrameCallback) S.vid.cancelVideoFrameCallback(S.rvfc);
        if (S.raf) cancelAnimationFrame(S.raf);
        if (S.timer) clearInterval(S.timer);
        if (S.vid) S.vid.srcObject = null;
        if (S.tab) S.tab.getTracks().forEach(function (t) { t.stop(); });
        if (S.mic) S.mic.getTracks().forEach(function (t) { t.stop(); });
        if (S.cvs) S.cvs.getTracks().forEach(function (t) { t.stop(); });
        S.rvfc = 0; S.raf = 0; S.timer = null; S.vid = null; S.tab = null; S.mic = null; S.cvs = null; S.rec = null;
        S.chunks = [];   /* o Blob já foi criado em save(); sem isto a gravação inteira fica retida em memória */
        ui.btn.classList.remove('rec');
        ui.btn.innerHTML = '&#9679; Gravar';
        ui.mic.disabled = false;
    }

    function toggle() { if (S.rec) { stop(); } else { start(); } }

    /* ---------- tecla R (quieta nos modos E/P e digitação) ---------- */
    function bindKey() {
        document.addEventListener('keydown', function (e) {
            if (e.key !== 'r' && e.key !== 'R') return;
            var t = e.target;
            if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || ''))) return;
            if (document.body.classList.contains('me-on') || document.body.classList.contains('md-on')) return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            toggle();
        });
    }

    function init() {
        if (!document.querySelector('body > section')) return;
        injectCss();
        buildPanel();
        bindKey();
        readGeo();
        window.addEventListener('resize', queueGeo);
        window.addEventListener('scroll', queueGeo, { passive: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
