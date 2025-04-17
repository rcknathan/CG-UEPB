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

    static identity() {
        return [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ];
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
}

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

// Função para projetar um ponto 3D em 2D
function projectPoint(x, y, z, applyObjectRotation = true) {
    // Aplicar rotação do objeto se necessário
    let point = [x, y, z, 1];
    
    if (applyObjectRotation) {
        const rotX = Matrix3D.rotationX(objectRotationX);
        const rotY = Matrix3D.rotationY(objectRotationY);
        const rotZ = Matrix3D.rotationZ(objectRotationZ);
        let transform = Matrix3D.multiply(rotY, rotX);
        transform = Matrix3D.multiply(rotZ, transform);
        point = Matrix3D.multiplyVector(transform, point);
    }
    
    // Projeção isométrica fixa para visualização
    const f = zoom / 100;
    const px = (point[0] - point[2]) * f * 0.7071 + canvas.width / 2;
    const py = (-point[1] + (point[0] + point[2]) * 0.5) * f * 0.7071 + canvas.height / 2;
    
    return { x: px, y: py };
}

// Função para desenhar eixos fixos
function drawFixedAxes() {
    const center = { x: canvas.width / 2, y: canvas.height / 2 };
    const length = 100 * (zoom / 100);
    
    // Eixo X (vermelho) - não aplica rotação do objeto
    const xEnd = projectPoint(length, 0, 0, false);
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(xEnd.x, xEnd.y);
    ctx.stroke();
    
    // Eixo Y (verde) - não aplica rotação do objeto
    const yEnd = projectPoint(0, length, 0, false);
    ctx.strokeStyle = 'green';
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(yEnd.x, yEnd.y);
    ctx.stroke();
    
    // Eixo Z (azul) - não aplica rotação do objeto
    const zEnd = projectPoint(0, 0, length, false);
    ctx.strokeStyle = 'blue';
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(zEnd.x, zEnd.y);
    ctx.stroke();
    
    // Rótulos dos eixos
    ctx.font = '12px Arial';
    ctx.fillStyle = 'red';
    ctx.fillText('X', xEnd.x + 15, xEnd.y);
    ctx.fillStyle = 'green';
    ctx.fillText('Y', yEnd.x, yEnd.y - 15);
    ctx.fillStyle = 'blue';
    ctx.fillText('Z', zEnd.x - 15, zEnd.y);
}

// Função para desenhar os octantes
function drawOctants() {
    const center = { x: canvas.width / 2, y: canvas.height / 2 };
    const size = 100 * (zoom / 100);
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1.8;
    
    // Pontos dos vértices do cubo de octantes
    const points = [
        projectPoint(size, size, size, false),
        projectPoint(-size, size, size, false),
        projectPoint(-size, -size, size, false),
        projectPoint(size, -size, size, false),
        projectPoint(size, size, -size, false),
        projectPoint(-size, size, -size, false),
        projectPoint(-size, -size, -size, false),
        projectPoint(size, -size, -size, false)
    ];
    
    // Arestas do cubo que representa os octantes
    const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0], // Face frontal
        [4, 5], [5, 6], [6, 7], [7, 4], // Face traseira
        [0, 4], [1, 5], [2, 6], [3, 7]  // Arestas laterais
    ];
    
    for (const edge of edges) {
        const p1 = points[edge[0]];
        const p2 = points[edge[1]];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }
    
    // Rótulos dos octantes
    ctx.font = '10px Arial';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    
    const octantPositions = [
        { x: size/2, y: size/2, z: size/2, label: '1' },
        { x: -size/2, y: size/2, z: size/2, label: '2' },
        { x: -size/2, y: -size/2, z: size/2, label: '3' },
        { x: size/2, y: -size/2, z: size/2, label: '4' },
        { x: size/2, y: size/2, z: -size/2, label: '5' },
        { x: -size/2, y: size/2, z: -size/2, label: '6' },
        { x: -size/2, y: -size/2, z: -size/2, label: '7' },
        { x: size/2, y: -size/2, z: -size/2, label: '8' }
    ];
    
    for (const octant of octantPositions) {
        const p = projectPoint(octant.x, octant.y, octant.z, false);
        ctx.fillText(octant.label, p.x, p.y);
    }
}

// Função para determinar o octante de um ponto
function getOctant(x, y, z) {
    if (x >= 0 && y >= 0 && z >= 0) return 1;
    if (x < 0 && y >= 0 && z >= 0) return 2;
    if (x < 0 && y < 0 && z >= 0) return 3;
    if (x >= 0 && y < 0 && z >= 0) return 4;
    if (x >= 0 && y >= 0 && z < 0) return 5;
    if (x < 0 && y >= 0 && z < 0) return 6;
    if (x < 0 && y < 0 && z < 0) return 7;
    if (x >= 0 && y < 0 && z < 0) return 8;
    return 0;
}

// Função para determinar o octante predominante do objeto
function getObjectOctant() {
    if (objectVertices.length === 0) return null;
    
    const octantCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    
    for (const vertex of objectVertices) {
        const octant = getOctant(vertex[0], vertex[1], vertex[2]);
        octantCounts[octant]++;
    }
    
    // Encontrar o octante com mais vértices
    let maxCount = 0;
    let predominantOctant = 0;
    
    for (let i = 1; i <= 8; i++) {
        if (octantCounts[i] > maxCount) {
            maxCount = octantCounts[i];
            predominantOctant = i;
        }
    }
    
    return predominantOctant;
}

// Função para atualizar informações do objeto na sidebar
function updateObjectInfo() {
    const verticesInfo = document.getElementById('vertices-info');
    const centerInfo = document.getElementById('center-info');
    const dimensionsInfo = document.getElementById('dimensions-info');
    const octantInfo = document.getElementById('octant-info');
    
    if (objectVertices.length === 0) {
        verticesInfo.innerHTML = "Nenhum objeto gerado.";
        centerInfo.innerHTML = "Nenhum objeto gerado.";
        dimensionsInfo.innerHTML = "Nenhum objeto gerado.";
        octantInfo.innerHTML = "Nenhum objeto gerado.";
        return;
    }
    
    // Informações dos vértices
    let verticesHTML = '';
    objectVertices.forEach((vertex, index) => {
        verticesHTML += `<div class="vertex-info">V${index+1}: (${vertex[0].toFixed(1)}, ${vertex[1].toFixed(1)}, ${vertex[2].toFixed(1)})</div>`;
    });
    verticesInfo.innerHTML = verticesHTML;
    
    // Centro geométrico
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
    
    // Dimensões
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
    
    const width = (maxX - minX).toFixed(1);
    const height = (maxY - minY).toFixed(1);
    const depth = (maxZ - minZ).toFixed(1);
    
    dimensionsInfo.innerHTML = `Largura: ${width}<br>Altura: ${height}<br>Profundidade: ${depth}`;
    
    // Octante predominante
    const octant = getObjectOctant();
    octantInfo.innerHTML = octant ? `Octante ${octant}` : "Indeterminado";
}

// Função para desenhar o objeto
function drawObject() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fundo branco para melhor contraste
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar eixos fixos e octantes primeiro (mais claros)
    drawOctants(); // Octantes em cinza claro
    drawFixedAxes(); // Eixos coloridos

    if (!currentObject) return;

    // Configurações para as arestas do objeto
    ctx.strokeStyle = '#111'; // Cinza muito escuro (quase preto)
    ctx.lineWidth = 2.5; // Linha um pouco mais grossa
    ctx.lineCap = 'round'; // Pontas arredondadas para melhor visualização

    // Desenhar arestas (aplicando rotação do objeto)
    for (const edge of objectEdges) {
        const v1 = objectVertices[edge[0]];
        const v2 = objectVertices[edge[1]];
        
        const p1 = projectPoint(v1[0], v1[1], v1[2]);
        const p2 = projectPoint(v2[0], v2[1], v2[2]);
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }

    // Configurações para os vértices
    ctx.fillStyle = '#222'; // Cinza escuro para os vértices
    const vertexSize = 3.5; // Tamanho um pouco maior

    // Desenhar vértices (aplicando rotação do objeto)
    for (const vertex of objectVertices) {
        const p = projectPoint(vertex[0], vertex[1], vertex[2]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, vertexSize, 0, Math.PI * 2);
        ctx.fill();
    }

    updateObjectInfo();
}

// Aplicar transformação aos vértices
function applyTransformation(matrix) {
    objectVertices = objectVertices.map(vertex => {
        const transformed = Matrix3D.multiplyVector(matrix, [...vertex, 1]);
        return [transformed[0], transformed[1], transformed[2]];
    });
    drawObject();
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
    
    // Resetar rotações ao gerar novo objeto
    objectRotationX = 0;
    objectRotationY = 0;
    objectRotationZ = 0;
    
    // Resetar controles deslizantes
    document.getElementById('view-rot-x').value = 0;
    document.getElementById('view-rot-y').value = 0;
    document.getElementById('view-rot-x-value').textContent = '0°';
    document.getElementById('view-rot-y-value').textContent = '0°';
    
    objectVertices = currentObject.vertices.map(v => [...v]);
    objectEdges = currentObject.edges;
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
    applyTransformation(translationMatrix);
});

document.getElementById('apply-rotation').addEventListener('click', () => {
    if (!currentObject) {
        alert('Gere um objeto primeiro!');
        return;
    }
    
    const axis = document.getElementById('rotation-axis').value;
    const angle = parseFloat(document.getElementById('rotation-angle').value) || 0;
    
    // Aplicar rotação incremental ao objeto
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
    
    // Redesenhar o objeto com as novas rotações
    drawObject();
});

document.getElementById('apply-scale').addEventListener('click', () => {
    if (!currentObject) {
        alert('Gere um objeto primeiro!');
        return;
    }
    
    const sx = parseFloat(document.getElementById('sx').value) || 1;
    const sy = parseFloat(document.getElementById('sy').value) || 1;
    const sz = parseFloat(document.getElementById('sz').value) || 1;
    
    const scalingMatrix = Matrix3D.scaling(sx, sy, sz);
    applyTransformation(scalingMatrix);
});

// Controles de rotação do objeto
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

// Controle de abas
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons and contents
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        const tabId = button.getAttribute('data-tab') + '-tab';
        document.getElementById(tabId).classList.add('active');
    });
});

// Botão limpar
document.getElementById('clear-btn').addEventListener('click', () => {
    currentObject = null;
    objectVertices = [];
    objectEdges = [];
    objectRotationX = 0;
    objectRotationY = 0;
    objectRotationZ = 0;
    
    // Resetar controles
    document.getElementById('view-rot-x').value = 0;
    document.getElementById('view-rot-y').value = 0;
    document.getElementById('view-rot-x-value').textContent = '0°';
    document.getElementById('view-rot-y-value').textContent = '0°';
    document.getElementById('view-zoom').value = 100;
    document.getElementById('view-zoom-value').textContent = '100%';
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFixedAxes();
    drawOctants();
    updateObjectInfo();
});

// Inicialização
drawFixedAxes();
drawOctants();
updateObjectInfo();