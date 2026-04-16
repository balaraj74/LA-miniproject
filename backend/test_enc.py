import numpy as np

def test():
    matrix_key = np.array([[3, 2], [7, 5]])
    A = np.random.randint(0, 255, (1000, 1000))
    bh, bw = A.shape
    A_blocks = A.reshape(bh // 2, 2, bw // 2, 2).transpose(0, 2, 1, 3)
    enc_blocks = np.matmul(matrix_key, A_blocks) % 256
    channel_enc = enc_blocks.transpose(0, 2, 1, 3).reshape(bh, bw)
    print("Done vectorization")

test()
