import numpy as np

def encrypt_channel_svd(channel_matrix, k1, k2, secret_key):
    """
    Encrypt a single image channel using SVD and key-dependent noise.
    Returns the encrypted matrix and the noise generated, for reconstruction.
    """
    # 1. Perform SVD
    U, S, Vt = np.linalg.svd(channel_matrix, full_matrices=False)
    
    # 2. Generate key-dependent noise
    # We must seed based on secret_key and the channel shape to ensure uniqueness but repeatability
    np.random.seed(int(secret_key) % (2**32 - 1))
    noise = np.random.randint(0, 20, size=S.shape)
    
    # 3. Encrypt singular values
    S_enc = (S * k1) + k2 + noise
    
    # Reconstruct matrix
    encoded_matrix = np.dot(U, np.dot(np.diag(S_enc), Vt))
    
    return encoded_matrix

def decrypt_channel_svd(encoded_matrix, k1, k2, secret_key):
    """
    Decrypt a single image channel by undoing the SVD mutation.
    """
    # 1. Strip the structure manually
    U, S_enc, Vt = np.linalg.svd(encoded_matrix, full_matrices=False)
    
    # 2. Regenerate exact same noise via deterministic seed
    np.random.seed(int(secret_key) % (2**32 - 1))
    noise = np.random.randint(0, 20, size=S_enc.shape)
    
    # 3. Inverse mathematical operation
    S_dec = (S_enc - noise - k2) / k1
    
    # 4. Reconstruct original image shape
    decoded_matrix = np.dot(U, np.dot(np.diag(S_dec), Vt))
    
    return decoded_matrix
