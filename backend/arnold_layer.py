import numpy as np

def pad_to_square(image_array):
    """
    Pads an image array (H, W, C) so that H == W with zeros.
    Also returns original dimensions to crop back later.
    """
    h, w, c = image_array.shape
    max_dim = max(h, w)
    
    pad_h = max_dim - h
    pad_w = max_dim - w
    
    padded = np.pad(image_array, ((0, pad_h), (0, pad_w), (0, 0)), mode='constant')
    return padded, h, w

def arnold_cat_map_encrypt(image_array, iterations):
    """
    Encrypts a perfect square image array using Arnold Cat Map iterations.
    x' = (x + y) mod N
    y' = (x + 2y) mod N
    """
    h, w, c = image_array.shape
    if h != w:
        raise ValueError("Arnold Cat Map mapping requires a perfectly square matrix.")
        
    N = h
    current_img = image_array.copy()
    temp_img = np.zeros_like(current_img)
    
    # Create coordinate grids
    x_idx, y_idx = np.meshgrid(np.arange(N), np.arange(N), indexing='ij')
    new_x, new_y = x_idx, y_idx
    
    for _ in range(iterations):
        nx = (new_x + new_y) % N
        ny = (new_x + 2 * new_y) % N
        new_x, new_y = nx, ny
        
    temp_img[new_x, new_y] = current_img[x_idx, y_idx]
    return temp_img

def arnold_cat_map_decrypt(image_array, iterations):
    """
    Inverse Arnold Cat Map:
    x = (2x' - y') mod N
    y = (-x' + y') mod N
    """
    h, w, c = image_array.shape
    if h != w:
        raise ValueError("Arnold Cat Map mapping requires a perfectly square matrix.")
        
    N = h
    current_img = image_array.copy()
    temp_img = np.zeros_like(current_img)
    
    x_idx, y_idx = np.meshgrid(np.arange(N), np.arange(N), indexing='ij')
    orig_x, orig_y = x_idx, y_idx
    
    for _ in range(iterations):
        nx = (2 * orig_x - orig_y) % N
        ny = (-orig_x + orig_y) % N
        orig_x, orig_y = nx, ny
        
    temp_img[orig_x, orig_y] = current_img[x_idx, y_idx]
    return temp_img
