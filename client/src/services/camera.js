import { useState, useEffect } from 'react';

/**
 * Hook to check if direct camera capture is supported and a camera is available.
 */
export const useCameraSupport = () => {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      // 1. Check if the 'capture' attribute exists in HTMLInputElement
      const hasCaptureAttr = 'capture' in document.createElement('input');

      // 2. Check if a video input device exists (if enumerateDevices is supported)
      let hasCamera = false;
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          hasCamera = devices.some(device => device.kind === 'videoinput');
        } catch (e) {
          // If permission is denied or enumeration fails, fallback to browser capability
          hasCamera = true;
        }
      } else {
        // Fallback for non-secure contexts or older browsers
        hasCamera = hasCaptureAttr;
      }

      setIsSupported(hasCaptureAttr && hasCamera);
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

  const hasExt = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
  if (!hasExt) {
    const ext = file.type === 'image/png' ? '.png' : '.jpg';
    const name = `captured_receipt_${Date.now()}${ext}`;
    return new File([file], name, { type: file.type || 'image/jpeg' });
  }

  // Ensure it's constructed via new File to normalize properties
  return new File([file], file.name, {
    type: file.type || 'image/jpeg',
    lastModified: file.lastModified || Date.now(),
  });
};
