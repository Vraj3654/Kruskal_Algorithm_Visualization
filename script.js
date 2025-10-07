// --- DATA STRUCTURES (JavaScript version of the Java classes) ---

// Disjoint Set Union (DSU) or Union-Find data structure
class DisjointSet {
    constructor(n) {
        this.parent = Array.from({ length: n }, (_, i) => i);
        this.rank = Array(n).fill(0);
    }

    find(i) {
        if (this.parent[i] === i) {
            return i;
        }
        // Path compression for optimization
        this.parent[i] = this.find(this.parent[i]);
        return this.parent[i];
    }

    union(x, y) {
        const rootX = this.find(x);
        const rootY = this.find(y);
        if (rootX !== rootY) {
            // Union by rank for optimization
            if (this.rank[rootX] > this.rank[rootY]) {
                this.parent[rootY] = rootX;
            } else if (this.rank[rootX] < this.rank[rootY]) {
                this.parent[rootX] = rootY;
            } else {
                this.parent[rootY] = rootX;
                this.rank[rootX]++;
            }
            return true; // Union was successful
        }
        return false; // x and y were already in the same set
    }
}

// --- CORE ALGORITHM ---

function kruskalMST(V, allEdges) {
    const resultMST = [];
    // Sort edges by weight in ascending order
    allEdges.sort((a, b) => a.weight - b.weight);
    
    const dsu = new DisjointSet(V);
    let totalCost = 0;

    for (const edge of allEdges) {
        if (resultMST.length === V - 1) break;
        
        const { source, destination, weight } = edge;
        if (dsu.union(source, destination)) {
            resultMST.push(edge);
            totalCost += weight;
        }
    }
    
    return { mst: resultMST, cost: totalCost };
}

// --- VISUALIZATION LOGIC ---

const canvas = document.getElementById('graph-canvas');
const ctx = canvas.getContext('2d');
let nodePositions = [];

function drawGraph(V, allEdges, mstEdges = []) {
    const container = canvas.parentElement;
    const size = container.clientWidth;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (V === 0) return;

    nodePositions = [];
    const radius = size * 0.4;
    const center = { x: size / 2, y: size / 2 };

    // Calculate node positions in a circle
    for (let i = 0; i < V; i++) {
        const angle = (i / V) * 2 * Math.PI - (Math.PI / 2); // Start from top
        nodePositions.push({
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle)
        });
    }

    // 1. Draw all non-MST edges in a faint color
    allEdges.forEach(edge => {
        const pos1 = nodePositions[edge.source];
        const pos2 = nodePositions[edge.destination];
        if (!pos1 || !pos2) return;
        
        ctx.beginPath();
        ctx.moveTo(pos1.x, pos1.y);
        ctx.lineTo(pos2.x, pos2.y);
        ctx.strokeStyle = 'rgba(107, 114, 128, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

         // Draw weight text
         ctx.fillStyle = 'rgba(156, 163, 175, 0.8)';
         ctx.font = '12px Inter';
         ctx.textAlign = 'center';
         ctx.textBaseline = 'middle';
         ctx.fillText(edge.weight, (pos1.x + pos2.x) / 2, (pos1.y + pos2.y) / 2 - 8);
    });

    // 2. Draw MST edges in a bright color on top
    mstEdges.forEach(edge => {
        const pos1 = nodePositions[edge.source];
        const pos2 = nodePositions[edge.destination];
         if (!pos1 || !pos2) return;

        ctx.beginPath();
        ctx.moveTo(pos1.x, pos1.y);
        ctx.lineTo(pos2.x, pos2.y);
        ctx.strokeStyle = '#2dd4bf'; // teal-400
        ctx.lineWidth = 4;
        ctx.stroke();
    });
    
    // 3. Draw nodes on top of all lines
    nodePositions.forEach((pos, i) => {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 15, 0, 2 * Math.PI);
        ctx.fillStyle = '#111827'; // gray-900
        ctx.fill();
        ctx.strokeStyle = '#2dd4bf';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i, pos.x, pos.y);
    });
}

// --- DOM MANIPULATION & EVENT LISTENERS ---

const setupBtn = document.getElementById('setup-btn');
const edgeInputsContainer = document.getElementById('edge-inputs-container');

setupBtn.addEventListener('click', () => {
    const V = parseInt(document.getElementById('vertices').value);
    const E = parseInt(document.getElementById('edges').value);

    if (isNaN(V) || V <= 0 || isNaN(E) || E < 0) {
        alert('Please enter a valid, positive number for vertices and a non-negative number for edges.');
        return;
    }

    edgeInputsContainer.innerHTML = '';
    
    let inputsHTML = `<h3 class="text-xl font-semibold my-4 border-t border-gray-700 pt-4">Connection Details</h3>`;
    inputsHTML += `<p class="text-xs text-gray-500 mb-2">Vertex numbers must be from 0 to ${V - 1}</p>`;

    for (let i = 0; i < E; i++) {
        inputsHTML += `
            <div class="grid grid-cols-3 gap-2 mb-2 items-center">
                <input type="number" class="edge-source input-field" placeholder="Src" title="Source" min="0" max="${V-1}">
                <input type="number" class="edge-dest input-field" placeholder="Dest" title="Destination" min="0" max="${V-1}">
                <input type="number" class="edge-weight input-field" placeholder="Cost" title="Weight" min="0">
            </div>`;
    }
    
    if (E > 0) {
        inputsHTML += '<button id="calculate-btn" class="btn mt-4">Calculate MST</button>';
    }
    edgeInputsContainer.innerHTML = inputsHTML;
    
    drawGraph(V, []);

    const calculateBtn = document.getElementById('calculate-btn');
    if(calculateBtn) {
         calculateBtn.addEventListener('click', calculateAndDisplayMST);
    }
});

function calculateAndDisplayMST() {
    const V = parseInt(document.getElementById('vertices').value);
    const allEdges = [];
    let hasError = false;

    const sourceInputs = document.querySelectorAll('.edge-source');
    const destInputs = document.querySelectorAll('.edge-dest');
    const weightInputs = document.querySelectorAll('.edge-weight');

    for(let i = 0; i < sourceInputs.length; i++) {
        const source = parseInt(sourceInputs[i].value);
        const destination = parseInt(destInputs[i].value);
        const weight = parseInt(weightInputs[i].value);

        if (isNaN(source) || isNaN(destination) || isNaN(weight) || source < 0 || source >= V || destination < 0 || destination >= V) {
            alert(`Invalid input for edge ${i + 1}. Please ensure vertex numbers are between 0 and ${V - 1}.`);
            hasError = true;
            break;
        }
        allEdges.push({ source, destination, weight });
    }

    if (hasError) return;

    const { mst, cost } = kruskalMST(V, allEdges);

    document.getElementById('initial-message').classList.add('hidden');
    document.getElementById('cost-container').classList.remove('hidden');
    document.getElementById('total-cost').textContent = cost;

    const mstEdgesList = document.getElementById('mst-edges');
    mstEdgesList.innerHTML = '';
    mst.forEach(edge => {
        const li = document.createElement('li');
        li.className = 'text-gray-300 bg-gray-700/50 p-2 rounded-md';
        li.textContent = `Server ${edge.source} <--> Server ${edge.destination} (Cost: ${edge.weight})`;
        mstEdgesList.appendChild(li);
    });

     if (mst.length < V - 1 && V > 1) {
        const li = document.createElement('li');
        li.className = 'text-yellow-400 mt-2';
        li.textContent = 'Note: A full spanning tree could not be formed. The graph may not be connected.';
        mstEdgesList.appendChild(li);
    }

    drawGraph(V, allEdges, mst);
}

window.addEventListener('resize', () => {
    const V = parseInt(document.getElementById('vertices').value) || 0;
    if (V > 0) {
        const calculateBtn = document.getElementById('calculate-btn');
        if (calculateBtn && document.querySelectorAll('.edge-source')[0].value !== '') {
            calculateAndDisplayMST();
        } else {
            drawGraph(V, []);
        }
    }
});

