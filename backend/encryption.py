import io
import base64
import numpy as np
from PIL import Image

from svd_layer import encrypt_channel_svd, decrypt_channel_svd
from matrix_layer import encrypt_channel_matrix, decrypt_channel_matrix, matrix_mod_inverse
from arnold_layer import pad_to_square, arnold_cat_map_encrypt, arnold_cat_map_decrypt
from metrics import generate_full_metrics

def encode_img_to_base64(img_array):
    img_array = np.clip(img_array, 0, 255).astype(np.uint8)
    img = Image.fromarray(img_array)
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    return f"data:image/png;base64,{base64.b64encode(buffered.getvalue()).decode()}"

def encrypt_pipeline(file_content, k1, k2, secret_key, matrix_key, arnold_iterations):
    """
    Executes Triple Layer Encryption.
    1. Base Image padding
    2. Arnold Cat Map Iterations
    3. Matrix Block Transform
    4. SVD Modulation
    """
    # Verify Matrix Key Is invertible
    try:
        matrix_mod_inverse(matrix_key, 256)
    except Exception as e:
        raise ValueError(str(e))
        
    image = Image.open(io.BytesIO(file_content)).convert("RGB")
    
    # Cap maximum dimension to 512px to keep SVD/Arnold math inside O(1) second processing bounds
    image.thumbnail((512, 512), Image.Resampling.LANCZOS)
    
    original_arr = np.array(image)
    
    # 1. Arnold Padding
    padded_img, orig_h, orig_w = pad_to_square(original_arr)
    
    # Setup arrays
    h, w, c = padded_img.shape
    encrypted_arr = np.zeros_like(padded_img, dtype=float)
    
    # Process Channels
    # We'll collect the pad_h and pad_w from matrix_layer for decryption reference
    # but since it's already a square (and matrix is e.g. 4x4, 8x8), if Arnold size isn't divisible by N, it pads again.
    # To keep simple, Arnold size might need padding to be divisible by Matrix Dim first.
    N_mat = matrix_key.shape[0]
    # Ensure square is divisible by N_mat
    if h % N_mat != 0:
        extra_pad = N_mat - (h % N_mat)
        padded_img = np.pad(padded_img, ((0, extra_pad), (0, extra_pad), (0, 0)), mode='constant')
        h, w, c = padded_img.shape
        
    arnold_scrambled = np.zeros_like(padded_img, dtype=float)
    
    # Layer 3: Arnold Scrambling (Happens first on original layout for geometric shattering)
    # Wait, the user asked for:
    # 1. SVD
    # 2. Block Matrix
    # 3. Arnold
    # The order requested: [Layer 1] SVD -> [Layer 2] Matrix -> [Layer 3] Arnold
    # Let's do that exactly.
    
    # LAYER 1: SVD
    svd_encrypted = np.zeros_like(original_arr, dtype=float)
    for i in range(3):
        svd_encrypted[:, :, i] = encrypt_channel_svd(original_arr[:, :, i], k1, k2, secret_key)
        
    # CRITICAL: SVD operates in Floats, but PNG/Modulo Matrix Math operates strictly on Integers [0,255].
    # Lock matrix into integers now to prevent matrix_inverse from exponentially amplifying missing float decimals during decryption.
    svd_encrypted = np.clip(np.round(svd_encrypted), 0, 255).astype(np.uint8)
        
    # LAYER 2: Block Matrix
    matrix_encrypted = None
    m_pad_h, m_pad_w = 0, 0
    
    channels = []
    for i in range(3):
        enc_channel, p_h, p_w = encrypt_channel_matrix(svd_encrypted[:, :, i], matrix_key)
        channels.append(enc_channel)
        m_pad_h, m_pad_w = p_h, p_w
        
    matrix_encrypted = np.stack(channels, axis=-1)
    
    # LAYER 3: Arnold Cat Map
    # Must be perfectly square and Arnold doesn't change dims.
    padded_for_arnold, a_orig_h, a_orig_w = pad_to_square(matrix_encrypted)
    
    # Layer 3 applies Arnold Map across all color channels automatically
    arnold_encrypted = arnold_cat_map_encrypt(padded_for_arnold, arnold_iterations)
        
    final_arr = arnold_encrypted
    
    # Generate Metrics
    # Resize final matrix to original purely for metric evaluation against original image base pixels
    # Clip and convert to uint8 right here to avoid intense mathematical hashing on large float arrays!
    metric_overlay = np.clip(final_arr[:original_arr.shape[0], :original_arr.shape[1], :], 0, 255).astype(np.uint8)
    metrics = generate_full_metrics(original_arr, metric_overlay)
    
    return {
        "image_base64": encode_img_to_base64(final_arr),
        "m_pad_h": int(m_pad_h),
        "m_pad_w": int(m_pad_w),
        "a_orig_h": int(a_orig_h),
        "a_orig_w": int(a_orig_w),
        "metrics": metrics
    }

def decrypt_pipeline(file_content, k1, k2, secret_key, matrix_key, arnold_iterations, m_pad_h, m_pad_w, a_orig_h, a_orig_w):
    image = Image.open(io.BytesIO(file_content)).convert("RGB")
    encrypted_arr = np.array(image, dtype=float)
    
    try:
        matrix_mod_inverse(matrix_key, 256)
    except Exception as e:
        raise ValueError("Invalid Matrix Key during decryption check.")
    
    # REVERSE LAYER 3: Arnold Cat Map applies simultaneously across channels
    arnold_decrypted = arnold_cat_map_decrypt(encrypted_arr, arnold_iterations)
        
    # Fallback to image dimensions if padding state was lost/not provided by user
    if a_orig_h == 0 or a_orig_w == 0:
        a_orig_h, a_orig_w = encrypted_arr.shape[0], encrypted_arr.shape[1]
        
    # Crop Arnold padding
    unpadded_arnold = arnold_decrypted[:a_orig_h, :a_orig_w, :]
    
    # REVERSE LAYER 2: Block Matrix
    matrix_decrypted = None
    channels = []
    for i in range(3):
        dec_channel = decrypt_channel_matrix(unpadded_arnold[:, :, i], matrix_key, m_pad_h, m_pad_w)
        channels.append(dec_channel)
        
    matrix_decrypted = np.stack(channels, axis=-1)
    
    # REVERSE LAYER 1: SVD
    svd_decrypted = np.zeros_like(matrix_decrypted)
    for i in range(3):
        svd_decrypted[:, :, i] = decrypt_channel_svd(matrix_decrypted[:, :, i], k1, k2, secret_key)
        
    final_arr = svd_decrypted
    
    return {
        "image_base64": encode_img_to_base64(final_arr)
    }
