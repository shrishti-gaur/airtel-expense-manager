import { useState, useEffect } from 'react';

/**
 * Hook to check if direct browser camera capture via getUserMedia is supported and a camera is available.
 */
export const useCameraSupport = () => {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      // 1. Check if getUserMedia is supported
      const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

      // 2. Check if a video input device exists (if enumerateDevices is supported)
      let hasCamera = false;
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          hasCamera = devices.some(device => device.kind === 'videoinput');
        } catch {
          // If permission is denied or enumeration fails, fallback to capability check
          hasCamera = true;
        }
      } else {
        hasCamera = hasGetUserMedia;
      }

      setIsSupported(hasGetUserMedia && hasCamera);
    };

    checkSupport();
  }, []);

  return isSupported;
};

/**
 * Sanitizes a captured camera file by ensuring it's a standard File object
 * with a valid extension (e.g. .jpg or .png) and proper MIME type.
 * @param {File|Blob} file 
 * @returns {File}
 */
export const sanitizeCapturedFile = (file) => {
  if (!file) return null;

  // If it's already a File and has a valid name with extension, just return it
  if (file instanceof File && file.name && /\.(jpg|jpeg|png|gif|webp|svg|pdf|docx|doc)$/i.test(file.name)) {
    return file;
  }

  // Otherwise, construct a filename with extension
  const ext = file.type === 'image/png' ? '.png' : '.jpg';
  const name = `captured_receipt_${Date.now()}${ext}`;
  
  try {
    return new File([file], name, { type: file.type || 'image/jpeg' });
  } catch {
    // Fallback if File constructor is not supported
    return file;
  }
};

/**
 * Detects if the captured image is blurry using the variance of the Laplacian filter.
 * Samples from three separate patches (Center, Top-Third, Bottom-Third) and selects the
 * first patch that contains actual text details (indicated by a standard deviation of pixel values >= 15).
 * This prevents empty whitespace regions from triggering false-positive blur warnings.
 * @param {ImageData} imageData 
 * @returns {{ variance: number, isBlurry: boolean }}
 */
export const detectBlur = (imageData) => {
  const { width, height, data } = imageData;
  
  const sampleSize = 300;
  const actualW = Math.min(width, sampleSize);
  const actualH = Math.min(height, sampleSize);
  
  if (actualW <= 2 || actualH <= 2) {
    return { variance: 0, isBlurry: false };
  }
  
  // Define three regions: Center, Top-Third, Bottom-Third
  const regions = [
    {
      name: 'Center',
      startX: Math.floor((width - actualW) / 2),
      startY: Math.floor((height - actualH) / 2)
    },
    {
      name: 'Top-Third',
      startX: Math.floor((width - actualW) / 2),
      startY: Math.floor((height - actualH) / 3)
    },
    {
      name: 'Bottom-Third',
      startX: Math.floor((width - actualW) / 2),
      startY: Math.floor(((height - actualH) * 2) / 3)
    }
  ];

  let selectedVariance = 0;
  let hasValidPatch = false;

  for (const region of regions) {
    const grayscale = new Float32Array(actualW * actualH);
    let pixelSum = 0;
    
    // Convert region to grayscale
    for (let y = 0; y < actualH; y++) {
      for (let x = 0; x < actualW; x++) {
        const srcIdx = ((region.startY + y) * width + (region.startX + x)) * 4;
        const r = data[srcIdx];
        const g = data[srcIdx + 1];
        const b = data[srcIdx + 2];
        const grayVal = 0.299 * r + 0.587 * g + 0.114 * b;
        grayscale[y * actualW + x] = grayVal;
        pixelSum += grayVal;
      }
    }
    
    const pixelMean = pixelSum / (actualW * actualH);
    let pixelVarianceSum = 0;
    for (let i = 0; i < grayscale.length; i++) {
      const diff = grayscale[i] - pixelMean;
      pixelVarianceSum += diff * diff;
    }
    const grayscaleStdDev = Math.sqrt(pixelVarianceSum / (actualW * actualH));

    // If standard deviation is extremely low (< 15), this patch is empty paper background or solid space.
    // Skip to next region unless all regions are empty.
    if (grayscaleStdDev < 15) {
      continue;
    }

    // Compute Laplacian variance for this region
    let laplacianSum = 0;
    const count = (actualH - 2) * (actualW - 2);
    const laplacianValues = new Float32Array(count);
    let lIdx = 0;
    
    for (let y = 1; y < actualH - 1; y++) {
      for (let x = 1; x < actualW - 1; x++) {
        const idx = y * actualW + x;
        const val = 
          -4 * grayscale[idx] +
          grayscale[idx - 1] +
          grayscale[idx + 1] +
          grayscale[idx - actualW] +
          grayscale[idx + actualW];
        
        laplacianValues[lIdx++] = val;
        laplacianSum += val;
      }
    }
    
    const laplacianMean = laplacianSum / count;
    let laplacianVarSum = 0;
    for (let i = 0; i < count; i++) {
      const diff = laplacianValues[i] - laplacianMean;
      laplacianVarSum += diff * diff;
    }
    
    selectedVariance = laplacianVarSum / count;
    hasValidPatch = true;
    break; // Found a valid patch with text, exit loop!
  }

  // If no patch had details (entire center/thirds are empty paper), skip warning
  if (!hasValidPatch) {
    return { variance: 25, isBlurry: false }; // Defaults to sharp (passing)
  }

  const isBlurry = selectedVariance < 12;
  return { variance: selectedVariance, isBlurry };
};

/**
 * Detects if the captured image is too dark using average luminance.
 * Uses a standard deviation filter to prevent Dark Mode screenshots or invoices
 * (which have high contrast standard deviation) from flagging false darkness alerts.
 * @param {ImageData} imageData 
 * @returns {{ avgBrightness: number, isDark: boolean }}
 */
export const detectDarkness = (imageData) => {
  const { data } = imageData;
  let brightnessSum = 0;
  const step = 4; // Sample every 4th pixel for speed
  let count = 0;
  const samples = [];
  
  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const val = 0.299 * r + 0.587 * g + 0.114 * b;
    brightnessSum += val;
    samples.push(val);
    count++;
  }
  
  const avgBrightness = brightnessSum / count;
  
  // Calculate variance and standard deviation of brightness values (contrast check)
  let diffSum = 0;
  for (let i = 0; i < count; i++) {
    const diff = samples[i] - avgBrightness;
    diffSum += diff * diff;
  }
  const stdDev = Math.sqrt(diffSum / count);
  
  // A brightness score below 55 is considered dark, unless standard deviation is high (Dark Mode text)
  const isDark = avgBrightness < 55 && stdDev < 70;
  
  return { avgBrightness, isDark };
};

/**
 * Detects if the captured image resolution is low.
 * @param {number} width 
 * @param {number} height 
 * @returns {{ isLowRes: boolean, totalPixels: number }}
 */
export const detectLowResolution = (width, height) => {
  const totalPixels = width * height;
  // Below 1280x720 (921,600 pixels) is considered too low resolution for high-quality OCR.
  const isLowRes = totalPixels < 921600;
  return { isLowRes, totalPixels };
};
