import requests
import io
from PIL import Image
import numpy as np

img = Image.fromarray(np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8), "RGB")
buffer = io.BytesIO()
img.save(buffer, format="PNG")

try:
    print("Testing 1, 2, 3, 4 (Even determinant)...")
    res = requests.post("http://localhost:8000/encrypt", files={'file': ('test.png', buffer.getvalue(), 'image/png')}, data={'svd_key': 0.5, 'm1': 1, 'm2': 2, 'm3': 3, 'm4': 4})
    print(res.status_code, res.text)
except Exception as e:
    print("Error:", e)
