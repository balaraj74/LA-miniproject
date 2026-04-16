import numpy as np

img = np.random.randint(0, 256, (10, 10)).astype(float)

U, S, Vt = np.linalg.svd(img, full_matrices=False)
S_enc = S * 0.5
A = np.dot(U, np.dot(np.diag(S_enc), Vt))
A_int = np.clip(A, 0, 255).astype(int)

# Decrypt
U, S, Vt = np.linalg.svd(A_int.astype(float), full_matrices=False)
S_dec = S / 0.5
A_dec = np.dot(U, np.dot(np.diag(S_dec), Vt))

diff1 = A_dec - A_int / 0.5
print("Max diff against simple multiplier:", np.max(np.abs(diff1)))
