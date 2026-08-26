import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, MessageSquare, AlertCircle } from 'lucide-react';
import { normalizeCategory, EXPENSE_CATEGORIES } from '../../constants/expenseCategories';
import Button from '../ui/Button';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';

// Modular Child Components
import StatusBadge from './StatusBadge';
import Timeline from './Timeline';
import ReceiptSection from './ReceiptSection';
import ExpenseDetails from './ExpenseDetails';
import Comments from './Comments';
import ActionButtons from './ActionButtons';
import DuplicateWarningModal from './DuplicateWarningModal';
import AppModal from './AppModal';

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

// Modular Child Components

/**
 * Orchestrator component for the centered Expense Claim modal pop-up
 */
const ExpenseForm = ({
  isOpen,
  onClose,
  mode = 'Create', // 'Create' | 'Draft' | 'Submitted' | 'Returned' | 'Approved' | 'Reimbursed'
  data = {},
  onSubmit,
  onAction,
  userRole = 'Employee',
  renderInline = false,
}) => {
  const { user } = useAuth();
  const { runWithLoading, addNotification } = useUI();
  // Centralized Form Fields State
  const [formData, setFormData] = useState({
    merchant: '',
    invoiceNumber: '',
    invoiceDate: '',
    submissionDate: '',
    amount: '',
    currency: 'INR',
    tax: '',
    category: '',
    subcategory: '',
    conveyanceMethod: '',
    tripDistance: '',
    distanceRate: '',
    unitOfMeasure: 'KM',
    department: '',
    costCenter: '',
    projectCode: '',
    expenseType: 'Reimbursable',
    employeeNotes: '',
    managerComments: '',
    financeComments: '',
    ocrOverallScore: null,
    ocrTimestamp: null,
    ocrConfidence: null,
  });

  const [receipts, setReceipts] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [duplicateData, setDuplicateData] = useState(null);

  // Return to Employee comment prompt
  const [showReturnRemarks, setShowReturnRemarks] = useState(false);
  const [returnRemarks, setReturnRemarks] = useState('');
  const [alertConfig, setAlertConfig] = useState(null);

  const [receiptPreference, setReceiptPreference] = useState('yes');

  const handlePreferenceChange = (preference) => {
    setReceiptPreference(preference);
    if (preference === 'no') {
      setReceipts([]);
      setActiveIndex(0);
    }
  };

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ title, message, type });
  };

  const isEditable = mode === 'Create' || mode === 'Draft' || mode === 'Returned';
  const isCreateLayout = mode === 'Create' || mode === 'Draft';

  // Synchronize incoming data
  useEffect(() => {
    if (!isOpen) return;

    if (data && Object.keys(data).length > 0) {
      let initialReceipts = [];
      if (data.receipts && data.receipts.length > 0) {
        initialReceipts = data.receipts;
      } else if (data.receiptUrl) {
        // Fallback for legacy single-receipt claims
        initialReceipts = [{
          receiptUrl: data.receiptUrl,
          fileName: data.fileName || 'receipt_document',
          fileType: data.fileType || '',
          fileSize: data.fileSize || null,
          uploadDate: data.uploadDate || null,
          amount: data.amount || 0,
          tax: data.tax || 0,
          merchant: data.merchant || '',
          invoiceNumber: data.invoiceNumber || '',
          invoiceDate: parseSafeDate(data.invoiceDate || data.date),
          ocrOverallScore: data.ocrOverallScore !== undefined ? data.ocrOverallScore : null,
          ocrTimestamp: data.ocrTimestamp || null,
          ocrConfidence: data.ocrConfidence || null,
          receiptHash: data.receiptHash || '',
          invoiceFingerprint: data.invoiceFingerprint || '',
        }];
      }
      setReceipts(initialReceipts);
      setActiveIndex(0);

      const activeR = initialReceipts[0] || {};
      setFormData({
        merchant: activeR.merchant || data.merchant || '',
        invoiceNumber: activeR.invoiceNumber || data.invoiceNumber || '',
        invoiceDate: parseSafeDate(activeR.invoiceDate || data.invoiceDate || data.date),
        submissionDate: data.submissionDate || '',
        amount: activeR.amount || data.amount || '',
        totalAmount: data.amount || 0,
        currency: activeR.currency || data.currency || 'INR',
        tax: activeR.tax || data.tax || '',
        category: normalizeCategory(data.category) || '',
        subcategory: data.subcategory || '',
        conveyanceMethod: data.conveyanceMethod || '',
        tripDistance: data.tripDistance || '',
        distanceRate: data.distanceRate || '',
        unitOfMeasure: data.unitOfMeasure || 'KM',
        department: data.department || '',
        costCenter: data.costCenter || '',
        projectCode: data.projectCode || '',
        expenseType: data.expenseType || 'Reimbursable',
        employeeNotes: data.employeeNotes || '',
        managerComments: data.managerComments || '',
        financeComments: data.financeComments || '',
        ocrOverallScore: activeR.ocrOverallScore !== undefined ? activeR.ocrOverallScore : (data.ocrOverallScore !== undefined ? data.ocrOverallScore : null),
        ocrTimestamp: activeR.ocrTimestamp || data.ocrTimestamp || null,
        ocrConfidence: activeR.ocrConfidence || data.ocrConfidence || null,
      });
    } else {
      setFormData({
        merchant: '',
        invoiceNumber: '',
        invoiceDate: '',
        submissionDate: '',
        amount: '',
        totalAmount: 0,
        currency: 'INR',
        tax: '',
        category: '',
        subcategory: '',
        conveyanceMethod: '',
        tripDistance: '',
        distanceRate: '',
        unitOfMeasure: 'KM',
        department: user?.department || '',
        costCenter: user?.costCenter || '',
        projectCode: '',
        expenseType: 'Reimbursable',
        employeeNotes: '',
        managerComments: '',
        financeComments: '',
        ocrOverallScore: null,
        ocrTimestamp: null,
        ocrConfidence: null,
      });
      setReceipts([]);
      setActiveIndex(0);
    }

    setErrors({});
    setReturnRemarks('');
    setShowReturnRemarks(false);
  }, [isOpen, data, mode]);

  // Synchronize activeIndex receipt values into formData
  const prevActiveIndexRef = useRef(activeIndex);
  useEffect(() => {
    if (prevActiveIndexRef.current !== activeIndex) {
      prevActiveIndexRef.current = activeIndex;
      if (receipts && receipts[activeIndex]) {
        const r = receipts[activeIndex];
        setFormData((prev) => ({
          ...prev,
          merchant: r.merchant || '',
          invoiceNumber: r.invoiceNumber || '',
          invoiceDate: parseSafeDate(r.invoiceDate || r.date),
          amount: r.amount || '',
          tax: r.tax || '',
          ocrOverallScore: r.ocrOverallScore !== undefined ? r.ocrOverallScore : null,
          ocrTimestamp: r.ocrTimestamp || null,
          ocrConfidence: r.ocrConfidence || null,
        }));
      }
    }
  }, [activeIndex, receipts]);

  // Watch receipts list to dynamically calculate the overall claim totalAmount
  useEffect(() => {
    if (receipts.length > 0) {
      const total = receipts.reduce((sum, r) => sum + Number(r.amount || 0), 0);
      setFormData((prev) => ({
        ...prev,
        totalAmount: total,
        amount: (prev.category === 'Conveyance' && prev.conveyanceMethod === 'Per Kilometer') ? prev.amount : total,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        totalAmount: (prev.category === 'Conveyance' && prev.conveyanceMethod === 'Per Kilometer') ? prev.amount : (prev.amount || 0),
      }));
    }
  }, [receipts, formData.category, formData.conveyanceMethod]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Sync back to receipt array
    const receiptFields = ['merchant', 'invoiceNumber', 'invoiceDate', 'amount', 'tax'];
    if (receiptFields.includes(name) && receipts.length > 0) {
      setReceipts((prev) =>
        prev.map((r, idx) => {
          if (idx === activeIndex) {
            const val = (name === 'amount' || name === 'tax') ? (value === '' ? '' : Number(value)) : value;
            return { ...r, [name]: val };
          }
          return r;
        })
      );
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const uploadAndProcessReceipt = async (file, replaceIndex = null) => {
    const allowedMimeTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.pdf', '.docx', '.doc'];
    
    const fileExt = file.name && file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : '';
    const isMimeValid = file.type && allowedMimeTypes.includes(file.type);
    const isExtValid = allowedExtensions.includes(fileExt);

    if (!isMimeValid && !isExtValid) {
      showAlert('Unsupported Format', 'Please upload PNG, JPG, JPEG, PDF, or DOCX receipt files.', 'warning');
      return;
    }

    let finalName = file.name || 'receipt.jpg';
    if (!allowedExtensions.includes(fileExt)) {
      const ext = file.type === 'image/png' ? '.png' : '.jpg';
      finalName = `captured_receipt_${Date.now()}${ext}`;
    }

    try {
      const formDataPayload = new FormData();
      formDataPayload.append('receipt', file, finalName);

      const sequence = [
        { message: 'Uploading Receipt...', duration: 1000 },
        { message: 'Reading Receipt...', duration: 1200 },
        { message: 'Extracting Text...', duration: 1500 },
        { message: 'Processing...', duration: 800 },
        { message: 'Almost Done...', duration: 600 }
      ];

      await runWithLoading(sequence, async () => {
        const res = await api.post('/ocr/process', formDataPayload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const extracted = res.data;
        const uploadedUrl = extracted.receiptUrl || URL.createObjectURL(file);

        const newReceipt = {
          receiptUrl: uploadedUrl,
          fileName: file.name,
          fileType: file.type || (fileExt === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : fileExt === '.doc' ? 'application/msword' : fileExt === '.pdf' ? 'application/pdf' : 'image/png'),
          fileSize: file.size,
          uploadDate: new Date().toISOString(),
          receiptHash: extracted.receiptHash || '',
          invoiceFingerprint: extracted.invoiceFingerprint || '',
          amount: extracted.amount !== undefined ? Number(extracted.amount) : 0,
          tax: extracted.taxAmount !== undefined ? Number(extracted.taxAmount) : 0,
          merchant: extracted.vendor || '',
          invoiceNumber: extracted.invoiceNumber || '',
          invoiceDate: parseSafeDate(extracted.date) || parseSafeDate(new Date()),
          ocrOverallScore: extracted.confidenceScore ? Math.round(extracted.confidenceScore * 100) : null,
          ocrTimestamp: new Date().toISOString(),
          ocrConfidence: extracted.ocrConfidence || null,
        };

        if (replaceIndex !== null) {
          setReceipts(prev => prev.map((r, idx) => idx === replaceIndex ? newReceipt : r));
        } else {
          setReceipts(prev => [...prev, newReceipt]);
          setActiveIndex(receipts.length);
        }

        if (addNotification) {
          addNotification(
            'OCR Scanning Succeeded',
            extracted.amount
              ? `Successfully extracted ₹${Number(extracted.amount).toLocaleString('en-IN')} from "${file.name}".`
              : `File "${file.name}" uploaded successfully. Fill in claim details.`,
            'success'
          );
        }
      });
    } catch (err) {
      console.error('Failed to upload receipt file:', err);
      if (err?.error?.code === 'DUPLICATE_RECEIPT') {
        setDuplicateData({
          duplicateType: err.error.duplicateType,
          existingClaim: err.error.existingClaim,
        });
      } else if (err?.error?.code === 'SCREENSHOT_DETECTED') {
        setDuplicateData({
          isScreenshot: true,
          screenshotMessage: err.error.reason
        });
      } else {
        showAlert('Upload Failed', 'Failed to upload receipt file to server.', 'error');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadAndProcessReceipt(e.target.files[0], receipts.length > 0 ? activeIndex : null);
    }
  };

  const handleAddNewReceipt = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadAndProcessReceipt(e.target.files[0], null);
    }
  };

  const handleRemoveReceipt = (idxToRemove) => {
    setReceipts(prev => prev.filter((_, idx) => idx !== idxToRemove));
    if (activeIndex >= receipts.length - 1) {
      setActiveIndex(Math.max(0, receipts.length - 2));
    }
  };

  // Perform Form Validations
  const validateForm = () => {
    const tempErrors = {};

    if (!formData.category) {
      tempErrors.category = 'Category selection is required';
    } else if (formData.category === 'Conveyance') {
      if (formData.conveyanceMethod === 'Per Kilometer') {
        const dist = Number(formData.tripDistance);
        if (!formData.tripDistance || isNaN(dist) || dist <= 0) {
          tempErrors.tripDistance = 'Trip distance must be greater than zero';
        }
        const rate = Number(formData.distanceRate);
        if (!formData.distanceRate || isNaN(rate) || rate <= 0) {
          tempErrors.distanceRate = 'Distance rate must be greater than zero';
        }
      } else if (formData.conveyanceMethod === 'Receipt Based') {
        if (!formData.subcategory) {
          tempErrors.subcategory = 'Conveyance expense type is required';
        }
        if (!formData.merchant?.trim()) {
          tempErrors.merchant = 'Merchant name is required';
        }
      } else {
        tempErrors.conveyanceMethod = 'Submission method is required';
      }
    } else {
      // HR-related Expenses and others
      if (!formData.merchant?.trim()) tempErrors.merchant = 'Merchant name is required';
      const selectedCatConfig = EXPENSE_CATEGORIES.find(c => c.id === formData.category);
      if (selectedCatConfig && selectedCatConfig.subcategories && selectedCatConfig.subcategories.length > 0 && !formData.subcategory) {
        tempErrors.subcategory = 'Subcategory selection is required';
      }
    }

    if (!formData.invoiceDate) {
      tempErrors.invoiceDate = 'Invoice / Receipt date is required';
    }

    const amt = Number(formData.amount);
    if (formData.category === 'Conveyance' && formData.conveyanceMethod === 'Per Kilometer') {
      // Amount is calculated and doesn't need to be input, but must be valid
      if (isNaN(amt) || amt <= 0) {
        tempErrors.amount = 'Calculated amount must be greater than zero';
      }
    } else {
      if (!formData.amount || isNaN(amt)) {
        tempErrors.amount = 'Claim amount is required';
      } else if (amt <= 0) {
        tempErrors.amount = 'Claim amount must be greater than zero';
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Handle Draft Submission
  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (onSubmit) {
      setProcessing(true);
      try {
        await onSubmit({
          ...formData,
          id: data?.id || `EXP-${Date.now()}`,
          status: 'Draft',
          submissionDate: formData.submissionDate || new Date().toISOString(),
          receipts,
          employeeName: data?.employeeName || user?.name || 'Unknown Employee',
        });
      } catch (err) {
        console.error('Failed to submit draft:', err);
        if (err?.error?.code === 'DUPLICATE_RECEIPT') {
          setDuplicateData({
            duplicateType: err.error.duplicateType,
            existingClaim: err.error.existingClaim,
          });
        } else {
          showAlert('Save Failed', err.message || 'An error occurred while saving the draft.', 'error');
        }
      } finally {
        setProcessing(false);
      }
    }
  };

  // Handle Full Submission
  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (onSubmit) {
      setProcessing(true);
      try {
        await onSubmit({
          ...formData,
          id: data?.id || `EXP-${Date.now()}`,
          status: 'Submitted',
          submissionDate: new Date().toISOString(),
          receipts,
          employeeName: data?.employeeName || user?.name || 'Unknown Employee',
        });
      } catch (err) {
        console.error('Failed to submit claim:', err);
        if (err?.error?.code === 'DUPLICATE_RECEIPT') {
          setDuplicateData({
            duplicateType: err.error.duplicateType,
            existingClaim: err.error.existingClaim,
          });
        } else {
          showAlert('Submission Failed', err.message || 'An error occurred while submitting the claim.', 'error');
        }
      } finally {
        setProcessing(false);
      }
    }
  };

  // Handle audit adjustments
  const handleActionClick = (action, remarks = '') => {
    if (onAction && data?.id) {
      onAction(data.id, action, remarks);
    }
  };

  if (!isOpen && !renderInline) return null;

  const showReceiptPane = mode === 'Create' ? (receiptPreference === 'yes') : (receipts.length > 0);

  const mainCardContent = (
    <>
        {/* Modal Header Area */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shrink-0">
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2.5">
              <span className="text-base font-bold text-slate-800 font-display">
                {mode === 'Create' ? 'Create Expense Claim' : `Claim ID: ${data?.id || 'Draft'}`}
              </span>
              <StatusBadge status={mode} />
            </div>
            {mode !== 'Create' && (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-3 mt-0.5 font-sans">
                Filed By: {data?.employeeName || data?.employee || (userRole === 'Employee' ? user?.name : 'Unknown Employee')}
              </span>
            )}
          </div>
          {onClose && !renderInline && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Modal Main Body */}
        <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden">
                   {/* LEFT: Document Preview Section (Fixed at 50% split width on md, stacked vertically on mobile) */}
          {showReceiptPane && (
            <div className="w-full md:w-1/2 h-auto md:h-full shrink-0 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-900 relative transition-all duration-300">
              <ReceiptSection
                receipts={receipts}
                activeReceiptIndex={activeIndex}
                onSelectReceipt={setActiveIndex}
                onAddReceipt={handleAddNewReceipt}
                onRemoveReceipt={handleRemoveReceipt}
                isEditable={isEditable}
                onFileChange={handleFileChange}
              />
            </div>
          )}

          {/* RIGHT: Form Fields Sections (Full width on mobile/tablet, 50% on md) */}
          <div className={`flex flex-col flex-1 bg-slate-50 md:overflow-hidden w-full ${showReceiptPane ? 'md:w-1/2' : ''}`}>
            
            {/* Scrollable Form Content */}
            <div className="flex-1 md:overflow-y-auto overflow-visible px-8 py-8 space-y-6">
              
              {/* Receipt Preference Selector (Only for New Claim mode on the dedicated page) */}
              {mode === 'Create' && renderInline && (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm text-left font-sans mb-6">
                  <span className="block text-sm font-extrabold text-slate-800 mb-3 tracking-tight font-display">
                    Do you want to upload a receipt?
                  </span>
                  <div className="grid grid-cols-2 gap-3 max-w-md">
                    <button
                      type="button"
                      onClick={() => handlePreferenceChange('yes')}
                      className={`flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-bold transition-all border cursor-pointer ${
                        receiptPreference === 'yes'
                          ? 'bg-red-50 border-red-500 text-red-600 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Yes, upload receipt
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePreferenceChange('no')}
                      className={`flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-bold transition-all border cursor-pointer ${
                        receiptPreference === 'no'
                          ? 'bg-red-50 border-red-500 text-red-600 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      No, submit manually
                    </button>
                  </div>
                </div>
              )}
              
              {/* Stepper progress indicator: Only shown when viewing an existing claim */}
              {!isCreateLayout && (
                <div className="mb-6">
                  <Timeline status={mode} />
                </div>
              )}

              {/* Correction Notes / Comments from Manager */}
              {mode === 'Returned' && data?.managerComments && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-left shadow-sm">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-amber-800 uppercase tracking-wide font-sans">
                        Correction Notes (From Manager Review)
                      </h5>
                      <p className="mt-1 text-sm text-amber-700 leading-relaxed font-medium">
                        "{data.managerComments}"
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Reusable Form Inputs */}
              <div className="space-y-6">
                <ExpenseDetails
                  formData={formData}
                  isEditable={isEditable}
                  onChange={handleChange}
                  ocrConfidence={data?.ocrConfidence}
                  ocrOverallScore={data?.ocrOverallScore}
                  ocrTimestamp={data?.ocrTimestamp}
                  errors={errors}
                  receipts={receipts}
                  activeIndex={activeIndex}
                  claimData={data}
                />

                {/* Manager / Finance Comments & Actions History */}
                {!isCreateLayout && (
                  <Comments
                    formData={formData}
                    isEditable={isEditable}
                    mode={mode}
                    userRole={userRole}
                    onChange={handleChange}
                    ocrOverallScore={data?.ocrOverallScore}
                  />
                )}

                {/* Action dialogue prompt for Returned claims */}
                {showReturnRemarks && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-3 text-left shadow-sm">
                    <div className="flex gap-2 text-amber-800 text-xs font-bold uppercase tracking-wide font-sans">
                      <MessageSquare className="h-4.5 w-4.5" />
                      <span>Provide Correction Notes</span>
                    </div>
                    <textarea
                      rows="2"
                      required
                      value={returnRemarks}
                      onChange={(e) => setReturnRemarks(e.target.value)}
                      placeholder="Describe what correction is needed..."
                      className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-400 focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowReturnRemarks(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700 font-semibold"
                        disabled={!returnRemarks.trim()}
                        onClick={() => handleActionClick('Returned', returnRemarks)}
                      >
                        Confirm Return
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions footer panel */}
            <div className="shrink-0 bg-white border-t border-slate-200">
              <ActionButtons
                mode={mode}
                userRole={userRole}
                onClose={onClose}
                onSaveDraft={handleSaveDraft}
                onSubmitClaim={handleSubmitClaim}
                onApprove={() => handleActionClick('Approved', formData.managerComments)}
                onReturn={() => setShowReturnRemarks(true)}
                onReject={() => handleActionClick('Rejected', formData.financeComments)}
                onDisburse={() => handleActionClick('Reimbursed', formData.financeComments)}
                processing={processing}
                showReturnRemarksFlag={showReturnRemarks}
              />
            </div>

          </div>
        </div>
    </>
  );

  const modalContent = (
    <>
      {!renderInline && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-300"
        />
      )}

      <div 
        className={renderInline
          ? "flex w-full max-w-6xl flex-col bg-white shadow-xl rounded-2xl overflow-hidden font-sans border border-slate-200/80 min-h-[75vh] md:h-[75vh]"
          : "fixed inset-x-4 top-[8vh] bottom-[8vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 z-[70] flex w-auto md:w-full max-w-6xl flex-col bg-white shadow-2xl rounded-2xl overflow-hidden font-sans border border-slate-200/80"
        }
      >
        {mainCardContent}
      </div>

      <DuplicateWarningModal
        isOpen={!!duplicateData}
        onClose={() => setDuplicateData(null)}
        duplicateType={duplicateData?.duplicateType}
        existingClaim={duplicateData?.existingClaim}
        isScreenshot={duplicateData?.isScreenshot}
        screenshotMessage={duplicateData?.screenshotMessage}
      />

      <AppModal
        isOpen={!!alertConfig}
        onClose={() => setAlertConfig(null)}
        title={alertConfig?.title || 'Notification'}
        subtitle={alertConfig?.type === 'error' ? 'System Error Alert' : alertConfig?.type === 'warning' ? 'Warning Alert' : 'System Success Message'}
        maxWidth="max-w-md"
      >
        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <AlertCircle className={`h-5 w-5 shrink-0 mt-0.5 ${alertConfig?.type === 'warning' ? 'text-amber-500' : alertConfig?.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`} />
          <div className="text-left text-sm text-slate-600 font-sans leading-relaxed">
            {alertConfig?.message}
          </div>
        </div>
      </AppModal>
    </>
  );

  if (renderInline) {
    return modalContent;
  }
  return createPortal(modalContent, document.body);
};

export default ExpenseForm;
