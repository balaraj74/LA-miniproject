import numpy as np
from collections import Counter
import math

def calculate_histogram(image_array):
    """Returns histogram data (0-255) for RGB channels."""
    r_hist, _ = np.histogram(image_array[:, :, 0], bins=256, range=(0, 256))
    g_hist, _ = np.histogram(image_array[:, :, 1], bins=256, range=(0, 256))
    b_hist, _ = np.histogram(image_array[:, :, 2], bins=256, range=(0, 256))
    return r_hist.tolist(), g_hist.tolist(), b_hist.tolist()

def calculate_entropy(image_array):
    """Shannon Entropy for a 2D or 3D image array."""
    flat_img = image_array.flatten()
    length = len(flat_img)
    counts = Counter(flat_img)
    
    entropy = 0.0
    for count in counts.values():
        p = count / length
        entropy -= p * math.log2(p)
    return entropy

def calculate_npcr(img1, img2):
    """Number of Pixels Change Rate."""
    if img1.shape != img2.shape:
        # If padded, crop to smallest common area for comparison
        h = min(img1.shape[0], img2.shape[0])
        w = min(img1.shape[1], img2.shape[1])
        img1 = img1[:h, :w]
        img2 = img2[:h, :w]
        
    diff = np.where(img1 != img2, 1, 0)
    npcr = np.sum(diff) / img1.size
    return npcr * 100

def calculate_uaci(img1, img2):
    """Unified Average Changing Intensity."""
    if img1.shape != img2.shape:
        h = min(img1.shape[0], img2.shape[0])
        w = min(img1.shape[1], img2.shape[1])
        img1 = img1[:h, :w]
        img2 = img2[:h, :w]
        
    img1_float = img1.astype(float)
    img2_float = img2.astype(float)
    
    diff = np.abs(img1_float - img2_float)
    uaci = np.sum(diff) / (img1.size * 255)
    return uaci * 100

def calculate_correlation(image_array, direction='horizontal', sample_size=3000):
    """Correlation coefficient of adjacent pixels."""
    h, w = image_array.shape[:2]
    # To save time, just do it on a flattened grayscaled array or a single channel. We do red channel.
    img_layer = image_array[:, :, 0]
    
    max_samples = (h-1) * (w-1)
    if sample_size > max_samples:
        sample_size = max_samples
        
    np.random.seed(42)  # Fixed seed for consistent metric evaluation
    
    # Pick random coordinates
    xs = np.random.randint(0, h - 1, sample_size)
    ys = np.random.randint(0, w - 1, sample_size)
    
    # Generate vectors based on direction
    v1 = img_layer[xs, ys].astype(float)
    
    if direction == 'horizontal':
        v2 = img_layer[xs, ys + 1].astype(float)
    elif direction == 'vertical':
        v2 = img_layer[xs + 1, ys].astype(float)
    elif direction == 'diagonal':
        v2 = img_layer[xs + 1, ys + 1].astype(float)
    else:
        v2 = v1
        
    # Calculate Correlation Coefficient
    mean_v1 = np.mean(v1)
    mean_v2 = np.mean(v2)
    
    cov = np.mean((v1 - mean_v1) * (v2 - mean_v2))
    std_v1 = np.std(v1)
    std_v2 = np.std(v2)
    
    if std_v1 == 0 or std_v2 == 0:
        return 0.0
        
    return cov / (std_v1 * std_v2)

def generate_full_metrics(original_arr, encrypted_arr):
    return {
        "entropy_original": calculate_entropy(original_arr),
        "entropy_encrypted": calculate_entropy(encrypted_arr),
        "npcr": calculate_npcr(original_arr, encrypted_arr),
        "uaci": calculate_uaci(original_arr, encrypted_arr),
        "correlation_original": {
            "horizontal": calculate_correlation(original_arr, 'horizontal'),
            "vertical": calculate_correlation(original_arr, 'vertical'),
            "diagonal": calculate_correlation(original_arr, 'diagonal'),
        },
        "correlation_encrypted": {
            "horizontal": calculate_correlation(encrypted_arr, 'horizontal'),
            "vertical": calculate_correlation(encrypted_arr, 'vertical'),
            "diagonal": calculate_correlation(encrypted_arr, 'diagonal'),
        }
    }
