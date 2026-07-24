/**
 * Stepper Progress Timeline for Expense Claims
 * @param {string} status - Current status of the claim
 */
const Timeline = ({ status = 'Draft' }) => {
  const steps = [
    { key: 'Draft', label: 'Draft' },
    { key: 'Submitted', label: 'Submitted' },
    { key: 'ManagerReview', label: 'Manager Review' },
    { key: 'FinanceReview', label: 'Finance Review' },
    { key: 'Settled', label: 'Settled' },
  ];

  // Map status strings to indices in the timeline
  const statusIndices = {
    Draft: 0,
    Submitted: 1,
    Returned: 2, // Manager returned
    Approved: 3, // Passed manager review, waiting finance review
    Reimbursed: 4, // Fully processed
    Rejected: 2, // Stopped at Manager or Finance Review
  };

  const activeIndex = statusIndices[status] ?? 0;
  const isReturned = status === 'Returned';
  const isRejected = status === 'Rejected';

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-5 font-sans">
        Claim Timeline Track
      </p>

      {/* Horizontal timeline line container */}
      <div className="relative flex items-center justify-between px-2">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-slate-100" />
        <div
          className={`absolute left-0 top-1/2 h-0.5 -translate-y-1/2 transition-all duration-500 ${
            isReturned ? 'bg-amber-400' : isRejected ? 'bg-rose-500' : 'bg-red-500'
          }`}
          style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, idx) => {
          const isCompleted = idx < activeIndex;
          const isActive = idx === activeIndex;

          let circleClass = 'bg-slate-50 border-slate-200 text-slate-400';
          
          if (isCompleted) {
            circleClass = 'bg-red-600 border-red-600 text-white';
          } else if (isActive) {
            if (isReturned) {
              circleClass = 'bg-amber-500 border-amber-500 text-white ring-4 ring-amber-100';
            } else if (isRejected) {
              circleClass = 'bg-rose-600 border-rose-600 text-white ring-4 ring-rose-100';
            } else {
              circleClass = 'bg-red-600 border-red-600 text-white ring-4 ring-red-100 animate-pulse';
            }
          }

          // Complete step settled details
          if (isCompleted && step.key === 'Settled' && status === 'Reimbursed') {
            circleClass = 'bg-emerald-600 border-emerald-600 text-white';
          }

          let labelText = step.label;
          if (isActive && isReturned) labelText = 'Returned';
          if (isActive && isRejected) labelText = 'Rejected';
          if (step.key === 'Settled' && status === 'Reimbursed') labelText = 'Reimbursed';

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold transition-all ${circleClass}`}>
                {isCompleted ? '✓' : idx + 1}
              </div>
              <span className={`absolute top-8 whitespace-nowrap text-[10px] font-bold ${
                isActive ? 'text-slate-800 font-extrabold font-sans' : 'text-slate-400 font-sans'
              }`}>
                {labelText}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-4" /> {/* spacing divider */}
    </div>
  );
};

export default Timeline;
