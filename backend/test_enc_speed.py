import numpy as np
import time
from PIL import Image
import io

# Mock functions
def modular_inverse_matrix(matrix):
    a, b = int(matrix[0, 0]), int(matrix[0, 1])
    c, d = int(matrix[1, 0]), int(matrix[1, 1])
    det = (a * d - b * c) % 256
    if det % 2 == 0:
        raise ValueError("Matrix is not invertible")
    det_inv = pow(det, -1, 256)
    adj = np.array([[d, -b], [-c, a]]) % 256
    return (det_inv * adj) % 256

def profile_encryption():
    print("Generating mock image...")
    # Generate 4000x3000 mock image
    img = Image.fromarray(np.random.randint(0, 255, (3000, 4000, 3), dtype=np.uint8), 'RGB')
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    image_bytes = buffer.getvalue()
    
    print("Start Encryption")
    start = time.time()
    svd_key = 0.5
    matrix_key = np.array([[3, 2], [7, 5]])
    
    # mimic encrypt_image
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    print("Resizing...")
    t_res = time.time()
    img.thumbnail((800, 800), Image.Resampling.LANCZOS)
    print(f"Resizing took {time.time() - t_res:.2f}s, size is {img.size}")
    
    img_array = np.array(img, dtype=float)
    h, w, c = img_array.shape
    pad_h = h % 2
    pad_w = w % 2
    enc_array = np.zeros((h + pad_h, w + pad_w, c), dtype=np.uint8)
    
    t_svd_total = 0
    t_matmul_total = 0
    
    for i in range(c):
        t0 = time.time()
        U, S, Vt = np.linalg.svd(img_array[:, :, i], full_matrices=False)
        t_svd_total += time.time() - t0
        
        S_enc = S * svd_key
        A = np.dot(U, np.dot(np.diag(S_enc), Vt))
        A = np.clip(A, 0, 255).astype(int)
        
        if pad_h or pad_w:
            A = np.pad(A, ((0, pad_h), (0, pad_w)), mode='constant')
            
        bh, bw = A.shape
        t1 = time.time()
        A_blocks = A.reshape(bh // 2, 2, bw // 2, 2).transpose(0, 2, 1, 3)
        enc_blocks = np.matmul(matrix_key, A_blocks) % 256
        channel_enc = enc_blocks.transpose(0, 2, 1, 3).reshape(bh, bw)
        t_matmul_total += time.time() - t1
        
        enc_array[:, :, i] = channel_enc
        
    print(f"SVD total: {t_svd_total:.2f}s")
    print(f"Matmul total: {t_matmul_total:.2f}s")
    print(f"Total time: {time.time() - start:.2f}s")

profile_encryption()
