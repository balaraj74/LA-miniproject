import numpy as np

def matrix_mod_inverse(matrix, modulus):
    det = int(round(np.linalg.det(matrix)))
    det_mod = det % modulus
    def egcd(a, b):
        if a == 0: return (b, 0, 1)
        g, y, x = egcd(b % a, a)
        return (g, x - (b // a) * y, y)
    def modinv(a, m):
        g, x, y = egcd(a, m)
        if g != 1: raise ValueError("Not invertible")
        return x % m
    modinv(det_mod, modulus)

for _ in range(100):
   mat = np.random.randint(0, 255, (4, 4))
   try:
      matrix_mod_inverse(mat, 256)
      print(mat.tolist())
      break
   except:
      pass
