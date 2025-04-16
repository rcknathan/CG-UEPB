// Configuração do canvas
const canvas = document.getElementById('canvas3d');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 600;

// Variáveis de estado
let currentObject = null;
let objectVertices = [];
let objectEdges = [];
let viewRotationX = 30;
let viewRotationY = 30;
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
function projectPoint(x, y, z) {
    // Aplicar rotação da visualização
    let rotX = Matrix3D.rotationX(viewRotationX);
    let rotY = Matrix3D.rotationY(viewRotationY);
    let transform = Matrix3D.multiply(rotY, rotX);
    
    // Aplicar transformação ao ponto
    let point = Matrix3D.multiplyVector(transform, [x, y, z, 1]);
    
    // Projeção perspectiva simples
    const distance = 500;
    const f = zoom / 100;
    const zFactor = distance / (distance - point[2]);
    
    const px = point[0] * zFactor * f + canvas.width / 2;
    const py = -point[1] * zFactor * f + canvas.height / 2;
    
    return { x: px, y: py };
}

// Função para desenhar eixos
function drawAxes() {
    const center = { x: canvas.width / 2, y: canvas.height / 2 };
    const length = 100;
    
    // Eixo X (vermelho)
    const xEnd = projectPoint(length, 0, 0);
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(xEnd.x, xEnd.y);
    ctx.stroke();
    
    // Eixo Y (verde)
    const yEnd = projectPoint(0, length, 0);
    ctx.strokeStyle = 'green';
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(yEnd.x, yEnd.y);
    ctx.stroke();
    
    // Eixo Z (azul)
    const zEnd = projectPoint(0, 0, length);
    ctx.strokeStyle = 'blue';
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(zEnd.x, zEnd.y);
    ctx.stroke();
}

// Função para desenhar o objeto
function drawObject() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

    // Desenhar eixos
    drawAxes();

    if (!currentObject) return;

    // Desenhar arestas
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

    // Desenhar vértices
    for (const vertex of objectVertices) {
        const p = projectPoint(vertex[0], vertex[1], vertex[2]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    updateVerticesInfo();
}

// Atualizar informações dos vértices na sidebar
function updateVerticesInfo() {
    const verticesInfo = document.getElementById('vertices-info');
    verticesInfo.innerHTML = '';
    
    objectVertices.forEach((vertex, index) => {
        const vertexElement = document.createElement('div');
        vertexElement.className = 'vertex-info';
        vertexElement.textContent = `V${index}: (${vertex[0].toFixed(1)}, ${vertex[1].toFixed(1)}, ${vertex[2].toFixed(1)})`;
        verticesInfo.appendChild(vertexElement);
    });
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
    
    let rotationMatrix;
    switch (axis) {
        case 'x':
            rotationMatrix = Matrix3D.rotationX(angle);
            break;
        case 'y':
            rotationMatrix = Matrix3D.rotationY(angle);
            break;
        case 'z':
            rotationMatrix = Matrix3D.rotationZ(angle);
            break;
    }
    
    applyTransformation(rotationMatrix);
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

document.getElementById('clear-btn').addEventListener('click', () => {
    currentObject = null;
    objectVertices = [];
    objectEdges = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAxes();
    document.getElementById('vertices-info').innerHTML = '';
});

// Controles de visualização
document.getElementById('view-rot-x').addEventListener('input', (e) => {
    viewRotationX = parseInt(e.target.value);
    document.getElementById('view-rot-x-value').textContent = viewRotationX + '°';
    drawObject();
});

document.getElementById('view-rot-y').addEventListener('input', (e) => {
    viewRotationY = parseInt(e.target.value);
    document.getElementById('view-rot-y-value').textContent = viewRotationY + '°';
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

// Inicialização
drawAxes();