const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const drawSquareBtn = document.getElementById("draw-square-btn");
const clearCanvasBtn = document.getElementById("clear-canvas-btn");

// Definir tamanho do canvas
canvas.width = 500;
canvas.height = 500;

// Desenhar eixos cartesianos
function desenharQuadrantes() {
    const largura = canvas.width;
    const altura = canvas.height;

    ctx.lineWidth = 0.3;
    ctx.beginPath();
    ctx.moveTo(largura / 2, 0);
    ctx.lineTo(largura / 2, altura);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, altura / 2);
    ctx.lineTo(largura, altura / 2);
    ctx.stroke();
}

// Função para desenhar um pixel no canvas
function setPixel(x, y) {
    const canvasX = x + canvas.width / 2;
    const canvasY = canvas.height / 2 - y;
    ctx.fillStyle = "black";
    ctx.fillRect(canvasX, canvasY, 1, 1);
}

// Algoritmo DDA para desenhar uma linha
function dda(x1, y1, x2, y2) {
    const length = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    const xinc = (x2 - x1) / length;
    const yinc = (y2 - y1) / length;

    let x = x1;
    let y = y1;

    setPixel(Math.round(x), Math.round(y));

    for (let i = 0; i < length; i++) {
        x += xinc;
        y += yinc;
        setPixel(Math.round(x), Math.round(y));
    }
}

//para armazenar os pontos do quadrado anteriores para as operações.
let quadradoAtual = [];

function drawSquareDDA() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    desenharQuadrantes();

    const size = 50;
    quadradoAtual = [
        { x: 0, y: 0 },
        { x: size, y: 0 },
        { x: size, y: size },
        { x: 0, y: size }
    ];

    // Desenhar o quadrado
    for (let i = 0; i < quadradoAtual.length; i++) {
        const proximo = (i + 1) % quadradoAtual.length;
        dda(quadradoAtual[i].x, quadradoAtual[i].y, quadradoAtual[proximo].x, quadradoAtual[proximo].y);
    }

    atualizarInformacoesObjeto()
}

//Matriz Homogênea (usada nas operações)
function multiplicarMatrizVetor(matriz, vetor) {
    // vetor no formato [x, y, 1] (coordenadas homogêneas)
    return [
        matriz[0][0] * vetor[0] + matriz[0][1] * vetor[1] + matriz[0][2] * 1,
        matriz[1][0] * vetor[0] + matriz[1][1] * vetor[1] + matriz[1][2] * 1
    ];
}

//Matriz de Translacao
function criarMatrizTranslacao(dx, dy) {
    return [
        [1, 0, dx],
        [0, 1, dy],
        [0, 0, 1]
    ];
}

//Operação Translação
function aplicarTranslacaoMatriz() {
    const dx = parseFloat(document.getElementById("x-translation").value) || 0;
    const dy = parseFloat(document.getElementById("y-translation").value) || 0;

    if (quadradoAtual.length === 0) {
        alert("Gere um quadrado primeiro!");
        return;
    }

    // Criar matriz de translação
    const matrizTranslacao = criarMatrizTranslacao(dx, dy);

    // Aplicar a cada ponto do quadrado
    const novosPontos = quadradoAtual.map(ponto => {
        const vetor = [ponto.x, ponto.y]; // Ponto original
        const [novoX, novoY] = multiplicarMatrizVetor(matrizTranslacao, vetor);
        return { x: novoX, y: novoY };
    });

    // Redesenhar e atualizar
    redesenharQuadrado(novosPontos);
    quadradoAtual = novosPontos;
    atualizarInformacoesObjeto()
}

//Matriz de Rotação
function criarMatrizRotacao(anguloGraus, centroX = 0, centroY = 0) {
    const anguloRad = (anguloGraus * Math.PI) / 180; // Converte graus para radianos
    const cos = Math.cos(anguloRad);
    const sin = Math.sin(anguloRad);

    // Matriz de rotação em torno da origem
    const matrizRotacao = [
        [cos, -sin, 0],
        [sin,  cos, 0],
        [0,    0,   1]
    ];

    // Se houver centro de rotação diferente da origem, combinar com translações
    if (centroX !== 0 || centroY !== 0) {
        const matrizTranslacaoPositiva = criarMatrizTranslacao(centroX, centroY);
        const matrizTranslacaoNegativa = criarMatrizTranslacao(-centroX, -centroY);

        // Matriz composta: T⁻¹ × Rotação × T
        return multiplicarMatrizes(
            matrizTranslacaoPositiva,
            multiplicarMatrizes(matrizRotacao, matrizTranslacaoNegativa)
        );
    }

    return matrizRotacao;
}

//Função multiplicar matrizes caso você precise rotacionar em um ponto fixo. (overload de método)
function multiplicarMatrizes(a, b) {
    const result = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
    ];

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            for (let k = 0; k < 3; k++) {
                result[i][j] += a[i][k] * b[k][j];
            }
        }
    }

    return result;
}

//Função Rotação
function aplicarRotacaoMatriz() {
    const angulo = parseFloat(document.getElementById("angle").value) || 0;
    const centroX = parseFloat(document.getElementById("x-rotation").value) || 0;
    const centroY = parseFloat(document.getElementById("y-rotation").value) || 0;

    if (quadradoAtual.length === 0) {
        alert("Gere um quadrado primeiro!");
        return;
    }

    // Criar matriz de rotação (com centro especificado)
    const matrizRotacao = criarMatrizRotacao(angulo, centroX, centroY);

    // Aplicar a cada ponto do quadrado
    const novosPontos = quadradoAtual.map(ponto => {
        const vetor = [ponto.x, ponto.y];
        const [novoX, novoY] = multiplicarMatrizVetor(matrizRotacao, vetor);
        return { x: novoX, y: novoY };
    });

    // Redesenhar e atualizar
    redesenharQuadrado(novosPontos);
    quadradoAtual = novosPontos;
    atualizarInformacoesObjeto();
}


//Matriz de Escala
function criarMatrizEscala(sx, sy) {
    return [
        [sx, 0, 0],
        [0, sy, 0],
        [0, 0, 1]
    ];
}

function aplicarEscalaMatriz() {
    const sx = parseFloat(document.getElementById("x-scale").value) || 1;
    const sy = parseFloat(document.getElementById("y-scale").value) || 1;

    if (quadradoAtual.length === 0) {
        alert("Gere um quadrado primeiro!");
        return;
    }

    // Criar matriz de escala
    const matrizEscala = criarMatrizEscala(sx, sy);

    // Aplicar a cada ponto do quadrado
    const novosPontos = quadradoAtual.map(ponto => {
        const vetor = [ponto.x, ponto.y];
        const [novoX, novoY] = multiplicarMatrizVetor(matrizEscala, vetor);
        return { x: novoX, y: novoY };
    });

    // Redesenhar e atualizar
    redesenharQuadrado(novosPontos);
    quadradoAtual = novosPontos;
    atualizarInformacoesObjeto()
}

//Matriz Cisalhamento
function criarMatrizCisalhamento(shx, shy) {
    return [
        [1, shx, 0],
        [shy, 1, 0],
        [0, 0, 1]
    ];
}

//Função Cisalhamento
function aplicarCisalhamentoMatriz() {
    const shx = parseFloat(document.getElementById("x-cis").value) || 0;
    const shy = parseFloat(document.getElementById("y-cis").value) || 0;

    if (quadradoAtual.length === 0) {
        alert("Gere um quadrado primeiro!");
        return;
    }

    // Criar matriz de cisalhamento
    const matrizCisalhamento = criarMatrizCisalhamento(shx, shy);

    // Aplicar a cada ponto do quadrado
    const novosPontos = quadradoAtual.map(ponto => {
        const vetor = [ponto.x, ponto.y];
        const [novoX, novoY] = multiplicarMatrizVetor(matrizCisalhamento, vetor);
        return { x: novoX, y: novoY };
    });

    // Redesenhar e atualizar
    redesenharQuadrado(novosPontos);
    quadradoAtual = novosPontos;
    atualizarInformacoesObjeto(); // Atualiza a sidebar
}


//Matriz de Reflexão
function criarMatrizReflexao(refletirX, refletirY) {
    return [
        [refletirY ? -1 : 1, 0, 0],
        [0, refletirX ? -1 : 1, 0],
        [0, 0, 1]
    ];
}

//flag
let estaRefletido = { x: false, y: false }; // Rastreia se o quadrado está atualmente refletido em X e/ou Y

//Operação Reflexão
function aplicarReflexaoMatriz() {
    const refletirX = document.getElementById("x-ref").checked;
    const refletirY = document.getElementById("y-ref").checked;

    if (!refletirX && !refletirY) return; // Nada a fazer

    if (quadradoAtual.length === 0) {
        alert("Gere um quadrado primeiro!");
        return;
    }

    // Criar matriz de reflexão
    const matrizReflexao = criarMatrizReflexao(refletirX, refletirY);

    // Aplicar a cada ponto do quadrado
    const novosPontos = quadradoAtual.map(ponto => {
        const vetor = [ponto.x, ponto.y];
        const [novoX, novoY] = multiplicarMatrizVetor(matrizReflexao, vetor);
        return { x: novoX, y: novoY };
    });

    // Redesenhar e atualizar
    redesenharQuadrado(novosPontos);
    quadradoAtual = novosPontos;
    atualizarInformacoesObjeto()
}

//Função para obter os pontos originais do quadrado criado.
function obterPontosOriginais() {
    return [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 50 },
        { x: 0, y: 50 }
    ];
}

//Função para obter os pontos atuais da figura.
function obterPontosAtuais() {
    return quadradoAtual;
}

// Função auxiliar para redesenhar o quadrado com novos pontos
function redesenharQuadrado(pontos) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    desenharQuadrantes();
    
    // Desenhar linhas entre os pontos
    for (let i = 0; i < pontos.length; i++) {
        const proximo = (i + 1) % pontos.length;
        dda(pontos[i].x, pontos[i].y, pontos[proximo].x, pontos[proximo].y);
    }
}

//Função para ter informações em tempo real do objeto
function atualizarInformacoesObjeto() {
    if (quadradoAtual.length === 0) {
        document.getElementById("vertices-list").innerHTML = "Nenhum objeto gerado.";
        document.getElementById("center-position").innerHTML = "N/A";
        return;
    }

    // Calcular centro geométrico (média dos vértices)
    const centroX = (quadradoAtual[0].x + quadradoAtual[1].x + quadradoAtual[2].x + quadradoAtual[3].x) / 4;
    const centroY = (quadradoAtual[0].y + quadradoAtual[1].y + quadradoAtual[2].y + quadradoAtual[3].y) / 4;

    // Formatar vértices
    const verticesHTML = quadradoAtual.map((vertice, index) => 
        `Vértice ${index + 1}: (${vertice.x.toFixed(2)}, ${vertice.y.toFixed(2)})`
    ).join("<br>");

    // Atualizar a UI
    document.getElementById("vertices-list").innerHTML = verticesHTML;
    document.getElementById("center-position").innerHTML = 
        `(${centroX.toFixed(2)}, ${centroY.toFixed(2)})`;
}


// Função para limpar o canvas mantendo o plano cartesiano
function clearCanvas() {
    // Limpa o canvas e redesenhando os eixos
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    desenharQuadrantes();
    
    // Reseta o array do quadrado atual
    quadradoAtual = [];
    
    // Limpa as informações exibidas na sidebar
    document.getElementById("vertices-list").innerHTML = "Nenhum objeto gerado.";
    document.getElementById("center-position").innerHTML = "N/A";
}

// Eventos para os botões
drawSquareBtn.addEventListener("click", drawSquareDDA);
clearCanvasBtn.addEventListener("click", clearCanvas);
document.querySelectorAll('.type-op')[0].addEventListener('click', aplicarTranslacaoMatriz);
document.querySelectorAll('.type-op')[1].addEventListener('click', aplicarEscalaMatriz);
document.querySelectorAll('.type-op')[2].addEventListener('click', aplicarRotacaoMatriz);
document.querySelectorAll('.type-op')[3].addEventListener('click', aplicarReflexaoMatriz);
document.querySelectorAll('.type-op')[4].addEventListener('click', aplicarCisalhamentoMatriz);
// Inicializa o plano cartesiano
desenharQuadrantes();
