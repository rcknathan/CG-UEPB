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

// Função para desenhar um quadrado 100x100 na origem
function drawSquareDDA() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    desenharQuadrantes();

    const size = 50;
    const x1 = 0, y1 = 0;
    const x2 = size, y2 = 0;
    const x3 = size, y3 = size;
    const x4 = 0, y4 = size;

    dda(x1, y1, x2, y2);
    dda(x2, y2, x3, y3);
    dda(x3, y3, x4, y4);
    dda(x4, y4, x1, y1);
}

// Função para limpar o canvas mantendo o plano cartesiano
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    desenharQuadrantes();
}

// Eventos para os botões
drawSquareBtn.addEventListener("click", drawSquareDDA);
clearCanvasBtn.addEventListener("click", clearCanvas);

// Inicializa o plano cartesiano
desenharQuadrantes();
