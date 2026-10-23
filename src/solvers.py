import time

TIMEOUT_S = 5.0

def solve_baseline(board):
    start = time.perf_counter()
    grid = [row[:] for row in board]
    nodes = 0
    solved = False
    timed_out = False

    def is_safe(r, c, num):
        for x in range(9):
            if grid[r][x] == num or grid[x][c] == num: return False
        sr, sc = (r // 3) * 3, (c // 3) * 3
        for i in range(3):
            for j in range(3):
                if grid[sr + i][sc + j] == num: return False
        return True

    def dfs(pos):
        nonlocal nodes, solved, timed_out
        if time.perf_counter() - start > TIMEOUT_S:
            timed_out = True
            return False
        if pos == 81:
            solved = True
            return True
        r, c = pos // 9, pos % 9
        if grid[r][c] != 0: return dfs(pos + 1)
        for num in range(1, 10):
            if is_safe(r, c, num):
                nodes += 1
                grid[r][c] = num
                if dfs(pos + 1): return True
                grid[r][c] = 0
        return False

    dfs(0)
    return {"solved": solved, "timed_out": timed_out, "nodes": nodes, "time_ms": (time.perf_counter() - start) * 1000}

def solve_mrv_scan(board):
    start = time.perf_counter()
    grid = [row[:] for row in board]
    nodes = 0
    solved = False
    timed_out = False

    def is_safe(r, c, num):
        for x in range(9):
            if grid[r][x] == num or grid[x][c] == num: return False
        sr, sc = (r // 3) * 3, (c // 3) * 3
        for i in range(3):
            for j in range(3):
                if grid[sr + i][sc + j] == num: return False
        return True

    def find_best_spot():
        best_r, best_c, min_count = -1, -1, 10
        for r in range(9):
            for c in range(9):
                if grid[r][c] == 0:
                    cnt = sum(1 for num in range(1, 10) if is_safe(r, c, num))
                    if cnt < min_count:
                        min_count, best_r, best_c = cnt, r, c
                        if cnt == 1: break
        return best_r, best_c

    def dfs():
        nonlocal nodes, solved, timed_out
        if time.perf_counter() - start > TIMEOUT_S:
            timed_out = True
            return False
        r, c = find_best_spot()
        if r == -1:
            solved = True
            return True
        for num in range(1, 10):
            if is_safe(r, c, num):
                nodes += 1
                grid[r][c] = num
                if dfs(): return True
                grid[r][c] = 0
        return False

    dfs()
    return {"solved": solved, "timed_out": timed_out, "nodes": nodes, "time_ms": (time.perf_counter() - start) * 1000}

def solve_csp(board):
    start = time.perf_counter()
    grid = [row[:] for row in board]
    nodes = 0
    solved = False
    timed_out = False
    FULL = 0b111111111
    rows, cols, boxes = [0]*9, [0]*9, [0]*9

    for r in range(9):
        for c in range(9):
            if grid[r][c]:
                bit = 1 << (grid[r][c] - 1)
                b = (r // 3) * 3 + (c // 3)
                rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit

    def dfs():
        nonlocal nodes, solved, timed_out
        if time.perf_counter() - start > TIMEOUT_S:
            timed_out = True
            return False
        best_r, best_c, min_count, best_bit = -1, -1, 10, 0
        for r in range(9):
            for c in range(9):
                if grid[r][c] == 0:
                    b = (r // 3) * 3 + (c // 3)
                    avail = FULL & ~(rows[r] | cols[c] | boxes[b])
                    count = bin(avail).count('1')
                    if count < min_count:
                        min_count, best_r, best_c, best_bit = count, r, c, avail
                        if count == 1: break
        if best_r == -1:
            solved = True
            return True
        b = (best_r // 3) * 3 + (best_c // 3)
        avail = best_bit
        while avail:
            bit = avail & -avail
            avail ^= bit
            nodes += 1
            grid[best_r][best_c] = bit.bit_length()
            rows[best_r] |= bit; cols[best_c] |= bit; boxes[b] |= bit
            if dfs(): return True
            grid[best_r][best_c] = 0
            rows[best_r] &= ~bit; cols[best_c] &= ~bit; boxes[b] &= ~bit
        return False

    dfs()
    return {"solved": solved, "timed_out": timed_out, "nodes": nodes, "time_ms": (time.perf_counter() - start) * 1000}