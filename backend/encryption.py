import numpy as np
from PIL import Image
import io
import base64

def modular_inverse_matrix(matrix):
    """Calculate the inverse of a 2x2 matrix modulo 256."""
    a, b = int(matrix[0, 0]), int(matrix[0, 1])
    c, d = int(matrix[1, 0]), int(matrix[1, 1])
    
    det = (a * d - b * c) % 256
    
    # Invertibility check mod 256
    if det % 2 == 0:
        raise ValueError("Matrix is not invertible modulo 256. The determinant must be odd.")
        
    det_inv = pow(det, -1, 256)
    
    adj = np.array([
        [d, -b],
        [-c, a]
    ]) % 256
    
    return (det_inv * adj) % 256

def encrypt_image(image_bytes: bytes, svd_key: float, m1: int, m2: int, m3: int, m4: int):
    # Security/Validation Checks
    matrix_key = np.array([[m1, m2], [m3, m4]])
    _ = modular_inverse_matrix(matrix_key)
    
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    img.thumbnail((400, 400), Image.Resampling.LANCZOS)
    img_array = np.array(img, dtype=float)
    
    h, w, c = img_array.shape
    
    pad_h = h % 2
    pad_w = w % 2
    
    enc_array = np.zeros((h + pad_h, w + pad_w, c), dtype=np.uint8)
    
    for i in range(c):
        # a) SVD Decomposition
        U, S, Vt = np.linalg.svd(img_array[:, :, i], full_matrices=False)
        
        # b) Encrypt Singular Values
        S_enc = S * svd_key
        
        # c) Reconstruct Image
        A = np.dot(U, np.dot(np.diag(S_enc), Vt))
        A = np.clip(A, 0, 255).astype(int)
        
        if pad_h or pad_w:
            A = np.pad(A, ((0, pad_h), (0, pad_w)), mode='constant')
            
        bh, bw = A.shape
        channel_enc = np.zeros_like(A)
        
        # d) Block Matrix Encryption (mod 256) - Vectorized
        A_blocks = A.reshape(bh // 2, 2, bw // 2, 2).transpose(0, 2, 1, 3)
        enc_blocks = np.matmul(matrix_key, A_blocks) % 256
        channel_enc = enc_blocks.transpose(0, 2, 1, 3).reshape(bh, bw)
                
        enc_array[:, :, i] = channel_enc
        
    enc_img = Image.fromarray(enc_array, 'RGB')
    buffer = io.BytesIO()
    enc_img.save(buffer, format='PNG')
    
    encoded = base64.b64encode(buffer.getvalue()).decode('utf-8')
    return {
        "image_base64": f"data:image/png;base64,{encoded}",
        "pad_h": pad_h,
        "pad_w": pad_w
    }

def decrypt_image(image_bytes: bytes, svd_key: float, m1: int, m2: int, m3: int, m4: int, pad_h: int, pad_w: int):
    # e) Modular Matrix Inverse
    matrix_key = np.array([[m1, m2], [m3, m4]])
    inv_matrix = modular_inverse_matrix(matrix_key)
    
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    enc_array = np.array(img, dtype=int)
    
    h, w, c = enc_array.shape
    
    orig_h, orig_w = h - pad_h, w - pad_w
    dec_array = np.zeros((orig_h, orig_w, c), dtype=np.uint8)
    
    for i in range(c):
        channel_enc = enc_array[:, :, i]
        channel_dec = np.zeros_like(channel_enc)
        
        # Inverse matrix transformation - Vectorized
        enc_blocks = channel_enc.reshape(h // 2, 2, w // 2, 2).transpose(0, 2, 1, 3)
        dec_blocks = np.matmul(inv_matrix, enc_blocks) % 256
        channel_dec = dec_blocks.transpose(0, 2, 1, 3).reshape(h, w)
                
        if pad_h or pad_w:
            channel_dec = channel_dec[:orig_h, :orig_w]
            
        # Reverse SVD scaling
        U, S, Vt = np.linalg.svd(channel_dec.astype(float), full_matrices=False)
        S_dec = S / svd_key
        
        A = np.dot(U, np.dot(np.diag(S_dec), Vt))
        dec_array[:, :, i] = np.clip(A, 0, 255).astype(np.uint8)
        
    dec_img = Image.fromarray(dec_array, 'RGB')
    buffer = io.BytesIO()
    dec_img.save(buffer, format='PNG')
    
    encoded = base64.b64encode(buffer.getvalue()).decode('utf-8')
    return {
        "image_base64": f"data:image/png;base64,{encoded}"
    }
