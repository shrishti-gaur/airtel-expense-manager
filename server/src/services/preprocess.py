import sys
import os
import cv2
import numpy as np
import json
import time

def preprocess_image(input_path, output_path):
    start_time = time.time()
    
    # Read the image
    img = cv2.imread(input_path)
    if img is None:
        return {"success": False, "error": "Could not read image"}

    h, w = img.shape[:2]
    original_size = [w, h]
    
    # 1. Convert to grayscale for text extraction calculations
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 2. Auto-detect dark/low-quality images and adjust brightness/contrast
    mean_brightness = np.mean(gray)
    std_brightness = np.std(gray)
    
    adjusted_brightness = False
    adjusted_contrast = False
    
    # If mean brightness is very low (e.g. < 110), increase brightness and contrast
    if mean_brightness < 110:
        # Scale brightness and contrast using convertScaleAbs
        # alpha controls contrast (1.0-3.0), beta controls brightness (0-100)
        alpha = 1.35
        beta = int(45 - mean_brightness * 0.25)
        img = cv2.convertScaleAbs(img, alpha=alpha, beta=beta)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        adjusted_brightness = True
    # If the standard deviation (contrast) is very low, stretch contrast
    elif std_brightness < 45:
        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        gray = clahe.apply(gray)
        img = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
        adjusted_contrast = True

    # 3. Detect and crop the receipt (Contour detection & perspective warp)
    cropped = False
    # Apply threshold to isolate sheet structures
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blurred, 50, 150)
    contours, _ = cv2.findContours(edged.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    
    receipt_contour = None
    for c in contours[:8]:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        # Check if contour is a quad with significant area (e.g. > 15% of image area)
        if len(approx) == 4 and cv2.contourArea(c) > (w * h * 0.15):
            receipt_contour = approx
            break
            
    if receipt_contour is not None:
        # Reorder points: top-left, top-right, bottom-right, bottom-left
        pts = receipt_contour.reshape(4, 2)
        rect = np.zeros((4, 2), dtype="float32")
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]
        rect[2] = pts[np.argmax(s)]
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]
        rect[3] = pts[np.argmax(diff)]
        
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
        img = cv2.warpPerspective(img, M, (maxWidth, maxHeight))
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        cropped = True

    # 4. Correct rotation/perspective (Hough lines text-lines deskew)
    rotated = False
    skew_angle = 0.0
    
    # Detect horizontal lines / text flow angle
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(edges, 1, np.pi/180, 100, minLineLength=100, maxLineGap=10)
    angles = []
    if lines is not None:
        for line in lines:
            x1, y1, x2, y2 = line[0]
            angle = np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi
            if -45 < angle < 45:
                angles.append(angle)
                
    if len(angles) > 0:
        median_angle = np.median(angles)
        if abs(median_angle) > 0.5:
            # Rotate image
            (h_curr, w_curr) = img.shape[:2]
            center = (w_curr // 2, h_curr // 2)
            M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
            img = cv2.warpAffine(img, M, (w_curr, h_curr), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            rotated = True
            skew_angle = median_angle

    # 5. Resize & Upscale appropriately
    h_curr, w_curr = img.shape[:2]
    upscaled_2x = False
    resized = False
    
    # 2x Upscaling for low-resolution or small-font receipts
    if w_curr < 1200 or h_curr < 1200:
        img = cv2.resize(img, (w_curr * 2, h_curr * 2), interpolation=cv2.INTER_CUBIC)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        upscaled_2x = True
        h_curr, w_curr = img.shape[:2]
        
    # Resize down if the image is extremely large (e.g., > 2200px)
    if w_curr > 2200:
        target_width = 1600
        ratio = target_width / float(w_curr)
        target_height = int(h_curr * ratio)
        img = cv2.resize(img, (target_width, target_height), interpolation=cv2.INTER_AREA)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        resized = True

    # 6. Apply denoise and sharpen
    # Bilateral filtering preserves crisp edges for OCR while smoothing noise
    gray_denoised = cv2.bilateralFilter(gray, 9, 75, 75)
    
    # Unsharp mask sharpening
    gaussian = cv2.GaussianBlur(gray_denoised, (0, 0), 2.0)
    sharpened = cv2.addWeighted(gray_denoised, 1.5, gaussian, -0.5, 0)
    
    # Save the processed image
    cv2.imwrite(output_path, sharpened)
    
    elapsed = time.time() - start_time
    
    return {
        "success": True,
        "original_size": original_size,
        "new_size": [img.shape[1], img.shape[0]],
        "adjusted_brightness": adjusted_brightness,
        "adjusted_contrast": adjusted_contrast,
        "cropped": cropped,
        "rotated": rotated,
        "skew_angle": float(skew_angle),
        "upscaled_2x": upscaled_2x,
        "resized": resized,
        "processing_time_ms": int(elapsed * 1000)
    }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Usage: python3 preprocess.py <input> <output>"}))
        sys.exit(1)
        
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    res = preprocess_image(input_path, output_path)
    print(json.dumps(res))
