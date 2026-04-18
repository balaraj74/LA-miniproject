# Advanced Triple-Layer Image Encryption System

A full-stack, enterprise-grade cryptographic web application designed to securely encrypt and decrypt strict image models using a robust triple-layer algorithm involving Singular Value Decomposition (SVD), NxN Modular Arithmetic Matrix Transformations, and Arnold Cat Map chaotic pixel permutations.

## Features & Cryptographic Layers
- **Frontend Dashboard**: Clean, intuitive Next.js 14 UI with TailwindCSS. Automatically tracks metrics in real-time using `recharts`.
- **Backend Infrastructure**: Extensible Python endpoints structured over FastAPI for high-throughput tensor calculations.
- **Layer 1 - SVD Modulation**: Performs Singular Value Decomposition on individual color channels. Morphs the mathematical weights of the image with a scalable key ($k_1$), translational shift ($k_2$), and a deterministically seeded random spatial noise generator.
- **Layer 2 - N-Dimensional Matrix Transformation**: Groups RGB color pixels into scalable $4 \times 4$ or $8 \times 8$ mathematical blocks and computes Hill-Cipher permutations using strict exact-integer Extended Euclidean Gauss-Jordan elimination Modulo 256. 
- **Layer 3 - Chaos Permutations (Arnold Cat Map)**: Performs iterative geometric shuffling using purely Torus-bound equations. Visually ruins image correlation arrays and scatters distinct visual features across the entire square geometric bounds.
- **Security Dashboard**: Automatically evaluates standard modern cryptographic standards on images uploaded:
  - **NPCR** (~99.6% optimal): Verifies Avalanche effect.
  - **UACI** (~33% optimal): Measures unified average changing intensity per pixel.
  - **Shannon Entropy** (~8.0 optimal): Verifies output uniformity equivalent to random white-noise distributions.
  - **Pixel Correlation:** Assesses adjacent predictability horizontally, vertically, and diagonally.

## 1. Local Setup Instructions

### Backend (Python/FastAPI)
1. Navigate into the backend folder:
   ```bash
   cd backend
   ```
2. Create standard virtual environment (Recommended):
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
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

## 2. Advanced Explanations & Security Analysis

### Multi-Dimensional Input Validity:
The custom Key Matrix ($K$) must be mathematically invertible *modulo 256*.
Because 256 is an exponent of 2, the determinant of your $N \times N$ matrix must be **odd**.
If an incorrect array mapping is provided, the backend API uses precise numerical bounds to reject and abort the operation before data corruption.

### Chaotic Seed Iterations
The system combines three completely independent keys:
1. $2^{64}$ mathematical vector configuration for Matrix Key
2. Integer iteration loops for Arnold Cat
3. A PRNG deterministic seed for generating non-linear noise mapping.

This ensures brute forcing is functionally mathematically impossible without breaching the NP-Hard boundaries inherent in multi-layered lattice-based assumptions.

---

## 3. Production Hosting with GitHub Actions

This repository now includes CI/CD workflows for:
- Frontend deployment to **Vercel**: `.github/workflows/deploy-frontend-vercel.yml`
- Backend deployment to **Render**: `.github/workflows/deploy-backend-render.yml`

### 3.1 Backend on Render (One-time setup)

1. Push this repo to GitHub.
2. In Render, create a new **Web Service** from your GitHub repository.
3. Use `render.yaml` at the repository root (recommended), or set manually:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Health Check Path: `/`
4. After service creation, copy:
   - Public backend URL (example: `https://your-backend.onrender.com`)
   - Render **Deploy Hook URL** from service settings.

### 3.2 Frontend on Vercel (One-time setup)

1. In Vercel, import this GitHub repository.
2. Set project root directory to `frontend`.
3. Generate a Vercel token from Vercel account settings.
4. Link local project once (to obtain IDs):
   ```bash
   cd frontend
   npx vercel link
   cat .vercel/project.json
   ```
   Copy `orgId` and `projectId` values.

### 3.3 Add GitHub Repository Secrets

In GitHub: **Settings -> Secrets and variables -> Actions -> New repository secret**

Required secrets:
- `VERCEL_TOKEN`: Personal token from Vercel
- `VERCEL_ORG_ID`: Vercel org/team ID
- `VERCEL_PROJECT_ID`: Vercel project ID for this frontend
- `NEXT_PUBLIC_API_URL`: Render backend URL (example: `https://your-backend.onrender.com`)
- `RENDER_DEPLOY_HOOK_URL`: Deploy hook URL from Render service

Optional secret:
- `BACKEND_HEALTHCHECK_URL`: Health endpoint (example: `https://your-backend.onrender.com/`)

### 3.4 Deployment Behavior

- Push changes under `frontend/**` to `main` or `master` -> deploy frontend to Vercel.
- Push changes under `backend/**` to `main` or `master` -> trigger backend deploy on Render.
- You can also run either workflow manually from the GitHub Actions tab using `workflow_dispatch`.
