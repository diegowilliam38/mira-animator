# BRAINSTORM: Vídeo → Jogada na Mesa Tática (YOLO)

Data: 05/07/2026 · Autor: sandeco + Claude · Status: pesquisado, não implementado

## A ideia

O usuário fornece um vídeo real de uma jogada (transmissão de TV ou câmera tática) e o Mira monta a jogada sozinho na mesa tática: identifica os jogadores no vídeo, separa os times, converte as posições para o campo 2D visto de cima e gera os keyframes que o painel "Jogada" já sabe reproduzir.

## O que já existe no motor (decks/mesa-tatica/tatico-brasil-noruega.html)

- Replay por keyframes: cada quadro é `{ players: { id: [u, v] }, ball: [u, v] }`, com `u` e `v` normalizados 0..1 no campo (u = comprimento, v = largura). Interpolação suave entre quadros, play/pausa/passo.
- Jogadas nomeadas persistidas como ARQUIVOS: um `.json` por jogada em `decks/mesa-tatica/data/`, no schema `mira-tactics-play/1` (ver SPEC_MESA_TATICA.md, seção 8). O slide já salva (💾, via File System Access API), lista, carrega (▶) e importa (⇪) esses arquivos.
- Ou seja: o alvo da extração de vídeo é EXATAMENTE esse JSON. O pipeline YOLO deve gerar no fim um arquivo desse schema com VÁRIOS quadros-chave da movimentação (momentos de inflexão da jogada; o replay interpola o resto). Nenhuma mudança no motor é necessária para carregar.

## Stack pesquisada (validada na web em 05/07/2026)

1. **Detecção de jogadores**: Ultralytics YOLO (ou RF-DETR da Roboflow) detecta jogadores, juiz e bola frame a frame.
   - Modelo pronto: https://universe.roboflow.com/roboflow-jvuqo/football-players-detection-3zvbc
2. **Tracking (IDs persistentes)**: ByteTrack via Ultralytics mantém o mesmo ID de cada jogador entre frames.
   - https://docs.ultralytics.com/modes/track
3. **Homografia (pixel → campo 2D)**: modelo de keypoints do gramado (32 pontos: linhas, círculo, áreas) gera a matriz de perspectiva que converte a posição do pé do jogador em coordenada do campo visto de cima ("radar").
   - Modelo pronto: https://universe.roboflow.com/roboflow-jvuqo/football-field-detection-f07vi
   - Tutorial oficial: https://blog.roboflow.com/camera-calibration-sports-computer-vision/
   - Pipeline completo: https://blog.roboflow.com/sports-analytics-ai/
4. **Separação de times**: cor dominante da camisa (KMeans no recorte do torso) + voto temporal por track para estabilidade.
5. **Referência de ponta a ponta**: repo MatchVision (vídeo de transmissão → mapa tático 2D sincronizado, YOLO + ByteTrack + homografia PnLCalib):
   - https://github.com/BlazeWild/MatchVision-AI-Sports-Video-Analytics-Tracking-Pipeline

## Plano proposto

1. **Script Python** (`video2jogada.py`, fora do slide):
   - Entrada: vídeo .mp4 + taxa de amostragem (ex.: 1 quadro/s).
   - YOLO + ByteTrack → caixas com ID por frame; keypoints do campo → homografia por frame (a câmera se move).
   - Ponto do jogador = centro da base da caixa (pés), projetado pela homografia → normalizar para u,v 0..1.
   - KMeans nas cores → time A/B; mapear tracks para os 11 ids de cada time do TACTICS (por proximidade da formação inicial ou manualmente).
   - Detecção de quadros-chave: em vez de despejar todas as posições, selecionar os momentos de inflexão (mudança de direção/velocidade dos tracks, troca de posse) e emitir um frame por momento.
   - Saída: arquivo `data/<jogada>.json` no schema `mira-tactics-play/1` (SPEC seção 8).
2. **Carregamento no slide**: já implementado (lista ▤ lê a pasta data/, ⇪ importa arquivo avulso; apertar R já conecta a pasta e carrega a lista). Nada a fazer.
2b. **Correção humana pós-YOLO**: o painel de jogada já permite editar o resultado importado quadro a quadro (◀/▶| navega, ✓ sobrescreve o quadro com as posições da tela, ⌫ apaga um quadro ruim) e regravar o arquivo pelo 💾 da linha na lista. Ou seja: a saída do pipeline não precisa ser perfeita; o apresentador refina na própria mesa.
3. **Validação antes de integrar** (regra do sandeco: pesquisar fundo antes de construir): rodar os dois modelos do Roboflow Universe num clipe real e conferir a qualidade da homografia com câmera em movimento antes de fechar o formato.

## Ambiente e downloads (verificado em 05/07/2026 na máquina do sandeco)

Máquina: Python 3.12.0, pip 26.0.1, GPU NVIDIA RTX 4070 Laptop 8 GB. Roda tudo local.

O que baixar, em ordem:

1. **Pacotes Python** (num venv dedicado):
   - `torch` com CUDA (~2,5 GB) para usar a 4070; sem ele o YOLO roda em CPU.
   - `ultralytics` (YOLO + ByteTrack juntos).
   - `supervision` (utilitários Roboflow, inclui o "radar" 2D).
   - `opencv-python`, `numpy`, `scikit-learn` (KMeans dos times).
   - `inference` ou `roboflow` (cliente que baixa/roda os modelos do Universe).
2. **Pesos dos dois modelos do Roboflow Universe** (links na seção Stack): jogadores (`football-players-detection-3zvbc`) e keypoints do campo (`football-field-detection-f07vi`). Exigem conta gratuita na Roboflow + API key (variável de ambiente).
3. **Clipe de teste**: 10–30 s de vídeo real (.mp4), câmera de transmissão mostrando bastante campo (a homografia precisa ver as linhas).
4. Opcional: clonar `github.com/roboflow/sports`, que já tem o `ViewTransformer` (homografia) pronto para copiar.

Pendências do sandeco: criar a conta Roboflow e pegar a API key; separar o clipe da jogada.

## Decisões pendentes

- Mapear track→jogador (camisa nº?) automático via OCR do número ou manual (o apresentador arrasta uma vez para casar).
- Amostragem: keyframes esparsos (1/s, replay interpola) ou trajetória densa (mais fiel, arquivo maior).
- A bola: detecção é instável em transmissão; aceitar bola interpolada/manual na v1.
- Onde roda o Python: local (venv com ultralytics + roboflow) ou serviço.

## Restrições ativas

- O slide continua offline por file://: a extração roda FORA do slide; o slide só carrega o JSON.
- Não quebrar o schema `mira-tactics-play/1` (jogadas já salvas em data/ pelo usuário).
