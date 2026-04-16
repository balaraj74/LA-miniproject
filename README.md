# Image Encryption & Decryption using SVD + Matrix Transformations

A full-stack web application designed for securely encrypting and decrypting strict image models using combining aspects of Linear Algebra: Singular Value Decomposition (SVD) and Matrix Multiplications modular arithmetics. 

## Features
- **Frontend**: Clean, intuitive Next.js 14 App Router UI with TailwindCSS.
- **Backend**: Fast Python calculations supported by FastAPI + NumPy + Pillow.
- **SVD Processing**: Modifies image parameters via scaling the singular value ($\Sigma$) elements.
- **Matrix Transformation Mod 256**: Uses a 2x2 modular arithmetic matrix key block multiplier for strict RGB layer encryption securely within 8-bit confines.
- **Dual Pipeline Visuals**: Encrypt from source, download it securely as PNG, then recreate perfectly with proper modular inverse logic.

## 1. Local Setup Instructions

### Backend (Python/FastAPI)
1. Navigate into the backend folder:
   ```bash
   cd backend
   ```
2. Create standard virtual environment (Recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install strict mathematical dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the API Server explicitly:
   ```bash
   python main.py
   # Or manually: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend (Next.js)
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install npm node modules:
   ```bash
   npm install
   ```
3. Boot the development server:
   ```bash
   npm run dev
   ```
4. Visit `http://localhost:3000` in your web browser.

---

## 2. Advanced Explanations

### Testing the Invertibility:
The custom Matrix Key must be mathematically invertible *modulo 256*.
Because 256 is an exponent of 2, the determinant ($ad - bc$) must be **odd**.
Example Valid Keys (Determinant is odd):
* 3, 2, 7, 5 (Det = 15 - 14 = 1) ✅ 
* 3, 1, 1, 2 (Det = 6 - 1 = 5) ✅

Example Invalid Keys:
* 2, 4, 3, 6 (Det = 12 - 12 = 0) ❌
* 3, 1, 1, 3 (Det = 9 - 1 = 8) ❌ The system will gracefully catch and warn regarding invalid structures!
