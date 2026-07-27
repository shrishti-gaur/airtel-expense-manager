import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, Upload, FileText, X, FileCode, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { renderAsync } from 'docx-preview';

// Set up the PDFjs worker using Vite URL resolver for clean local bundling
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * ReceiptSection component handling uploads, previews, and zoom states
 */
const ReceiptSection = ({
  receiptUrl,
  fileName = '',
  fileType = '',
  fileSize = null,
  uploadDate = null,
  isEditable,
  onFileChange,
}) => {
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  // PDF Page Navigation State
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  // DOCX Rendering References & Loading States
  const docxRef = useRef(null);
  const [docxLoading, setDocxLoading] = useState(false);
  const [docxError, setDocxError] = useState(null);

  const handleZoomIn = (e) => {
    e.stopPropagation();
    setZoomScale(s => Math.min(2.5, s + 0.25));
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    setZoomScale(s => Math.max(0.5, s - 0.25));
  };

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

  // Detect file type
  const isImage = !receiptUrl ? false : (
    fileType.includes('image') || 
    receiptUrl.startsWith('data:image') ||
    /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(fileName) ||
    (!fileType && !isPdf && !isDocx)
  );

  // Handle PDF Loading callbacks
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  // Handle DOCX client-side rendering inside standard ref container
  useEffect(() => {
    if (isDocx && receiptUrl && docxRef.current) {
      setDocxLoading(true);
      setDocxError(null);
      
      fetch(receiptUrl)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch DOCX source');
          return res.arrayBuffer();
        })
        .then((arrayBuffer) => {
          if (docxRef.current) {
            docxRef.current.innerHTML = '';
            // Render the DOCX arraybuffer directly inside the target ref element
            return renderAsync(arrayBuffer, docxRef.current, undefined, {
              className: 'docx-preview-canvas',
              inWrapper: false,
              ignoreWidth: true,
              ignoreHeight: true,
            });
          }
        })
        .then(() => {
          setDocxLoading(false);
        })
        .catch((err) => {
          console.error('[docx-preview] Render session failed:', err);
          setDocxError('Failed to render Word document preview.');
          setDocxLoading(false);
        });
    }
  }, [receiptUrl, isDocx]);

  // Format file size metrics
  const formatBytes = (bytes) => {
    if (!bytes || isNaN(bytes)) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date display
  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return 'N/A';
    }
  };

  return (
    <div className="flex w-full flex-col bg-slate-900 p-6 text-white h-full justify-between font-sans">
      
      {/* Dynamic persistent preview controls header */}
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

      {/* Main preview container block */}
      <div className="flex flex-1 items-center justify-center rounded-xl bg-slate-950/50 border border-slate-800/80 overflow-auto relative group min-h-[350px]">
        {receiptUrl ? (
          <div className="h-full w-full flex flex-col items-center justify-center p-4 overflow-auto">
            
            {/* IMAGE PREVIEW MODE */}
            {isImage && (
              <div className="relative h-full w-full flex items-center justify-center overflow-auto">
                <img
                  src={receiptUrl}
                  alt="Receipt Invoice"
                  className="max-h-[380px] max-w-full object-contain rounded transition-transform origin-center cursor-zoom-in"
                  style={{ transform: `scale(${zoomScale})` }}
                  onClick={() => setZoomOpen(true)}
                />
              </div>
            )}

            {/* DIRECT PDF CANVAS PREVIEW MODE */}
            {isPdf && (
              <div className="h-full w-full overflow-auto flex flex-col items-center justify-start py-2">
                <Document
                  file={receiptUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={
                    <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
                      <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                      <span className="text-xs font-semibold">Loading PDF file...</span>
                    </div>
                  }
                  error={
                    <div className="text-xs text-rose-400 py-8 font-semibold">
                      Failed to parse PDF document structures.
                    </div>
                  }
                  className="flex flex-col items-center"
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={zoomScale}
                    className="shadow-lg border border-slate-800 rounded overflow-hidden"
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    loading={
                      <div className="h-[280px] flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                      </div>
                    }
                  />
                </Document>

                {/* PDF Page Navigation Footer */}
                {numPages && numPages > 1 && (
                  <div className="flex items-center justify-between gap-4 mt-4 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 shadow select-none">
                    <button
                      type="button"
                      disabled={pageNumber <= 1}
                      onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                      className="p-1 rounded hover:bg-slate-750 text-slate-300 hover:text-white disabled:text-slate-600 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-[11px] text-slate-300 font-bold font-sans">
                      Page {pageNumber} of {numPages}
                    </span>
                    <button
                      type="button"
                      disabled={pageNumber >= numPages}
                      onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                      className="p-1 rounded hover:bg-slate-750 text-slate-300 hover:text-white disabled:text-slate-600 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* DIRECT WORD (DOCX) HTML PREVIEW MODE */}
            {isDocx && (
              <div className="h-full w-full overflow-auto bg-white rounded-lg p-4 text-left shadow-inner flex flex-col min-h-[380px] max-w-full">
                {docxLoading && (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-500 mx-auto">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="text-xs font-semibold font-sans">Generating document preview...</span>
                  </div>
                )}
                
                {docxError && (
                  <div className="text-xs text-rose-500 font-semibold py-8 text-center mx-auto">
                    {docxError}
                  </div>
                )}

                <div 
                  ref={docxRef} 
                  className={`docx-preview-canvas w-full overflow-auto bg-white text-slate-900 ${
                    docxLoading ? 'hidden' : 'block'
                  }`}
                  style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center' }}
                />
              </div>
            )}

            {/* PREVIEW FALLBACK */}
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
          <div className="text-center p-6 space-y-3 select-none">
            <FileText className="mx-auto h-16 w-16 text-slate-700" />
            <p className="text-sm font-semibold text-slate-400 font-sans">No receipt file uploaded</p>
            <p className="text-xs text-slate-500 font-sans">Provide an invoice image, PDF, or Word doc.</p>
          </div>
        )}
      </div>

      {/* Metadata info cards panel at bottom */}
      {receiptUrl && (
        <div className="mt-4 border-t border-slate-800 pt-4 text-left font-sans text-xs space-y-2 bg-slate-950/20 p-3 rounded-lg border border-slate-800/60 shrink-0">
          <div className="flex justify-between items-center text-slate-400 select-none">
            <span className="font-semibold text-slate-500 uppercase tracking-wide text-[10px]">File Metadata</span>
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {isImage ? 'IMAGE' : isPdf ? 'PDF' : isDocx ? 'WORD' : 'FILE'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-slate-300">
            <div className="truncate">
              <span className="block text-[10px] text-slate-500 font-semibold select-none">File Name</span>
              <span className="font-medium truncate block font-sans" title={fileName}>{fileName || 'receipt_document'}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 font-semibold select-none">File Size</span>
              <span className="font-medium font-sans">{formatBytes(fileSize)}</span>
            </div>
            <div className="truncate">
              <span className="block text-[10px] text-slate-500 font-semibold select-none">MIME Content Type</span>
              <span className="font-medium truncate block font-sans" title={fileType}>{fileType || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 font-semibold select-none">Upload Date</span>
              <span className="font-medium font-sans">{formatDate(uploadDate)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Replacement trigger */}
      {isEditable && (
        <div className="mt-4 border-t border-slate-800 pt-3">
          <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 bg-slate-950/30 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-950/50 hover:text-white transition-all select-none">
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

      {/* Fullscreen modal zoom for images */}
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
