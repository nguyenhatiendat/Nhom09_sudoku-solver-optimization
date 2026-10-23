document.getElementById('btn-start').addEventListener('click', () => { document.getElementById('welcome-screen').classList.add('hidden'); });
document.getElementById('btn-toggle-history').addEventListener('click', () => { document.getElementById('left-sidebar').classList.toggle('hidden'); });
document.getElementById('btn-toggle-tools').addEventListener('click', () => { const toolsSidebar = document.getElementById('right-sidebar'); toolsSidebar.classList.toggle('show-sidebar'); toolsSidebar.classList.toggle('hidden'); });

const leftSidebar = document.getElementById('left-sidebar'); const resizer = document.getElementById('resizer'); let isResizing = false;
resizer.addEventListener('mousedown', () => { isResizing = true; resizer.classList.add('active'); document.body.style.cursor = 'col-resize'; });
document.addEventListener('mousemove', (e) => { if (!isResizing) return; let newWidth = e.clientX; if (newWidth > 250 && newWidth < 600) { leftSidebar.style.width = newWidth + 'px'; leftSidebar.style.marginLeft = '0'; leftSidebar.classList.remove('hidden'); } });
document.addEventListener('mouseup', () => { isResizing = false; resizer.classList.remove('active'); document.body.style.cursor = 'default'; });

let selectedRow = -1, selectedCol = -1; let timerInterval = null, secondsElapsed = 0; let mistakes = 0, isGameOver = false; 
let masterSolution = null; let hintCount = 3; let currentRecordId = null;

function renderBoard(boardId, boardData) {
    const table = document.getElementById(boardId); table.innerHTML = '';
    for (let r = 0; r < 9; r++) {
        let tr = document.createElement('tr');
        for (let c = 0; c < 9; c++) {
            let td = document.createElement('td'); let input = document.createElement('input');
            input.type = 'text'; input.maxLength = 1; input.id = `${boardId}-cell-${r}-${c}`;
            let val = boardData ? boardData[r][c] : 0;
            if (typeof val === 'number' && !isNaN(val) && val > 0) { input.value = val; input.classList.add('api-fixed-cell'); input.dataset.isApi = "true"; } else { input.dataset.isApi = "false"; }
            input.readOnly = true;
            if (boardId === 'sudoku-board-main') { input.addEventListener('click', () => { selectedRow = r; selectedCol = c; updateHighlightEffects(r, c, input.value); }); }
            td.appendChild(input); tr.appendChild(td);
        }
        table.appendChild(tr);
    }
}

function syncBoards() {
    if (!document.getElementById('toggle-dual-board').checked) return;
    for (let r = 0; r < 9; r++) { for (let c = 0; c < 9; c++) { let mainInp = document.getElementById(`sudoku-board-main-cell-${r}-${c}`); let compareInp = document.getElementById(`sudoku-board-compare-cell-${r}-${c}`); if (mainInp && compareInp) { compareInp.value = mainInp.value; compareInp.dataset.isApi = mainInp.dataset.isApi; } } }
}

function startTimer() { if (timerInterval) clearInterval(timerInterval); secondsElapsed = 0; updateTimerUI(); timerInterval = setInterval(() => { secondsElapsed++; updateTimerUI(); }, 1000); }
function updateTimerUI() { let m = Math.floor(secondsElapsed / 60).toString().padStart(2, '0'); let s = (secondsElapsed % 60).toString().padStart(2, '0'); document.getElementById('timer-display').innerText = `${m}:${s}`; }
function addMistake() { mistakes++; document.getElementById('mistakes-display').innerText = mistakes; if (mistakes >= 5) { isGameOver = true; setTimeout(() => alert("Bạn đã sai 5 lần! Game kết thúc."), 100); } }
function resetGameStats() { mistakes = 0; isGameOver = false; hintCount = 3; document.getElementById('mistakes-display').innerText = mistakes; document.getElementById('hint-count').innerText = hintCount; startTimer(); }

function loadPuzzleByDifficulty() {
    let level = document.getElementById('difficulty-select').value;
    if (level === "1") { renderBoard('sudoku-board-main', null); if (document.getElementById('toggle-dual-board').checked) renderBoard('sudoku-board-compare', null); masterSolution = null; document.getElementById('ai-log-box').innerHTML = ''; document.getElementById('chart-wrapper').style.display = 'none'; resetGameStats(); return; }
    let board = generateSudoku(); renderBoard('sudoku-board-main', board); if (document.getElementById('toggle-dual-board').checked) renderBoard('sudoku-board-compare', board);
    masterSolution = solveSudokuFast(board).grid; document.getElementById('stat-nodes-csp').innerText = "0"; document.getElementById('stat-time-csp').innerText = "0"; document.getElementById('ai-log-box').innerHTML = '';
    resetGameStats();
}

async function runSolveFast() {
    if (isAIPlaying) return; isAIPlaying = true;
    let board = []; 
    let hasData = false;
    for (let r = 0; r < 9; r++) { let row = []; for (let c = 0; c < 9; c++) { let v = document.getElementById(`sudoku-board-main-cell-${r}-${c}`).value; if (v) hasData = true; row.push(v ? parseInt(v) : 0); } board.push(row); }

    if (!hasData) { alert("Bàn cờ đang trống!"); isAIPlaying = false; return; }
    let test = solveSudokuFast(board);
    if (!test.solved) { alert("Đề bài không có nghiệm!"); isAIPlaying = false; return; }
    
    let isDual = document.getElementById('toggle-dual-board').checked;
    if (isDual) {
        printAILog("Bắt đầu so sánh thuật toán...", "log-info");
        let resN = solveBaseline(board); 
        let resM = solveMRVScan(board);
        let resC = await solveCSP(board, false, 'sudoku-board-compare'); 
        
        document.getElementById('stat-nodes-csp').innerText = resC.nodes; 
        document.getElementById('stat-time-csp').innerText = resC.time.toFixed(2); 
        printAILog(`Baseline xong: ${resN.nodes} nodes, ${resN.time.toFixed(2)}ms`, "log-success");
        printAILog(`CSP xong: ${resC.nodes} nodes, ${resC.time.toFixed(2)}ms`, "log-success");
        
        for (let r = 0; r < 9; r++) { for (let c = 0; c < 9; c++) { let inpM = document.getElementById(`sudoku-board-main-cell-${r}-${c}`); let inpC = document.getElementById(`sudoku-board-compare-cell-${r}-${c}`); if (inpM && resN.grid) inpM.value = resN.grid[r][c]; if (inpC && resC.grid) inpC.value = resC.grid[r][c]; } }
        drawComparisonChart(resN.time, resM.time, resC.time); 
        printAILog("Hoàn tất so sánh!", "log-success");
    } else {
        printAILog("Bắt đầu Giải Nhanh...", "log-info");
        let res = await solveCSP(board, false, 'sudoku-board-main'); 
        document.getElementById('stat-nodes-csp').innerText = res.nodes; 
        document.getElementById('stat-time-csp').innerText = res.time.toFixed(2); 
        printAILog(`Xong! ${res.nodes} nodes, ${res.time.toFixed(2)}ms`, "log-success");
        for (let r = 0; r < 9; r++) { for (let c = 0; c < 9; c++) { let inp = document.getElementById(`sudoku-board-main-cell-${r}-${c}`); if (inp && res.grid) inp.value = res.grid[r][c]; } }
        if (res.grid) saveToHistory('AI', res.time.toFixed(3), document.getElementById('difficulty-select').value, res.grid, res.nodes);
    }
    isAIPlaying = false;
}

async function runSolveSlow() {
    if (isAIPlaying) return; isAIPlaying = true;
    let board = []; 
    let hasData = false;
    for (let r = 0; r < 9; r++) { let row = []; for (let c = 0; c < 9; c++) { let v = document.getElementById(`sudoku-board-main-cell-${r}-${c}`).value; if (v) hasData = true; row.push(v ? parseInt(v) : 0); } board.push(row); }

    if (!hasData) { alert("Bàn cờ đang trống!"); isAIPlaying = false; return; }
    let test = solveSudokuFast(board);
    if (!test.solved) { alert("Đề bài không có nghiệm!"); isAIPlaying = false; return; }

    let isDual = document.getElementById('toggle-dual-board').checked; 
    let targetBoardId = isDual ? 'sudoku-board-compare' : 'sudoku-board-main';
    printAILog("Bắt đầu Giải Kỹ...", "log-info");
    
    let res = await solveCSP(board, true, targetBoardId); 
    document.getElementById('stat-nodes-csp').innerText = res.nodes; 
    document.getElementById('stat-time-csp').innerText = res.time.toFixed(2); 
    printAILog(`Xong! ${res.nodes} nodes, Thời gian thuật toán: ${res.time.toFixed(2)}ms`, "log-success");
    
    if (isDual) { let resN = solveBaseline(board); for (let r = 0; r < 9; r++) { for (let c = 0; c < 9; c++) { let inpM = document.getElementById(`sudoku-board-main-cell-${r}-${c}`); if (inpM && resN.grid) inpM.value = resN.grid[r][c]; } } }
    if (res.grid) saveToHistory('AI', res.time.toFixed(3), document.getElementById('difficulty-select').value, res.grid, res.nodes);
    isAIPlaying = false;
}

function giveHint() {
    if (isGameOver) return; if (hintCount <= 0) { alert("Bạn đã hết lượt gợi ý!"); runSolveFast(); return; }
    if (selectedRow === -1 || selectedCol === -1) { alert("Hãy chọn một ô trống trên bàn cờ trước khi xin gợi ý!"); return; }
    let inp = document.getElementById(`sudoku-board-main-cell-${selectedRow}-${selectedCol}`); if (inp.value !== '') { alert("Ô này đã có số rồi!"); return; }
    if (!masterSolution || !masterSolution[selectedRow]) return; let correctVal = masterSolution[selectedRow][selectedCol];
    if (typeof correctVal === 'number' && correctVal > 0 && correctVal <= 9) { inp.value = correctVal; inp.classList.remove('error-cell'); hintCount--; document.getElementById('hint-count').innerText = hintCount; updateHighlightEffects(selectedRow, selectedCol, correctVal); syncBoards(); }
}

function toggleDualBoard() {
    const isDual = document.getElementById('toggle-dual-board').checked; const wrapperCompare = document.getElementById('wrapper-compare'); const chartWrapper = document.getElementById('chart-wrapper');
    if (isDual) { wrapperCompare.style.display = 'flex'; chartWrapper.style.display = 'block'; for (let r = 0; r < 9; r++) { for (let c = 0; c < 9; c++) { let v = document.getElementById(`sudoku-board-main-cell-${r}-${c}`).value; document.getElementById(`sudoku-board-compare-cell-${r}-${c}`).value = v; } } drawComparisonChart(0, 0, 0); } else { wrapperCompare.style.display = 'none'; chartWrapper.style.display = 'none'; }
}

document.addEventListener('DOMContentLoaded', () => {
    renderBoard('sudoku-board-main', null); renderBoard('sudoku-board-compare', null); loadPuzzleByDifficulty();
    document.getElementById('sudoku-board-main').addEventListener('input', syncBoards); document.getElementById('btn-new-game').addEventListener('click', loadPuzzleByDifficulty); document.getElementById('difficulty-select').addEventListener('change', loadPuzzleByDifficulty);
    document.getElementById('btn-solve-slow').addEventListener('click', (e) => { e.preventDefault(); runSolveSlow(); }); document.getElementById('btn-solve-fast').addEventListener('click', (e) => { e.preventDefault(); runSolveFast(); }); document.getElementById('btn-hint').addEventListener('click', giveHint); document.getElementById('btn-benchmark').addEventListener('click', runBenchmark); document.getElementById('toggle-dual-board').addEventListener('change', toggleDualBoard);
    document.addEventListener('keydown', (e) => { if (/^[1-9]$/.test(e.key) || e.key === 'Backspace' || e.key === 'Delete') handleInput(e.key); });
    document.querySelectorAll('.num-btn').forEach(btn => { btn.addEventListener('click', () => handleInput(btn.innerText)); }); document.getElementById('btn-erase').addEventListener('click', () => handleInput('Erase'));
    document.getElementById('bg-selector').addEventListener('change', (e) => { document.body.style.backgroundImage = `url('${e.target.value}')`; });
    document.getElementById('btn-clear-history').addEventListener('click', () => { if(confirm("Xóa toàn bộ lịch sử?")){ localStorage.removeItem('sudokuAppHistory'); loadHistoryFromStorage(); } });
    document.getElementById('btn-export-csv').addEventListener('click', () => {
        let historyStr = localStorage.getItem('sudokuAppHistory'); let historyArr = historyStr ? JSON.parse(historyStr) : [];
        if (historyArr.length === 0) { alert("Chưa có dữ liệu!"); return; }
        let csvContent = "\uFEFF"; csvContent += "ID,Tên bản ghi,Loại,Độ khó,Time TB Base (ms),Time TB MRV (ms),Time TB CSP (ms),Lần chạy,Time Base,Time MRV,Time CSP,Nodes Base,Nodes MRV,Nodes CSP\n";
        historyArr.forEach(r => { 
            if (r.type === 'BENCHMARK' && r.benchmarkDetails) { r.benchmarkDetails.forEach(run => { csvContent += `${r.id},${r.title},${r.type},${r.difficultyLabel},${r.timeN},${r.timeM},${r.timeC},${run.run},${run.timeN.toFixed(3)},${run.timeM.toFixed(3)},${run.timeC.toFixed(3)},${run.nodesN},${run.nodesM},${run.nodesC}\n`; }); } 
            else { csvContent += `${r.id},${r.title},${r.type},${r.difficultyLabel},${r.time},,,${r.time},,,${r.nodes},,,\n`; }
        });
        let blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); let url = URL.createObjectURL(blob); let link = document.createElement("a"); link.setAttribute("href", url); link.setAttribute("download", "sudoku_benchmark_full.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link);
    });
    loadHistoryFromStorage();
});

function updateHighlightEffects(activeRow, activeCol, activeValue) { document.querySelectorAll('#sudoku-board-main td').forEach(td => td.classList.remove('highlight-line')); document.querySelectorAll('#sudoku-board-main input').forEach(inp => inp.classList.remove('selected-cell', 'highlight-same-num')); const activeInput = document.getElementById(`sudoku-board-main-cell-${activeRow}-${activeCol}`); if (activeInput) activeInput.classList.add('selected-cell'); for (let r = 0; r < 9; r++) { for (let c = 0; c < 9; c++) { const cellInput = document.getElementById(`sudoku-board-main-cell-${r}-${c}`); if (r === activeRow || c === activeCol) cellInput.parentElement.classList.add('highlight-line'); if (activeValue !== '' && cellInput.value === activeValue) cellInput.classList.add('highlight-same-num'); } } }
function handleInput(key) { if (selectedRow === -1 || selectedCol === -1 || isGameOver) return; const cellInput = document.getElementById(`sudoku-board-main-cell-${selectedRow}-${selectedCol}`); if (cellInput.dataset.isApi === "true") return; if (key === 'Backspace' || key === 'Delete' || key === 'Erase') { cellInput.value = ''; cellInput.classList.remove('error-cell'); } else if (/^[1-9]$/.test(key)) { cellInput.value = key; if (masterSolution && parseInt(key) !== masterSolution[selectedRow][selectedCol]) { cellInput.classList.add('error-cell'); addMistake(); } else { cellInput.classList.remove('error-cell'); } } updateHighlightEffects(selectedRow, selectedCol, cellInput.value); syncBoards(); }
function saveBenchmarkToHistory(runDetails, meanN, meanM, meanC, diffValue, finalBoard) { let historyStr = localStorage.getItem('sudokuAppHistory'); let historyArr = historyStr ? JSON.parse(historyStr) : []; let diffLabel = "Tự nhập"; if(diffValue === "2") diffLabel = "Dễ"; else if(diffValue === "3") diffLabel = "Trung bình"; else if(diffValue === "4") diffLabel = "Khó"; else if(diffValue === "5") diffLabel = "Siêu Khó"; let newRecord = { id: Date.now(), title: `Benchmark ${runDetails.length} lần - ${diffLabel}`, type: 'BENCHMARK', timeN: meanN.toFixed(3), timeM: meanM.toFixed(3), timeC: meanC.toFixed(3), difficultyLabel: diffLabel, difficultyValue: diffValue, board: finalBoard, benchmarkDetails: runDetails, originalApi: getOriginalApiMask() }; historyArr.unshift(newRecord); localStorage.setItem('sudokuAppHistory', JSON.stringify(historyArr)); loadHistoryFromStorage(); }
function saveToHistory(type, timeStr, diffValue, finalBoard, nodes = 0) { let historyStr = localStorage.getItem('sudokuAppHistory'); let historyArr = historyStr ? JSON.parse(historyStr) : []; let diffLabel = "Tự nhập"; if(diffValue === "2") diffLabel = "Dễ"; else if(diffValue === "3") diffLabel = "Trung bình"; else if(diffValue === "4") diffLabel = "Khó"; else if(diffValue === "5") diffLabel = "Siêu Khó"; let newRecord = { id: Date.now(), title: `Bản ghi ${String(historyArr.length + 1).padStart(2, '0')} - ${type === 'AI' ? 'AI' : 'Giải tay'}`, type: type, time: timeStr, nodes: nodes, difficultyLabel: diffLabel, difficultyValue: diffValue, board: finalBoard, originalApi: getOriginalApiMask() }; historyArr.unshift(newRecord); localStorage.setItem('sudokuAppHistory', JSON.stringify(historyArr)); loadHistoryFromStorage(); }
function getOriginalApiMask() { let mask = []; for(let r=0; r<9; r++){ let row = []; for(let c=0; c<9; c++){ let inp = document.getElementById(`sudoku-board-main-cell-${r}-${c}`); row.push(inp && inp.dataset.isApi === "true" ? 1 : 0); } mask.push(row); } return mask; }
function loadHistoryFromStorage() { const listContainer = document.getElementById('history-list'); listContainer.innerHTML = ''; let historyStr = localStorage.getItem('sudokuAppHistory'); let historyArr = historyStr ? JSON.parse(historyStr) : []; if (historyArr.length === 0) { listContainer.innerHTML = '<p style="color: #94a3b8; text-align:center; font-size: 13px;">Chưa có dữ liệu lịch sử.</p>'; return; } historyArr.forEach(record => { let isAI = record.type === 'AI'; let isBM = record.type === 'BENCHMARK'; let huongGiai = isBM ? "Đo Benchmark" : (isAI ? "Hướng giải: AI" : "Hướng giải: Tự giải"); let colorClass = isAI ? "ai-solved" : "manual-solved"; let diffLabel = record.difficultyLabel || "Tự nhập"; let miniBoardHtml = `<div class="mini-board">`; for(let r=0; r<9; r++){ for(let c=0; c<9; c++){ let val = record.board[r][c]; let isOriginal = record.originalApi[r][c] === 1; let cssClass = isOriginal ? "api-original" : (val !== 0 ? colorClass : ""); miniBoardHtml += `<div class="mini-cell ${cssClass}">${val !== 0 ? val : ''}</div>`; } } miniBoardHtml += `</div>`; let itemDiv = document.createElement('div'); itemDiv.className = 'history-item'; if (isBM) { itemDiv.innerHTML = `<div class="history-title" style="color: #f87171">${record.title}</div><div class="history-info" style="font-size: 12px; line-height: 1.5;"><p style="color: #fcd34d; font-weight: bold;">${huongGiai}</p><p>⏱ TB Base: ${record.timeN}s | MRV: ${record.timeM}s | CSP: ${record.timeC}s</p><p>⎋ Độ khó: ${diffLabel}</p></div>`; } else { itemDiv.innerHTML = `<div class="history-title">${record.title}</div>${miniBoardHtml}<div class="history-info" style="font-size: 12px; line-height: 1.5;"><p style="color: #fcd34d; font-weight: bold;">${huongGiai}</p><p>⏱ Thời gian: <span>${record.time}s</span></p><p>⎋ Độ khó: ${diffLabel}</p></div>`; } itemDiv.addEventListener('click', () => openModal(record, miniBoardHtml)); listContainer.appendChild(itemDiv); }); }
const modal = document.getElementById('board-modal'); const closeModalBtn = document.getElementById('close-modal');
function openModal(record, miniBoardHtml) { currentRecordId = record.id; document.getElementById('modal-title').innerText = record.title; let isBM = record.type === 'BENCHMARK'; let infoHtml = isBM ? `<p>Độ khó: <span>${record.difficultyLabel}</span></p><p style="margin-top:5px">Trung bình: <span>Base: ${record.timeN}ms</span> | <span>MRV: ${record.timeM}ms</span> | <span>CSP: ${record.timeC}ms</span></p>` : `<p>Hướng giải: <span>${record.type === 'AI' ? 'AI' : 'Tự giải'}</span></p><p>Thời gian: <span>${record.time}s</span></p><p>Số Nodes: <span>${record.nodes || 0}</span></p>`; if (isBM && record.benchmarkDetails) { let tableHtml = `<table style="width:100%; margin-top:10px; border-collapse: collapse; font-size:11px; color:white;"><tr style="background:rgba(255,255,255,0.1);"><th style="border:1px solid #444; padding:3px;">Lần</th><th style="border:1px solid #444; padding:3px;">Base (ms)</th><th style="border:1px solid #444; padding:3px;">MRV (ms)</th><th style="border:1px solid #444; padding:3px;">CSP (ms)</th></tr>`; record.benchmarkDetails.forEach(d => { tableHtml += `<tr><td style="border:1px solid #444; padding:3px; text-align:center;">${d.run}</td><td style="border:1px solid #444; padding:3px; text-align:center;">${d.timeN.toFixed(1)}</td><td style="border:1px solid #444; padding:3px; text-align:center;">${d.timeM.toFixed(1)}</td><td style="border:1px solid #444; padding:3px; text-align:center;">${d.timeC.toFixed(1)}</td></tr>`; }); tableHtml += `</table>`; infoHtml += tableHtml; } document.getElementById('modal-info').innerHTML = infoHtml; let bigBoard = miniBoardHtml.replace('class="mini-board"', 'class="mini-board" style="width: 300px; height: 300px;"'); bigBoard = bigBoard.replace(/class="mini-cell/g, 'class="mini-cell" style="font-size: 24px;"'); document.getElementById('modal-board-container').innerHTML = bigBoard; modal.classList.remove('hidden'); }
closeModalBtn.addEventListener('click', () => modal.classList.add('hidden')); modal.addEventListener('click', (e) => { if(e.target === modal) modal.classList.add('hidden'); }); document.getElementById('btn-delete-single').onclick = function() { if (currentRecordId) { if(confirm("Xóa bản ghi này?")) { let historyStr = localStorage.getItem('sudokuAppHistory'); let historyArr = historyStr ? JSON.parse(historyStr) : []; historyArr = historyArr.filter(r => r.id !== currentRecordId); localStorage.setItem('sudokuAppHistory', JSON.stringify(historyArr)); loadHistoryFromStorage(); modal.classList.add('hidden'); } } };