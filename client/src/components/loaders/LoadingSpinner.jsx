import React from 'react';

/**
 * Reusable premium loading spinner.
 * @param {string} size - Size variant ('sm', 'md', 'lg')
 * @param {boolean} fullPage - Center in full-screen block
 */
const LoadingSpinner = ({ size = 'md', fullPage = false }) => {
  const sizeClasses = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-t-red-600 border-r-transparent border-b-transparent border-l-transparent`}
        style={{ borderColor: 'var(--color-brand) transparent transparent transparent' }}
        role="status"
        aria-label="loading"
      />
      <span className="text-sm font-medium tracking-wide text-slate-500 animate-pulse font-sans">
        Loading System Lines...
      </span>
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center bg-transparent">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
