import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, Upload, FileText, X, FileCode, ChevronLeft, ChevronRight, Loader2, Camera } from 'lucide-react';
import { sanitizeCapturedFile, detectBlur, detectDarkness, detectLowResolution } from '../../services/camera';
import ImageQualityAlertModal from './ImageQualityAlertModal';
import { Document, Page, pdfjs } from 'react-pdf';
import { renderAsync } from 'docx-preview';

// Set up the PDFjs worker using URL constructor for offline-first local Vite bundling
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

/**
 * ReceiptSection component handling uploads, previews, and zoom states
 */
const ReceiptSection = ({
  receipts = [],
  activeReceiptIndex = 0,
  onSelectReceipt,
  onAddReceipt,
  onRemoveReceipt,
  isEditable,
  
  // Legacy / Single-receipt props
  receiptUrl,
  fileName = '',
  fileType = '',
  fileSize = null,
  uploadDate = null,
  onFileChange,
}) => {
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const cameraFallbackInputRef = useRef(null);

  useEffect(() => {
    setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  // Post-capture validation states
  const [isQualityAlertOpen, setIsQualityAlertOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingDiagnostics, setPendingDiagnostics] = useState(null);
  const [pendingDataUrl, setPendingDataUrl] = useState(null);
  const [pendingIsReplace, setPendingIsReplace] = useState(false);

  // Map to unified receipts list
  const effectiveReceipts = receipts && receipts.length > 0 ? receipts : (receiptUrl ? [{
    receiptUrl,
    fileName,
    fileType,
    fileSize,
    uploadDate,
    amount: 0
  }] : []);

  const activeReceipt = effectiveReceipts[activeReceiptIndex] || null;
  const currentUrl = activeReceipt ? activeReceipt.receiptUrl : null;
  const currentName = activeReceipt ? activeReceipt.fileName : '';
  const currentType = activeReceipt ? activeReceipt.fileType : '';
  const currentSize = activeReceipt ? activeReceipt.fileSize : null;
  const currentDate = activeReceipt ? activeReceipt.uploadDate : null;

  const processSelectedFile = async (file, isReplace = false) => {
    if (file && file.type && file.type.startsWith('image/')) {
      const runChecks = (width, height, getImgData) => {
        try {
          const imageData = getImgData();
          const blurInfo = detectBlur(imageData);
          const darkInfo = detectDarkness(imageData);
          const resInfo = detectLowResolution(width, height);
          
          const hasWarnings = blurInfo.isBlurry || darkInfo.isDark || resInfo.isLowRes;
          
          if (hasWarnings) {
            setPendingFile(file);
            setPendingIsReplace(isReplace);
            setPendingDiagnostics({
              blur: blurInfo,
              dark: darkInfo,
              resolution: resInfo,
              width: width,
              height: height
            });
            setPendingDataUrl(URL.createObjectURL(file));
            setIsQualityAlertOpen(true);
          } else {
            triggerFileChange(file, isReplace);
          }
        } catch (err) {
          console.warn("Diagnostics error, uploading directly:", err);
          triggerFileChange(file, isReplace);
        }
      };

      if (window.createImageBitmap) {
        try {
          const imageBitmap = await createImageBitmap(file);
          const canvas = document.createElement('canvas');
          
          // Limit max canvas dimension to 1200px to avoid memory OOMs on mobile
          const maxDim = 1200;
          let w = imageBitmap.width;
          let h = imageBitmap.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(imageBitmap, 0, 0, w, h);
          
          runChecks(imageBitmap.width, imageBitmap.height, () => ctx.getImageData(0, 0, w, h));
          imageBitmap.close();
          return;
        } catch (e) {
          console.warn("createImageBitmap failed, falling back to Image:", e);
        }
      }

      // Fallback: new Image() onload
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        runChecks(img.naturalWidth, img.naturalHeight, () => ctx.getImageData(0, 0, w, h));
        URL.revokeObjectURL(objectUrl);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        triggerFileChange(file, isReplace);
      };
    } else if (file) {
      triggerFileChange(file, isReplace);
    }
  };

  const triggerFileChange = (file, isReplace = false) => {
    if (isReplace && onFileChange) {
      onFileChange({
        target: {
          files: [file]
        }
      });
    } else if (onAddReceipt) {
      onAddReceipt({
        target: {
          files: [file]
        }
      });
    } else if (onFileChange) {
      onFileChange({
        target: {
          files: [file]
        }
      });
    }
  };

  const handleConfirmQualityAlert = () => {
    if (pendingFile) {
      triggerFileChange(pendingFile, pendingIsReplace);
    }
    setIsQualityAlertOpen(false);
    setPendingFile(null);
    setPendingIsReplace(false);
    setPendingDiagnostics(null);
    setPendingDataUrl(null);
  };

  const handleCloseQualityAlert = () => {
    setIsQualityAlertOpen(false);
    setPendingFile(null);
    setPendingIsReplace(false);
    setPendingDiagnostics(null);
    setPendingDataUrl(null);
  };

  const handleCaptureClick = () => {
    if (cameraFallbackInputRef.current) {
      cameraFallbackInputRef.current.click();
    }
  };

  const handleUploadChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0], false);
    }
  };

  const handleReplaceChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0], true);
    }
  };

  const handleCameraCapture = (e) => {
    if (e.target.files && e.target.files[0]) {
      const sanitized = sanitizeCapturedFile(e.target.files[0]);
      processSelectedFile(sanitized, false);
    }
  };

  const handleCameraReplace = (e) => {
    if (e.target.files && e.target.files[0]) {
      const sanitized = sanitizeCapturedFile(e.target.files[0]);
      processSelectedFile(sanitized, true);
    }
  };

  // PDF Page Navigation State
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  // DOCX Rendering References & Loading States
  const docxRef = useRef(null);
  const [docxLoading, setDocxLoading] = useState(false);
  const [docxError, setDocxError] = useState(null);

  const isPdf = !currentUrl ? false : (
    (currentType && currentType.includes('pdf')) || 
    /\.pdf$/i.test(currentName) || 
    /\.pdf(\?.*)?$/i.test(currentUrl)
  );

  const isDocx = !currentUrl ? false : (
    (currentType && (currentType.includes('word') || currentType.includes('officedocument'))) || 
    /\.(docx|doc)$/i.test(currentName) || 
    /\.(docx|doc)(\?.*)?$/i.test(currentUrl)
  );

  // Detect file type
  const isImage = !currentUrl ? false : (
    (currentType && currentType.includes('image')) || 
    currentUrl.startsWith('data:image') ||
    /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(currentName) ||
    /\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i.test(currentUrl) ||
    (!currentType && !isPdf && !isDocx)
  );

  // Diagnostic Traces
  console.log('[ReceiptSection] Trace details:');
  console.log(' - currentUrl:', currentUrl);
  console.log(' - currentName:', currentName);
  console.log(' - currentType:', currentType);
  console.log(' - isPdf evaluation:', isPdf);
  console.log(' - isDocx evaluation:', isDocx);
  console.log(' - isImage evaluation:', isImage);

  // Reset PDF page number and total pages when document source URL changes
  useEffect(() => {
    setNumPages(null);
    setPageNumber(1);
  }, [currentUrl]);

  const handleZoomIn = (e) => {
    e.stopPropagation();
    setZoomScale(s => Math.min(2.5, s + 0.25));
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    setZoomScale(s => Math.max(0.5, s - 0.25));
  };

  // Handle PDF Loading callbacks
  const onDocumentLoadSuccess = ({ numPages }) => {
    console.log('[ReceiptSection] PDF Document loaded successfully. Pages:', numPages);
    setNumPages(numPages);
    setPageNumber(1);
  };

  const onDocumentLoadError = (error) => {
    console.error('[ReceiptSection] PDF Document rendering failure:', error);
  };

  // Handle DOCX client-side rendering inside standard ref container
  useEffect(() => {
    let active = true;

    if (isDocx && currentUrl && docxRef.current) {
      setDocxLoading(true);
      setDocxError(null);
      
      fetch(currentUrl)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch DOCX source');
          return res.arrayBuffer();
        })
        .then((arrayBuffer) => {
          if (active && docxRef.current) {
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
          if (active) {
            setDocxLoading(false);
          }
        })
        .catch((err) => {
          console.error('[docx-preview] Render session failed:', err);
          if (active) {
            setDocxError('Failed to render Word document preview.');
            setDocxLoading(false);
          }
        });
    }

    return () => {
      active = false;
      if (docxRef.current) {
        docxRef.current.innerHTML = '';
      }
    };
  }, [currentUrl, isDocx]);

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
    <div className="flex w-full flex-col bg-slate-900 p-4 sm:p-6 text-white h-full justify-between font-sans">
      
      {/* Dynamic persistent preview controls header */}
      <div className="mb-4 flex items-center justify-between font-sans flex-wrap gap-2 border-b border-slate-800 pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Receipt Documents</span>
        {currentUrl && (isImage || isPdf) && (
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
              href={currentUrl}
              download={currentName || 'receipt_file'}
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

      {/* Receipts Thumbnails Scrollbar */}
      {effectiveReceipts.length > 0 && (
        <div className="mb-4 w-full">
          <div className="flex gap-3 overflow-x-auto pb-2.5 pt-0.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950/40 scroll-smooth">
            {effectiveReceipts.map((receipt, idx) => {
              const isActive = idx === activeReceiptIndex;
              const isImg = !receipt.receiptUrl ? false : (
                (receipt.fileType && receipt.fileType.includes('image')) || 
                receipt.receiptUrl.startsWith('data:image') ||
                /\.(jpeg|jpg|gif|png|webp|svg)/i.test(receipt.fileName)
              );
              
              return (
                <div
                  key={idx}
                  onClick={() => onSelectReceipt && onSelectReceipt(idx)}
                  className={`relative flex flex-col shrink-0 w-28 rounded-xl border p-2 cursor-pointer transition-all ${
                    isActive
                      ? 'bg-slate-800 border-red-500 shadow-md scale-95'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  {/* Thumbnail / Icon */}
                  <div className="w-full h-16 rounded bg-slate-950 overflow-hidden flex items-center justify-center relative mb-1.5 border border-slate-900">
                    {isImg ? (
                      <img src={receipt.receiptUrl} alt={receipt.fileName} className="w-full h-full object-cover" />
                    ) : (
                      <FileText className="h-6 w-6 text-slate-500" />
                    )}
                    
                    {/* OCR Status Badge */}
                    <div className="absolute top-1 right-1">
                      {receipt.amount > 0 ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-900 block" title="OCR Success" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-slate-900 block" title="OCR Warning/No amount" />
                      )}
                    </div>
                  </div>

                  {/* Title / Amount */}
                  <div className="text-[10px] text-left truncate font-sans font-bold text-slate-300 mb-0.5 leading-tight">
                    {receipt.fileName || `Receipt ${idx + 1}`}
                  </div>
                  <div className="text-[10px] text-left font-extrabold text-white">
                    ₹{Number(receipt.amount || 0).toLocaleString('en-IN')}
                  </div>

                  {/* Delete Button */}
                  {isEditable && onRemoveReceipt && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveReceipt(idx);
                      }}
                      className="absolute -top-1.5 -right-1.5 rounded-full bg-red-600 hover:bg-red-700 p-0.5 text-white shadow-md transition-colors cursor-pointer border border-slate-900"
                      title="Remove Receipt"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Sleek "+ Add Another Receipt" option card */}
            {isEditable && onAddReceipt && (
              <label className="flex flex-col items-center justify-center shrink-0 w-28 h-[106px] rounded-xl border border-dashed border-slate-700 hover:border-slate-500 hover:bg-slate-900/40 cursor-pointer transition-all p-2 select-none">
                <Upload className="h-5 w-5 text-slate-400 mb-1" />
                <span className="text-[10px] font-bold text-slate-400 tracking-tight text-center leading-snug">Add Receipt</span>
                <input
                  type="file"
                  accept="image/*,application/pdf,.docx,.doc"
                  className="hidden"
                  onChange={handleUploadChange}
                />
              </label>
            )}
          </div>
        </div>
      )}

      {/* Main preview container block */}
      <div className="flex h-[250px] md:h-auto md:flex-1 items-center justify-center rounded-xl bg-slate-950/50 border border-slate-800/80 overflow-auto relative group min-h-[220px] md:min-h-[350px]">
        {currentUrl ? (
          <div className="h-full w-full flex flex-col items-center justify-center p-4 overflow-auto">
            
            {/* IMAGE PREVIEW MODE */}
            {isImage && (
              <div className="relative h-full w-full flex items-center justify-center overflow-auto p-4">
                <img
                  src={currentUrl}
                  alt="Receipt Invoice"
                  className="rounded transition-all duration-200 cursor-zoom-in animate-in fade-in zoom-in-95"
                  style={{
                    width: zoomScale > 1 ? `${100 * zoomScale}%` : '100%',
                    height: zoomScale > 1 ? 'auto' : '100%',
                    maxWidth: zoomScale > 1 ? 'none' : '100%',
                    maxHeight: zoomScale > 1 ? `${380 * zoomScale}px` : '100%',
                    objectFit: 'contain'
                  }}
                  onClick={() => setZoomOpen(true)}
                />
              </div>
            )}

            {/* DIRECT PDF CANVAS PREVIEW MODE */}
            {isPdf && (
              <div className="h-full w-full overflow-auto flex flex-col items-center justify-start py-2">
                <Document
                  file={currentUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
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
              <div className="h-full w-full overflow-auto bg-white rounded-lg p-4 text-left shadow-inner flex flex-col h-[250px] md:h-auto md:min-h-[380px] max-w-full">
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
                    {currentName || 'receipt_file'}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Attachment File</p>
                </div>
                <a
                  href={currentUrl}
                  download={currentName || 'receipt_attachment'}
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
      {currentUrl && (
        <div className="mt-3 md:mt-4 border-t border-slate-800 pt-3 md:pt-4 text-left font-sans text-xs space-y-1.5 md:space-y-2 bg-slate-950/20 p-2.5 md:p-3 rounded-lg border border-slate-800/60 shrink-0">
          <div className="flex justify-between items-center text-slate-400 select-none">
            <span className="font-semibold text-slate-500 uppercase tracking-wide text-[10px]">File Metadata</span>
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {isImage ? 'IMAGE' : isPdf ? 'PDF' : isDocx ? 'WORD' : 'FILE'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 md:gap-x-4 gap-y-2 md:gap-y-2.5 text-slate-300">
            <div className="truncate">
              <span className="block text-[10px] text-slate-500 font-semibold select-none">File Name</span>
              <span className="font-medium truncate block font-sans" title={currentName}>{currentName || 'receipt_document'}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 font-semibold select-none">File Size</span>
              <span className="font-medium font-sans">{formatBytes(currentSize)}</span>
            </div>
            <div className="truncate">
              <span className="block text-[10px] text-slate-500 font-semibold select-none">MIME Content Type</span>
              <span className="font-medium truncate block font-sans" title={currentType}>{currentType || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 font-semibold select-none">Upload Date</span>
              <span className="font-medium font-sans">{formatDate(currentDate)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Replacement trigger */}
      {isEditable && (
        <div className="mt-4 border-t border-slate-800 pt-3 flex flex-col sm:flex-row gap-3">
          <label className="flex-1 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 bg-slate-950/30 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-950/50 hover:text-white transition-all select-none">
            <Upload className="h-4 w-4" />
            {currentUrl ? 'Replace Document' : 'Upload Receipt'}
            <input
              type="file"
              accept="image/*,application/pdf,.docx,.doc"
              className="hidden"
              onChange={handleReplaceChange}
            />
          </label>
          {isMobile && (
            <button
              type="button"
              onClick={handleCaptureClick}
              className="flex-1 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 bg-slate-950/30 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-950/50 hover:text-white transition-all select-none"
            >
              <Camera className="h-4 w-4" />
              Capture Receipt
            </button>
          )}
          {isMobile && (
            <input
              ref={cameraFallbackInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleCameraReplace}
            />
          )}
        </div>
      )}

      {/* Fullscreen modal zoom for images */}
      {zoomOpen && currentUrl && isImage && (
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
            src={currentUrl}
            alt="Receipt Zoomed"
            className="max-h-full max-w-full object-contain rounded shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <ImageQualityAlertModal
        isOpen={isQualityAlertOpen}
        onClose={handleCloseQualityAlert}
        onConfirm={handleConfirmQualityAlert}
        diagnostics={pendingDiagnostics}
        dataUrl={pendingDataUrl}
      />
    </div>
  );
};

export default ReceiptSection;
