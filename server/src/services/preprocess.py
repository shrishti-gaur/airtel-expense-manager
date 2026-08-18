import sys
import os
import cv2
import numpy as np
import json
import time

def order_points(pts):
    # pts: (4, 2). Sort coordinates robustly:
    # 1. Sort by X-coordinate to separate left-most and right-most points
    xSorted = pts[np.argsort(pts[:, 0]), :]
    leftMost = xSorted[:2, :]
    rightMost = xSorted[2:, :]
    
    # 2. Sort left-most by Y to identify Top-Left and Bottom-Left
    leftMost = leftMost[np.argsort(leftMost[:, 1]), :]
    (tl, bl) = leftMost
    
    # 3. Sort right-most by Y to identify Top-Right and Bottom-Right
    rightMost = rightMost[np.argsort(rightMost[:, 1]), :]
    (tr, br) = rightMost
    
    return np.array([tl, tr, br, bl], dtype="float32")

def get_perspective_transform(img, pts):
    rect = order_points(pts)
    (tl, tr, br, bl) = rect
    
    # Width computation
    widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
    widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
    maxWidth = max(int(widthA), int(widthB))
    
    # Height computation
    heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
    heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
    maxHeight = max(int(heightA), int(heightB))
    
    dst = np.array([
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]
    ], dtype="float32")
    
    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(img, M, (maxWidth, maxHeight))
    return warped

def smart_crop(img, gray):
    h, w = img.shape[:2]
    
    # Adaptive thresholding to segment text characters cleanly
    thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 9)
    
    # Morphological dilation: connect characters horizontally first (text lines)
    kernel_h = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 4))
    dilated = cv2.dilate(thresh, kernel_h, iterations=1)
    
    # Connect lines vertically (blocks)
    kernel_v = cv2.getStructuringElement(cv2.MORPH_RECT, (4, 15))
    dilated = cv2.dilate(dilated, kernel_v, iterations=1)
    
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    x_min, y_min = w, h
    x_max, y_max = 0, 0
    has_valid_boxes = False
    
    for c in contours:
        area = cv2.contourArea(c)
        if area > 450:
            x, y, cw, ch = cv2.boundingRect(c)
            
            # Filter out background border noise (e.g. fingers, phone cases, wood desk edges)
            if x <= 5 or y <= 5 or (x + cw) >= w - 5 or (y + ch) >= h - 5:
                continue
                
            # Filter out long solid horizontal divider lines (table boundaries)
            if cw > w * 0.95 and ch < 18:
                continue
                
            x_min = min(x_min, x)
            y_min = min(y_min, y)
            x_max = max(x_max, x + cw)
            y_max = max(y_max, y + ch)
            has_valid_boxes = True
            
    if has_valid_boxes:
        pad = 20
        y_min = max(0, y_min - pad)
        x_min = max(0, x_min - pad)
        y_max = min(h, y_max + pad)
        x_max = min(w, x_max + pad)
        
        # Verify the crop has a valid size and covers at least 15% of the original image area
        crop_w = x_max - x_min
        crop_h = y_max - y_min
        if crop_w > 150 and crop_h > 150 and (crop_w * crop_h) > (w * h * 0.15):
            return img[y_min:y_max, x_min:x_max], True
            
    return img, False

def deskew(img, gray):
    # Detect horizontal text-lines rotation angle and deskew it
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(edges, 1, np.pi/180, 100, minLineLength=100, maxLineGap=12)
    angles = []
    if lines is not None:
        for line in lines:
            x1, y1, x2, y2 = line[0]
            angle = np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi
            if -45 < angle < 45:
                angles.append(angle)
                
    if len(angles) > 0:
        median_angle = np.median(angles)
        if abs(median_angle) > 0.4:
            h, w = img.shape[:2]
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
            # Warp affine with white background to prevent black borders from confusing OCR
            rotated = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=(255, 255, 255))
            return rotated, True, median_angle
            
    return img, False, 0.0

def preprocess_image(input_path, output_path):
    start_time = time.time()
    
    # Read the image
    img = cv2.imread(input_path)
    if img is None:
        return {"success": False, "error": "Could not read image"}

    h_orig, w_orig = img.shape[:2]
    original_size = [w_orig, h_orig]
    
    gray_initial = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # --- 1. Optical Checks (Blur and Light levels) ---
    laplacian_var = cv2.Laplacian(gray_initial, cv2.CV_64F).var()
    mean_brightness = np.mean(gray_initial)
    
    is_blurry = laplacian_var < 15.0
    is_dark = mean_brightness < 60.0
    
    # --- 2. Receipt Boundary Detection & Perspective Warp ---
    cropped = False
    gray_blurred = cv2.GaussianBlur(gray_initial, (5, 5), 0)
    edged = cv2.Canny(gray_blurred, 40, 160)
    
    contours, _ = cv2.findContours(edged.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    
    receipt_contour = None
    for c in contours[:10]:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4 and cv2.contourArea(c) > (w_orig * h_orig * 0.10):
            receipt_contour = approx
            break
            
    # Warp perspective if contour is found
    if receipt_contour is not None:
        try:
            img = get_perspective_transform(img, receipt_contour)
            gray_current = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            cropped = True
        except Exception as e:
            # Fallback to smart cropping if perspective transform fails
            img, cropped = smart_crop(img, gray_initial)
            gray_current = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        # Fallback to smart cropping based on text bounding box bounds
        img, cropped = smart_crop(img, gray_initial)
        gray_current = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
    # --- 3. Deskew Rotation Alignment ---
    img, rotated, skew_angle = deskew(img, gray_current)
    gray_current = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # --- 4. Generate Preprocessing Variants ---
    h_curr, w_curr = img.shape[:2]
    
    # Base Variant Paths
    v1_path = output_path
    v2_path = f"{output_path}.v2.jpg"
    v3_path = f"{output_path}.v3.jpg"
    v4_path = f"{output_path}.v4.jpg"
    
    variants = []
    
    # --- VARIANT 1: Enhanced Grayscale (Adaptive CLAHE + bilateral filtering) ---
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    v1_gray = clahe.apply(gray_current)
    v1_denoised = cv2.bilateralFilter(v1_gray, 9, 65, 65)
    gaussian_v1 = cv2.GaussianBlur(v1_denoised, (0, 0), 2.0)
    v1_sharpened = cv2.addWeighted(v1_denoised, 1.6, gaussian_v1, -0.6, 0)
    cv2.imwrite(v1_path, v1_sharpened)
    variants.append({"id": "v1", "path": v1_path})
    
    # --- VARIANT 2: Binarized Adaptive (Ideal for shadow removal / uneven low-light) ---
    v2_gray = cv2.bilateralFilter(gray_current, 7, 50, 50)
    v2_binarized = cv2.adaptiveThreshold(
        v2_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY, 29, 11
    )
    cv2.imwrite(v2_path, v2_binarized)
    variants.append({"id": "v2", "path": v2_path})
    
    # --- VARIANT 3: Upscaled Crisp (Optimized for small text / small dimensions) ---
    # Upscale 2.5x if small, otherwise upscale 1.5x
    scale_factor = 2.5 if (w_curr < 1200 or h_curr < 1200) else 1.5
    target_w = int(w_curr * scale_factor)
    target_h = int(h_curr * scale_factor)
    
    v3_resized = cv2.resize(img, (target_w, target_h), interpolation=cv2.INTER_CUBIC)
    v3_gray = cv2.cvtColor(v3_resized, cv2.COLOR_BGR2GRAY)
    v3_denoised = cv2.bilateralFilter(v3_gray, 9, 75, 75)
    gaussian_v3 = cv2.GaussianBlur(v3_denoised, (0, 0), 2.5)
    v3_sharpened = cv2.addWeighted(v3_denoised, 1.7, gaussian_v3, -0.7, 0)
    cv2.imwrite(v3_path, v3_sharpened)
    variants.append({"id": "v3", "path": v3_path})
    
    # --- VARIANT 4: Blurry Recovery Fallback (Created if diagnostics flag blur or low-light) ---
    # Implements stronger high-contrast thresholding on highly upscaled frame
    created_v4 = False
    if is_blurry or is_dark:
        v4_resized = cv2.resize(img, (w_curr * 3, h_curr * 3), interpolation=cv2.INTER_CUBIC)
        v4_gray = cv2.cvtColor(v4_resized, cv2.COLOR_BGR2GRAY)
        
        # High pass sharpening kernel
        kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
        v4_sharpened = cv2.filter2D(v4_gray, -1, kernel)
        
        # Adaptive binarization with tight block size to isolate blurry character strokes
        v4_binarized = cv2.adaptiveThreshold(
            v4_sharpened, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 17, 8
        )
        cv2.imwrite(v4_path, v4_binarized)
        variants.append({"id": "v4", "path": v4_path})
        created_v4 = True
        
    elapsed = time.time() - start_time
    
    return {
        "success": True,
        "original_size": original_size,
        "new_size": [w_curr, h_curr],
        "is_blurry": bool(is_blurry),
        "is_dark": bool(is_dark),
        "blur_variance": float(laplacian_var),
        "mean_brightness": float(mean_brightness),
        "variants": variants,
        "cropped": bool(cropped),
        "rotated": bool(rotated),
        "skew_angle": float(skew_angle),
        "created_v4": bool(created_v4),
        "processing_time_ms": int(elapsed * 1000)
    }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Usage: python3 preprocess.py <input> <output>"}))
        sys.exit(1)
        
    in_path = sys.argv[1]
    out_path = sys.argv[2]
    
    res = preprocess_image(in_path, out_path)
    print(json.dumps(res))
