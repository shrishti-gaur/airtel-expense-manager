import React from 'react';
import { AlertCircle } from 'lucide-react';

const DuplicateWarningModal = ({ isOpen, onClose, duplicateType, existingClaim }) => {
  if (!isOpen || !existingClaim) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Glass backdrop with high blur */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Dialog container with custom drop-shadow and rounded-3xl corners */}
      <div className="relative bg-white/95 backdrop-blur-lg rounded-3xl max-w-md w-full shadow-[0_25px_50px_-12px_rgba(220,38,38,0.15)] border border-red-100 overflow-hidden z-[110] animate-in fade-in zoom-in-95 duration-200">
        {/* Airtel Corporate Crimson Top Accent Line */}
        <div className="h-2 bg-gradient-to-r from-red-500 via-rose-600 to-red-700" />
        
        <div className="p-8 text-center flex flex-col items-center">
          {/* Pulsing circular badge with bouncing warning icon */}
          <div className="p-4 bg-red-50 text-red-600 rounded-full mb-4 ring-8 ring-red-50/50 animate-pulse">
            <AlertCircle className="h-10 w-10 animate-bounce" style={{ animationDuration: '4s' }} />
          </div>
          
          <h3 className="text-2xl font-extrabold text-slate-800 font-display tracking-tight mb-1">
            Duplicate Receipt Detected
          </h3>
          
          <span className="text-[10px] font-extrabold text-red-600 bg-red-50 border border-red-100/50 px-3.5 py-1 rounded-full uppercase tracking-widest mb-6">
            {duplicateType || 'Exact File Match'}
          </span>

          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            This receipt already exists in the system. To comply with corporate expense audits, duplicate claims cannot be submitted.
          </p>

          {/* Details Card */}
          <div className="w-full bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-3.5 mb-6 text-left">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Existing Claim ID</span>
              <span className="text-slate-800 font-extrabold font-mono bg-white px-3 py-1.5 rounded-lg border border-slate-200/60 shadow-xs">
                {existingClaim?.id}
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
            {existingClaim?.employeeName && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Employee Name</span>
                <span className="text-slate-700 font-bold">{existingClaim.employeeName}</span>
              </div>
            )}
          </div>

          {/* Branded Primary Action Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all duration-150 cursor-pointer shadow-lg shadow-red-600/10 hover:shadow-red-600/20 active:scale-[0.98]"
          >
            Close & Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default DuplicateWarningModal;
