import numpy as np
import math

def mod_inverse(a, m):
    """Calculates the modular multiplicative inverse of a modulo m."""
    a = a % m
    for x in range(1, m):
        if (a * x) % m == 1:
            return x
    return None

def matrix_mod_inverse(matrix, m=256):
    """
    Finds the inverse of an NxN matrix modulo m using adjugate matrix.
    Numpy floating point inaccuracies make linalg.inv dangerous for exact cryptography,
    so we calculate it using strict integers.
    For small blocks (4x4, 8x8) determinant based inversion is adequate if done carefully,
    but the safest way over pure Numpy is exact integer arithmetic.
    """
    n = matrix.shape[0]
    
    # We will use an augmented matrix approach with Gauss-Jordan elimination
    # Since numpy arrays are fixed type, we use python lists for unlimited precision integers
    aug = [list(row) + [1 if i == j else 0 for j in range(n)] for i, row in enumerate(matrix.astype(int))]
    
    for i in range(n):
        # 1. Find pivot
        pivot_val = aug[i][i] % m
        inv_pivot = mod_inverse(pivot_val, m)
        
        # If the pivot is not invertible, attempt row swap
        if inv_pivot is None:
            swapped = False
            for k in range(i + 1, n):
                if mod_inverse(aug[k][i] % m, m) is not None:
                    aug[i], aug[k] = aug[k], aug[i]
                    pivot_val = aug[i][i] % m
                    inv_pivot = mod_inverse(pivot_val, m)
                    swapped = True
                    break
            if not swapped:
                raise ValueError("Matrix is not invertible modulo 256 (Determinant is even). Please select a different matrix key.")
                
        # 2. Normalize pivot row
        for j in range(2 * n):
            aug[i][j] = (aug[i][j] * inv_pivot) % m
            
        # 3. Eliminate other rows
        for k in range(n):
            if k != i:
                factor = aug[k][i] % m
                for j in range(2 * n):
                    aug[k][j] = (aug[k][j] - factor * aug[i][j]) % m
                    
    # Extract the inverse matrix from the augmented portion
    inverse = np.array([row[n:] for row in aug], dtype=int)
    return inverse

def encrypt_channel_matrix(channel_matrix, block_matrix):
    """
    Encrypts a single color channel by cutting it into NxN blocks
    and multiplying by block_matrix Modulo 256.
    """
    N = block_matrix.shape[0]
    h, w = channel_matrix.shape
    
    # Needs to be perfectly divisible by N. Pad if necessary.
    pad_h = (N - (h % N)) % N
    pad_w = (N - (w % N)) % N
    
    if pad_h > 0 or pad_w > 0:
        padded = np.pad(channel_matrix, ((0, pad_h), (0, pad_w)), mode='constant')
    else:
        padded = channel_matrix.copy()
        
    ph, pw = padded.shape
    
    # Vectorized block multiplication
    # Shape: (ph//N, N, pw//N, N)
    blocks = padded.reshape(ph // N, N, pw // N, N)
    # Transpose to (ph//N, pw//N, N, N)
    blocks = blocks.transpose(0, 2, 1, 3)
    
    # We want to multiply block_matrix (N, N) by every individual block (N, N)
    # block_matrix is (N,N), blocks is (A, B, N, N).
    # Using np.matmul, passing block_matrix as left multiplicand:
    # np.matmul(block_matrix, blocks) will treat blocks as collection of matrices and multiply.
    # Wait, block_matrix * a block (N,N).
    # np.matmul broadcasts.
    enc_blocks = np.matmul(block_matrix, blocks) % 256
    
    # Reassemble
    enc_transposed = enc_blocks.transpose(0, 2, 1, 3)
    enc_channel = enc_transposed.reshape(ph, pw)
    
    return enc_channel, pad_h, pad_w

def decrypt_channel_matrix(encoded_matrix, block_matrix, pad_h, pad_w):
    """
    Decrypts a single color channel block-by-block using the Modulo 256 Matrix Inverse.
    """
    N = block_matrix.shape[0]
    ph, pw = encoded_matrix.shape
    
    inv_matrix = matrix_mod_inverse(block_matrix, 256)
    
    blocks = encoded_matrix.reshape(ph // N, N, pw // N, N)
    blocks = blocks.transpose(0, 2, 1, 3)
    
    dec_blocks = np.matmul(inv_matrix, blocks) % 256
    
    dec_transposed = dec_blocks.transpose(0, 2, 1, 3)
    dec_channel = dec_transposed.reshape(ph, pw)
    
    if pad_h > 0 or pad_w > 0:
        h = ph - pad_h
        w = pw - pad_w
        dec_channel = dec_channel[:h, :w]
        
    return dec_channel
