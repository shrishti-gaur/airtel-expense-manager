import { useState } from 'react';
import { ZoomIn, ZoomOut, Upload, FileText, X } from 'lucide-react';

/**
 * ReceiptSection component handling uploads, previews, and zoom states
 */
const ReceiptSection = ({
  receiptUrl,
  isEditable,
  onFileChange,
}) => {
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  const handleZoomIn = (e) => {
    e.stopPropagation();
    setZoomScale(s => Math.min(2.5, s + 0.25));
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    setZoomScale(s => Math.max(0.5, s - 0.25));
  };

  return (
    <div className="flex w-full flex-col bg-slate-900 p-6 text-white h-full justify-between">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Receipt Document</span>
        {receiptUrl && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              className="rounded bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white"
              title="Zoom receipt"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Preview area */}
      <div className="flex flex-1 items-center justify-center rounded-xl bg-slate-950/50 border border-slate-800/80 overflow-hidden relative group min-h-[300px]">
        {receiptUrl ? (
          <div className="relative h-full w-full flex items-center justify-center p-4">
            <img
              src={receiptUrl}
              alt="Receipt Invoice"
              className="max-h-[380px] max-w-full object-contain rounded transition-transform"
              style={{ transform: `scale(${zoomScale})` }}
            />
            
            {/* Hover Actions */}
            <div className="absolute bottom-4 flex gap-2 rounded-lg bg-slate-950/80 p-1 border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 text-slate-400 hover:text-white"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setZoomScale(1); }}
                className="p-1 text-slate-400 hover:text-white text-xs font-semibold px-1"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 text-slate-400 hover:text-white"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center p-6 space-y-3">
            <FileText className="mx-auto h-16 w-16 text-slate-700" />
            <p className="text-sm font-semibold text-slate-400">No receipt file uploaded</p>
            <p className="text-xs text-slate-500">Provide an invoice image or PDF to parse details.</p>
          </div>
        )}
      </div>

      {/* Replacement trigger */}
      {isEditable && (
        <div className="mt-4">
          <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 bg-slate-950/30 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-950/50 hover:text-white transition-all">
            <Upload className="h-4 w-4" />
            {receiptUrl ? 'Replace Uploaded Document' : 'Upload Receipt file'}
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={onFileChange}
            />
          </label>
        </div>
      )}

      {/* Fullscreen Modal zoom */}
      {zoomOpen && receiptUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-955/95 p-4 animate-fade-in"
          onClick={() => setZoomOpen(false)}
        >
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            className="absolute top-4 right-4 rounded-full bg-slate-800 p-2 text-white hover:bg-slate-700"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={receiptUrl}
            alt="Receipt Zoomed"
            className="max-h-full max-w-full object-contain rounded shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ReceiptSection;
