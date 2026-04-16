import requests

with open("dummy.png", "wb") as f:
    import numpy as np
    from PIL import Image
    # 4000x3000
    img = Image.fromarray(np.random.randint(0, 255, (3000, 4000, 3), dtype=np.uint8), "RGB")
    img.save(f, format="PNG")

print("Sending request...")
response = requests.post(
    "http://localhost:8000/encrypt",
    files={"file": ("dummy.png", open("dummy.png", "rb"), "image/png")},
    data={
        "svd_key": "0.5",
        "m1": "3", "m2": "2", "m3": "7", "m4": "5"
    }
)
print(response.status_code)
if response.status_code == 200:
    data = response.json()
    print(len(data.get("image_base64", "")))
else:
    print(response.text)
