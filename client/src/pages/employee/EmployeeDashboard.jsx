import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import ImageQualityAlertModal from '../../components/common/ImageQualityAlertModal';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/loaders/LoadingSpinner';
import ExpenseForm from '../../components/common/ExpenseForm';
import StatusBadge from '../../components/common/StatusBadge';
import api from '../../services/api';
import DuplicateWarningModal from '../../components/common/DuplicateWarningModal';
import { normalizeCategory } from '../../constants/expenseCategories';
import {
  Plus,
  UploadCloud,
  Eye,
  Edit2,
  AlertCircle,
  Upload,
  FileText,
  ArrowLeft,
  History,
  FileCheck,
  Camera,
  User
} from 'lucide-react';
import { sanitizeCapturedFile, detectBlur, detectDarkness, detectLowResolution } from '../../services/camera';

const parseSafeDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch (e) {
    console.error('Failed to parse date:', dateStr, e);
  }
  return '';
};

// Unified category normalization imported from constants

const EmployeeDashboard = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const claimId = searchParams.get('claimId');
  const userClicked = useRef(false);
  const { runWithLoading, addNotification } = useUI();

  // Drawer popup states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('Create');
  const [activeClaimData, setActiveClaimData] = useState(null);

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

  const processSelectedFile = async (file) => {
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
            handleOcrFile(file);
          }
        } catch (err) {
          console.warn("Diagnostics error, uploading directly:", err);
          handleOcrFile(file);
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
        handleOcrFile(file);
      };
    } else if (file) {
      handleOcrFile(file);
    }
  };

  const handleConfirmQualityAlert = () => {
    if (pendingFile) {
      handleOcrFile(pendingFile);
    }
    setIsQualityAlertOpen(false);
    setPendingFile(null);
    setPendingDiagnostics(null);
    setPendingDataUrl(null);
  };

  const handleCloseQualityAlert = () => {
    setIsQualityAlertOpen(false);
    setPendingFile(null);
    setPendingDiagnostics(null);
    setPendingDataUrl(null);
  };

  const handleCaptureClick = () => {
    if (cameraFallbackInputRef.current) {
      cameraFallbackInputRef.current.click();
    }
  };

  // Drag and drop states for OCR
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [duplicateData, setDuplicateData] = useState(null);

  const formatDateOnly = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return 'N/A';
    }
  };

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const res = await api.get('/expense/my-claims');
        if (res && res.success && res.data) {
          setClaims(res.data.claims || []);
        }
      } catch (err) {
        console.error('Failed to fetch employee claims:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, []);

  // Listen to path changes and search parameters to open/close drawer
  useEffect(() => {
    const hasValidClaimId = claimId && claimId !== 'undefined' && claimId !== 'null';

    if (hasValidClaimId) {
      if (userClicked.current) {
        const claim = claims.find((c) => c.id === claimId);
        if (claim) {
          setActiveClaimData(claim);
          setFormMode(claim.status);
          setIsFormOpen(true);
        }
      } else {
        // Clear stale query params if not triggered by an explicit user click
        searchParams.delete('claimId');
        setSearchParams(searchParams);
      }
    } else if (location.pathname === '/employee/submit') {
      if (!isFormOpen) {
        setFormMode('Create');
        setIsFormOpen(true);
      }
    } else {
      setIsFormOpen(false);
      setActiveClaimData(null);
    }
  }, [location.pathname, claimId, claims]);

  // Compute metrics totals
  const getMetrics = () => {
    const counts = { Draft: 0, Submitted: 0, Approved: 0, Returned: 0, Reimbursed: 0 };
    
    claims.forEach((claim) => {
      if (counts[claim.status] !== undefined) {
        counts[claim.status]++;
      }
    });

    return counts;
  };

  const metrics = getMetrics();

  const handleRowClick = (claim) => {
    userClicked.current = true;
    setSearchParams({ claimId: claim.id });
  };

  const handleFormClose = () => {
    userClicked.current = false;
    setIsFormOpen(false);
    setActiveClaimData(null);
    if (claimId) {
      searchParams.delete('claimId');
      setSearchParams(searchParams);
    } else if (location.pathname === '/employee/submit') {
      navigate('/employee');
    }
  };

  const handleNewClaimClick = () => {
    setActiveClaimData(null);
    setFormMode('Create');
    setIsFormOpen(true);
    navigate('/employee/submit');
  };

  const handleQuickOcrClick = () => {
    navigate('/employee/scan');
  };

  // OCR Upload Actions
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleOcrFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleCameraCapture = (e) => {
    if (e.target.files && e.target.files[0]) {
      const sanitized = sanitizeCapturedFile(e.target.files[0]);
      processSelectedFile(sanitized);
    }
  };

  const handleOcrFile = async (file) => {
    setSelectedFile(file);
    const sequence = [
      { message: 'Uploading Receipt...', duration: 1000 },
      { message: 'Reading Receipt...', duration: 1200 },
      { message: 'Extracting Text...', duration: 1500 },
      { message: 'Processing...', duration: 800 },
      { message: 'Almost Done...', duration: 600 }
    ];
    
      const allowedExtensions = ['.png', '.jpg', '.jpeg', '.pdf', '.docx', '.doc'];
      const fileExt = file.name && file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : '';

      // Ensure the file has a valid extension for backend Multer verification
      let finalName = file.name || 'receipt.jpg';
      if (!allowedExtensions.includes(fileExt)) {
        const ext = file.type === 'image/png' ? '.png' : '.jpg';
        finalName = `captured_receipt_${Date.now()}${ext}`;
      }

      try {
        const formDataPayload = new FormData();
        formDataPayload.append('receipt', file, finalName);

        await runWithLoading(sequence, async () => {
          const res = await api.post('/ocr/process', formDataPayload, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          const extracted = res.data;

        const claimData = {
          merchant: extracted.vendor || '',
          invoiceNumber: extracted.invoiceNumber || '',
          invoiceDate: parseSafeDate(extracted.date),
          submissionDate: new Date().toISOString(),
          amount: extracted.amount || '',
          tax: extracted.taxAmount || '',
          category: normalizeCategory(extracted.category),
          receiptUrl: extracted.receiptUrl,
          fileName: file.name,
          fileType: file.type || (fileExt === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : fileExt === '.pdf' ? 'application/pdf' : 'image/png'),
          fileSize: file.size,
          ocrOverallScore: extracted.confidenceScore ? Math.round(extracted.confidenceScore * 100) : null,
          ocrTimestamp: new Date().toISOString(),
          ocrConfidence: extracted.ocrConfidence || null,
          receiptHash: extracted.receiptHash || '',
          invoiceFingerprint: extracted.invoiceFingerprint || '',
        };

        setActiveClaimData(claimData);
        addNotification(
          'OCR Scanning Succeeded',
          claimData.amount
            ? `Successfully extracted ₹${Number(claimData.amount).toLocaleString('en-IN')} from "${file.name}". Review details in the form.`
            : `File "${file.name}" uploaded successfully. Fill in claim details.`,
          'success'
        );
        setFormMode('Create');
        setIsFormOpen(true);
        navigate('/employee/submit');
      });
    } catch (err) {
      console.error('Failed to process OCR receipt upload:', err);
      if (err?.error?.code === 'DUPLICATE_RECEIPT') {
        setDuplicateData({
          duplicateType: err.error.duplicateType,
          existingClaim: err.error.existingClaim
        });
      } else if (err?.error?.code === 'SCREENSHOT_DETECTED') {
        setDuplicateData({
          isScreenshot: true,
          screenshotMessage: err.error.reason
        });
      } else {
        addNotification(
          'Upload & OCR Failed',
          err.message || 'Failed to upload or parse receipt file.',
          'error'
        );
      }
    } finally {
      setSelectedFile(null);
    }
  };



  const handleFormSubmit = async (submittedData) => {
    setLoading(true);
    try {
      const isNew = !claims.some((item) => item.id === submittedData.id);

      if (isNew) {
        await api.post('/expense', submittedData);
        addNotification(
          submittedData.status === 'Draft' ? 'Claim Draft Saved' : 'Claim Submitted',
          submittedData.status === 'Draft'
            ? `Claim draft has been saved.`
            : `Claim for ₹${Number(submittedData.amount).toLocaleString('en-IN')} has been submitted for review.`,
          submittedData.status === 'Draft' ? 'info' : 'success'
        );
      } else {
        await api.put(`/expense/${submittedData.id}`, submittedData);
        addNotification(
          submittedData.status === 'Draft' ? 'Claim Draft Updated' : 'Claim Submitted',
          submittedData.status === 'Draft'
            ? `Claim draft ${submittedData.id} has been saved.`
            : `Claim ${submittedData.id} has been submitted for review.`,
          submittedData.status === 'Draft' ? 'info' : 'success'
        );
      }

      // Re-fetch claims from database
      const res = await api.get('/expense/my-claims');
      if (res && res.success && res.data) {
        setClaims(res.data.claims || []);
      }
      setIsFormOpen(false);
      setActiveClaimData(null);
      navigate('/employee');
    } catch (err) {
      console.error('Failed to submit claim:', err);
      // Rethrow error so calling component (ExpenseForm) can capture duplicate errors and keep form state open
      throw err;
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  // 1. RENDER CREATE EXPENSE CLAIM VIEW
  if (location.pathname === '/employee/submit') {
    return (
      <div className="space-y-6 animate-fade-in font-sans">
        {/* Back Link Header */}
        <div className="text-left">
          <button
            onClick={handleFormClose}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors uppercase tracking-wider mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 font-display">
            Create Expense Claim
          </h1>
          <p className="text-sm text-slate-500">
            Fill in the expense details or upload/capture a receipt to automatically parse transaction information.
          </p>
        </div>

        {/* Dedicated Page Form Container */}
        <div className="max-w-6xl mx-auto">
          <ExpenseForm
            isOpen={true}
            onClose={handleFormClose}
            mode={formMode}
            data={activeClaimData}
            onSubmit={handleFormSubmit}
            userRole="Employee"
            renderInline={true}
          />
        </div>
      </div>
    );
  }

  // 2. RENDER SCAN RECEIPT VIEW
  if (location.pathname === '/employee/scan') {
    return (
      <div className="space-y-6 animate-fade-in font-sans">
        {/* Back Link Header */}
        <div className="text-left">
          <button
            onClick={() => navigate('/employee')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors uppercase tracking-wider mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 font-display">
            Scan Receipt (OCR)
          </h1>
          <p className="text-sm text-slate-500">
            Upload receipt documents or invoices. Our AI parser automatically reads, verifies, and fills the claim fields.
          </p>
        </div>

        {/* Drag and Drop Box */}
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl transition-all ${
                dragActive 
                  ? 'border-red-500 bg-red-50/30' 
                  : 'border-slate-300 hover:border-red-500 hover:bg-slate-50/40'
              }`}
            >
              <UploadCloud className="h-16 w-16 text-slate-400 mb-4 animate-bounce" style={{ animationDuration: '3s' }} />
              <h3 className="text-base font-bold text-slate-800">
                Drag and drop your receipt here
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-6">
                Supports JPEG, PNG, PDF, and DOCX files up to 10MB
              </p>

              {/* Upload Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full justify-center items-center">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors">
                  <Upload className="h-4 w-4" />
                  Upload Receipt
                  <input
                    type="file"
                    accept="image/*,application/pdf,.docx,.doc"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                {isMobile && (
                  <button
                    type="button"
                    onClick={handleCaptureClick}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-700 hover:bg-slate-800 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors"
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
                    onChange={handleCameraCapture}
                  />
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Drawer popup */}
        <ExpenseForm
          isOpen={isFormOpen}
          onClose={handleFormClose}
          mode={formMode}
          data={activeClaimData}
          onSubmit={handleFormSubmit}
          userRole="Employee"
        />

        <DuplicateWarningModal
          isOpen={!!duplicateData}
          onClose={() => setDuplicateData(null)}
          duplicateType={duplicateData?.duplicateType}
          existingClaim={duplicateData?.existingClaim}
          isScreenshot={duplicateData?.isScreenshot}
          screenshotMessage={duplicateData?.screenshotMessage}
        />

        <ImageQualityAlertModal
          isOpen={isQualityAlertOpen}
          onClose={handleCloseQualityAlert}
          onConfirm={handleConfirmQualityAlert}
          diagnostics={pendingDiagnostics}
          dataUrl={pendingDataUrl}
        />
      </div>
    );
  }

  // 2. RENDER CLAIM HISTORY ONLY VIEW
  if (location.pathname === '/employee/claims') {
    return (
      <div className="space-y-6 animate-fade-in font-sans">
        {/* Back Link Header */}
        <div className="text-left">
          <button
            onClick={() => navigate('/employee')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors uppercase tracking-wider mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 font-display">
            Claim History Ledger
          </h1>
          <p className="text-sm text-slate-500">
            View full record audits of your submitted and processed expense items.
          </p>
        </div>

        {/* Full Ledger */}
        <Card title="Claims History Ledger">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Claim ID</th>
                  <th className="py-3 px-4">Claim Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Invoice Date</th>
                  <th className="py-3 px-4">Submission Date & Time</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {claims.map((claim) => {
                  const isReturned = claim.status === 'Returned';
                  const isDraft = claim.status === 'Draft';

                  return (
                    <tr
                      key={claim.id}
                      onClick={() => handleRowClick(claim)}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-4 font-semibold text-slate-500 font-mono">{claim.id}</td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800 leading-tight group-hover:text-red-600 transition-colors">
                          {claim.title}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-semibold text-left">
                       <div>{claim.category}</div>
                       {claim.subcategory && (
                         <div className="text-[10px] text-slate-400 font-normal font-sans">{claim.subcategory}</div>
                       )}
                     </td>
                      <td className="py-4 px-4 text-slate-500 font-sans">{formatDateOnly(claim.invoiceDate)}</td>
                      <td className="py-4 px-4 text-slate-500 font-sans">{formatDateTime(claim.submissionDate)}</td>
                      <td className="py-4 px-4 font-extrabold text-slate-800">
                        ₹{claim.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={claim.status} />
                      </td>
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          {isReturned || isDraft ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800"
                              onClick={() => handleRowClick(claim)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              Correct
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1 hover:border-slate-400 hover:bg-slate-50"
                              onClick={() => handleRowClick(claim)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Drawer popup */}
        <ExpenseForm
          isOpen={isFormOpen}
          onClose={handleFormClose}
          mode={formMode}
          data={activeClaimData}
          onSubmit={handleFormSubmit}
          userRole="Employee"
        />
      </div>
    );
  }

  // 3. DEFAULT DASHBOARD VIEW
  const latestClaim = claims.length > 0
    ? [...claims].sort((a, b) => new Date(b.submissionDate || b.createdAt) - new Date(a.submissionDate || a.createdAt))[0]
    : null;

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-left">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 font-display">
            Employee Workspace
          </h1>
          <p className="text-sm text-slate-500">
            Create claims, upload receipt files for OCR extractions, and review settlement timelines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleQuickOcrClick} className="flex items-center gap-1.5 shadow-sm">
            <UploadCloud className="h-4 w-4" />
            Quick OCR Upload
          </Button>
          <Button variant="primary" onClick={handleNewClaimClick} className="flex items-center gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            New Claim
          </Button>
        </div>
      </div>

      {/* 5-Card Metrics Summaries Grid */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-5">
        {/* Card 1: Drafts */}
        <Card className="border-t-4 border-t-slate-400 p-4 hover:scale-102 transition-transform">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Drafts</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 font-display">{metrics.Draft}</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">Unsent</span>
          </div>
        </Card>

        {/* Card 2: Pending (Submitted) */}
        <Card className="border-t-4 border-t-blue-500 p-4 hover:scale-102 transition-transform">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Review</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 font-display">{metrics.Submitted}</span>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold">Awaiting</span>
          </div>
        </Card>

        {/* Card 3: Approved */}
        <Card className="border-t-4 border-t-emerald-500 p-4 hover:scale-102 transition-transform">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Finance Review</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 font-display">{metrics.Approved}</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold font-sans">Awaiting Audit</span>
          </div>
        </Card>

        {/* Card 4: Returned */}
        <Card className="border-t-4 border-t-amber-500 p-4 hover:scale-102 transition-transform">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Returned for Correction</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 font-display text-amber-600">{metrics.Returned}</span>
            <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold font-sans">Action Req.</span>
          </div>
        </Card>

        {/* Card 5: Reimbursed */}
        <Card className="border-t-4 border-t-green-600 p-4 hover:scale-102 transition-transform">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Approved & Synced to Oracle</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 font-display text-emerald-700">{metrics.Reimbursed}</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold font-sans">Synced</span>
          </div>
        </Card>
      </div>

      {/* Claims Ledger Table Card */}
      {/* Redesigned Info & Activity Layout */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Employee Info Card */}
        <Card title="Employee Profile">
          <div className="space-y-4 text-sm font-sans pt-1">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Employee Name</span>
              <span className="font-extrabold text-slate-800">{user?.name || 'John Employee'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">OLM ID</span>
              <span className="font-bold text-slate-800 font-mono">{user?.id?.toUpperCase() || 'EMP_123'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Cost Centre</span>
              <span className="font-extrabold text-slate-800">{user?.costCenter || 'CC-ENG-402'}</span>
            </div>
            <div className="flex justify-between items-center pb-1">
              <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Reimbursement Currency</span>
              <span className="font-extrabold text-slate-800">INR</span>
            </div>
          </div>
        </Card>

        {/* Latest Claim Activity Card */}
        <Card
          title="Latest Claim Activity"
          headerAction={
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/employee/claims')}
              className="flex items-center gap-1.5 font-bold shadow-sm"
            >
              <History className="h-4 w-4" />
              View Ledger
            </Button>
          }
        >
          {latestClaim ? (
            <div className="space-y-4 text-sm font-sans pt-1">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Claim ID & Title</span>
                <div className="text-right">
                  <span className="font-mono text-slate-500 font-semibold mr-2">{latestClaim.id}</span>
                  <span className="font-extrabold text-slate-800">{latestClaim.title}</span>
                </div>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Category</span>
                <span className="font-extrabold text-slate-800">
                  {latestClaim.category}
                  {latestClaim.subcategory && <span className="text-xs font-normal text-slate-400 ml-1">({latestClaim.subcategory})</span>}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Amount</span>
                <span className="font-extrabold text-slate-800">₹{latestClaim.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Status</span>
                <StatusBadge status={latestClaim.status} />
              </div>
              <div className="flex justify-between items-center pb-1">
                <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Submission Date</span>
                <span className="font-semibold text-slate-500">{formatDateTime(latestClaim.submissionDate || latestClaim.createdAt)}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 font-sans">
              <History className="h-10 w-10 mb-2 opacity-40 text-slate-500" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">No recent claims</span>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                Create a new claim to view activity updates.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* How to Apply a Claim Card (Instructions) */}
      <Card title="How to Apply a Claim">
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 text-sm text-slate-600 font-sans pt-1">
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
              Receipt Guidelines
            </h4>
            <ul className="list-disc pl-5 space-y-2 text-xs leading-relaxed">
              <li>Upload a clear, readable receipt photograph.</li>
              <li>PDF/DOCX can be used where applicable for better readability.</li>
              <li>Credit-card slips are not invoices.</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
              Policy Compliance
            </h4>
            <ul className="list-disc pl-5 space-y-2 text-xs leading-relaxed">
              <li>Check all extracted/manual details carefully before submitting.</li>
              <li>Do not submit duplicate invoices.</li>
              <li>Submit claims within the applicable policy period (60 days where applicable).</li>
              <li>Follow approved travel/exception approval processes where required.</li>
            </ul>
          </div>
        </div>
      </Card>

      <ExpenseForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        mode={formMode}
        data={activeClaimData}
        onSubmit={handleFormSubmit}
        userRole="Employee"
      />

      <DuplicateWarningModal
        isOpen={!!duplicateData}
        onClose={() => setDuplicateData(null)}
        duplicateType={duplicateData?.duplicateType}
        existingClaim={duplicateData?.existingClaim}
        isScreenshot={duplicateData?.isScreenshot}
        screenshotMessage={duplicateData?.screenshotMessage}
      />

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

export default EmployeeDashboard;
