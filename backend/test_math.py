import numpy as np

matrix_key = np.array([[3, 2], [7, 5]])
A = np.random.randint(0, 256, (4, 4))
channel_enc_loop = np.zeros_like(A)

print("Original:")
print(A)

# Loop
for row in range(0, 4, 2):
    for col in range(0, 4, 2):
        block = A[row:row+2, col:col+2]
        channel_enc_loop[row:row+2, col:col+2] = np.dot(matrix_key, block) % 256

# Vectorized
bh, bw = A.shape
A_blocks = A.reshape(bh // 2, 2, bw // 2, 2).transpose(0, 2, 1, 3)
enc_blocks = np.matmul(matrix_key, A_blocks) % 256
channel_enc_vec = enc_blocks.transpose(0, 2, 1, 3).reshape(bh, bw)

print("Loop result:")
print(channel_enc_loop)
print("Vectorized result:")
print(channel_enc_vec)

print("Equal?", np.allclose(channel_enc_loop, channel_enc_vec))
