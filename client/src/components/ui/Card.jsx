import React from 'react';

/**
 * Reusable enterprise Card component
 */
const Card = ({ children, className = '', title, headerAction }) => {
  return (
    <div className={`rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md/5 ${className}`}>
      {(title || headerAction) && (
        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
          {title && (
            <h3 className="text-lg font-semibold tracking-tight text-slate-800 font-display">
              {title}
            </h3>
          )}
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};

export default Card;
