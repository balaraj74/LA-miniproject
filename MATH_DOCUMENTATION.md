# Mathematical Documentation of Triple-Layer Scheme

## Layer 1: Singular Value Decomposition (SVD) Modulation

An image channel is mathematically represented as a 2D matrix $A$ where $A_{i,j} \in [0, 255]$.
Singular Value Decomposition factorizes this matrix into:

$$A = U \Sigma V^T$$

Where:
- $U$ is an orthogonal matrix of size $m \times m$
- $\Sigma$ is a diagonal matrix containing the singular values of $A$.
- $V^T$ is an orthogonal matrix of size $n \times n$

**Plain English Comment:**
SVD splits one image channel into 3 parts: orientation ($U$), strength ($\Sigma$), and orientation again ($V^T$).  
Encryption changes only the strength values in $\Sigma$, then rebuilds the channel.

**Small 2x2 Example:**
Take
$$
A = \begin{bmatrix} 4 & 0 \\ 0 & 2 \end{bmatrix}
$$
For this simple case, $U = I$, $V^T = I$, and $\Sigma = diag(4,2)$.  
Choose $k_1 = 2$, $k_2 = 1$, and noise $[3,1]$:
$$
\Sigma_{enc} = (\Sigma \times 2) + 1 + [3,1] = [12,6]
$$
So encrypted channel becomes:
$$
A_{enc} = \begin{bmatrix} 12 & 0 \\ 0 & 6 \end{bmatrix}
$$
During decryption:
$$
\Sigma_{dec} = \frac{[12,6]-[3,1]-1}{2} = [4,2]
$$
and we recover the original channel.

**Encryption Transformation:**
We directly mutate the singular values using two key scalers ($k_1, k_2$) and an additive noise matrix generated natively by a PRNG algorithm seeded with $K_{seed}$.
$$ \Sigma_{enc} = (\Sigma \times k_1) + k_2 + \text{Noise}(K_{seed}) $$
The matrix is reconstructed as $A_{enc} = U \Sigma_{enc} V^T$.

**Decryption:**
By holding the PRNG initial state via $K_{seed}$, the identical dimensional noise array is generated and subtracted before inversion.
$$ \Sigma_{dec} = \frac{\Sigma_{enc} - \text{Noise}(K_{seed}) - k_2}{k_1} $$

---

## Layer 2: Modular Arithmetic Block Matrices

Block transformations divide the image into mutually exclusive groupings of vectors mapped across an $N \times N$ dimensional grid representing pixel intensities relative to colors (e.g. 4x4 or 8x8 squares).

**Modulo Multiplication:**
Each image block $B$ acts as a $N \times N$ matrix. Given a distinct Key Matrix $K$ of equivalent dimensions, the transformation operates:
$$ B_{enc} = (K \times B) \pmod{256} $$

**Modulo Matrix Inverse:**
Because computations happen strictly on the finite field $Z_{256}$, traditional matrix floating-point inversion fails. For exactly reconstructing $K^{-1}$ mathematically:
$det(K)$ must be odd such that $gcd(det(K), 256) = 1$.
The inverse is computed via the Adjugate methodology:
$$ K^{-1} = det(K)^{-1}_{mod256} \times adj(K) \pmod{256} $$
$$ B = (K^{-1} \times B_{enc}) \pmod{256} $$

**Plain English Comment:**
The image is cut into small blocks. Each block is mixed using matrix multiplication and then wrapped with modulo 256 so every value stays inside valid pixel range (0 to 255).  
Decryption works only if the key matrix is invertible modulo 256.

**Small 2x2 Example:**
Let
$$
K = \begin{bmatrix} 3 & 2 \\ 5 & 7 \end{bmatrix}, \quad
B = \begin{bmatrix} 10 & 20 \\ 30 & 40 \end{bmatrix}
$$
First encrypt:
$$
K \times B = \begin{bmatrix} 90 & 140 \\ 260 & 380 \end{bmatrix}
$$
Apply modulo 256:
$$
B_{enc} = \begin{bmatrix} 90 & 140 \\ 4 & 124 \end{bmatrix}
$$
Here, $det(K)=11$ (odd), so inverse exists modulo 256.  
Using $K^{-1}$ modulo 256 on $B_{enc}$ gives back:
$$
B = \begin{bmatrix} 10 & 20 \\ 30 & 40 \end{bmatrix}
$$

---

## Layer 3: Arnold Cat Map Chaos Permutation

The Arnold Cat Map is a chaotic geometric bijection mapping of a perfectly square matrix onto itself. It shears the geometric array and wraps the geometry perfectly via bounded spatial Torus mappings.

**Forward Permutation:**
For any coordinate $(x, y)$ in an image matrix of bounded width $N$, the new coordinated $(x', y')$ is determined by:
$$ \begin{bmatrix} x' \\ y' \end{bmatrix} = \begin{bmatrix} 1 & 1 \\ 1 & 2 \end{bmatrix} \begin{bmatrix} x \\ y \end{bmatrix} \pmod{N} $$
This loop is completed continuously representing chaotic fractal iterations based on parameter input bounds.

**Inverse Iteration Retrieval:**
To uniquely pinpoint coordinate derivation dynamically backward, the inverse discrete torus transform performs:
$$ \begin{bmatrix} x \\ y \end{bmatrix} = \begin{bmatrix} 2 & -1 \\ -1 & 1 \end{bmatrix} \begin{bmatrix} x' \\ y' \end{bmatrix} \pmod{N} $$
Which analytically evaluates iteratively to:
$$ x = (2x' - y') \pmod{N} $$
$$ y = (-x' + y') \pmod{N} $$

**Plain English Comment:**
This layer does not change pixel values; it changes pixel positions.  
Think of it as shuffling coordinates in a deterministic way. The same number of inverse iterations unshuffles perfectly.

**Small Coordinate Example (N = 5):**
Start from $(x,y)=(1,2)$.
Forward map:
$$
x'=(x+y)\bmod5=(1+2)\bmod5=3
$$
$$
y'=(x+2y)\bmod5=(1+4)\bmod5=0
$$
So $(1,2) \rightarrow (3,0)$.  
Now apply inverse on $(3,0)$:
$$
x=(2x'-y')\bmod5=(6-0)\bmod5=1
$$
$$
y=(-x'+y')\bmod5=(-3+0)\bmod5=2
$$
So we return to $(1,2)$.
