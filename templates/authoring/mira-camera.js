/* =====================================================================
   mira-camera.js  ·  Câmera embutida do MIRA (decks multi-formato)
   ---------------------------------------------------------------------
   Injeta o feed da webcam ao vivo em toda `.cam-area` do deck, para
   gravação direta no OBS (captura de janela, sem chroma key).

   Contrato:
     - Área de câmera: qualquer elemento com a classe `.cam-area`.
     - Stream ÚNICO por sessão (uma permissão), compartilhado por todas
       as áreas via o mesmo MediaStream.
     - Vídeo local sempre MUDO (o áudio da gravação é do OBS).
     - Fallback: sem câmera (file://, permissão negada, sem dispositivo),
       a área vira verde chroma puro #00FF00, sem nada por cima, e um
       aviso discreto aparece FORA da área (some em 5s).
     - Tecla C alterna o espelhamento (padrão: espelhado, estilo selfie).
     - Requer contexto seguro (http://localhost via mira-serve, ou https).

   Este arquivo vive em `mira/` dentro do deck, como os demais módulos
   de apoio (mira-edit.js, mira-draw.js). Não depende de nada externo.
   ===================================================================== */
(function () {
    'use strict';
    if (typeof document === 'undefined') return;

    /* ---------- estilos ---------- */
    function injectCss() {
        if (document.getElementById('mira-camera-css')) return;
        var st = document.createElement('style');
        st.id = 'mira-camera-css';
        st.textContent = [
            '.cam-area { position: relative; overflow: hidden; background: #000; }',
            /* fallback verde chroma PURO: nenhum texto/gradiente por cima (keying limpo no OBS) */
            '.cam-area.cam-fallback { background: #00FF00 !important; }',
            '.cam-area .cam-video { width: 100%; height: 100%; object-fit: cover; display: block; }',
            /* espelhamento estilo selfie (padrão ligado; tecla C alterna) */
            'body.cam-mirror .cam-video { transform: scaleX(-1); }',
            /* aviso discreto FORA da área de câmera (canto da margem #333), some sozinho */
            '.cam-notice { position: fixed; top: 14px; left: 14px; z-index: 2147483000;',
            '  max-width: 300px; padding: 10px 14px; border-radius: 10px;',
            '  background: rgba(13, 13, 15, .94); color: #f4f4f5;',
            '  border: 1px solid rgba(255, 144, 77, .55);',
            '  font: 600 13px/1.45 Inter, system-ui, -apple-system, sans-serif; }'
        ].join('\n');
        document.head.appendChild(st);
    }

    /* ---------- stream único memoizado (RN-07) ---------- */
    var streamPromise = null;
    function getStream() {
        if (!streamPromise) {
            if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
                streamPromise = Promise.reject(new Error('mira-camera: contexto inseguro (sem mediaDevices)'));
            } else {
                streamPromise = navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            }
        }
        return streamPromise;
    }

    /* ---------- aviso temporário ---------- */
    function notice(msg) {
        var el = document.createElement('div');
        el.className = 'cam-notice';
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 5000);
    }

    function fallback(areas, msg) {
        areas.forEach(function (a) { a.classList.add('cam-fallback'); });
        notice(msg);
    }

    /* ---------- teclado: C alterna espelhamento ---------- */
    function bindMirrorKey() {
        document.addEventListener('keydown', function (e) {
            if (e.key !== 'c' && e.key !== 'C') return;
            var t = e.target;
            if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || ''))) return;
            if (document.body.classList.contains('me-on') || document.body.classList.contains('md-on')) return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            document.body.classList.toggle('cam-mirror');
        });
    }

    /* ---------- injeção nas áreas ---------- */
    var activeStream = null;

    function init() {
        var areas = Array.prototype.slice.call(document.querySelectorAll('.cam-area'));
        if (!areas.length) return;                     // deck sem câmera: módulo inerte
        document.body.classList.add('cam-mirror');     // padrão selfie (D-06)
        bindMirrorKey();

        // registrado ANTES do getUserMedia: se a página fechar com o prompt aberto
        // e a permissão resolver depois, a track ainda é parada
        window.addEventListener('pagehide', function () {
            if (activeStream) activeStream.getTracks().forEach(function (t) { t.stop(); });
        });

        getStream().then(function (stream) {
            activeStream = stream;
            areas.forEach(function (a) {
                var v = document.createElement('video');
                v.className = 'cam-video';
                v.autoplay = true;
                v.muted = true;                        // nunca captura/tocamos áudio (D-04)
                v.playsInline = true;
                v.setAttribute('playsinline', '');
                v.setAttribute('muted', '');
                v.srcObject = stream;
                a.appendChild(v);
                var p = v.play();
                if (p && p.catch) p.catch(function () { /* autoplay muted não bloqueia */ });
            });
        }).catch(function (err) {
            var insecure = !(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
            var denied = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
            var msg;
            if (insecure) {
                msg = 'Câmera indisponível em file://. Sirva o deck em localhost (npx mira-animator serve) para o feed ao vivo. Área em verde chroma: no OBS, aplique Chroma Key.';
            } else if (denied) {
                msg = 'Permissão de câmera negada. Área em verde chroma: no OBS, aplique Chroma Key em #00FF00.';
            } else {
                msg = 'Nenhuma câmera encontrada. Área em verde chroma: no OBS, aplique Chroma Key em #00FF00.';
            }
            fallback(areas, msg);
        });
    }

    injectCss();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
