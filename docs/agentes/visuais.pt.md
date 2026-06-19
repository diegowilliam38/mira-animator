# Visuais e dados

Visuais estáticos, gráficos, QR codes, 3D de verdade e templates a partir de imagem.

## `/mira-visuals`
Imagens estáticas para slides: painéis, diagramas, gráficos e infográficos — quando um conceito fica melhor como um visual fixo e denso do que como movimento.

## `/mira-chart`
Transforma dados em gráficos com impacto: a partir de um CSV/JSON, de uma imagem de gráfico, ou de um rascunho à mão — e recomenda o melhor tipo de gráfico a partir de uma galeria.

## `/mira-qrcode`
Insere num slide um **QR code** grande, central e escaneável, gerado a partir de um link ou texto que você fornece. O QR é gerado **localmente** na hora de criar o slide (pacote npm `qrcode`) e embutido como SVG inline, sem dependência de runtime, sem API externa e sem CDN, então o slide funciona até por `file://`. Card limpo, mesmo padrão do `mira-3d`: só o título do slide e o QR grande, sem legenda com o link embaixo. A escaneabilidade manda no estilo: módulos escuros sobre cartão branco, zona de silêncio preservada, laranja só na moldura e no título. O QR fica estático: o loop interno vive na moldura (pulso de brilho, cantos respirando), nunca sobre os módulos.

## `/mira-3d`
Adiciona um **elemento 3D de verdade** ao canvas de um slide (profundidade real, rotação automática contínua e interação de arrastar para girar / dar zoom) num card limpo onde o elemento fica maximizado. Escolhe uma de três camadas a partir do seu pedido: CSS 3D puro (formas simples), Three.js procedural (formas abstratas como esfera de partículas e rede de nós, ou objetos low-poly montados de primitivas), ou glTF (quando você fornece um `.glb`, ou aceita buscar um modelo gratuito e licenciado na web). Herda a regra-mãe: o 3D nunca entra estático, então a rotação automática pausa no arrasto e retoma.

!!! warning "A camada glTF precisa de servidor"
    Um slide que carrega um `.glb` local **não** abre por `file://` (o navegador bloqueia o fetch do modelo), só por HTTP. Nesse caso o agente sobe um servidor local, te entrega o link `http://localhost` e gera um launcher de duplo-clique (`abrir-slide.cmd`) para você apresentar depois. Essa camada precisa do **Node.js** instalado. As camadas CSS 3D e procedural não usam asset local e abrem direto de `file://`, sem servidor.

## `/mira-svg-morph`
Gera um slide onde uma forma SVG **morfa em outra**, em loop contínuo, com GSAP + MorphSVGPlugin vendorados localmente (o deck roda offline, por `file://`). Você aponta 2 ou mais arquivos `.svg` da pasta `assets/` do deck, na ordem do morph: 2 SVGs vão e voltam, N SVGs encadeiam (A vira B vira C ... volta a A). A skill cola os `<path>` inline com ids únicos (sem colidir entre vários SVGs no mesmo documento), roda `convertToPath` em formas que não são path, e monta o loop. Card limpo, mesmo padrão do `mira-3d`: só o título e a forma morfando grande e central, em laranja #FF904D. O MorphSVG morfa path em path (não SVG inteiro em SVG inteiro): multi-path morfa par a par, morfa só a silhueta, e fica mais limpo quando os dois SVGs têm o mesmo viewBox. Para metáfora densa ou emergente (partículas, explosão), use o `mira-animator`.

## `/mira-icon-morph`
O mesmo morph, mas a partir de **conceitos em palavras** quando você não tem os arquivos. Você diz "nuvem virando lâmpada"; a skill busca na API do Iconify, valida a licença, baixa os SVGs, cola inline e monta o morph. Prefere ícones de path único em viewBox 0 0 24 24 (morfam liso), usa só licenças abertas (MIT, Apache-2.0, CC0 ou CC-BY), registra atribuição no `CREDITS.md` do deck, e recusa IP protegida (personagens de franquia), sugerindo arte original. A internet é usada só na geração; o deck final fica offline. Reaproveita o núcleo de render do `mira-svg-morph`.

## `/mira-svg-animator`
Anima um SVG que você fornece, dando movimento próprio à forma (ela não vira outra, isso é morph). Você passa um `.svg` e descreve o movimento em palavras: bater asas, girar uma roda, deslizar, pulsar, desenhar o contorno, percorrer uma curva. A skill escolhe a técnica do GSAP: transform (rotate/scale/translate), DrawSVG (o traço se desenha) ou MotionPath (movimento por curva). Ponto-chave: para animar uma parte, ela precisa ser um elemento separado; se o SVG for um path único fundido, a skill separa a parte (corte por um eixo com clipPath, ou edição do path para isolar/remover um trecho, como manter as antenas paradas). Também remove fundo opaco e define a origem do movimento (a dobradiça ou o centro de rotação). Loop e `prefers-reduced-motion` respeitados; GSAP vendorado, funciona por `file://`.

## `/mira-image-template`
Cria um **novo template de deck a partir de imagem(ns)**. Você manda prints de telas/slides e/ou a logomarca, e o agente reconhece todo o design system (cores, fundo, tipografia, cantos, sombras, glassmorphism, glows) e, quando há print, a **disposição dos elementos**, e monta um template completo: o esqueleto `mira-templates/decks/<nome>/index.html` com a identidade embutida, mais o tema `mira-templates/themes/<nome>.css`. Ao final pede um **nome** e salva. O template passa a ser oferecido pelo `/mira-new` junto com os existentes, e seu tema de mesmo nome vira o padrão natural. Print manda no layout; logo manda na paleta.
