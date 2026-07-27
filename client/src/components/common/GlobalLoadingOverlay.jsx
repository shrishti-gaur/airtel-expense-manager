import React from 'react';
import { useUI } from '../../context/UIContext';
import LoadingStatus from '../loaders/LoadingStatus';

/**
 * Reusable premium Global Loading Overlay
 */
const GlobalLoadingOverlay = () => {
  const { isLoading, loadingMessage } = useUI();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-md text-white p-6 animate-fade-in">
      <div className="flex flex-col items-center max-w-sm w-full p-8 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-2xl">
        {/* Centered Circular Spinner */}
        <div className="relative flex items-center justify-center h-20 w-20">
          {/* Inner ring */}
          <div className="absolute h-16 w-16 rounded-full border-4 border-slate-800 border-t-red-600 animate-spin" />
          {/* Outer glowing pulsed ring */}
          <div className="absolute h-20 w-20 rounded-full border-2 border-red-500/20 animate-ping opacity-60" style={{ animationDuration: '2s' }} />
          {/* Core dot logo mark */}
          <div className="h-4 w-4 rounded-full bg-red-600" />
        </div>

        {/* Dynamic Loading Status Component */}
        <LoadingStatus message={loadingMessage} />
      </div>
    </div>
  );
};

export default GlobalLoadingOverlay;
