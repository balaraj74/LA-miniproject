import numpy as np
from PIL import Image
import io

def modular_inverse_matrix(matrix):
    a, b = int(matrix[0, 0]), int(matrix[0, 1])
    c, d = int(matrix[1, 0]), int(matrix[1, 1])
    det = (a * d - b * c) % 256
    det_inv = pow(det, -1, 256)
    adj = np.array([[d, -b], [-c, a]]) % 256
    return (det_inv * adj) % 256

def test_crypto():
    # Make dummy image
    img_array = np.random.randint(0, 255, (200, 200, 3), dtype=np.uint8)
    
    m1, m2, m3, m4 = 93, 201, 144, 57
    svd_key = 0.5
    matrix_key = np.array([[m1, m2], [m3, m4]])
    
    pad_h, pad_w = 0, 0
    h, w, c = img_array.shape
    enc_array = np.zeros((h, w, c), dtype=np.uint8)
    
    for i in range(c):
        U, S, Vt = np.linalg.svd(img_array[:, :, i].astype(float), full_matrices=False)
        S_enc = S * svd_key
        A = np.dot(U, np.dot(np.diag(S_enc), Vt))
        A = np.clip(A, 0, 255).astype(int)
        
        A_blocks = A.reshape(h // 2, 2, w // 2, 2).transpose(0, 2, 1, 3)
        enc_blocks = np.matmul(matrix_key, A_blocks) % 256
        enc_array[:, :, i] = enc_blocks.transpose(0, 2, 1, 3).reshape(h, w)
        
    inv_matrix = modular_inverse_matrix(matrix_key)
    dec_array = np.zeros((h, w, c), dtype=np.uint8)
    
    for i in range(c):
        channel_enc = enc_array[:, :, i]
        enc_blocks = channel_enc.reshape(h // 2, 2, w // 2, 2).transpose(0, 2, 1, 3)
        dec_blocks = np.matmul(inv_matrix, enc_blocks) % 256
        channel_dec = dec_blocks.transpose(0, 2, 1, 3).reshape(h, w)
        
        U, S, Vt = np.linalg.svd(channel_dec.astype(float), full_matrices=False)
        S_dec = S / svd_key
        A_dec = np.dot(U, np.dot(np.diag(S_dec), Vt))
        dec_array[:, :, i] = np.clip(A_dec, 0, 255).astype(np.uint8)
        
    diff = np.abs(img_array.astype(int) - dec_array.astype(int))
    print(f"Max diff: {diff.max()}")
    print(f"Mean diff: {diff.mean()}")

test_crypto()
