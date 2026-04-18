import json
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from encryption import encrypt_pipeline, decrypt_pipeline

app = FastAPI(title="Triple-Layer Multi-Stage Image Encryption")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "system": "Triple Layer Crypto"}

@app.post("/encrypt")
async def encrypt(
    file: UploadFile = File(...),
    k1: float = Form(...),
    k2: float = Form(...),
    secret_key: str = Form(...),
    matrix_key: str = Form(...),
    arnold_iterations: int = Form(...)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    try:
        matrix_data = json.loads(matrix_key)
        matrix = np.array(matrix_data)
        if matrix.ndim != 2 or matrix.shape[0] != matrix.shape[1]:
            raise ValueError("Matrix key must be a square NXN structure.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid matrix structure: {e}")
        
    content = await file.read()
    try:
        res = encrypt_pipeline(content, k1, k2, secret_key, matrix, arnold_iterations)
        return res
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/decrypt")
async def decrypt(
    file: UploadFile = File(...),
    k1: float = Form(...),
    k2: float = Form(...),
    secret_key: str = Form(...),
    matrix_key: str = Form(...),
    arnold_iterations: int = Form(...),
    m_pad_h: int = Form(...),
    m_pad_w: int = Form(...),
    a_orig_h: int = Form(...),
    a_orig_w: int = Form(...)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    try:
        matrix_data = json.loads(matrix_key)
        matrix = np.array(matrix_data)
        if matrix.ndim != 2 or matrix.shape[0] != matrix.shape[1]:
            raise ValueError("Matrix key must be a square NXN structure.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid matrix structure: {e}")
        
    content = await file.read()
    try:
        res = decrypt_pipeline(content, k1, k2, secret_key, matrix, arnold_iterations, m_pad_h, m_pad_w, a_orig_h, a_orig_w)
        return res
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
