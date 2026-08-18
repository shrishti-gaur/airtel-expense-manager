import React from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import AppModal from './AppModal';
import Button from '../ui/Button';

/**
 * ImageQualityAlertModal displays a warning popup if post-capture image diagnostics fail.
 * It shows the specific warnings alongside the receipt preview image.
 */
const ImageQualityAlertModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  diagnostics, 
  dataUrl 
}) => {
  if (!diagnostics) return null;

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Receipt Capture Warning"
      subtitle="Image Quality Alert"
      maxWidth="max-w-lg"
      footerActions={
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose}>
            Discard & Retake
          </Button>
          <Button 
            variant="primary" 
            onClick={onConfirm} 
            className="bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            Use Photo Anyway
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-500 leading-relaxed font-sans">
          Our automated optical checks detected potential quality issues. To ensure accurate receipt parsing and prevent OCR extraction errors, please review the diagnostics below before uploading.
        </p>

        <div className="flex flex-col sm:flex-row gap-5 items-center bg-slate-50 p-4 rounded-xl border border-slate-200/60">
          {/* Preview image */}
          {dataUrl && (
            <div className="w-full sm:w-1/3 flex justify-center bg-slate-950 p-2 rounded-lg border border-slate-800 shadow-sm shrink-0">
              <img 
                src={dataUrl} 
                alt="Captured receipt crop preview" 
                className="max-h-36 object-contain rounded" 
              />
            </div>
          )}

          {/* Diagnostics checklist */}
          <div className="flex-1 w-full space-y-3.5 text-left font-sans">
            {/* Resolution Check */}
            <div className="flex items-start gap-2.5 text-xs">
              {diagnostics.resolution.isLowRes ? (
                <AlertTriangle className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <div className="rounded-full bg-emerald-100 p-0.5 shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="font-bold text-slate-800">Resolution Check: </span>
                <span className="text-slate-600">{diagnostics.width} × {diagnostics.height} px</span>
                {diagnostics.resolution.isLowRes && (
                  <p className="text-[10px] text-amber-600 font-semibold mt-0.5">
                    ⚠️ Lower resolution than recommended. Text might be pixelated.
                  </p>
                )}
              </div>
            </div>

            {/* Brightness Check */}
            <div className="flex items-start gap-2.5 text-xs">
              {diagnostics.dark.isDark ? (
                <AlertTriangle className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <div className="rounded-full bg-emerald-100 p-0.5 shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="font-bold text-slate-800">Lighting / Exposure: </span>
                <span className="text-slate-600">{Math.round(diagnostics.dark.avgBrightness)} / 255</span>
                {diagnostics.dark.isDark && (
                  <p className="text-[10px] text-amber-600 font-semibold mt-0.5">
                    ⚠️ Underexposed image. Text is too dark. Capture in better light.
                  </p>
                )}
              </div>
            </div>

            {/* Focus / Blur Check */}
            <div className="flex items-start gap-2.5 text-xs">
              {diagnostics.blur.isBlurry ? (
                <AlertTriangle className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <div className="rounded-full bg-emerald-100 p-0.5 shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="font-bold text-slate-800">Focus & Sharpness: </span>
                <span className="text-slate-600">{Math.round(diagnostics.blur.variance)}</span>
                {diagnostics.blur.isBlurry && (
                  <p className="text-[10px] text-amber-600 font-semibold mt-0.5">
                    ⚠️ Blurry text detected. Keep the camera steady and wait for focus.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppModal>
  );
};

export default ImageQualityAlertModal;
