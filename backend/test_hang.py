import numpy as np
for i in range(100):
    A = np.random.randint(0, 255, (800, 800))
    U, S, Vt = np.linalg.svd(A, full_matrices=False)
print("Finished 100 SVDs")
