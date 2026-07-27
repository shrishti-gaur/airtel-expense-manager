import React, { useState } from 'react';
import { AlertTriangle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * ExpenseDetails component rendering form fields and OCR placeholders
 */
const ExpenseDetails = ({
  formData = {},
  isEditable,
  onChange,
  ocrConfidence = {},
  ocrOverallScore,
  ocrTimestamp,
  errors = {},
}) => {
  const [businessOpen, setBusinessOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  // Render field with OCR confidence indicator
  const renderField = (name, label, children) => {
    const confidence = ocrConfidence[name];
    const isLowConfidence = confidence && confidence < 80;
    const errorMsg = errors[name];

    return (
      <div className="space-y-1.5 text-left">
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
        } ${
          errorMsg ? 'ring-2 ring-rose-500 ring-offset-1' : ''
        }`}>
          {children}
        </div>
        
        {errorMsg && (
          <p className="text-[11px] font-medium text-rose-600 font-sans animate-pulse">
            {errorMsg}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Basic Details Card */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5 font-sans">
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5 font-display text-left">
          1. Basic Details
        </h4>

        <div className="grid gap-5 sm:grid-cols-2">
          {renderField('merchant', 'Merchant Name', (
            <input
              name="merchant"
              required
              disabled={!isEditable}
              value={formData.merchant || ''}
              onChange={onChange}
              placeholder="e.g. Airtel India Broadband"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-medium"
            />
          ))}

          {renderField('invoiceNumber', 'Invoice / Bill Reference', (
            <input
              name="invoiceNumber"
              disabled={!isEditable}
              value={formData.invoiceNumber || ''}
              onChange={onChange}
              placeholder="e.g. INV-99210"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-medium"
            />
          ))}

          {renderField('date', 'Invoice Date', (
            <input
              name="date"
              type="date"
              required
              disabled={!isEditable}
              value={formData.date || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-medium"
            />
          ))}

          {renderField('expenseDate', 'Expense Date', (
            <input
              name="expenseDate"
              type="date"
              required
              disabled={!isEditable}
              value={formData.expenseDate || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-medium"
            />
          ))}

          {renderField('category', 'Expense Category', (
            <select
              name="category"
              required
              disabled={!isEditable}
              value={formData.category || ''}
              onChange={onChange}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-medium font-semibold"
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

          {renderField('amount', 'Claim Amount', (
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-sm font-semibold">
                {formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : formData.currency === 'GBP' ? '£' : '₹'}
              </span>
              <input
                name="amount"
                type="number"
                required
                disabled={!isEditable}
                value={formData.amount || ''}
                onChange={onChange}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-7 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-medium"
              />
            </div>
          ))}

          {renderField('currency', 'Currency', (
            <select
              name="currency"
              required
              disabled={!isEditable}
              value={formData.currency || 'INR'}
              onChange={onChange}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-medium font-semibold"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          ))}

          {renderField('tax', 'GST / Tax Line Amount', (
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-sm">
                {formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : formData.currency === 'GBP' ? '£' : '₹'}
              </span>
              <input
                name="tax"
                type="number"
                disabled={!isEditable}
                value={formData.tax || ''}
                onChange={onChange}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-7 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-medium"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 2. Business Details Card (Collapsible) */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4 font-sans transition-all">
        <button
          type="button"
          onClick={() => setBusinessOpen(!businessOpen)}
          className="w-full flex items-center justify-between border-b border-slate-100 pb-2.5 cursor-pointer group text-left focus:outline-none"
        >
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-display select-none">
            2. Business details
          </h4>
          <span className="text-slate-400 group-hover:text-slate-700 transition-colors">
            {businessOpen ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
          </span>
        </button>

        {businessOpen && (
          <div className="grid gap-5 sm:grid-cols-2 mt-4 animate-fade-in">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-500">Department</label>
              <input
                name="department"
                disabled={!isEditable}
                value={formData.department || ''}
                onChange={onChange}
                placeholder="e.g. Engineering"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-medium"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-500">Cost Center GL Line</label>
              <input
                name="costCenter"
                disabled={!isEditable}
                value={formData.costCenter || ''}
                onChange={onChange}
                placeholder="e.g. CC-ENG-402"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-medium"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-500 font-sans">Project Code</label>
              <input
                name="projectCode"
                disabled={!isEditable}
                value={formData.projectCode || ''}
                onChange={onChange}
                placeholder="e.g. PROJ-AIR-5G"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-medium"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-500">Expense Payment Type</label>
              <select
                name="expenseType"
                disabled={!isEditable}
                value={formData.expenseType || 'Reimbursable'}
                onChange={onChange}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-medium font-semibold"
              >
                <option value="Reimbursable">Reimbursable (Personal Claim)</option>
                <option value="Corporate Card">Corporate Card (Settlement)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 3. Additional Notes Card (Collapsible) */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4 font-sans transition-all">
        <button
          type="button"
          onClick={() => setNotesOpen(!notesOpen)}
          className="w-full flex items-center justify-between border-b border-slate-100 pb-2.5 cursor-pointer group text-left focus:outline-none"
        >
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-display select-none">
            3. Additional Notes
          </h4>
          <span className="text-slate-400 group-hover:text-slate-700 transition-colors">
            {notesOpen ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
          </span>
        </button>

        {notesOpen && (
          <div className="space-y-5 mt-4 animate-fade-in text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Business Purpose Justification</label>
              <textarea
                name="description"
                rows="2"
                required
                disabled={!isEditable}
                value={formData.description || ''}
                onChange={onChange}
                placeholder="Provide business purpose justification notes..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Employee Notes</label>
              <textarea
                name="employeeNotes"
                rows="2"
                disabled={!isEditable}
                value={formData.employeeNotes || ''}
                onChange={onChange}
                placeholder="Add any additional review details..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-medium"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. OCR details placeholder (for future integration) */}
      {ocrOverallScore !== null && ocrOverallScore !== undefined && (
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4 font-sans text-left">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-display flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              4. OCR & AI Data Extraction
            </h4>
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
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
              <p className="font-bold text-slate-700 font-sans">Airtel-OCR-Parser V2.1</p>
            </div>
            <div>
              <span>Extraction Timestamp:</span>
              <p className="font-bold text-slate-700 font-sans">
                {ocrTimestamp ? new Date(ocrTimestamp).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseDetails;
