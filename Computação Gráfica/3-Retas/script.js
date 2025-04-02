const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const liveCoords = document.getElementById("live-coords");
const clickedCoords = document.getElementById("clicked-coords");
const clearBtn = document.getElementById("clear-btn");
const drawLineBtn = document.getElementById("draw-line-btn");
const algorithmSelect = document.getElementById("algorithm-select");
const scrollContainer = document.querySelector(".scroll-container");

let selectedPixel = null;
let previousPixel = null;
let lines = []; // Array para armazenar as retas desenhadas

// Definir o tamanho do canvas
canvas.width = 500;
canvas.height = 500;

// Função para desenhar as linhas que dividem o canvas em 4 quadrantes
function desenharQuadrantes() {
    const largura = canvas.width;
    const altura = canvas.height;

    ctx.lineWidth = 0.3;

    // Desenhar linha vertical no centro
    ctx.beginPath();
    ctx.moveTo(largura / 2, 0);
    ctx.lineTo(largura / 2, altura);
    ctx.stroke();

    // Desenhar linha horizontal no centro
    ctx.beginPath();
    ctx.moveTo(0, altura / 2);
    ctx.lineTo(largura, altura / 2);
    ctx.stroke();
}

// Função para desenhar um pixel no canvas
function setPixel(x, y) {
    const canvasX = x + canvas.width / 2;
    const canvasY = canvas.height / 2 - y;  // Inverte o Y para que a direção positiva seja para baixo

    ctx.fillStyle = "black";
    ctx.fillRect(canvasX, canvasY, 1, 1);
}

// Função para armazenar e desenhar as retas
function drawLines() {
    lines.forEach(line => {
        const selectedAlgorithm = algorithmSelect.value;

        if (selectedAlgorithm === "dda") {
            scrollContainer.innerHTML = "";
            dda(line.x1, line.y1, line.x2, line.y2);
        } else if (selectedAlgorithm === "ponto-medio") {
            scrollContainer.innerHTML = "";
            pontoMedio(line.x1, line.y1, line.x2, line.y2);
        }
    });
}

// Função para exibir as coordenadas do mouse
canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(event.clientX - rect.left - canvas.width / 2); 
    const y = Math.round(canvas.height / 2 - (event.clientY - rect.top));

    liveCoords.innerHTML = ` 
        <strong>Coordenada:</strong> (${x}, ${y})<br>
        <strong>Quadrante:</strong> ${atualizarQuadrante(x,y)}
    `;
});

let clickCount = 0;
let x1, y1;

canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(event.clientX - rect.left - canvas.width / 2); 
    const y = Math.round(canvas.height / 2 - (event.clientY - rect.top));

    if (clickCount === 0) {
        // Armazenar o primeiro ponto
        x1 = x;
        y1 = y;
        clickCount = 1;

        // Preenche os inputs com as coordenadas do primeiro ponto
        document.getElementById("x1").value = x1;
        document.getElementById("y1").value = y1;
    } else if (clickCount === 1) {
        // Armazenar o segundo ponto e desenhar a reta
        lines.push({ x1, y1, x2: x, y2: y });
        clickCount = 0;
        drawLines();  // Desenha a reta de acordo com o algoritmo selecionado

        // Atualizar o painel direito com as coordenadas da reta desenhada
        const lastLine = lines[lines.length - 1]; // Pega a última reta desenhada
        document.getElementById("x-initial").textContent = lastLine.x1;
        document.getElementById("y-initial").textContent = lastLine.y1;
        document.getElementById("x-final").textContent = lastLine.x2;
        document.getElementById("y-final").textContent = lastLine.y2;

        // Exibir as informações e esconder a mensagem de "Nenhuma reta desenhada"
        document.getElementById("clicked-coords").style.display = "block";
        document.getElementById("no-line-message").style.display = "none";

        // Preenche os inputs com as coordenadas do segundo ponto
        document.getElementById("x2").value = x;
        document.getElementById("y2").value = y;
    }
});

// Evento de limpeza das retas
clearBtn.addEventListener("click", () => {
    lines = [];  // Limpa as retas
    ctx.clearRect(0, 0, canvas.width, canvas.height);  // Limpa o canvas
    desenharQuadrantes();  // Redesenha o plano cartesiano
    drawLines();  // Garante que as linhas antigas ainda sejam desenhadas

    // Restaura o painel direito para o estado inicial
    document.getElementById("no-line-message").style.display = "block";  // Exibe a mensagem "Nenhuma reta desenhada"
    document.getElementById("clicked-coords").style.display = "none";  // Esconde as coordenadas da reta

    // Limpa os campos de entrada
    document.getElementById("x1").value = '';
    document.getElementById("y1").value = '';
    document.getElementById("x2").value = '';
    document.getElementById("y2").value = '';

    scrollContainer.innerHTML = "";
});

// Evento de troca de algoritmo
algorithmSelect.addEventListener("change", () => {
    // Limpar as linhas e o canvas
    lines = [];  // Limpa as linhas
    ctx.clearRect(0, 0, canvas.width, canvas.height);  // Limpa o canvas

    // Redesenhar os quadrantes
    desenharQuadrantes();

    // Desenhar as linhas de acordo com o novo algoritmo
    drawLines();  // Garante que as linhas antigas sejam desenhadas com o novo algoritmo

    // Restaura o painel direito para o estado inicial
    document.getElementById("no-line-message").style.display = "block";  // Exibe a mensagem "Nenhuma reta desenhada"
    document.getElementById("clicked-coords").style.display = "none";  // Esconde as coordenadas da reta

    // Limpa os campos de entrada
    document.getElementById("x1").value = '';
    document.getElementById("y1").value = '';
    document.getElementById("x2").value = '';
    document.getElementById("y2").value = '';
});

// Evento do botão "Desenhar"
drawLineBtn.addEventListener("click", () => {
    // Captura os valores dos inputs de coordenadas
    const x1Value = parseInt(document.getElementById("x1").value);
    const y1Value = parseInt(document.getElementById("y1").value);
    const x2Value = parseInt(document.getElementById("x2").value);
    const y2Value = parseInt(document.getElementById("y2").value);

    // Adiciona a linha ao array
    lines.push({ x1: x1Value, y1: y1Value, x2: x2Value, y2: y2Value });

    // Desenha as linhas de acordo com o algoritmo selecionado
    drawLines();

    // Atualiza os valores das coordenadas da reta desenhada no painel
    const lastLine = lines[lines.length - 1]; // Pega a última reta desenhada
    document.getElementById("x-initial").textContent = lastLine.x1;
    document.getElementById("y-initial").textContent = lastLine.y1;
    document.getElementById("x-final").textContent = lastLine.x2;
    document.getElementById("y-final").textContent = lastLine.y2;

    // Exibe as coordenadas e esconde a mensagem "Nenhuma reta desenhada"
    document.getElementById("clicked-coords").style.display = "block";
    document.getElementById("no-line-message").style.display = "none";
});

// Inicializa o canvas com o plano cartesiano e sem linhas
desenharQuadrantes();

// Função para atualizar o quadrante em tempo real
function atualizarQuadrante(x, y) {
    let quadrante = '';
    if (x > 0 && y > 0) {
        return quadrante = '1';
    } else if (x < 0 && y > 0) {
        return quadrante = '2';
    } else if (x < 0 && y < 0) {
        return quadrante = '3';
    } else if (x > 0 && y < 0) {
        return quadrante = '4';
    } else if (x === 0 && y !== 0) {
        return quadrante = 'Eixo Y';
    } else if (y === 0 && x !== 0) {
        return quadrante = 'Eixo X';
    } else {
        return quadrante = 'Origem';
    }

    // Atualiza o conteúdo da barra lateral com o quadrante
    document.getElementById("quadrante-info").textContent = `Quadrante: ${quadrante}`;
}

function addCoordToSidebar(x, y, count) {
    let coordElement = document.createElement("div");
    coordElement.innerHTML = `<div style="justify-content: space-between; display: flex;"><strong>X${count}:</strong> ${x} <strong>Y${count}:</strong> ${y}</div><hr>`;
    scrollContainer.appendChild(coordElement);
}

// ---------------------------------------------------------------------------------------------------------------------------------
// Cálculos
// ---------------------------------------------------------------------------------------------------------------------------------

function dda(x1, y1, x2, y2) {
    const length = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    const xinc = (x2 - x1) / length;
    const yinc = (y2 - y1) / length;

    let x = x1;
    let y = y1;

    let count = 0;

    // Desenha os pixels da reta
    setPixel(Math.round(x), Math.round(y));

    while (Math.abs(x - x2) > Math.abs(xinc) || Math.abs(y - y2) > Math.abs(yinc)) {
        x += xinc;
        y += yinc;

        count++;

        setPixel(Math.round(x), Math.round(y));
        addCoordToSidebar(Math.round(x), Math.round(y), count);
    }
}

function pontoMedio(x1, y1, x2, y2) {
    const dx = x2 - x1; // Diferença dos x
    const dy = y2 - y1; // Diferença dos y

    if(dy < dx) { // Procedimento Bresenham line-drawning para |m| < 1.0 (1º Oitante)
        let ds = 2 * dy - dx; // Valor inicial de d

        const incE = 2 * dy; // Incremento de E
        const incNE = 2 * (dy - dx); // Incremento de NE
    
        let x = x1;
        let y = y1;

        let count = 0;
    
        setPixel(x, y); // Ativa o primeiro pixel
    
        while (x < x2) {
            if (ds <= 0) {
                // Escolhe E
                ds += incE;
                x += 1;
            } else {
                // Escolhe NE
                ds += incNE;
                x += 1;
                y += 1; // Direção da linha (cima ou baixo)
            }

            count++;

            setPixel(x, y); // Ativa o pixel atual
            addCoordToSidebar(x, y, count);
        }
    } else { // Procedimento Bresennham line-drawning para |m| >= 1.0 (2º Oitante)
        let ds = 2 * dx - dy; // Valor inicial de d

        const incE = 2 * dx; // Incremento de E
        const incNE = 2 * (dx - dy); // Incremento de NE
    
        let x = x1;
        let y = y1;

        let count = 0;
    
        setPixel(x, y); // Ativa o primeiro pixel
    
        while (y < y2) {
            if (ds <= 0) {
                // Escolhe E
                ds += incE;
                y += 1;
            } else {
                // Escolhe NE
                ds += incNE;
                y += 1;
                x += 1; // Direção da linha (cima ou baixo)
            }

            count++;

            setPixel(x, y); // Ativa o pixel atual
            addCoordToSidebar(x, y, count);
        }
    }
}