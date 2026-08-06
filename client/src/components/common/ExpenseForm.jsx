import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, MessageSquare, AlertCircle } from 'lucide-react';
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
    department: '',
    costCenter: '',
    projectCode: '',
    expenseType: 'Reimbursable',
    description: '',
    employeeNotes: '',
    managerComments: '',
    financeComments: '',
    ocrOverallScore: null,
    ocrTimestamp: null,
    ocrConfidence: null,
  });

  const [receiptUrl, setReceiptUrl] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');
  const [fileSize, setFileSize] = useState(null);
  const [uploadDate, setUploadDate] = useState(null);
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [duplicateData, setDuplicateData] = useState(null);
  const [receiptHash, setReceiptHash] = useState('');
  const [invoiceFingerprint, setInvoiceFingerprint] = useState('');

  // Return to Employee comment prompt
  const [showReturnRemarks, setShowReturnRemarks] = useState(false);
  const [returnRemarks, setReturnRemarks] = useState('');
  const [alertConfig, setAlertConfig] = useState(null);

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ title, message, type });
  };

  const isEditable = mode === 'Create' || mode === 'Draft' || mode === 'Returned';
  const isCreateLayout = mode === 'Create' || mode === 'Draft';

  // Synchronize incoming data
  useEffect(() => {
    if (!isOpen) return;

    if (data && Object.keys(data).length > 0) {
      setFormData({
        merchant: data.merchant || '',
        invoiceNumber: data.invoiceNumber || '',
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate).toISOString().split('T')[0] : (data.date ? new Date(data.date).toISOString().split('T')[0] : ''),
        submissionDate: data.submissionDate || '',
        amount: data.amount || '',
        currency: data.currency || 'INR',
        tax: data.tax || '',
        category: data.category || '',
        department: data.department || '',
        costCenter: data.costCenter || '',
        projectCode: data.projectCode || '',
        expenseType: data.expenseType || 'Reimbursable',
        description: data.description || '',
        employeeNotes: data.employeeNotes || '',
        managerComments: data.managerComments || '',
        financeComments: data.financeComments || '',
        ocrOverallScore: data.ocrOverallScore !== undefined ? data.ocrOverallScore : null,
        ocrTimestamp: data.ocrTimestamp || null,
        ocrConfidence: data.ocrConfidence || null,
      });
      setReceiptUrl(data.receiptUrl || null);
      setFileName(data.fileName || '');
      setFileType(data.fileType || '');
      setFileSize(data.fileSize || null);
      setUploadDate(data.uploadDate || null);
      setReceiptHash(data.receiptHash || '');
      setInvoiceFingerprint(data.invoiceFingerprint || '');
    } else {
      setFormData({
        merchant: '',
        invoiceNumber: '',
        invoiceDate: '',
        submissionDate: '',
        amount: '',
        currency: 'INR',
        tax: '',
        category: '',
        department: user?.department || '',
        costCenter: user?.costCenter || '',
        projectCode: '',
        expenseType: 'Reimbursable',
        description: '',
        employeeNotes: '',
        managerComments: '',
        financeComments: '',
        ocrOverallScore: null,
        ocrTimestamp: null,
        ocrConfidence: null,
      });
      setReceiptUrl(null);
      setFileName('');
      setFileType('');
      setFileSize(null);
      setUploadDate(null);
      setReceiptHash('');
      setInvoiceFingerprint('');
    }

    setErrors({});
    setReturnRemarks('');
    setShowReturnRemarks(false);
  }, [isOpen, data, mode]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear validation error when editing field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedMimeTypes = [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
      ];
      const allowedExtensions = ['.png', '.jpg', '.jpeg', '.pdf', '.docx', '.doc'];
      
      const fileExt = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      const isMimeValid = file.type && allowedMimeTypes.includes(file.type);
      const isExtValid = allowedExtensions.includes(fileExt);

      if (!isMimeValid && !isExtValid) {
        showAlert('Unsupported Format', 'Please upload PNG, JPG, JPEG, PDF, or DOCX receipt files.', 'warning');
        return;
      }

      try {
        const formDataPayload = new FormData();
        formDataPayload.append('receipt', file);

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

          setReceiptUrl(uploadedUrl);
          setFileName(file.name);
          setFileType(file.type || (fileExt === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : fileExt === '.doc' ? 'application/msword' : fileExt === '.pdf' ? 'application/pdf' : 'image/png'));
          setFileSize(file.size);
          setUploadDate(new Date().toISOString());
          setReceiptHash(extracted.receiptHash || '');
          setInvoiceFingerprint(extracted.invoiceFingerprint || '');

          setFormData((prev) => ({
            ...prev,
            merchant: extracted.vendor || prev.merchant || '',
            invoiceNumber: extracted.invoiceNumber || prev.invoiceNumber || '',
            amount: extracted.amount !== undefined ? extracted.amount : prev.amount || '',
            tax: extracted.taxAmount !== undefined ? extracted.taxAmount : prev.tax || '',
            invoiceDate: extracted.date ? new Date(extracted.date).toISOString().split('T')[0] : prev.invoiceDate || '',
            currency: extracted.currency || prev.currency || 'INR',
            description: extracted.description || prev.description || '',
            category: extracted.category || prev.category || '',
            ocrOverallScore: extracted.confidenceScore ? Math.round(extracted.confidenceScore * 100) : prev.ocrOverallScore,
            ocrTimestamp: new Date().toISOString(),
            ocrConfidence: extracted.ocrConfidence || prev.ocrConfidence,
          }));

          if (addNotification) {
            addNotification(
              'OCR Scanning Succeeded',
              extracted.amount
                ? `Successfully extracted ₹${Number(extracted.amount).toLocaleString('en-IN')} from "${file.name}". Review details in the form.`
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
    }
  };

  // Perform Form Validations
  const validateForm = () => {
    const tempErrors = {};
    if (!formData.merchant?.trim()) tempErrors.merchant = 'Merchant name is required';
    if (!formData.invoiceDate) tempErrors.invoiceDate = 'Invoice date is required';
    if (!formData.category) tempErrors.category = 'Category selection is required';
    
    const amt = Number(formData.amount);
    if (!formData.amount || isNaN(amt)) {
      tempErrors.amount = 'Claim amount is required';
    } else if (amt <= 0) {
      tempErrors.amount = 'Claim amount must be greater than zero';
    }

    if (!formData.description?.trim()) {
      tempErrors.description = 'Business Purpose justification is required';
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
          receiptUrl,
          fileName,
          fileType,
          fileSize,
          uploadDate,
          receiptHash,
          invoiceFingerprint,
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
          receiptUrl,
          fileName,
          fileType,
          fileSize,
          uploadDate,
          receiptHash,
          invoiceFingerprint,
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

  const modalContent = (
    <>
      {/* Backdrop Layer */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-300"
      />

      {/* Floating Center Modal container (Permanently max-w-6xl) */}
      <div 
        className="fixed inset-x-4 top-[8vh] bottom-[8vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 z-[70] flex w-auto md:w-full max-w-6xl flex-col bg-white shadow-2xl rounded-2xl overflow-hidden font-sans border border-slate-200/80"
      >
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
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden">
          
          {/* LEFT: Document Preview Section (Fixed at 50% split width on md, stacked vertically on mobile) */}
          <div className="w-full md:w-1/2 h-auto md:h-full shrink-0 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-900 relative transition-all duration-300">
            <ReceiptSection
              receiptUrl={receiptUrl}
              fileName={fileName}
              fileType={fileType}
              fileSize={fileSize}
              uploadDate={uploadDate}
              isEditable={isEditable}
              onFileChange={handleFileChange}
            />
          </div>

          {/* RIGHT: Form Fields Sections (Full width on mobile/tablet, 50% on md) */}
          <div className="flex flex-col flex-1 bg-slate-50 md:overflow-hidden w-full md:w-1/2">
            
            {/* Scrollable Form Content */}
            <div className="flex-1 md:overflow-y-auto overflow-visible px-8 py-8 space-y-6">
              
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

  return createPortal(modalContent, document.body);
};

export default ExpenseForm;
