import { useState } from 'react';
import { ZoomIn, ZoomOut, Upload, FileText, X, FileCode } from 'lucide-react';

/**
 * ReceiptSection component handling uploads, previews, and zoom states
 */
const ReceiptSection = ({
  receiptUrl,
  fileName = '',
  fileType = '',
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

  // Detect file type
  const isImage = !receiptUrl ? false : (
    fileType.includes('image') || 
    receiptUrl.startsWith('data:image') ||
    receiptUrl.startsWith('blob:http') ||
    /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(fileName) ||
    (!fileType && !/\.(pdf|docx|doc)$/i.test(receiptUrl))
  );

  const isPdf = !receiptUrl ? false : (
    fileType.includes('pdf') || 
    /\.pdf$/i.test(fileName) || 
    /\.pdf$/i.test(receiptUrl)
  );

  const isDocx = !receiptUrl ? false : (
    fileType.includes('word') || 
    fileType.includes('officedocument') || 
    /\.(docx|doc)$/i.test(fileName) || 
    /\.(docx|doc)$/i.test(receiptUrl)
  );

  return (
    <div className="flex w-full flex-col bg-slate-900 p-6 text-white h-full justify-between font-sans">
      
      {/* Controls header bar */}
      <div className="mb-4 flex items-center justify-between font-sans flex-wrap gap-2 border-b border-slate-800 pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Receipt Document</span>
        {receiptUrl && (isImage || isPdf) && (
          <div className="flex items-center gap-2 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 shadow-sm shrink-0">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-[11px] font-bold text-slate-300 w-10 text-center select-none">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoomScale(1)}
              className="p-1 text-[10px] font-bold text-slate-500 hover:text-white transition-colors border-l border-slate-700 pl-2 cursor-pointer"
              title="Reset Zoom"
            >
              Reset
            </button>
            <a
              href={receiptUrl}
              download={fileName || 'receipt_file'}
              className="p-1 text-slate-400 hover:text-white transition-colors border-l border-slate-700 pl-2 cursor-pointer flex items-center gap-1"
              title="Download Original Document"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Upload className="h-4 w-4 rotate-180" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Save</span>
            </a>
          </div>
        )}
      </div>

      {/* Preview area with overflow-auto for scale zooms */}
      <div className="flex flex-1 items-center justify-center rounded-xl bg-slate-950/50 border border-slate-800/80 overflow-auto relative group min-h-[350px]">
        {receiptUrl ? (
          <div className="h-full w-full flex items-center justify-center p-4 overflow-auto">
            
            {/* IMAGE PREVIEW */}
            {isImage && (
              <div className="relative h-full w-full flex items-center justify-center overflow-auto">
                <img
                  src={receiptUrl}
                  alt="Receipt Invoice"
                  className="max-h-[380px] max-w-full object-contain rounded transition-transform origin-center"
                  style={{ transform: `scale(${zoomScale})` }}
                  onClick={() => setZoomOpen(true)}
                />
              </div>
            )}

            {/* PDF PREVIEW */}
            {isPdf && (
              <div className="h-full w-full overflow-auto flex items-center justify-center">
                <iframe
                  src={receiptUrl}
                  title="Receipt PDF Preview"
                  className="h-full w-full min-h-[380px] bg-white rounded border-0 transition-transform origin-center"
                  style={{ transform: `scale(${zoomScale})` }}
                />
              </div>
            )}

            {/* WORD DOCUMENT PREVIEW */}
            {isDocx && (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 bg-slate-900/60 rounded-xl border border-slate-800 max-w-xs mx-auto animate-fade-in">
                <div className="rounded-full bg-blue-500/10 p-4 text-blue-400">
                  <FileText className="h-12 w-12" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white leading-snug truncate max-w-[200px] font-sans">
                    {fileName || 'Word Document.docx'}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Microsoft Word</p>
                </div>
                <a
                  href={receiptUrl}
                  download={fileName || 'receipt.docx'}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-semibold text-white transition-colors"
                >
                  Download File
                </a>
              </div>
            )}

            {/* OTHER FILE PREVIEWS FALLBACK */}
            {!isImage && !isPdf && !isDocx && (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 bg-slate-900/60 rounded-xl border border-slate-800 max-w-xs mx-auto animate-fade-in">
                <div className="rounded-full bg-slate-800 p-4 text-slate-400">
                  <FileCode className="h-12 w-12" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white leading-snug truncate max-w-[200px] font-sans">
                    {fileName || 'receipt_file'}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Attachment File</p>
                </div>
                <a
                  href={receiptUrl}
                  download={fileName || 'receipt_attachment'}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-semibold text-white transition-colors"
                >
                  Download File
                </a>
              </div>
            )}

          </div>
        ) : (
          <div className="text-center p-6 space-y-3">
            <FileText className="mx-auto h-16 w-16 text-slate-700" />
            <p className="text-sm font-semibold text-slate-400">No receipt file uploaded</p>
            <p className="text-xs text-slate-500">Provide an invoice image, PDF, or Word doc.</p>
          </div>
        )}
      </div>

      {/* Replacement trigger */}
      {isEditable && (
        <div className="mt-4 border-t border-slate-800 pt-3">
          <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 bg-slate-950/30 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-950/50 hover:text-white transition-all">
            <Upload className="h-4 w-4" />
            {receiptUrl ? 'Replace Uploaded Document' : 'Upload Receipt file'}
            <input
              type="file"
              accept="image/*,application/pdf,.docx,.doc"
              className="hidden"
              onChange={onFileChange}
            />
          </label>
        </div>
      )}

      {/* Fullscreen Modal zoom for image */}
      {zoomOpen && receiptUrl && isImage && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/95 p-4 animate-fade-in"
          onClick={() => setZoomOpen(false)}
        >
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            className="absolute top-4 right-4 rounded-full bg-slate-800 p-2 text-white hover:bg-slate-700 cursor-pointer"
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
