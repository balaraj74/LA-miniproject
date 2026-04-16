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

def test_pipeline():
    # Make dummy image
    img_array = np.random.randint(0, 256, (400, 400, 3), dtype=np.uint8)
    # Using the new keys
    m1, m2, m3, m4 = 93, 201, 144, 57
    svd_key = 0.5
    
    matrix_key = np.array([[m1, m2], [m3, m4]])
    inv_matrix = modular_inverse_matrix(matrix_key)
    
    h, w, c = img_array.shape
    pad_h, pad_w = 0, 0
    enc_array = np.zeros_like(img_array)
    
    for i in range(c):
        ### ENCRYPT ###
        U, S, Vt = np.linalg.svd(img_array[:, :, i], full_matrices=False)
        S_enc = S * svd_key
        A = np.dot(U, np.dot(np.diag(S_enc), Vt))
        A = np.clip(A, 0, 255).astype(int)
        
        bh, bw = A.shape
        # vectorized block matrix enc
        A_blocks = A.reshape(bh // 2, 2, bw // 2, 2).transpose(0, 2, 1, 3)
        enc_blocks = np.matmul(matrix_key, A_blocks) % 256
        enc_array[:, :, i] = enc_blocks.transpose(0, 2, 1, 3).reshape(bh, bw)
        
    for i in range(c):
        ### DECRYPT ###
        channel_enc = enc_array[:, :, i]
        
        enc_blocks = channel_enc.reshape(h // 2, 2, w // 2, 2).transpose(0, 2, 1, 3)
        dec_blocks = np.matmul(inv_matrix, enc_blocks) % 256
        channel_dec = dec_blocks.transpose(0, 2, 1, 3).reshape(h, w)
        
        U, S, Vt = np.linalg.svd(channel_dec.astype(float), full_matrices=False)
        S_dec = S / svd_key
        
        A_dec = np.dot(U, np.dot(np.diag(S_dec), Vt))
        A_dec = np.clip(A_dec, 0, 255).astype(np.uint8)
        
        diff = np.abs(img_array[:, :, i].astype(int) - A_dec.astype(int))
        print(f"Channel {i} max diff: {np.max(diff)}, mean diff: {np.mean(diff)}")

test_pipeline()
