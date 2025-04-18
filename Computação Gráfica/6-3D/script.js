// Configuração do canvas
const canvas = document.getElementById('canvas3d');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 600;

// Variáveis de estado
let currentObject = null;
let objectVertices = [];
let objectEdges = [];
let objectRotationX = 0;
let objectRotationY = 0;
let objectRotationZ = 0;
let zoom = 100;

// Histórico de transformações
let transformationHistory = [];

// Função para desenhar um pixel no canvas
function setPixel(x, y, color = '#000000') {
    const canvasX = Math.round(x);
    const canvasY = Math.round(y);
    
    if (canvasX >= 0 && canvasX < canvas.width && canvasY >= 0 && canvasY < canvas.height) {
        ctx.fillStyle = color;
        ctx.fillRect(canvasX, canvasY, 1, 1);
    }
}

// Algoritmo DDA para desenhar linhas
function drawLineDDA(x1, y1, x2, y2, color = '#000000') {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    
    const xIncrement = dx / steps;
    const yIncrement = dy / steps;
    
    let x = x1;
    let y = y1;
    
    setPixel(x, y, color);
    
    for (let i = 0; i < steps; i++) {
        x += xIncrement;
        y += yIncrement;
        setPixel(x, y, color);
    }
}

// Matrizes de transformação 3D
class Matrix3D {
    static multiply(a, b) {
        const result = [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ];

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                for (let k = 0; k < 4; k++) {
                    result[i][j] += a[i][k] * b[k][j];
                }
            }
        }
        return result;
    }

    static multiplyVector(matrix, vector) {
        const result = [0, 0, 0, 0];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                result[i] += matrix[i][j] * vector[j];
            }
        }
        return result;
    }

    static translation(tx, ty, tz) {
        return [
            [1, 0, 0, tx],
            [0, 1, 0, ty],
            [0, 0, 1, tz],
            [0, 0, 0, 1]
        ];
    }

    static scaling(sx, sy, sz) {
        return [
            [sx, 0, 0, 0],
            [0, sy, 0, 0],
            [0, 0, sz, 0],
            [0, 0, 0, 1]
        ];
    }

    static rotationX(angle) {
        const rad = angle * Math.PI / 180;
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        return [
            [1, 0, 0, 0],
            [0, c, -s, 0],
            [0, s, c, 0],
            [0, 0, 0, 1]
        ];
    }

    static rotationY(angle) {
        const rad = angle * Math.PI / 180;
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        return [
            [c, 0, s, 0],
            [0, 1, 0, 0],
            [-s, 0, c, 0],
            [0, 0, 0, 1]
        ];
    }

    static rotationZ(angle) {
        const rad = angle * Math.PI / 180;
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        return [
            [c, -s, 0, 0],
            [s, c, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ];
    }

    // Função de cisalhamento
    static shear(shXY, shXZ, shYZ) {
        return [
            [1, shXY, shXZ, 0],
            [0, 1, shYZ, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ];
    }

    // Função de reflexão
    static reflection(axis) {
        switch (axis) {
            case 'xy':
                return [
                    [1, 0, 0, 0],
                    [0, 1, 0, 0],
                    [0, 0, -1, 0],
                    [0, 0, 0, 1]
                ];
            case 'xz':
                return [
                    [1, 0, 0, 0],
                    [0, -1, 0, 0],
                    [0, 0, 1, 0],
                    [0, 0, 0, 1]
                ];
            case 'yz':
                return [
                    [-1, 0, 0, 0],
                    [0, 1, 0, 0],
                    [0, 0, 1, 0],
                    [0, 0, 0, 1]
                ];
        }
    }
}

// Funçoes para aplicar as transformações em 3D
document.getElementById('apply-scale').addEventListener('click', () => {
    if (!currentObject) {
        alert('Gere um objeto primeiro!');
        return;
    }
    
    const sx = parseFloat(document.getElementById('sx').value) || 1;
    const sy = parseFloat(document.getElementById('sy').value) || 1;
    const sz = parseFloat(document.getElementById('sz').value) || 1;
    
    const scalingMatrix = Matrix3D.scaling(sx, sy, sz);
    objectVertices = objectVertices.map(vertex => {
        const transformed = Matrix3D.multiplyVector(scalingMatrix, [...vertex, 1]);
        return [transformed[0], transformed[1], transformed[2]];
    });
    updateTransformationHistory(`Escala (SX: ${sx}, SY: ${sy}, SZ: ${sz})`);
    drawObject();
});

document.getElementById('apply-shear').addEventListener('click', () => {
    if (!currentObject) {
        alert('Gere um objeto primeiro!');
        return;
    }

    const shXY = parseFloat(document.getElementById('sh-xy').value) || 0;
    const shXZ = parseFloat(document.getElementById('sh-xz').value) || 0;
    const shYZ = parseFloat(document.getElementById('sh-yz').value) || 0;

    const shearMatrix = Matrix3D.shear(shXY, shXZ, shYZ);
    objectVertices = objectVertices.map(vertex => {
        const transformed = Matrix3D.multiplyVector(shearMatrix, [...vertex, 1]);
        return [transformed[0], transformed[1], transformed[2]];
    });

    updateTransformationHistory(`Cisalhamento (XY: ${shXY}, XZ: ${shXZ}, YZ: ${shYZ})`);
    drawObject();
});

document.getElementById('apply-reflection').addEventListener('click', () => {
    if (!currentObject) {
        alert('Gere um objeto primeiro!');
        return;
    }

    const axis = document.getElementById('reflection-axis').value;
    const reflectionMatrix = Matrix3D.reflection(axis);

    objectVertices = objectVertices.map(vertex => {
        const transformed = Matrix3D.multiplyVector(reflectionMatrix, [...vertex, 1]);
        return [transformed[0], transformed[1], transformed[2]];
    });

    updateTransformationHistory(`Reflexão no plano ${axis.toUpperCase()}`);
    drawObject();
});


document.getElementById('apply-translation').addEventListener('click', () => {
    if (!currentObject) {
        alert('Gere um objeto primeiro!');
        return;
    }
    
    const tx = parseFloat(document.getElementById('tx').value) || 0;
    const ty = parseFloat(document.getElementById('ty').value) || 0;
    const tz = parseFloat(document.getElementById('tz').value) || 0;
    
    const translationMatrix = Matrix3D.translation(tx, ty, tz);
    objectVertices = objectVertices.map(vertex => {
        const transformed = Matrix3D.multiplyVector(translationMatrix, [...vertex, 1]);
        return [transformed[0], transformed[1], transformed[2]];
    });
    updateTransformationHistory(`Translação (TX: ${tx}, TY: ${ty}, TZ: ${tz})`);
    drawObject();
});

document.getElementById('apply-rotation').addEventListener('click', () => {
    if (!currentObject) {
        alert('Gere um objeto primeiro!');
        return;
    }
    
    const axis = document.getElementById('rotation-axis').value;
    const angle = parseFloat(document.getElementById('rotation-angle').value) || 0;
    
    switch (axis) {
        case 'x':
            objectRotationX += angle;
            document.getElementById('view-rot-x').value = objectRotationX;
            document.getElementById('view-rot-x-value').textContent = objectRotationX + '°';
            break;
        case 'y':
            objectRotationY += angle;
            document.getElementById('view-rot-y').value = objectRotationY;
            document.getElementById('view-rot-y-value').textContent = objectRotationY + '°';
            break;
        case 'z':
            objectRotationZ += angle;
            break;
    }
    
    updateTransformationHistory(`Rotação (Eixo: ${axis.toUpperCase()}, Ângulo: ${angle}°)`);
    drawObject();
});


// Funções para criar objetos 3D
function createCube(size) {
    const half = size / 2;
    const vertices = [
        [-half, -half, -half], [half, -half, -half],
        [half, half, -half], [-half, half, -half],
        [-half, -half, half], [half, -half, half],
        [half, half, half], [-half, half, half]
    ];

    const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0], // Face inferior
        [4, 5], [5, 6], [6, 7], [7, 4], // Face superior
        [0, 4], [1, 5], [2, 6], [3, 7]  // Arestas laterais
    ];

    return { vertices, edges };
}

function createPyramid(size) {
    const half = size / 2;
    const vertices = [
        [-half, -half, -half], [half, -half, -half],
        [half, -half, half], [-half, -half, half],
        [0, half, 0]  // Topo
    ];

    const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0], // Base
        [0, 4], [1, 4], [2, 4], [3, 4]   // Arestas para o topo
    ];

    return { vertices, edges };
}

function createPrism(size) {
    const half = size / 2;
    const smaller = size / 3;
    const vertices = [
        [-half, -half, -smaller], [half, -half, -smaller],
        [half, half, -smaller], [-half, half, -smaller],
        [-half, -half, smaller], [half, -half, smaller],
        [half, half, smaller], [-half, half, smaller]
    ];

    const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0], // Face inferior
        [4, 5], [5, 6], [6, 7], [7, 4], // Face superior
        [0, 4], [1, 5], [2, 6], [3, 7]  // Arestas laterais
    ];

    return { vertices, edges };
}

// Função de projeção 3D para 2D
function projectPoint(x, y, z, applyObjectRotation = true) {
    let point = [x, y, z, 1];
    
    if (applyObjectRotation) {
        const rotX = Matrix3D.rotationX(objectRotationX);
        const rotY = Matrix3D.rotationY(objectRotationY);
        const rotZ = Matrix3D.rotationZ(objectRotationZ);
        let transform = Matrix3D.multiply(rotY, rotX);
        transform = Matrix3D.multiply(rotZ, transform);
        point = Matrix3D.multiplyVector(transform, point);
    }
    
    const f = zoom / 100;
    const px = (point[0] - point[2]) * f * 0.7071 + canvas.width / 2;
    const py = (-point[1] + (point[0] + point[2]) * 0.5) * f * 0.7071 + canvas.height / 2;
    
    return { x: px, y: py };
}

// Função para desenhar eixos fixos
function drawFixedAxes() {
    const center = { x: canvas.width / 2, y: canvas.height / 2 };
    const length = 100 * (zoom / 100);
    
    // Eixo X (vermelho)
    const xEnd = projectPoint(length, 0, 0, false);
    drawLineDDA(center.x, center.y, xEnd.x, xEnd.y, 'red');
    
    // Eixo Y (verde)
    const yEnd = projectPoint(0, length, 0, false);
    drawLineDDA(center.x, center.y, yEnd.x, yEnd.y, 'green');
    
    // Eixo Z (azul)
    const zEnd = projectPoint(0, 0, length, false);
    drawLineDDA(center.x, center.y, zEnd.x, zEnd.y, 'blue');
    
    // Rótulos dos eixos
    ctx.font = '12px Arial';
    ctx.fillStyle = 'red';
    ctx.fillText('X', xEnd.x + 15, xEnd.y);
    ctx.fillStyle = 'green';
    ctx.fillText('Y', yEnd.x, yEnd.y - 15);
    ctx.fillStyle = 'blue';
    ctx.fillText('Z', zEnd.x - 15, zEnd.y);
}

// Função para desenhar os 8 octantes
function drawOctants() {
    // Define o tamanho dos octantes com base no tamanho do canvas
    const sizeX = canvas.width / 2;
    const sizeY = canvas.height / 2;
    const sizeZ = Math.min(sizeX, sizeY); // Para manter a proporção no eixo Z

    // Define os 8 vértices do cubo que representa os octantes
    const vertices = [
        projectPoint(sizeX, sizeY, sizeZ, false),      // Octante 1
        projectPoint(-sizeX, sizeY, sizeZ, false),     // Octante 2
        projectPoint(-sizeX, -sizeY, sizeZ, false),    // Octante 3
        projectPoint(sizeX, -sizeY, sizeZ, false),     // Octante 4
        projectPoint(sizeX, sizeY, -sizeZ, false),     // Octante 5
        projectPoint(-sizeX, sizeY, -sizeZ, false),    // Octante 6
        projectPoint(-sizeX, -sizeY, -sizeZ, false),   // Octante 7
        projectPoint(sizeX, -sizeY, -sizeZ, false)     // Octante 8
    ];

    // Arestas que conectam os vértices (formando um cubo)
    const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0], // Face frontal (octantes 1-4)
        [4, 5], [5, 6], [6, 7], [7, 4], // Face traseira (octantes 5-8)
        [0, 4], [1, 5], [2, 6], [3, 7]  // Arestas laterais
    ];

    // Desenha todas as arestas do cubo
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
    edges.forEach(edge => {
        const v1 = vertices[edge[0]];
        const v2 = vertices[edge[1]];
        drawLineDDA(v1.x, v1.y, v2.x, v2.y, 'rgba(100, 100, 100, 0.3)');
    });

    // Desenha rótulos dos octantes
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#333';

    // Posições dos rótulos dentro de cada octante
    const labelPositions = [
        projectPoint(sizeX / 2, sizeY / 2, sizeZ / 2, false),      // Octante 1
        projectPoint(-sizeX / 2, sizeY / 2, sizeZ / 2, false),     // Octante 2
        projectPoint(-sizeX / 2, -sizeY / 2, sizeZ / 2, false),    // Octante 3
        projectPoint(sizeX / 2, -sizeY / 2, sizeZ / 2, false),     // Octante 4
        projectPoint(sizeX / 2, sizeY / 2, -sizeZ / 2, false),     // Octante 5
        projectPoint(-sizeX / 2, sizeY / 2, -sizeZ / 2, false),    // Octante 6
        projectPoint(-sizeX / 2, -sizeY / 2, -sizeZ / 2, false),   // Octante 7
        projectPoint(sizeX / 2, -sizeY / 2, -sizeZ / 2, false)     // Octante 8
    ];

    // Desenha os números dos octantes
    labelPositions.forEach((pos, index) => {
        ctx.fillText((index + 1).toString(), pos.x - 5, pos.y + 5);
    });
}

// Função para desenhar o objeto 3D
function drawObject() {
    // Limpa o canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Desenha os eixos
    drawFixedAxes();

    if (!currentObject) return;

    // Desenha todas as arestas do objeto
    ctx.strokeStyle = '#111';
    for (const edge of objectEdges) {
        const v1 = objectVertices[edge[0]];
        const v2 = objectVertices[edge[1]];
        
        const p1 = projectPoint(v1[0], v1[1], v1[2]);
        const p2 = projectPoint(v2[0], v2[1], v2[2]);
        
        drawLineDDA(p1.x, p1.y, p2.x, p2.y, '#111');
    }

    // Desenha os vértices
    for (const vertex of objectVertices) {
        const p = projectPoint(vertex[0], vertex[1], vertex[2]);
        setPixel(p.x, p.y, '#222');
    }

    updateObjectInfo();
    drawOctants(); // Desenha os octantes
}

// Função para atualizar informações do objeto
function updateObjectInfo() {
    const verticesInfo = document.getElementById('vertices-info');
    const centerInfo = document.getElementById('center-info');
    const dimensionsInfo = document.getElementById('dimensions-info');
    const octantInfo = document.getElementById('octant-info');
    
    if (!currentObject) {
        verticesInfo.innerHTML = "Nenhum objeto gerado.";
        centerInfo.innerHTML = "Nenhum objeto gerado.";
        dimensionsInfo.innerHTML = "Nenhum objeto gerado.";
        octantInfo.innerHTML = "Nenhum objeto gerado.";
        return;
    }
    
    // Atualiza informações dos vértices
    let verticesHTML = '';
    objectVertices.forEach((vertex, index) => {
        verticesHTML += `<div class="vertex-info">V${index+1}: (${vertex[0].toFixed(1)}, ${vertex[1].toFixed(1)}, ${vertex[2].toFixed(1)})</div>`;
    });
    verticesInfo.innerHTML = verticesHTML;
    
    // Calcula centro geométrico
    let centerX = 0, centerY = 0, centerZ = 0;
    for (const vertex of objectVertices) {
        centerX += vertex[0];
        centerY += vertex[1];
        centerZ += vertex[2];
    }
    centerX /= objectVertices.length;
    centerY /= objectVertices.length;
    centerZ /= objectVertices.length;
    
    centerInfo.innerHTML = `(${centerX.toFixed(1)}, ${centerY.toFixed(1)}, ${centerZ.toFixed(1)})`;
    
    // Calcula dimensões
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    for (const vertex of objectVertices) {
        minX = Math.min(minX, vertex[0]);
        maxX = Math.max(maxX, vertex[0]);
        minY = Math.min(minY, vertex[1]);
        maxY = Math.max(maxY, vertex[1]);
        minZ = Math.min(minZ, vertex[2]);
        maxZ = Math.max(maxZ, vertex[2]);
    }
    
    dimensionsInfo.innerHTML = `Largura: ${(maxX-minX).toFixed(1)}<br>Altura: ${(maxY-minY).toFixed(1)}<br>Profundidade: ${(maxZ-minZ).toFixed(1)}`;
    
    // Determina octante predominante
    const octantCount = [0,0,0,0,0,0,0,0,0];
    objectVertices.forEach(vertex => {
        const x = vertex[0], y = vertex[1], z = vertex[2];
        let octant = 0;
        if (x >= 0 && y >= 0 && z >= 0) octant = 1;
        else if (x < 0 && y >= 0 && z >= 0) octant = 2;
        else if (x < 0 && y < 0 && z >= 0) octant = 3;
        else if (x >= 0 && y < 0 && z >= 0) octant = 4;
        else if (x >= 0 && y >= 0 && z < 0) octant = 5;
        else if (x < 0 && y >= 0 && z < 0) octant = 6;
        else if (x < 0 && y < 0 && z < 0) octant = 7;
        else if (x >= 0 && y < 0 && z < 0) octant = 8;
        octantCount[octant]++;
    });
    
    const predominantOctant = octantCount.indexOf(Math.max(...octantCount.slice(1)));
    octantInfo.innerHTML = predominantOctant > 0 ? `Octante ${predominantOctant}` : "Indeterminado";
}

// Atualiza o histórico de transformações
function updateTransformationHistory(transformation) {
    transformationHistory.push(transformation);
    const historyElement = document.getElementById('transformation-history');
    historyElement.innerHTML = transformationHistory.map((t, i) => `<div>${i + 1}. ${t}</div>`).join('');
}

// Event Listeners
document.getElementById('generate-object-btn').addEventListener('click', () => {
    const objectType = document.getElementById('object-type-select').value;
    const size = parseInt(document.getElementById('object-size').value) || 50;
    
    switch (objectType) {
        case 'cube':
            currentObject = createCube(size);
            break;
        case 'pyramid':
            currentObject = createPyramid(size);
            break;
        case 'prism':
            currentObject = createPrism(size);
            break;
    }
    
    objectRotationX = 0;
    objectRotationY = 0;
    objectRotationZ = 0;
    
    document.getElementById('view-rot-x').value = 0;
    document.getElementById('view-rot-y').value = 0;
    document.getElementById('view-rot-x-value').textContent = '0°';
    document.getElementById('view-rot-y-value').textContent = '0°';
    
    objectVertices = currentObject.vertices.map(v => [...v]);
    objectEdges = currentObject.edges;
    drawObject();
});

document.getElementById('view-rot-x').addEventListener('input', (e) => {
    objectRotationX = parseInt(e.target.value);
    document.getElementById('view-rot-x-value').textContent = objectRotationX + '°';
    drawObject();
});

document.getElementById('view-rot-y').addEventListener('input', (e) => {
    objectRotationY = parseInt(e.target.value);
    document.getElementById('view-rot-y-value').textContent = objectRotationY + '°';
    drawObject();
});

document.getElementById('view-zoom').addEventListener('input', (e) => {
    zoom = parseInt(e.target.value);
    document.getElementById('view-zoom-value').textContent = zoom + '%';
    drawObject();
});

//Alternar entre as transformaçoes
document.addEventListener("DOMContentLoaded", () => {
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");

    tabButtons.forEach(button => {
        button.addEventListener("click", () => {
            // Remove a classe 'active' de todos os botões e conteúdos
            tabButtons.forEach(btn => btn.classList.remove("active"));
            tabContents.forEach(content => content.classList.remove("active"));

            // Adiciona a classe 'active' ao botão e conteúdo clicado
            button.classList.add("active");
            const tabId = button.getAttribute("data-tab");
            document.getElementById(`${tabId}-tab`).classList.add("active");
        });
    });
});

//Botao Limpar
document.getElementById('clear-btn').addEventListener('click', () => {
    currentObject = null;
    objectVertices = [];
    objectEdges = [];
    objectRotationX = 0;
    objectRotationY = 0;
    objectRotationZ = 0;
    
    document.getElementById('view-rot-x').value = 0;
    document.getElementById('view-rot-y').value = 0;
    document.getElementById('view-rot-x-value').textContent = '0°';
    document.getElementById('view-rot-y-value').textContent = '0°';
    document.getElementById('view-zoom').value = 100;
    document.getElementById('view-zoom-value').textContent = '100%';
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawFixedAxes();
    updateObjectInfo();
    transformationHistory = [];
    document.getElementById('transformation-history').innerHTML = "Nenhuma transformação aplicada.";
});

// Navegação - Voltar ao Início
document.getElementById('back').addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = this.getAttribute('href');
});

// Inicialização
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, canvas.width, canvas.height);
drawFixedAxes(); 
drawOctants();
updateObjectInfo();