import numpy as np
from PIL import Image

matrix_key = np.array([[93, 201], [144, 57]])
img_array = np.random.randint(200, 255, (400, 400, 3), dtype=np.uint8)

bh, bw = 400, 400
A_blocks = img_array.reshape(bh // 2, 2, bw // 2, 2, 3).transpose(0, 2, 4, 1, 3) 
# Wait, this reshapes incorrectly. Let's do a simple loop test to see average variance.

x = np.array([[255, 255], [255, 255]])
y = np.matmul(matrix_key, x) % 256
print("255 ->", y)

x2 = np.array([[254, 254], [254, 254]])
y2 = np.matmul(matrix_key, x2) % 256
print("254 ->", y2)
