# Post Instagram: /mira-animated-typing

> Texto aprovado pelo Sandeco em 2026-07-08. Sem emojis, sem hashtags.

**Você digita um comando e a tela vira cena de cinema.**

Acabei de criar uma nova skill no Mira, meu framework open source de apresentações animadas: o comando **/mira-animated-typing**.

Ele gera uma animação que simula alguém digitando um prompt para um agente de IA, como Claude Code ou Codex, mas em tamanho gigante, com fonte de terminal e cursor piscando igual ao do Windows. Quando o texto chega perto da borda da tela, ele desliza para a esquerda como uma câmera seguindo o cursor. Quebrou a linha? A linha de cima sobe, perde um pouco de opacidade e o foco fica sempre no que está sendo escrito no centro da tela.

E os detalhes são o que fazem a diferença:

Você controla tudo dentro do próprio texto. Quer uma pausa dramática de meio segundo entre duas palavras? Escreve /p500 no meio da frase. Quer quebrar a linha? /n. Quer uma palavra colorida? Marca ela com a cor que quiser. E se você tiver o texto num print, é só mandar a imagem: o agente reconhece o texto, as quebras e as cores sozinho.

Tem até um modo apresentação: o cursor fica piscando na tela esperando você apertar Enter ao vivo. No final, um segundo Enter revela o texto inteiro com um zoom out centralizado.

Para testar o limite, pedi ao Mira um design futurista estilo Matrix: chuva digital caindo ao fundo, texto verde-fósforo com glow, scanlines de tela antiga e cada letra tremulando um caractere aleatório antes de assentar, como se estivesse sendo decifrada.

Tudo isso é um único arquivo HTML. Sem servidor, sem biblioteca, sem internet. Clica duas vezes e roda.

É assim que se ensina IA na prática: inventando a ferramenta que você queria usar.

Para saber mais https://mira.sandeco.com.br
