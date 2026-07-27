import React from 'react';

/**
 * Reusable LoadingStatus component displaying active messages under the loader
 * @param {string} message - Current active message string
 */
const LoadingStatus = ({ message }) => {
  const steps = [
    'Uploading Receipt...',
    'Sending Request...',
    'Reading Receipt...',
    'Extracting Text...',
    'Processing...',
    'Almost Done...'
  ];

  const currentIdx = steps.indexOf(message);

  return (
    <div className="flex flex-col items-center gap-4 mt-6 text-center animate-fade-in">
      {/* Current Message */}
      <h3 className="text-lg font-bold text-white tracking-wide font-sans min-h-[28px]">
        {message || 'Processing Request...'}
      </h3>

      {/* Progress Dots / Steps Checklist */}
      <div className="flex items-center gap-2">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIdx;
          const isActive = idx === currentIdx;

          return (
            <div
              key={step}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                isActive
                  ? 'w-6 bg-red-500 animate-pulse'
                  : isCompleted
                  ? 'w-2.5 bg-emerald-500'
                  : 'w-2.5 bg-slate-700/80'
              }`}
              title={step}
            />
          );
        })}
      </div>

      {/* Micro Status Subtext */}
      <p className="text-xs text-slate-400 font-medium font-sans">
        {message === 'Almost Done...' 
          ? 'Finalizing data extractions...' 
          : 'Please do not refresh or close this tab.'}
      </p>
    </div>
  );
};

export default LoadingStatus;
