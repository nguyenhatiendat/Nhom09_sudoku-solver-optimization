# Problem Formulation (Mô hình hóa bài toán)

## 1. Decision Variables (Biến quyết định)
- Vector biến quyết định $x$ đại diện cho ma trận Sudoku 9x9.
- Với mỗi ô $(r, c)$, $x_{r,c} \in \{1, 2, ..., 9\}$.

## 2. Objective Function (Hàm mục tiêu)
$$f(x) = \min (Time(x) + Nodes(x))$$

## 3. Constraints (Ràng buộc)
- Ràng buộc hàng: $x_{r,1} \neq x_{r,2} \neq ... \neq x_{r,9}$.
- Ràng buộc cột: $x_{1,c} \neq x_{2,c} \neq ... \neq x_{9,c}$.
- Ràng buộc khối 3x3: Các số trong khối không trùng lặp.
- Ràng buộc thời gian (Budget): $Time(x) \le 5.0$ giây.