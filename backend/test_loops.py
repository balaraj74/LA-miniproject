import time
import numpy as np
bh = 800
bw = 800
A = np.random.randint(0, 255, (800, 800))
channel_enc = np.zeros_like(A)
matrix_key = np.array([[3, 2], [7, 5]])

start = time.time()
for row in range(0, bh, 2):
    for col in range(0, bw, 2):
        block = A[row:row+2, col:col+2]
        channel_enc[row:row+2, col:col+2] = np.dot(matrix_key, block) % 256
print("Loop time:", time.time() - start)
