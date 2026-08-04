import React from 'react';
import AppModal from './AppModal';
import { AlertCircle } from 'lucide-react';

const DuplicateWarningModal = ({ 
  isOpen, 
  onClose, 
  duplicateType, 
  existingClaim, 
  isScreenshot, 
  screenshotMessage 
}) => {
  if (!isOpen) return null;

  // Screenshot Mode
  if (isScreenshot) {
    return (
      <AppModal
        isOpen={isOpen}
        onClose={onClose}
        title="Screenshot Detected"
        subtitle="Upload Verification"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          {/* Warning Indicator */}
          <div className="flex items-start gap-3 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-left text-xs font-sans">
              <span className="font-bold block mb-1">Image Verification Failed</span>
              <span>{screenshotMessage || 'Please upload the original receipt, invoice, or PDF instead of a screenshot.'}</span>
            </div>
          </div>
        </div>
      </AppModal>
    );
  }

  // Duplicate Mode
  if (!existingClaim) return null;

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Duplicate Claim Detected"
      subtitle="Corporate Expense Policy Audit"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Warning Indicator */}
        <div className="flex items-start gap-3 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-left text-xs">
            <span className="font-bold block mb-0.5">Policy Infringement</span>
            <span>Reason: This claim already exists in the system and cannot be submitted again.</span>
          </div>
        </div>

        {/* Claim Details */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100/80 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-semibold">Existing Claim ID</span>
            <span className="text-slate-800 font-bold font-mono bg-white px-2.5 py-1 rounded-md border border-slate-200/60 shadow-xs">
              {existingClaim?.id}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-semibold">Submitted By</span>
            <span className="text-slate-700 font-bold">
              {existingClaim?.employeeName || 'John Employee'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-semibold">Submission Date</span>
            <span className="text-slate-700 font-bold">
              {existingClaim?.submissionDate ? new Date(existingClaim.submissionDate).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              }) : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </AppModal>
  );
};

export default DuplicateWarningModal;
