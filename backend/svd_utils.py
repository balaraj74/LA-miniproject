import numpy as np
from PIL import Image
import io
import base64
import math
import hashlib

# ----------------- SVD COMPRESSION -----------------

def compress_svd_channel(channel, k):
    """Apply SVD compression to a single 2D channel."""
    U, S, Vt = np.linalg.svd(channel, full_matrices=False)
    # Reconstruct using top k singular values
    compressed_channel = np.dot(U[:, :k], np.dot(np.diag(S[:k]), Vt[:k, :]))
    return compressed_channel

def calculate_psnr(img1, img2):
    mse = np.mean((img1 - img2) ** 2)
    if mse == 0:
        return 100
    PIXEL_MAX = 255.0
    return 20 * math.log10(PIXEL_MAX / math.sqrt(mse))

def compress_image(image_bytes: bytes, k: int):
    # Load image from bytes
    img = Image.open(io.BytesIO(image_bytes))
    
    # Ensure RGB
    img = img.convert('RGB')
    img_array = np.array(img, dtype=float)
    
    # Check max dimensions to avoid extremely long processing times
    max_dim = max(img_array.shape[0], img_array.shape[1])
    if max_dim > 1500:
        scale = 1500 / max_dim
        new_size = (int(img.width * scale), int(img.height * scale))
        img = img.resize(new_size, Image.Resampling.LANCZOS)
        img_array = np.array(img, dtype=float)

    h, w, c = img_array.shape
    
    max_k = min(h, w)
    if k > max_k:
        k = max_k
    if k < 1:
        k = 1
        
    compressed_array = np.zeros_like(img_array)
    
    for i in range(c):
        compressed_array[:,:,i] = compress_svd_channel(img_array[:,:,i], k)
        
    # Clip values to 0-255 and convert to uint8
    compressed_array = np.clip(compressed_array, 0, 255).astype(np.uint8)
    original_array = np.clip(img_array, 0, 255).astype(np.uint8)
    
    # Calculate MSE and PSNR
    mse = np.mean((original_array.astype(float) - compressed_array.astype(float)) ** 2)
    psnr = calculate_psnr(original_array.astype(float), compressed_array.astype(float))
    
    # Convert numpy array back to PIL image
    compressed_img = Image.fromarray(compressed_array, 'RGB')
    
    # Save to buffer to get bytes
    buffer = io.BytesIO()
    compressed_img.save(buffer, format='JPEG', quality=95)
    compressed_bytes = buffer.getvalue()
    
    base64_encoded = base64.b64encode(compressed_bytes).decode('utf-8')
    
    return {
        "compressed_image": f"data:image/jpeg;base64,{base64_encoded}",
        "original_size": len(image_bytes),
        "compressed_size": len(compressed_bytes),
        "compression_ratio": round(len(image_bytes) / max(len(compressed_bytes), 1), 2),
        "k_used": k,
        "max_k": max_k,
        "mse": round(mse, 2),
        "psnr": round(psnr, 2),
        "width": w,
        "height": h
    }

# ----------------- SVD ENCRYPTION & DECRYPTION -----------------

def generate_key_matrix(password: str, size: int = 16):
    """Generate a reproducible invertible matrix based on a password."""
    # Create a seed from the password
    seed_str = hashlib.sha256(password.encode()).hexdigest()[:8]
    seed = int(seed_str, 16)
    rng = np.random.RandomState(seed)
    
    # Generate random matrix
    K = rng.randn(size, size)
    
    # Ensure it's invertible by adding a scaled identity matrix to diagonal
    K = K + np.eye(size) * size
    return K

def svd_pseudo_inverse(K):
    """Compute the pseudo-inverse of a matrix using strictly SVD."""
    U, S, Vt = np.linalg.svd(K, full_matrices=False)
    # Threshold for singular values to avoid division by near-zero hardware limits
    tolerance = 1e-10
    S_inv = np.zeros_like(S)
    S_inv[S > tolerance] = 1.0 / S[S > tolerance]
    
    # K^+ = V * S^+ * U^T
    K_inv = np.dot(Vt.T, np.dot(np.diag(S_inv), U.T))
    return K_inv

def encrypt_image(image_bytes: bytes, password: str, block_size: int = 16):
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    img_array = np.array(img, dtype=float)
    
    # Restrict large files for the demo to prevent excessive timeout loops
    max_dim = max(img_array.shape[0], img_array.shape[1])
    if max_dim > 1000:
        scale = 1000 / max_dim
        new_size = (int(img.width * scale), int(img.height * scale))
        img = img.resize(new_size, Image.Resampling.LANCZOS)
        img_array = np.array(img, dtype=float)

    h, w, c = img_array.shape
    
    # Pad image to be a perfect multiple of block_size
    pad_h = (block_size - (h % block_size)) % block_size
    pad_w = (block_size - (w % block_size)) % block_size
    
    if pad_h > 0 or pad_w > 0:
        img_array = np.pad(img_array, ((0, pad_h), (0, pad_w), (0, 0)), mode='reflect')
        
    new_h, new_w, _ = img_array.shape
    
    # Generate Transform matrix Key
    K = generate_key_matrix(password, block_size)
    
    encrypted_array = np.zeros_like(img_array)
    
    for i in range(c):
        channel = img_array[:,:,i]
        # Process each block securely using Matrix Multiplication
        for row in range(0, new_h, block_size):
            for col in range(0, new_w, block_size):
                block = channel[row:row+block_size, col:col+block_size]
                # Matrix Transform: C = K * B
                enc_block = np.dot(K, block)
                encrypted_array[row:row+block_size, col:col+block_size, i] = enc_block

    # Floating point scaling normalization for image-saving
    c_min = np.min(encrypted_array)
    c_max = np.max(encrypted_array)
    
    if c_max - c_min == 0:
        normalized_array = encrypted_array
    else:
        normalized_array = 255.0 * (encrypted_array - c_min) / (c_max - c_min)
        
    normalized_array = np.clip(normalized_array, 0, 255).astype(np.uint8)
    
    enc_img = Image.fromarray(normalized_array, 'RGB')
    buffer = io.BytesIO()
    # Save strictly as lossless PNG to maintain quantized values accurately
    enc_img.save(buffer, format='PNG')
    enc_bytes = buffer.getvalue()
    
    base64_encoded = base64.b64encode(enc_bytes).decode('utf-8')
    
    return {
        "image_base64": f"data:image/png;base64,{base64_encoded}",
        "metadata": {
            "c_min": float(c_min),
            "c_max": float(c_max),
            "orig_w": w,
            "orig_h": h,
            "pad_h": pad_h,
            "pad_w": pad_w,
            "block_size": block_size
        }
    }

def decrypt_image(image_bytes: bytes, password: str, metadata: dict):
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    img_array = np.array(img, dtype=float)
    
    c_min = metadata['c_min']
    c_max = metadata['c_max']
    orig_w = metadata['orig_w']
    orig_h = metadata['orig_h']
    pad_h = metadata['pad_h']
    pad_w = metadata['pad_w']
    block_size = metadata.get('block_size', 16)
    
    # Demap from normalized [0-255] back to floating precision space
    img_array = img_array / 255.0 * (c_max - c_min) + c_min
    
    h, w, c = img_array.shape
    
    # Regeneration and SVD calculation
    K = generate_key_matrix(password, block_size)
    
    # Decrypting matrix exclusively using Singular Value Decomposition 
    K_inv = svd_pseudo_inverse(K)
    
    decrypted_array = np.zeros_like(img_array)
    
    for i in range(c):
        channel = img_array[:,:,i]
        for row in range(0, h, block_size):
            for col in range(0, w, block_size):
                block = channel[row:row+block_size, col:col+block_size]
                # Reconstruct block through inv transform: B = K_inv * C
                dec_block = np.dot(K_inv, block)
                decrypted_array[row:row+block_size, col:col+block_size, i] = dec_block
                
    # Remove synthetic padding inserted at encryption
    decrypted_array = decrypted_array[:orig_h, :orig_w, :]
    
    decrypted_array = np.clip(decrypted_array, 0, 255).astype(np.uint8)
    
    dec_img = Image.fromarray(decrypted_array, 'RGB')
    buffer = io.BytesIO()
    dec_img.save(buffer, format='JPEG', quality=95)
    dec_bytes = buffer.getvalue()
    
    base64_encoded = base64.b64encode(dec_bytes).decode('utf-8')
    
    return {
        "image_base64": f"data:image/jpeg;base64,{base64_encoded}"
    }
