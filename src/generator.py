import random

def count_solutions(board, limit=2):
    grid = [row[:] for row in board]
    count = 0
    def is_safe(r, c, num):
        for x in range(9):
            if grid[r][x] == num or grid[x][c] == num: return False
        sr, sc = (r // 3) * 3, (c // 3) * 3
        for i in range(3):
            for j in range(3):
                if grid[sr + i][sc + j] == num: return False
        return True

    def dfs():
        nonlocal count
        if count >= limit: return
        best_r, best_c, min_count = -1, -1, 10
        for r in range(9):
            for c in range(9):
                if grid[r][c] == 0:
                    cnt = sum(1 for num in range(1, 10) if is_safe(r, c, num))
                    if cnt < min_count: min_count, best_r, best_c = cnt, r, c
                    if cnt == 0: return
        if best_r == -1:
            count += 1
            return
        for num in range(1, 10):
            if is_safe(best_r, best_c, num):
                grid[best_r][best_c] = num
                dfs()
                grid[best_r][best_c] = 0
    dfs()
    return count

def generate_sudoku(level="medium", seed=42):
    random.seed(seed)
    grid = [[0]*9 for _ in range(9)]
    def is_safe(r, c, num):
        for x in range(9):
            if grid[r][x] == num or grid[x][c] == num: return False
        sr, sc = (r // 3) * 3, (c // 3) * 3
        for i in range(3):
            for j in range(3):
                if grid[sr + i][sc + j] == num: return False
        return True

    def fill(pos):
        if pos == 81: return True
        r, c = pos // 9, pos % 9
        nums = list(range(1, 10))
        random.shuffle(nums)
        for num in nums:
            if is_safe(r, c, num):
                grid[r][c] = num
                if fill(pos + 1): return True
                grid[r][c] = 0
        return False
    fill(0)

    clues_map = {"easy": 45, "medium": 35, "hard": 28, "expert": 21}
    target_clues = clues_map.get(level, 35)
    
    puzzle = [row[:] for row in grid]
    positions = [(r, c) for r in range(9) for c in range(9)]
    random.shuffle(positions)
    
    cleared = 0
    target_cleared = 81 - target_clues
    for r, c in positions:
        if cleared >= target_cleared: break
        backup = puzzle[r][c]
        puzzle[r][c] = 0
        if count_solutions(puzzle) != 1:
            puzzle[r][c] = backup
        else:
            cleared += 1
    return puzzle