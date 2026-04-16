import numpy as np

def modular_inverse_matrix(matrix):
    a, b = int(matrix[0, 0]), int(matrix[0, 1])
    c, d = int(matrix[1, 0]), int(matrix[1, 1])
    det = (a * d - b * c) % 256
    det_inv = pow(det, -1, 256)
    adj = np.array([[d, -b], [-c, a]]) % 256
    return (det_inv * adj) % 256

M = np.array([[93, 201], [144, 57]])
M_inv = modular_inverse_matrix(M)

B = np.array([[[[10, 20], [30, 40]]]])  # shape (1,1,2,2)
print("Original B:\n", B)

E = np.matmul(M, B) % 256
print("Encrypted B:\n", E)

D = np.matmul(M_inv, E) % 256
print("Decrypted B:\n", D)

