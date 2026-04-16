from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from encryption import encrypt_image, decrypt_image

app = FastAPI(title="SVD + Matrix Transform Image Encryption")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok"}

@app.post("/encrypt")
async def encrypt(
    file: UploadFile = File(...),
    svd_key: float = Form(...),
    m1: int = Form(...),
    m2: int = Form(...),
    m3: int = Form(...),
    m4: int = Form(...)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    content = await file.read()
    try:
        res = encrypt_image(content, svd_key, m1, m2, m3, m4)
        return res
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/decrypt")
async def decrypt(
    file: UploadFile = File(...),
    svd_key: float = Form(...),
    m1: int = Form(...),
    m2: int = Form(...),
    m3: int = Form(...),
    m4: int = Form(...),
    pad_h: int = Form(0),
    pad_w: int = Form(0)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    content = await file.read()
    try:
        res = decrypt_image(content, svd_key, m1, m2, m3, m4, pad_h, pad_w)
        return res
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
