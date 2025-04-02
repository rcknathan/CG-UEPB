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
let circles = []; // Array para armazenar as circunferências desenhadas

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

// Função para desenhar as circunferências
function drawCircles() {
    circles.forEach(circle => {
        const selectedAlgorithm = algorithmSelect.value;

        if (selectedAlgorithm === "eqex") {
            scrollContainer.innerHTML = "";
            drawCircleUsingExplicitEquation(circle.x, circle.y, circle.r);
        } else if (selectedAlgorithm === "trigo") {
            scrollContainer.innerHTML = "";
            drawCircleUsingTrigonometric(circle.x, circle.y, circle.r);
        } else if (selectedAlgorithm === "ponto-medio") {
            scrollContainer.innerHTML = "";
            drawCircleUsingMidPoint(circle.x, circle.y, circle.r);
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
let cx, cy, r;

canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(event.clientX - rect.left - canvas.width / 2);
    const y = Math.round(canvas.height / 2 - (event.clientY - rect.top));

    if (clickCount === 0) {
        // Define o centro da circunferência
        cx = x;
        cy = y;
        clickCount = 1;

        document.getElementById("x").value = cx;
        document.getElementById("y").value = cy;
    } else if (clickCount === 1) {
        // Calcula o raio com base no segundo clique
        r = Math.round(Math.sqrt((x - cx) ** 2 + (y - cy) ** 2));
        circles.push({ x: cx, y: cy, r: r });
        clickCount = 0;

        document.getElementById("r").value = r;
        
        // Desenhar a circunferência após o segundo clique
        drawCircles(); // Função que desenha a circunferência usando o algoritmo escolhido

        // Atualizar o painel direito com as informações da circunferência
        document.getElementById("x-ponto").textContent = cx;
        document.getElementById("y-ponto").textContent = cy;
        document.getElementById("raio").textContent = r;

        // Atualiza o painel com as informações da circunferência
        document.getElementById("clicked-coords").style.display = "block";
        document.getElementById("no-line-message").style.display = "none";
    }
});

// Evento de limpeza das circunferências
clearBtn.addEventListener("click", () => {
    circles = [];  // Limpa as circunferências
    ctx.clearRect(0, 0, canvas.width, canvas.height);  // Limpa o canvas
    desenharQuadrantes();  // Redesenha o plano cartesiano
    drawCircles();  // Garante que as circunferências antigas ainda sejam desenhadas

    // Restaura o painel direito para o estado inicial
    document.getElementById("no-line-message").style.display = "block";  // Exibe a mensagem "Nenhuma circunferência desenhada"
    document.getElementById("clicked-coords").style.display = "none";  // Esconde as informações da circunferência

    // Limpa os campos de entrada
    document.getElementById("x").value = '';
    document.getElementById("y").value = '';
    document.getElementById("r").value = '';

    scrollContainer.innerHTML = "";
});

// Evento de troca de algoritmo
algorithmSelect.addEventListener("change", () => {
    // Limpar as circunferências e o canvas
    circles = [];  // Limpa as circunferências
    ctx.clearRect(0, 0, canvas.width, canvas.height);  // Limpa o canvas

    // Redesenhar os quadrantes
    desenharQuadrantes();

    // Desenhar as circunferências de acordo com o novo algoritmo
    drawCircles();  // Garante que as circunferências antigas sejam desenhadas com o novo algoritmo

    // Restaura o painel direito para o estado inicial
    document.getElementById("no-line-message").style.display = "block";  // Exibe a mensagem "Nenhuma circunferência desenhada"
    document.getElementById("clicked-coords").style.display = "none";  // Esconde as informações da circunferência

    // Limpa os campos de entrada
    document.getElementById("x").value = '';
    document.getElementById("y").value = '';
    document.getElementById("r").value = '';
});

// Evento do botão "Desenhar"
drawLineBtn.addEventListener("click", () => {
    // Captura os valores dos inputs de coordenadas e raio
    const xValue = parseInt(document.getElementById("x").value);
    const yValue = parseInt(document.getElementById("y").value);
    const rValue = parseInt(document.getElementById("r").value);

    // Adiciona a circunferência ao array
    circles.push({ x: xValue, y: yValue, r: rValue });

    // Desenha as circunferências de acordo com o algoritmo selecionado
    drawCircles();

    // Atualiza os valores das coordenadas da circunferência desenhada no painel
    const lastCircle = circles[circles.length - 1]; // Pega a última circunferência desenhada
    document.getElementById("x-ponto").textContent = lastCircle.x;
    document.getElementById("y-ponto").textContent = lastCircle.y;
    document.getElementById("raio").textContent = lastCircle.r;

    // Exibe as coordenadas e o raio da circunferência e esconde a mensagem "Nenhuma circunferência desenhada"
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

function drawCircleUsingExplicitEquation(xc, yc, r) {
    let count = 1; 
    for (let x = -r; x <= r; x++) {
        let y = Math.round(Math.sqrt(r * r - x * x)); 

        setPixel(xc + x, yc + y);
        addCoordToSidebar(xc + x, yc + y, count++);

        setPixel(xc + x, yc - y);
        addCoordToSidebar(xc + x, yc - y, count++);
    }
}

function drawCircleUsingTrigonometric(xc, yc, r) {
    const step = 0.1;  
    let count = 1; 
    for (let theta = 0; theta < 2 * Math.PI; theta += step) {
        let x = Math.round(xc + r * Math.cos(theta));
        let y = Math.round(yc + r * Math.sin(theta));

        setPixel(x, y);
        addCoordToSidebar(x, y, count++);
    }
}

function drawCircleUsingMidPoint(xc, yc, r) {
    let x = 0;
    let y = r;
    let p = 1 - r;  
    let count = 1;

    function plotCirclePoints(xc, yc, x, y) {
        setPixel(xc + x, yc + y); 
        addCoordToSidebar(xc + x, yc + y, count); 
        count++;

        setPixel(xc - x, yc + y); 
        addCoordToSidebar(xc - x, yc + y, count); 
        count++;

        setPixel(xc + x, yc - y); 
        addCoordToSidebar(xc + x, yc - y, count); 
        count++;

        setPixel(xc - x, yc - y); 
        addCoordToSidebar(xc - x, yc - y, count); 
        count++;

        setPixel(xc + y, yc + x); 
        addCoordToSidebar(xc + y, yc + x, count); 
        count++;

        setPixel(xc - y, yc + x); 
        addCoordToSidebar(xc - y, yc + x, count); 
        count++;

        setPixel(xc + y, yc - x); 
        addCoordToSidebar(xc + y, yc - x, count); 
        count++;

        setPixel(xc - y, yc - x); 
        addCoordToSidebar(xc - y, yc - x, count); 
        count++;
    }

    while (x <= y) {
        plotCirclePoints(xc, yc, x, y);
        if (p < 0) {
            p = p + 2 * x + 3; 
        } else {
            p = p + 2 * (x - y) + 5; 
            y--;
        }
        x++;
    }
}