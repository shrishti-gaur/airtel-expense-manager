import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Button from '../ui/Button';

/**
 * Reusable AppModal component that mirrors the styling, fonts, border radius,
 * overlay, animations, and close buttons of the New Claim modal.
 */
const AppModal = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children, 
  maxWidth = 'max-w-md',
  footerActions 
}) => {
  
  // Prevent background scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalLayout = (
    <>
      {/* Backdrop Layer (Identical to New Claim Modal) */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in"
      />

      {/* Floating Center Modal container (Identical style, shadow-2xl, rounded-2xl, bg-white, border-slate-200) */}
      <div 
        className={`fixed inset-y-[12vh] md:inset-y-[18vh] left-4 right-4 md:left-1/2 md:-translate-x-1/2 z-[130] flex w-auto ${maxWidth} flex-col bg-white shadow-2xl rounded-2xl overflow-hidden font-sans border border-slate-200/80 animate-in fade-in zoom-in-95 duration-200`}
      >
        {/* Modal Header Area (Identical to New Claim header layout & spacing) */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shrink-0 text-left">
          <div className="flex flex-col">
            <span className="text-base font-bold text-slate-800 font-display">
              {title}
            </span>
            {subtitle && (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-3 mt-0.5 font-sans">
                {subtitle}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-6 text-left text-sm text-slate-600 leading-relaxed">
          {children}
        </div>

        {/* Modal Footer Area (Identical action footer spacing & border) */}
        <div className="flex h-18 items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 shrink-0">
          {footerActions ? (
            footerActions
          ) : (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(modalLayout, document.body);
};

export default AppModal;
