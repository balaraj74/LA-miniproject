# VIVA GUIDE: Image Encryption using SVD & Matrix Transform

Here are simple, high-impact explanations to common queries you will face during a Viva presentation of this Linear Algebra assignment.

## 1. What is the core logic behind this encryption?
**Answer:** The project uses a hybrid mathematical approach on images. Since images are basically arrays of numbers (matrices), we use two linear algebra techniques:
1. **SVD (Singular Value Decomposition):** We decompose the image channel into three matrices $U$, $\Sigma$, and $V^T$. We then multiply the singular values ($\Sigma$) by a scalar key.
2. **Matrix Transformations:** We take $2 \times 2$ pixel blocks from that modified image and multiply them by a $2 \times 2$ Key Matrix under modulo 256 arithmetic to perfectly encrypt pixels within the $0-255$ color limit limits securely.

## 2. Why do we need the 'Modulo 256' logic? Why is the determinant odd?
**Answer:** Pixel densities strictly range from integer 0 to 255. When we multiply matrices, we get numbers that exceed 255. Modulo 256 ensures they wrap around perfectly back into safe pixel boundaries. 
For decryption, we need to invert this $2 \times 2$ matrix *modulo 256*. Mathematically, a matrix is only invertible modulo $N$ if its determinant is coprime to $N$. Since $256 = 2^8$, the only numbers coprime to 256 are **odd numbers**. If the determinant is even, the matrix cannot be perfectly inverted and decrypted!

## 3. How does Decryption structurally work?
**Answer:** It applies the exact mathematical inverse. 
First, we calculate the modular inverse of our $2 \times 2$ Key Matrix and multiply it across the encrypted blocked image (modulo 256) to reverse the shuffling. Next, we run SVD again to retrieve the modified $\Sigma$ matrix, and divide it by the scalar 'SVD Key' to restore original image scaling precisely.

## 4. Why use SVD instead of just a Matrix Transform?
**Answer:** SVD acts as an extra highly dynamic layer of pseudo-encryption. Normal modular matrices are structured block encryption forms, but SVD dynamically scrambles energy matrices globally across the entire color channel. Layering them creates a complex, structurally deeper crypto-lock. 

## 5. Do we process RGB colors together?
**Answer:** No. An RGB image is a highly dense 3D matrix (Height $\times$ Width $\times$ 3). We process each channel (Red, Green, Blue) completely separately with SVD and block multiplications, then merge them back at the end.
