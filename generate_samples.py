import os
from PIL import Image, ImageDraw
import numpy as np

os.makedirs("test_images", exist_ok=True)

# 1. Simple Color Blocks
img1 = Image.new('RGB', (256, 256), color='white')
draw1 = ImageDraw.Draw(img1)
draw1.rectangle([50, 50, 200, 200], fill=(255, 0, 0))
draw1.ellipse([100, 100, 150, 150], fill=(0, 255, 0))
img1.save("test_images/sample1_shapes.png")

# 2. Gradient Image
arr2 = np.zeros((256, 256, 3), dtype=np.uint8)
for i in range(256):
    for j in range(256):
        arr2[i, j] = [i, j, (i+j)//2]
img2 = Image.fromarray(arr2)
img2.save("test_images/sample2_gradient.png")

# 3. Random Noise Image
arr3 = np.random.randint(0, 256, (256, 256, 3), dtype=np.uint8)
img3 = Image.fromarray(arr3)
img3.save("test_images/sample3_noise.png")

print("Created 3 sample images in 'test_images/' directory.")
