let isAIPlaying = false;
let chartInstance = null;

function countSolutions(board, limit = 2) {
    let grid = board.map(r => [...r]);
    let count = 0;
    function isSafe(r, c, num) {
        for (let x = 0; x < 9; x++) if (grid[r][x] === num || grid[x][c] === num) return false;
        let sr = Math.floor(r/3)*3, sc = Math.floor(c/3)*3;
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (grid[sr+i][sc+j] === num) return false;
        return true;
    }
    function dfs() {
        if (count >= limit) return;
        let bestR = -1, bestC = -1, minCount = 10;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (grid[r][c] === 0) {
                    let cnt = 0;
                    for (let num = 1; num <= 9; num++) if (isSafe(r, c, num)) cnt++;
                    if (cnt < minCount) { minCount = cnt; bestR = r; bestC = c; if (cnt === 0) return; }
                }
            }
        }
        if (bestR === -1) { count++; return; }
        for (let num = 1; num <= 9; num++) {
            if (isSafe(bestR, bestC, num)) {
                grid[bestR][bestC] = num;
                dfs();
                grid[bestR][bestC] = 0;
            }
        }
    }
    dfs();
    return count;
}

function generateSudoku() {
    let grid = Array(9).fill(0).map(() => Array(9).fill(0));
    function isSafe(r, c, num) {
        for (let x = 0; x < 9; x++) if (grid[r][x] === num || grid[x][c] === num) return false;
        let sr = Math.floor(r/3)*3, sc = Math.floor(c/3)*3;
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (grid[sr+i][sc+j] === num) return false;
        return true;
    }
    function fillGrid(pos) {
        if (pos === 81) return true;
        let r = Math.floor(pos/9), c = pos%9;
        let nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
        for (let num of nums) {
            if (isSafe(r, c, num)) {
                grid[r][c] = num;
                if (fillGrid(pos+1)) return true;
                grid[r][c] = 0;
            }
        }
        return false;
    }
    fillGrid(0);

    let level = document.getElementById('difficulty-select').value;
    let clues = 45; if (level === "3") clues = 35; if (level === "4") clues = 28; if (level === "5") clues = 21;
    let cellsToClear = 81 - clues;
    let positions = Array.from({length: 81}, (_, i) => i).sort(() => Math.random() - 0.5);
    
    let puzzle = grid.map(row => [...row]);
    let cleared = 0;
    
    for (let i = 0; i < positions.length && cleared < cellsToClear; i++) {
        let pos = positions[i];
        let r = Math.floor(pos/9), c = pos%9;
        let backup = puzzle[r][c];
        puzzle[r][c] = 0;
        if (countSolutions(puzzle, 2) !== 1) {
            puzzle[r][c] = backup;
        } else {
            cleared++;
        }
    }
    return puzzle;
}

const TIMEOUT_MS = 5000;

function solveSudokuFast(board) {
    let grid = board.map(r => [...r]);
    let solved = false;
    function isSafe(r, c, num) {
        for (let x = 0; x < 9; x++) if (grid[r][x] === num || grid[x][c] === num) return false;
        let sr = Math.floor(r/3)*3, sc = Math.floor(c/3)*3;
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (grid[sr+i][sc+j] === num) return false;
        return true;
    }
    function dfs() {
        let bestR = -1, bestC = -1, minCount = 10;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (grid[r][c] === 0) {
                    let count = 0;
                    for (let num = 1; num <= 9; num++) if (isSafe(r, c, num)) count++;
                    if (count < minCount) { minCount = count; bestR = r; bestC = c; if (count === 1) break; }
                }
            }
        }
        if (bestR === -1) { solved = true; return true; }
        for (let num = 1; num <= 9; num++) {
            if (isSafe(bestR, bestC, num)) {
                grid[bestR][bestC] = num;
                if (dfs()) return true;
                grid[bestR][bestC] = 0;
            }
        }
        return false;
    }
    dfs();
    return { solved, grid: solved ? grid : null }; 
}

function solveBaseline(board) {
    let start = performance.now();
    let grid = board.map(r => [...r]);
    let nodes = 0;
    let solved = false;
    let timedOut = false;
    function isSafe(r, c, num) {
        for (let x = 0; x < 9; x++) if (grid[r][x] === num || grid[x][c] === num) return false;
        let sr = Math.floor(r/3)*3, sc = Math.floor(c/3)*3;
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (grid[sr+i][sc+j] === num) return false;
        return true;
    }
    function dfs(pos) {
        if (performance.now() - start > TIMEOUT_MS) { timedOut = true; return false; }
        if (pos === 81) { solved = true; return true; }
        let r = Math.floor(pos/9), c = pos%9;
        if (grid[r][c] !== 0) return dfs(pos+1);
        for (let num = 1; num <= 9; num++) {
            if (isSafe(r, c, num)) {
                nodes++; grid[r][c] = num;
                if (dfs(pos+1)) return true;
                grid[r][c] = 0;
            }
        }
        return false;
    }
    dfs(0);
    return { solved, timedOut, grid: solved ? grid : null, nodes, time: performance.now() - start };
}

function solveMRVScan(board) {
    let start = performance.now();
    let grid = board.map(r => [...r]);
    let nodes = 0;
    let solved = false;
    let timedOut = false;
    function isSafe(r, c, num) {
        for (let x = 0; x < 9; x++) if (grid[r][x] === num || grid[x][c] === num) return false;
        let sr = Math.floor(r/3)*3, sc = Math.floor(c/3)*3;
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (grid[sr+i][sc+j] === num) return false;
        return true;
    }
    function findBestSpot() {
        let bestR = -1, bestC = -1, minCount = 10;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (grid[r][c] === 0) {
                    let count = 0;
                    for (let num = 1; num <= 9; num++) if (isSafe(r, c, num)) count++;
                    if (count < minCount) { minCount = count; bestR = r; bestC = c; if (count === 1) break; }
                }
            }
        }
        return { bestR, bestC };
    }
    function dfs() {
        if (performance.now() - start > TIMEOUT_MS) { timedOut = true; return false; }
        let { bestR, bestC } = findBestSpot();
        if (bestR === -1) { solved = true; return true; }
        for (let num = 1; num <= 9; num++) {
            if (isSafe(bestR, bestC, num)) {
                nodes++; grid[bestR][bestC] = num;
                if (dfs()) return true;
                grid[bestR][bestC] = 0;
            }
        }
        return false;
    }
    dfs();
    return { solved, timedOut, grid: solved ? grid : null, nodes, time: performance.now() - start };
}

async function solveCSP(board, isVisual = false, boardId = 'sudoku-board-main') {
    let start = performance.now();
    let grid = board.map(r => [...r]);
    let nodes = 0;
    let visualDelay = 0; 
    let solved = false;
    let timedOut = false;
    const FULL = 0b111111111;
    let rows = [0,0,0,0,0,0,0,0,0], cols = [0,0,0,0,0,0,0,0,0], boxes = [0,0,0,0,0,0,0,0,0];

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            let val = grid[r][c];
            if (val) {
                let bit = 1 << (val - 1);
                let b = Math.floor(r/3)*3 + Math.floor(c/3);
                rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
            }
        }
    }

    async function dfs() {
        if (performance.now() - start > TIMEOUT_MS) { timedOut = true; return false; }
        let bestR = -1, bestC = -1, minCount = 10, bestBit = 0;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (grid[r][c] === 0) {
                    let b = Math.floor(r/3)*3 + Math.floor(c/3);
                    let avail = FULL & ~(rows[r] | cols[c] | boxes[b]);
                    let count = 0, temp = avail;
                    while(temp) { count++; temp &= (temp - 1); }
                    if (count < minCount) { minCount = count; bestR = r; bestC = c; bestBit = avail; if (count === 1) break; }
                }
            }
        }
        if (bestR === -1) { solved = true; return true; }
        let b = Math.floor(bestR/3)*3 + Math.floor(bestC/3);
        let avail = bestBit;
        while (avail) {
            let bit = avail & -avail;
            avail ^= bit;
            nodes++;
            if (isVisual) {
                let inp = document.getElementById(`${boardId}-cell-${bestR}-${bestC}`);
                if (inp) { 
                    inp.value = bit.toString(2).length; 
                    let t = performance.now();
                    await new Promise(r => setTimeout(r, 10)); 
                    visualDelay += (performance.now() - t);
                }
            }
            grid[bestR][bestC] = bit.toString(2).length;
            rows[bestR] |= bit; cols[bestC] |= bit; boxes[b] |= bit;
            if (await dfs()) return true;
            grid[bestR][bestC] = 0; rows[bestR] &= ~bit; cols[bestC] &= ~bit; boxes[b] &= ~bit;
        }
        return false;
    }
    await dfs();
    let realTime = (performance.now() - start) - visualDelay; 
    return { solved, timedOut, grid: solved ? grid : null, nodes, time: realTime };
}

function printAILog(message, typeClass) {
    let logBox = document.getElementById('ai-log-box');
    if (!logBox) return;
    let p = document.createElement('div');
    p.innerHTML = `<span class="${typeClass}">> ${message}</span>`;
    logBox.appendChild(p);
    logBox.scrollTop = logBox.scrollHeight;
}

function drawComparisonChart(timeBaseline, timeMRV, timeCSP) {
    const ctx = document.getElementById('convergenceChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Thời gian giải TB (ms)'],
            datasets: [
                { label: 'Baseline (Naive)', data: [timeBaseline], backgroundColor: 'rgba(248, 113, 113, 0.8)', borderColor: '#f87171', borderWidth: 1 },
                { label: 'MRV Scan', data: [timeMRV], backgroundColor: 'rgba(250, 204, 21, 0.8)', borderColor: '#facc15', borderWidth: 1 },
                { label: 'CSP Tối ưu', data: [timeCSP], backgroundColor: 'rgba(52, 211, 153, 0.8)', borderColor: '#34d399', borderWidth: 1 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'So sánh thời gian giải', color: 'white' }, legend: { labels: { color: 'white' } } }, scales: { y: { beginAtZero: true, type: 'logarithmic', ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } }, x: { ticks: { color: 'white' }, grid: { display: false } } } }
    });
}

async function runBenchmark() {
    if (isAIPlaying) return;
    isAIPlaying = true;
    
    let logBox = document.getElementById('ai-log-box');
    if(logBox) logBox.innerHTML = '';
    
    let runs = parseInt(document.getElementById('benchmark-runs').value) || 12;
    printAILog(`=== BẮT ĐẦU BENCHMARK (${runs} LẦN) ===`, "log-info");
    
    let board = [];
    let hasData = false;
    for (let r = 0; r < 9; r++) {
        let row = [];
        for (let c = 0; c < 9; c++) {
            let v = document.getElementById(`sudoku-board-main-cell-${r}-${c}`).value;
            if (v) hasData = true;
            row.push(v ? parseInt(v) : 0);
        }
        board.push(row);
    }
    
    if (!hasData) {
        alert("Bàn cờ đang trống! Vui lòng bấm 'GAME MỚI' hoặc tự nhập đề bài trước khi Benchmark.");
        isAIPlaying = false;
        return;
    }
    
    let test = solveSudokuFast(board);
    if (!test.solved) { 
        alert("Đề bài nhập vào không có nghiệm hoặc vi phạm luật Sudoku!");
        isAIPlaying = false;
        return;
    }

    let sumN = 0, sumM = 0, sumC = 0;
    let runDetails = [];

    for (let i = 1; i <= runs; i++) {
        await new Promise(r => setTimeout(r, 50)); 
        
        let resN = solveBaseline(board); 
        let resM = solveMRVScan(board);
        let resC = await solveCSP(board, false, 'sudoku-board-compare'); 
        
        sumN += resN.time; sumM += resM.time; sumC += resC.time;
        
        runDetails.push({ run: i, timeN: resN.time, timeM: resM.time, timeC: resC.time, nodesN: resN.nodes, nodesM: resM.nodes, nodesC: resC.nodes });

        printAILog(`Lần ${i}/${runs}: Base ${resN.time.toFixed(1)}ms | MRV ${resM.time.toFixed(1)}ms | CSP ${resC.time.toFixed(1)}ms`, "log-try");
    }
    
    let meanN = sumN / runs, meanM = sumM / runs, meanC = sumC / runs;
    
    printAILog(`✅ XONG!`, "log-success");
    drawComparisonChart(meanN, meanM, meanC);
    
    if(typeof saveBenchmarkToHistory === 'function') {
        let diffValue = document.getElementById('difficulty-select').value;
        saveBenchmarkToHistory(runDetails, meanN, meanM, meanC, diffValue, board);
    }

    isAIPlaying = false;
}