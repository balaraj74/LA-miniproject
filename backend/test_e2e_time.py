import time
from PIL import Image
import numpy as np
import io
import encryption

# Create an 8K image
img = Image.fromarray(np.random.randint(0, 255, (4000, 4000, 3), dtype=np.uint8), "RGB")
buffer = io.BytesIO()
img.save(buffer, format="PNG")
img_bytes = buffer.getvalue()
print("Image size:", len(img_bytes))

start = time.time()
res = encryption.encrypt_image(img_bytes, 0.5, 3, 2, 7, 5)
enc_time = time.time() - start
print("Encrypt time:", enc_time)

enc_img_data = res['image_base64'].split(',')[1]
import base64
enc_bytes = base64.b64decode(enc_img_data)
start = time.time()
res_dec = encryption.decrypt_image(enc_bytes, 0.5, 3, 2, 7, 5, res['pad_h'], res['pad_w'])
dec_time = time.time() - start
print("Decrypt time:", dec_time)
