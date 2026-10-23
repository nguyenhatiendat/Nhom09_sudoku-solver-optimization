import pandas as pd
import matplotlib.pyplot as plt
import os

if __name__ == "__main__":
    os.makedirs("figures", exist_ok=True)
    df = pd.read_csv("results/benchmark_results.csv")

    # 1. Vẽ biểu đồ so sánh thời gian
    plt.figure(figsize=(10, 6))
    mean_times = df.groupby("Level")[["Base_Time", "MRV_Time", "CSP_Time"]].mean()
    mean_times.plot(kind="bar", logy=True, color=["#f87171", "#facc15", "#34d399"])
    plt.title("So sánh thời gian giải trung bình (ms) - Log Scale")
    plt.ylabel("Thời gian (ms) - Log Scale")
    plt.xticks(rotation=0)
    plt.tight_layout()
    plt.savefig("figures/fig_runtime_comparison.png")
    plt.close()

    # 2. Vẽ biểu đồ so sánh số Nodes
    plt.figure(figsize=(10, 6))
    mean_nodes = df.groupby("Level")[["Base_Nodes", "MRV_Nodes", "CSP_Nodes"]].mean()
    mean_nodes.plot(kind="bar", logy=True, color=["#f87171", "#facc15", "#34d399"])
    plt.title("So sánh số Nodes trung bình - Log Scale")
    plt.ylabel("Số Nodes - Log Scale")
    plt.xticks(rotation=0)
    plt.tight_layout()
    plt.savefig("figures/fig_nodes_comparison.png")
    plt.close()

    print("Đã xuất 2 hình biểu đồ vào thư mục figures/")