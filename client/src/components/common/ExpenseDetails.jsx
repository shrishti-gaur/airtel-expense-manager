import React, { useState, useRef, useEffect } from 'react';
import { AlertTriangle, Sparkles, ChevronDown, ChevronUp, Search, Check } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../../constants/expenseCategories';
import StatusBadge from './StatusBadge';
import { useUI } from '../../context/UIContext';

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
  receipts = [],
  activeIndex = 0,
  claimData = null,
}) => {
  const { expenseCategories } = useUI();
  const [businessOpen, setBusinessOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const [categorySearch, setCategorySearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategorySelect = (categoryId) => {
    onChange({ target: { name: 'category', value: categoryId } });
    onChange({ target: { name: 'conveyanceMethod', value: '' } });
    onChange({ target: { name: 'tripDistance', value: '' } });
    onChange({ target: { name: 'distanceRate', value: '' } });
    onChange({ target: { name: 'unitOfMeasure', value: 'KM' } });
    onChange({ target: { name: 'invoiceNumber', value: '' } });
    onChange({ target: { name: 'amount', value: '' } });

    if (categoryId === 'Network Meeting Expenses') {
      onChange({ target: { name: 'subcategory', value: 'Network Meeting Expenses' } });
      onChange({ target: { name: 'merchant', value: 'Network Meeting' } });
      onChange({ target: { name: 'tax', value: '0' } });
    } else if (categoryId === 'Sales Meeting Expenses') {
      onChange({ target: { name: 'subcategory', value: 'Sales Meeting Expense' } });
      onChange({ target: { name: 'merchant', value: 'Sales Meeting' } });
      onChange({ target: { name: 'tax', value: '0' } });
    } else if (categoryId === 'Network Maintenance Expense') {
      onChange({ target: { name: 'subcategory', value: '' } });
      onChange({ target: { name: 'merchant', value: 'Network Maintenance' } });
      onChange({ target: { name: 'tax', value: '0' } });
    } else if (categoryId === 'Retail Store Expenses') {
      onChange({ target: { name: 'subcategory', value: '' } });
      onChange({ target: { name: 'merchant', value: 'Retail Store' } });
      onChange({ target: { name: 'tax', value: '0' } });
    } else if (categoryId === 'Relocation Expenses') {
      onChange({ target: { name: 'subcategory', value: '' } });
      onChange({ target: { name: 'merchant', value: 'Relocation' } });
      onChange({ target: { name: 'tax', value: '0' } });
    } else if (categoryId === 'Tour Bill') {
      onChange({ target: { name: 'subcategory', value: '' } });
      onChange({ target: { name: 'merchant', value: 'Tour Bill' } });
      onChange({ target: { name: 'tax', value: '0' } });
    } else {
      onChange({ target: { name: 'subcategory', value: '' } });
      onChange({ target: { name: 'merchant', value: '' } });
      onChange({ target: { name: 'tax', value: '' } });
    }

    setDropdownOpen(false);
    setCategorySearch('');
  };

  const handleConveyanceMethodSelect = (method) => {
    onChange({ target: { name: 'conveyanceMethod', value: method } });
    if (method === 'Per Kilometer') {
      onChange({ target: { name: 'subcategory', value: '' } });
      onChange({ target: { name: 'tripDistance', value: '' } });
      onChange({ target: { name: 'distanceRate', value: '' } });
      onChange({ target: { name: 'amount', value: '0' } });
      onChange({ target: { name: 'merchant', value: 'Self-Driven / Conveyance' } });
      onChange({ target: { name: 'invoiceNumber', value: 'N/A' } });
      onChange({ target: { name: 'tax', value: '0' } });
    } else {
      onChange({ target: { name: 'subcategory', value: '' } });
      onChange({ target: { name: 'amount', value: '' } });
      onChange({ target: { name: 'merchant', value: '' } });
      onChange({ target: { name: 'invoiceNumber', value: '' } });
      onChange({ target: { name: 'tax', value: '' } });
    }
  };

  const categoriesList = expenseCategories && expenseCategories.length > 0 ? expenseCategories : EXPENSE_CATEGORIES;
  const selectedCategoryConfig = categoriesList.find(c => c.id === formData.category);
  const hasSubcategories = selectedCategoryConfig && selectedCategoryConfig.subcategories && selectedCategoryConfig.subcategories.length > 0;
  const showSubcategoryField = hasSubcategories || (formData.subcategory && formData.subcategory.trim() !== '');

  // Filter categories by search term
  const filteredCategories = categoriesList.filter(cat => 
    cat.label.toLowerCase().includes(categorySearch.toLowerCase()) ||
    cat.group.toLowerCase().includes(categorySearch.toLowerCase())
  );

  // Group filtered categories by group name
  const groups = {};
  filteredCategories.forEach(cat => {
    if (!groups[cat.group]) {
      groups[cat.group] = [];
    }
    groups[cat.group].push(cat);
  });
  const groupedCategories = Object.entries(groups);

  // Render field with OCR confidence indicator
  const renderField = (name, label, children) => {
    const confidence = ocrConfidence?.[name];
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

  const formatSubmissionDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Basic Details Card */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5 font-sans">
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5 font-display text-left">
          1. Basic Details
        </h4>

        {claimData && (
          <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4 mb-4 text-xs font-sans">
            <div className="text-left">
              <span className="text-slate-400 font-bold uppercase tracking-wider block">Claim ID</span>
              <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">{claimData.id}</span>
            </div>
            <div className="text-left">
              <span className="text-slate-400 font-bold uppercase tracking-wider block">Employee Details</span>
              <span className="font-extrabold text-slate-800 text-sm mt-0.5 block">
                {claimData.employeeName || claimData.employee || 'Unknown Employee'}
              </span>
              <span className="text-slate-400 font-bold font-mono mt-0.5 block">ID: {claimData.employeeId || claimData.employee || 'N/A'}</span>
            </div>
            <div className="text-left">
              <span className="text-slate-400 font-bold uppercase tracking-wider block">Submission Date</span>
              <span className="font-bold text-slate-800 mt-0.5 block">
                {formatSubmissionDate(claimData.submissionDate || claimData.createdAt)}
              </span>
            </div>
            <div className="text-left">
              <span className="text-slate-400 font-bold uppercase tracking-wider block">Current Status</span>
              <span className="mt-1 block">
                <StatusBadge status={claimData.status} />
              </span>
            </div>
          </div>
        )}

        {receipts && receipts.length > 0 && (
          <div className="rounded-xl bg-red-50/50 border border-red-100 p-4 flex items-center justify-between font-sans text-left shadow-xs">
            <div>
              <h5 className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Total Reimbursement Claimed</h5>
              <p className="text-[11px] text-slate-500 mt-0.5">Calculated sum from all {receipts.length} attached receipts</p>
            </div>
            <div className="text-right">
              <span className="text-base font-black text-red-650 font-display">
                ₹{Number(formData.totalAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          {/* 1. Category selector spans full width in grid */}
          <div className="sm:col-span-2">
            {renderField('category', 'Expense Category', (
              <div ref={dropdownRef} className="relative w-full">
                <button
                  type="button"
                  disabled={!isEditable}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-805 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-semibold text-left cursor-pointer"
                >
                  <span className="truncate">
                    {selectedCategoryConfig?.label || '-- Choose Category --'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
                </button>

                {dropdownOpen && isEditable && (
                  <div className="absolute left-0 mt-1 w-full max-w-full rounded-lg border border-slate-200 bg-white shadow-xl z-[80] overflow-hidden">
                    <div className="flex items-center gap-2 p-2 border-b border-slate-100 bg-slate-50">
                      <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Search categories..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-405 focus:outline-none font-sans"
                      />
                    </div>

                    <div className="max-h-60 overflow-y-auto py-1">
                      {groupedCategories.map(([groupName, items]) => (
                        <div key={groupName} className="px-1 py-1">
                          <div className="px-2 py-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/70 rounded-xs">
                            {groupName}
                          </div>
                          <div className="space-y-0.5 mt-1">
                            {items.map((cat) => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleCategorySelect(cat.id)}
                                className={`w-full flex items-center justify-between text-left px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                                  formData.category === cat.id
                                    ? 'bg-red-50 text-red-650'
                                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                              >
                                <span className="truncate">{cat.label}</span>
                                {formData.category === cat.id && (
                                  <Check className="h-3.5 w-3.5 text-red-500 shrink-0 ml-1" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      {groupedCategories.length === 0 && (
                        <div className="px-3 py-3 text-xs text-slate-400 font-sans text-center">
                          No categories found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Conditional Progressive Disclosure Fields */}
          {formData.category === 'Conveyance' ? (
            <>
              {/* Conveyance Submission Method Selector */}
              <div className="sm:col-span-2">
                {renderField('conveyanceMethod', 'Submission Method', (
                  <select
                    name="conveyanceMethod"
                    required
                    disabled={!isEditable}
                    value={formData.conveyanceMethod || ''}
                    onChange={(e) => handleConveyanceMethodSelect(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-505 font-sans font-semibold"
                  >
                    <option value="">-- Select Method --</option>
                    <option value="Per Kilometer">Per Kilometer (Distance Based)</option>
                    <option value="Receipt Based">Receipt Based Claim</option>
                  </select>
                ))}
              </div>

              {formData.conveyanceMethod === 'Per Kilometer' && (
                <>
                  {renderField('invoiceDate', 'Start Date', (
                    <input
                      name="invoiceDate"
                      type="date"
                      required
                      disabled={!isEditable}
                      value={formData.invoiceDate || ''}
                      onChange={onChange}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-medium"
                    />
                  ))}

                  {renderField('unitOfMeasure', 'Unit of Measure', (
                    <input
                      name="unitOfMeasure"
                      type="text"
                      disabled={true}
                      value={formData.unitOfMeasure || 'KM'}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 font-sans font-medium"
                    />
                  ))}

                  {renderField('tripDistance', 'Trip Distance (KM)', (
                    <input
                      name="tripDistance"
                      type="number"
                      required
                      step="any"
                      disabled={!isEditable}
                      value={formData.tripDistance || ''}
                      onChange={(e) => {
                        onChange(e);
                        const distance = Number(e.target.value || 0);
                        const rate = Number(formData.distanceRate || 0);
                        onChange({ target: { name: 'amount', value: (distance * rate).toString() } });
                      }}
                      placeholder="e.g. 15.5"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-medium"
                    />
                  ))}

                  {renderField('distanceRate', 'Distance Rate (INR/KM)', (
                    <input
                      name="distanceRate"
                      type="number"
                      required
                      step="any"
                      disabled={!isEditable}
                      value={formData.distanceRate || ''}
                      onChange={(e) => {
                        onChange(e);
                        const rate = Number(e.target.value || 0);
                        const distance = Number(formData.tripDistance || 0);
                        onChange({ target: { name: 'amount', value: (distance * rate).toString() } });
                      }}
                      placeholder="e.g. 10"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-medium"
                    />
                  ))}

                  {renderField('amount', 'Reimbursement Amount (INR)', (
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-sm font-semibold">₹</span>
                      <input
                        name="amount"
                        type="number"
                        disabled={true}
                        value={formData.amount || ''}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-7 pr-3 text-sm text-slate-550 font-sans font-medium font-semibold"
                      />
                    </div>
                  ))}


                </>
              )}

              {formData.conveyanceMethod === 'Receipt Based' && (
                <>
                  {renderField('invoiceDate', 'Receipt Date', (
                    <input
                      name="invoiceDate"
                      type="date"
                      required
                      disabled={!isEditable}
                      value={formData.invoiceDate || ''}
                      onChange={onChange}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-medium"
                    />
                  ))}

                  {renderField('subcategory', 'Conveyance Expense Type', (
                    <select
                      name="subcategory"
                      required
                      disabled={!isEditable}
                      value={formData.subcategory || ''}
                      onChange={onChange}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-505 font-sans font-semibold"
                    >
                      <option value="">-- Select Type --</option>
                      {selectedCategoryConfig?.subcategories?.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  ))}

                  {renderField('amount', receipts.length > 0 ? 'Receipt Amount (Active)' : 'Receipt / Reimbursement Amount', (
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-sm font-semibold">₹</span>
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

                  {renderField('merchant', 'Merchant Name', (
                    <input
                      name="merchant"
                      disabled={!isEditable}
                      value={formData.merchant || ''}
                      onChange={onChange}
                      placeholder="e.g. Ola / Uber / Self Cab"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-medium"
                    />
                  ))}

                  {renderField('invoiceNumber', 'Invoice / Bill Reference', (
                    <input
                      name="invoiceNumber"
                      disabled={!isEditable}
                      value={formData.invoiceNumber || ''}
                      onChange={onChange}
                      placeholder="e.g. INV-88120"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-medium"
                    />
                  ))}

                  {renderField('tax', 'GST / Tax Line Amount', (
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-sm">₹</span>
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


                </>
              )}
            </>
          ) : (formData.category && formData.category !== 'Conveyance') ? (
            <>
              {renderField('invoiceDate', 'Receipt Date', (
                <input
                  name="invoiceDate"
                  type="date"
                  required
                  disabled={!isEditable}
                  value={formData.invoiceDate || ''}
                  onChange={onChange}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-medium"
                />
              ))}

              {hasSubcategories && renderField('subcategory', `${selectedCategoryConfig?.label || formData.category} Type`, (
                <select
                  name="subcategory"
                  required
                  disabled={!isEditable}
                  value={formData.subcategory || ''}
                  onChange={onChange}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-550 font-sans font-semibold"
                >
                  <option value="">-- Select Type --</option>
                  {selectedCategoryConfig?.subcategories?.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              ))}

              {renderField('amount', receipts.length > 0 ? 'Receipt Amount (Active)' : 'Receipt / Reimbursement Amount', (
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-sm font-semibold">₹</span>
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

              {renderField('merchant', 'Merchant Name', (
                <input
                  name="merchant"
                  required
                  disabled={!isEditable}
                  value={formData.merchant || ''}
                  onChange={onChange}
                  placeholder="e.g. Vendor / Store Name"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-medium"
                />
              ))}

              {renderField('invoiceNumber', 'Invoice / Bill Reference', (
                <input
                  name="invoiceNumber"
                  disabled={!isEditable}
                  value={formData.invoiceNumber || ''}
                  onChange={onChange}
                  placeholder="e.g. INV-10029"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-medium"
                />
              ))}

              {renderField('tax', 'GST / Tax Line Amount', (
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-sm">₹</span>
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
            </>
          ) : (
            <>
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

              {renderField('invoiceDate', 'Invoice Date', (
                <input
                  name="invoiceDate"
                  type="date"
                  required
                  disabled={!isEditable}
                  value={formData.invoiceDate || ''}
                  onChange={onChange}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-medium"
                />
              ))}

              {renderField('submissionDate', 'Submission Date & Time', (
                <input
                  name="submissionDate"
                  type="text"
                  disabled={true}
                  value={formData.submissionDate ? new Date(formData.submissionDate).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  }) : 'Generated upon creation/submission'}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 font-sans font-medium"
                />
              ))}

              {showSubcategoryField && renderField('subcategory', 'Expense Type / Subcategory', (
                <select
                  name="subcategory"
                  required
                  disabled={!isEditable}
                  value={formData.subcategory || ''}
                  onChange={onChange}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-medium font-semibold"
                >
                  <option value="">-- Choose Subcategory --</option>
                  {selectedCategoryConfig?.subcategories?.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              ))}

              {renderField('amount', receipts.length > 0 ? 'Receipt Amount (Active)' : 'Claim Amount', (
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
            </>
          )}
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
              ocrOverallScore >= 90
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : ocrOverallScore >= 75
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
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
