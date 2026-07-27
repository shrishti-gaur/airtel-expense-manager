import { useState, useEffect } from 'react';
import { X, AlertTriangle, MessageSquare } from 'lucide-react';
import Button from '../ui/Button';

// Modular Child Components
import StatusBadge from './StatusBadge';
import Timeline from './Timeline';
import ReceiptSection from './ReceiptSection';
import ExpenseDetails from './ExpenseDetails';
import Comments from './Comments';
import ActionButtons from './ActionButtons';

/**
 * Orchestrator component for the right-side Expense Claim drawer form popup
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
  // Centralized Form Fields State
  const [formData, setFormData] = useState({
    merchant: '',
    invoiceNumber: '',
    date: '',
    expenseDate: '',
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
  });

  const [receiptUrl, setReceiptUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);

  // Return to Employee comment prompt
  const [showReturnRemarks, setShowReturnRemarks] = useState(false);
  const [returnRemarks, setReturnRemarks] = useState('');

  const isEditable = mode === 'Create' || mode === 'Draft' || mode === 'Returned';

  // Synchronize incoming data
  useEffect(() => {
    if (!isOpen) return;

    if (data && Object.keys(data).length > 0) {
      setFormData({
        merchant: data.merchant || '',
        invoiceNumber: data.invoiceNumber || '',
        date: data.date ? new Date(data.date).toISOString().split('T')[0] : '',
        expenseDate: data.expenseDate ? new Date(data.expenseDate).toISOString().split('T')[0] : (data.date ? new Date(data.date).toISOString().split('T')[0] : ''),
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
      });
      setReceiptUrl(data.receiptUrl || null);
    } else {
      // Setup empty form defaults for Create
      setFormData({
        merchant: '',
        invoiceNumber: '',
        date: new Date().toISOString().split('T')[0],
        expenseDate: new Date().toISOString().split('T')[0],
        amount: '',
        currency: 'INR',
        tax: '',
        category: '',
        department: 'Engineering',
        costCenter: 'CC-ENG-402',
        projectCode: 'PROJ-AIR-5G',
        expenseType: 'Reimbursable',
        description: '',
        employeeNotes: '',
        managerComments: '',
        financeComments: '',
      });
      setReceiptUrl(null);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setReceiptUrl(url);

      // Preload placeholders to simulate future OCR extraction fields
      if (mode === 'Create' && !formData.merchant) {
        setFormData((prev) => ({
          ...prev,
          merchant: file.name.toLowerCase().includes('airtel') ? 'Airtel India Broadband' : 'Global Telecom Merchant',
          invoiceNumber: `INV-${Math.floor(Math.random() * 900000) + 100000}`,
          amount: '1499',
          tax: '228.66',
          category: 'Internet & Communications',
          description: `Auto-extracted receipt details for file ${file.name}.`,
        }));
      }
    }
  };

  // Perform Form Validations
  const validateForm = () => {
    const tempErrors = {};
    if (!formData.merchant?.trim()) tempErrors.merchant = 'Merchant name is required';
    if (!formData.date) tempErrors.date = 'Invoice date is required';
    if (!formData.expenseDate) tempErrors.expenseDate = 'Expense date is required';
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
  const handleSaveDraft = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({
        ...formData,
        id: data?.id || `EXP-${Date.now()}`,
        status: 'Draft',
        receiptUrl,
        employeeName: data?.employeeName || 'John Employee',
      });
    }
  };

  // Handle Full Submission
  const handleSubmitClaim = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (onSubmit) {
      onSubmit({
        ...formData,
        id: data?.id || `EXP-${Date.now()}`,
        status: 'Submitted',
        receiptUrl,
        employeeName: data?.employeeName || 'John Employee',
      });
    }
  };

  // Handle audit adjustments
  const handleActionClick = (action, remarks = '') => {
    if (onAction && data?.id) {
      onAction(data.id, action, remarks);
    }
  };

  return (
    <>
      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-6xl flex-col bg-slate-50 shadow-2xl border-l border-slate-200 animate-fade-in font-sans">
        
        {/* Drawer Header Area */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2.5">
              <span className="text-base font-bold text-slate-800 font-display">
                {mode === 'Create' ? 'Create Expense Claim' : `Claim ID: ${data?.id || 'Draft'}`}
              </span>
              <StatusBadge status={mode} />
            </div>
            {mode !== 'Create' && (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-3 mt-0.5">
                Filed By: {data?.employeeName || 'John Employee'}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Main Body */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* LEFT: Document Preview Section */}
          <div className="hidden w-2/5 border-r border-slate-200 bg-slate-900 lg:block">
            <ReceiptSection
              receiptUrl={receiptUrl}
              isEditable={isEditable}
              onFileChange={handleFileChange}
            />
          </div>

          {/* RIGHT: Form Fields Stepper Sections */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            
            {/* stepper timeline progress indicator */}
            <div className="mb-6">
              <Timeline status={mode} />
            </div>

            {/* Error panel for corrections */}
            {mode === 'Returned' && data?.managerComments && (
              <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4 text-left">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                      Correction Notes (From Manager Review)
                    </h5>
                    <p className="mt-1 text-sm text-amber-700 leading-relaxed font-medium">
                      "{data.managerComments}"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form Segment */}
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

              <Comments
                formData={formData}
                isEditable={isEditable}
                mode={mode}
                userRole={userRole}
                onChange={handleChange}
                ocrOverallScore={data?.ocrOverallScore}
              />

              {/* Action dialogue prompt */}
              {showReturnRemarks && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-3 text-left">
                  <div className="flex gap-2 text-amber-800 text-xs font-bold uppercase tracking-wide">
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
                      className="bg-amber-600 hover:bg-amber-700"
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
        </div>

        {/* Drawer Action Footer */}
        <ActionButtons
          mode={mode}
          userRole={userRole}
          onClose={onClose}
          onSaveDraft={handleSaveDraft}
          onSubmitClaim={handleSubmitClaim}
          onApprove={() => handleActionClick('Approved', formData.managerComments)}
          onReturn={() => setShowReturnRemarks(true)}
          onReject={() => handleActionClick('Rejected', userRole === 'Manager' ? formData.managerComments : formData.financeComments)}
          onDisburse={() => handleActionClick('Reimbursed', formData.financeComments)}
          processing={processing}
          showReturnRemarksFlag={showReturnRemarks}
        />
      </div>
    </>
  );
};

export default ExpenseForm;
