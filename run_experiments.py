import csv
import os
from src.generator import generate_sudoku
from src.solvers import solve_baseline, solve_mrv_scan, solve_csp

if __name__ == "__main__":
    levels = ["easy", "medium", "hard", "expert"]
    puzzles_per_level = 25
    seeds = [42, 43, 44]

    os.makedirs("results", exist_ok=True)
    results = []

    print("Bắt đầu chạy thực nghiệm... Vui lòng đợi.")
    for level in levels:
        for i in range(puzzles_per_level):
            seed = seeds[i % len(seeds)]
            board = generate_sudoku(level, seed=seed + i)
            
            res_base = solve_baseline(board)
            res_mrv = solve_mrv_scan(board)
            res_csp = solve_csp(board)

            results.append({
                "Level": level, "Puzzle_ID": i, "Seed": seed + i,
                "Base_Time": res_base["time_ms"], "Base_Nodes": res_base["nodes"], "Base_Solved": res_base["solved"],
                "MRV_Time": res_mrv["time_ms"], "MRV_Nodes": res_mrv["nodes"], "MRV_Solved": res_mrv["solved"],
                "CSP_Time": res_csp["time_ms"], "CSP_Nodes": res_csp["nodes"], "CSP_Solved": res_csp["solved"]
            })
            print(f"Đã chạy xong {level} - Đề {i+1}/{puzzles_per_level}")

    csv_file = "results/benchmark_results.csv"
    with open(csv_file, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=results[0].keys())
        writer.writeheader()
        writer.writerows(results)
    
    print(f"\nHOÀN TẤT! Đã lưu kết quả vào {csv_file}")