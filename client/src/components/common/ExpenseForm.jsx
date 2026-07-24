import React, { useState, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  Upload,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  FileText
} from 'lucide-react';
import Button from '../ui/Button';

/**
 * Reusable Multi-mode Expense Form Drawer Component
 * 
 * Modes:
 * - 'CREATE'
 * - 'VIEW_DRAFT'
 * - 'EDIT_DRAFT'
 * - 'VIEW_PENDING'
 * - 'VIEW_RETURNED' (acts like edit but displays manager comments)
 * - 'VIEW_APPROVED'
 * - 'VIEW_REIMBURSED'
 */
const ExpenseForm = ({
  isOpen,
  onClose,
  mode = 'CREATE',
  data = {},
  onSubmit,
  onAction,
  userRole = 'Employee',
}) => {
  // Form State
  const [formData, setFormData] = useState({
    merchant: '',
    invoiceNumber: '',
    date: '',
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
  const [receiptFile, setReceiptFile] = useState(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  // OCR Metadata
  const [ocrConfidence, setOcrConfidence] = useState({});
  const [ocrOverallScore, setOcrOverallScore] = useState(null);
  const [ocrTimestamp, setOcrTimestamp] = useState(null);

  // Return dialog status (when manager click Return, it requires comments)
  const [showReturnRemarks, setShowReturnRemarks] = useState(false);
  const [returnRemarks, setReturnRemarks] = useState('');

  const isEditable = mode === 'CREATE' || mode === 'EDIT_DRAFT' || mode === 'VIEW_RETURNED';

  // Load Initial Data
  useEffect(() => {
    if (!isOpen) return;

    if (data && Object.keys(data).length > 0) {
      setFormData({
        merchant: data.merchant || '',
        invoiceNumber: data.invoiceNumber || '',
        date: data.date ? new Date(data.date).toISOString().split('T')[0] : '',
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
      setOcrConfidence(data.ocrConfidence || {});
      setOcrOverallScore(data.ocrOverallScore || null);
      setOcrTimestamp(data.ocrTimestamp || null);
    } else {
      // Clear Form for CREATE mode
      setFormData({
        merchant: '',
        invoiceNumber: '',
        date: new Date().toISOString().split('T')[0],
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
      setOcrConfidence({});
      setOcrOverallScore(null);
      setOcrTimestamp(null);
    }

    setReturnRemarks('');
    setShowReturnRemarks(false);
    setZoomScale(1);
  }, [isOpen, data, mode]);

  if (!isOpen) return null;

  // Handle inputs changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file uploads
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      const url = URL.createObjectURL(file);
      setReceiptUrl(url);

      // Simulate AI/OCR parsing on file upload
      if (mode === 'CREATE') {
        simulateOcrExtraction(file.name);
      }
    }
  };

  // Simulate OCR Extractions for demo
  const simulateOcrExtraction = (fileName) => {
    // Generate mock OCR details
    setOcrTimestamp(new Date().toISOString());
    setOcrOverallScore(86);
    setOcrConfidence({
      merchant: 95,
      invoiceNumber: 72, // low confidence
      amount: 98,
      tax: 65, // low confidence
      date: 92,
      category: 78, // low confidence
    });

    setFormData((prev) => ({
      ...prev,
      merchant: fileName.toLowerCase().includes('airtel') ? 'Airtel India Broadband' : 'Global Merchant Corp',
      invoiceNumber: `INV-${Math.floor(Math.random() * 900000) + 100000}`,
      amount: '1499',
      tax: '228.66',
      category: 'Internet & Communications',
      description: `Uploaded receipt file: ${fileName}`,
    }));
  };

  // Submit Handler
  const handleFormSubmit = (e, statusAction = 'SUBMITTED') => {
    e.preventDefault();
    if (!receiptUrl) {
      alert('Please upload a receipt document to proceed.');
      return;
    }

    if (onSubmit) {
      onSubmit({
        ...formData,
        id: data.id || `EXP-${Date.now()}`,
        status: statusAction === 'SUBMITTED' ? 'PENDING_APPROVAL' : 'DRAFT',
        receiptUrl,
        ocrConfidence,
        ocrOverallScore,
        ocrTimestamp,
      });
    }
  };

  // Action execution wrappers (Manager/Finance decisions)
  const executeAction = (action, remarks = '') => {
    if (onAction) {
      onAction(data.id, action, remarks);
    }
  };

  // Workflow steps tracking
  const getWorkflowSteps = () => {
    // Standard steps
    const steps = [
      { key: 'DRAFT', label: 'Draft' },
      { key: 'SUBMITTED', label: 'Submitted' },
      { key: 'MANAGER_REVIEW', label: 'Manager Review' },
      { key: 'FINANCE_REVIEW', label: 'Finance Review' },
      { key: 'APPROVED', label: 'Approved' },
      { key: 'REIMBURSED', label: 'Reimbursed' },
    ];

    // Determine current index
    let activeIndex = 0;
    let isReturned = false;

    if (mode === 'CREATE') activeIndex = 0;
    else if (mode === 'VIEW_DRAFT') activeIndex = 0;
    else if (mode === 'EDIT_DRAFT') activeIndex = 0;
    else if (mode === 'VIEW_PENDING' && userRole === 'Manager') activeIndex = 2;
    else if (mode === 'VIEW_PENDING' && userRole === 'Finance') activeIndex = 3;
    else if (mode === 'VIEW_RETURNED') {
      activeIndex = 2;
      isReturned = true;
    } else if (mode === 'VIEW_APPROVED') activeIndex = 4;
    else if (mode === 'VIEW_REIMBURSED') activeIndex = 5;

    // Map status strings to indices
    const statusMap = {
      DRAFT: 0,
      PENDING_APPROVAL: 2,
      APPROVED: 4,
      PROCESSED: 5,
      REJECTED: 2,
      RETURNED: 2,
    };

    if (data.status) {
      activeIndex = statusMap[data.status] ?? activeIndex;
      if (data.status === 'RETURNED') {
        isReturned = true;
      }
    }

    return { steps, activeIndex, isReturned };
  };

  const { steps, activeIndex, isReturned } = getWorkflowSteps();

  // Helper check for low confidence highlighting
  const renderInputWrapper = (fieldName, label, children) => {
    const confidence = ocrConfidence[fieldName];
    const isLowConfidence = confidence && confidence < 80;

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-500 font-sans">{label}</label>
          {isLowConfidence && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              <AlertTriangle className="h-3 w-3" />
              Low Confidence ({confidence}%)
            </span>
          )}
        </div>
        <div className={`relative rounded-lg transition-all ${
          isLowConfidence && isEditable ? 'ring-2 ring-amber-400 ring-offset-1' : ''
        }`}>
          {children}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Background overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
      />

      {/* Slide-in Right Drawer Container */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-6xl flex-col bg-slate-50 shadow-2xl border-l border-slate-200 animate-fade-in">
        
        {/* Header Block */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight text-slate-800 font-display">
              {mode === 'CREATE' ? 'Submit New Claim' : `Expense Details: ${data.id || 'Draft'}`}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              isReturned ? 'bg-amber-100 text-amber-800 border border-amber-200' :
              mode.includes('VIEW_REIMBURSED') ? 'bg-emerald-100 text-emerald-800' :
              mode.includes('VIEW') ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
            }`}>
              {isReturned ? 'Returned for Correction' : mode.replace('VIEW_', '').replace('EDIT_', '')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Body (Split Screen Layout) */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* LEFT SIDE PANEL: Receipt Viewer */}
          <div className="hidden w-2/5 flex-col border-r border-slate-200 bg-slate-900/95 p-6 lg:flex">
            <div className="mb-4 flex items-center justify-between text-white">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Receipt Document</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setZoomOpen(true)}
                  className="rounded bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white"
                  title="Zoom receipt"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Receipt Frame */}
            <div className="flex flex-1 items-center justify-center rounded-xl bg-slate-950/50 border border-slate-800/80 overflow-hidden relative group">
              {receiptUrl ? (
                <div className="relative h-full w-full flex items-center justify-center p-4">
                  <img
                    src={receiptUrl}
                    alt="Receipt Invoice"
                    className="max-h-full max-w-full object-contain rounded transition-transform"
                    style={{ transform: `scale(${zoomScale})` }}
                  />
                  
                  {/* Image Controls Overlay */}
                  <div className="absolute bottom-4 flex gap-2 rounded-lg bg-slate-950/80 p-1 border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setZoomScale(s => Math.max(0.5, s - 0.25))}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setZoomScale(1)}
                      className="p-1 text-slate-400 hover:text-white text-xs font-semibold px-1"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setZoomScale(s => Math.min(2.5, s + 0.25))}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 space-y-3">
                  <FileText className="mx-auto h-16 w-16 text-slate-700" />
                  <p className="text-sm font-semibold text-slate-400">No document uploaded</p>
                  <p className="text-xs text-slate-500">Provide a file to trigger AI data extractions</p>
                </div>
              )}
            </div>

            {/* Replace Button (Editable only) */}
            {isEditable && (
              <div className="mt-4">
                <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 bg-slate-950/30 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-950/50 hover:text-white transition-all">
                  <Upload className="h-4 w-4" />
                  {receiptUrl ? 'Replace Uploaded Receipt' : 'Upload Receipt File'}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            )}
          </div>

          {/* RIGHT SIDE PANEL: Form Fields Scrollable */}
          <div className="flex-1 overflow-y-auto bg-slate-50 px-8 py-6">
            
            {/* WORKFLOW PROGRESS TIMELINE SECTION */}
            <div className="mb-8 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 font-sans">
                Workflow Track State
              </p>
              
              {/* Timeline Horizontal Line */}
              <div className="relative flex items-center justify-between">
                <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-slate-200" />
                <div 
                  className={`absolute left-0 top-1/2 h-0.5 -translate-y-1/2 transition-all duration-500 ${
                    isReturned ? 'bg-amber-400' : 'bg-red-500'
                  }`}
                  style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, idx) => {
                  const isCompleted = idx < activeIndex;
                  const isActive = idx === activeIndex;
                  
                  let circleClass = 'bg-slate-200 border-slate-300 text-slate-500';
                  
                  if (isCompleted) {
                    circleClass = 'bg-red-600 border-red-600 text-white';
                  } else if (isActive) {
                    circleClass = isReturned 
                      ? 'bg-amber-500 border-amber-500 text-white ring-4 ring-amber-100'
                      : 'bg-red-600 border-red-600 text-white ring-4 ring-red-100 animate-pulse';
                  }

                  // Handle Completed Payout Step
                  if (isCompleted && step.key === 'REIMBURSED') {
                    circleClass = 'bg-emerald-600 border-emerald-600 text-white';
                  }

                  return (
                    <div key={step.key} className="relative z-10 flex flex-col items-center">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold transition-all ${circleClass}`}>
                        {isCompleted ? '✓' : idx + 1}
                      </div>
                      <span className={`absolute top-8 whitespace-nowrap text-[10px] font-bold ${
                        isActive ? 'text-slate-800 font-extrabold' : 'text-slate-400'
                      }`}>
                        {step.key === 'MANAGER_REVIEW' && isReturned ? 'Returned' : step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="h-4" /> {/* spacing spacer */}
            </div>

            {/* ERROR / EXCEPTION BANNER FOR RETURNED CLAIMS */}
            {isReturned && data.managerComments && (
              <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-amber-800 uppercase tracking-wide font-sans">
                      Remarks for Correction (From Manager)
                    </h5>
                    <p className="mt-1 text-sm text-amber-700 leading-relaxed font-sans font-medium">
                      "{data.managerComments}"
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-6">
              
              {/* SECTION 1: Expense Details */}
              <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 font-display">
                  1. Expense Details
                </h4>

                <div className="grid gap-4 sm:grid-cols-2">
                  {renderInputWrapper('merchant', 'Merchant Name', (
                    <input
                      name="merchant"
                      required
                      disabled={!isEditable}
                      value={formData.merchant}
                      onChange={handleChange}
                      placeholder="e.g. Airtel India Broadband"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  ))}

                  {renderInputWrapper('invoiceNumber', 'Invoice / Bill Reference', (
                    <input
                      name="invoiceNumber"
                      disabled={!isEditable}
                      value={formData.invoiceNumber}
                      onChange={handleChange}
                      placeholder="e.g. INV-99210"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  ))}

                  {renderInputWrapper('date', 'Invoice Date', (
                    <div className="relative">
                      <input
                        name="date"
                        type="date"
                        required
                        disabled={!isEditable}
                        value={formData.date}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                  ))}

                  {renderInputWrapper('category', 'Expense Category', (
                    <select
                      name="category"
                      required
                      disabled={!isEditable}
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    >
                      <option value="">-- Choose Category --</option>
                      <option value="Travel">Travel & Lodging</option>
                      <option value="Meals">Meals & Entertainment</option>
                      <option value="Internet & Communications">Internet & Communications</option>
                      <option value="Software Licences">Software Licenses & SaaS</option>
                      <option value="Office Supplies">Office Supplies</option>
                      <option value="Others">Others</option>
                    </select>
                  ))}

                  {renderInputWrapper('amount', 'Claim Amount', (
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-sm font-semibold">₹</span>
                      <input
                        name="amount"
                        type="number"
                        required
                        disabled={!isEditable}
                        value={formData.amount}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-7 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                  ))}

                  {renderInputWrapper('tax', 'Extracted Tax Line (GST)', (
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-sm">₹</span>
                      <input
                        name="tax"
                        type="number"
                        disabled={!isEditable}
                        value={formData.tax}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-7 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 2: Business Information */}
              <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 font-display">
                  2. Business Information
                </h4>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Department</label>
                    <input
                      name="department"
                      disabled={!isEditable}
                      value={formData.department}
                      onChange={handleChange}
                      placeholder="e.g. Engineering"
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500">Cost Center GL Line</label>
                    <input
                      name="costCenter"
                      disabled={!isEditable}
                      value={formData.costCenter}
                      onChange={handleChange}
                      placeholder="e.g. CC-ENG-402"
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500">Project Code</label>
                    <input
                      name="projectCode"
                      disabled={!isEditable}
                      value={formData.projectCode}
                      onChange={handleChange}
                      placeholder="e.g. PROJ-AIR-5G"
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500">Payment Type</label>
                    <select
                      name="expenseType"
                      disabled={!isEditable}
                      value={formData.expenseType}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    >
                      <option value="Reimbursable">Reimbursable (Personal Claim)</option>
                      <option value="Corporate Card">Corporate Card (Settlement)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500">Business Justification Description</label>
                  <textarea
                    name="description"
                    rows="3"
                    required
                    disabled={!isEditable}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Provide justification notes for cost allocation approval..."
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              </div>

              {/* SECTION 3: OCR Data Extractor Details */}
              {ocrOverallScore !== null && (
                <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-display flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      3. OCR & AI Data Extraction
                    </h4>
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${
                      ocrOverallScore < 80 
                        ? 'bg-amber-50 border-amber-200 text-amber-700' 
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}>
                      Confidence Score: {ocrOverallScore}%
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 text-xs font-medium text-slate-500">
                    <div>
                      <span>AI Model Extractor Version:</span>
                      <p className="font-bold text-slate-700">Airtel-OCR-Parser V2.1</p>
                    </div>
                    <div>
                      <span>Extraction Timestamp:</span>
                      <p className="font-bold text-slate-700">
                        {ocrTimestamp ? new Date(ocrTimestamp).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 4: Comments and Feedback Loops */}
              <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 font-display">
                  {ocrOverallScore !== null ? '4.' : '3.'} Auditor & Approver Remarks
                </h4>

                <div className="space-y-4">
                  {/* Employee remarks */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Employee Cover Notes</label>
                    <textarea
                      name="employeeNotes"
                      rows="2"
                      disabled={!isEditable}
                      value={formData.employeeNotes}
                      onChange={handleChange}
                      placeholder="Add any additional comments for the manager audit..."
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>

                  {/* Manager remarks */}
                  {(mode.includes('VIEW') || mode.includes('EDIT')) && (
                    <div>
                      <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Manager Review Remarks
                      </label>
                      <textarea
                        name="managerComments"
                        rows="2"
                        disabled={!(mode === 'VIEW_PENDING' && userRole === 'Manager')}
                        value={formData.managerComments}
                        onChange={handleChange}
                        placeholder="Add remarks when returning or rejecting..."
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                  )}

                  {/* Finance remarks */}
                  {(mode.includes('VIEW_APPROVED') || mode.includes('VIEW_REIMBURSED')) && (
                    <div>
                      <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Finance Auditing Comments
                      </label>
                      <textarea
                        name="financeComments"
                        rows="2"
                        disabled={!(mode === 'VIEW_APPROVED' && userRole === 'Finance')}
                        value={formData.financeComments}
                        onChange={handleChange}
                        placeholder="Add payout ledger settlement notes..."
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons inside form for Return to Employee Remarks input */}
              {showReturnRemarks && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-3">
                  <div className="flex gap-2 text-amber-800 text-xs font-bold uppercase tracking-wide">
                    <MessageSquare className="h-4.5 w-4.5" />
                    <span>Enter Correction Requests for Employee</span>
                  </div>
                  <textarea
                    rows="2"
                    required
                    value={returnRemarks}
                    onChange={(e) => setReturnRemarks(e.target.value)}
                    placeholder="Provide details on what needs to be updated (e.g. upload legible receipt, adjust cost center)..."
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
                      onClick={() => executeAction('RETURNED', returnRemarks)}
                    >
                      Confirm Return
                    </Button>
                  </div>
                </div>
              )}

              {/* Main submit buttons hidden, handled by drawer footer */}
              <input type="submit" id="expense-form-submit-trigger" className="hidden" />
            </form>
          </div>
        </div>

        {/* Drawer Actions Footer */}
        <div className="flex h-18 items-center justify-end gap-3 border-t border-slate-200 bg-white px-6">
          
          {/* Mode: EDITABLE (Create / Edit Draft / Returned) */}
          {isEditable && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              
              {mode !== 'VIEW_RETURNED' && (
                <Button
                  variant="outline"
                  onClick={(e) => {
                    // Trigger form submit but as draft status
                    const submitBtn = document.getElementById('expense-form-submit-trigger');
                    if (submitBtn) {
                      // Adjust status flag locally then trigger click
                      setFormData(prev => ({ ...prev }));
                      // Call form submit directly with draft marker
                      handleFormSubmit(e, 'DRAFT');
                    }
                  }}
                  className="hover:bg-slate-100 hover:text-slate-800"
                >
                  Save Draft
                </Button>
              )}
              
              <Button
                variant="primary"
                onClick={() => {
                  const submitBtn = document.getElementById('expense-form-submit-trigger');
                  if (submitBtn) submitBtn.click();
                }}
                className="flex items-center gap-1.5"
              >
                Submit Expense
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Mode: PENDING (Manager Review) */}
          {mode === 'VIEW_PENDING' && userRole === 'Manager' && !showReturnRemarks && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="outline"
                className="border-amber-300 hover:bg-amber-50 hover:text-amber-800"
                onClick={() => setShowReturnRemarks(true)}
              >
                Return to Employee
              </Button>
              <Button
                variant="danger"
                onClick={() => executeAction('REJECTED', formData.managerComments)}
              >
                Reject Claim
              </Button>
              <Button
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => executeAction('APPROVED', formData.managerComments)}
              >
                Approve & Sync
              </Button>
            </>
          )}

          {/* Mode: APPROVED (Finance Auditor) */}
          {(mode === 'VIEW_APPROVED' || (mode === 'VIEW_PENDING' && userRole === 'Finance')) && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => executeAction('REJECTED', formData.financeComments)}
              >
                Reject Payout
              </Button>
              <Button
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => executeAction('PROCESSED', formData.financeComments)}
              >
                Disburse Payout & Sync ERP
              </Button>
            </>
          )}

          {/* Mode: VIEW ONLY (Approved / Reimbursed / Draft View only) */}
          {!isEditable && mode !== 'VIEW_PENDING' && mode !== 'VIEW_APPROVED' && (
            <Button variant="secondary" onClick={onClose}>
              Close Viewer
            </Button>
          )}
        </div>
      </div>

      {/* FULLSCREEN ZOOM MODAL OVERLAY */}
      {zoomOpen && receiptUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 p-4 animate-fade-in"
          onClick={() => setZoomOpen(false)}
        >
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoomOpen(false);
              }}
              className="rounded-full bg-slate-800/80 p-2 text-white hover:bg-slate-700 focus:outline-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <img
            src={receiptUrl}
            alt="Receipt Zoomed"
            className="max-h-full max-w-full object-contain rounded shadow-2xl transition-transform"
            onClick={(e) => e.stopPropagation()} // stop close on image click
          />
        </div>
      )}
    </>
  );
};

export default ExpenseForm;
