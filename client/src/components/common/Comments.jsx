import { MessageSquare, ShieldCheck } from 'lucide-react';

/**
 * Comments component to organize remarks across the employee, manager, and finance layers
 */
const Comments = ({
  formData = {},
  isEditable,
  mode,
  userRole,
  onChange,
  ocrOverallScore,
}) => {
  const ocrSectionIndex = ocrOverallScore !== null && ocrOverallScore !== undefined ? '4.' : '3.';

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4 font-sans text-left">
      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 font-display">
        {ocrSectionIndex} Auditor & Approver Remarks
      </h4>

      <div className="space-y-4">
        {/* Employee Notes */}
        <div>
          <label className="text-xs font-semibold text-slate-500 font-sans">Employee Notes</label>
          <textarea
            name="employeeNotes"
            rows="2"
            disabled={!isEditable}
            value={formData.employeeNotes || ''}
            onChange={onChange}
            placeholder="Add any additional comments for the manager audit..."
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-medium"
          />
        </div>

        {/* Manager Review Remarks */}
        <div>
          <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 font-sans">
            <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
            Manager Review Remarks
          </label>
          <textarea
            name="managerComments"
            rows="2"
            disabled={!(mode === 'Submitted' && userRole === 'Manager')}
            value={formData.managerComments || ''}
            onChange={onChange}
            placeholder={userRole === 'Manager' ? 'Add review/return/rejection comments...' : 'No manager remarks.'}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-medium"
          />
        </div>

        {/* Finance Auditing Comments */}
        {(mode === 'Approved' || mode === 'Reimbursed' || userRole === 'Finance') && (
          <div>
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 font-sans">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
              Finance Auditing Comments
            </label>
            <textarea
              name="financeComments"
              rows="2"
              disabled={!(userRole === 'Finance' && (mode === 'Approved' || mode === 'Submitted'))}
              value={formData.financeComments || ''}
              onChange={onChange}
              placeholder={userRole === 'Finance' ? 'Add payout ledger settlement notes...' : 'No finance remarks.'}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 font-sans font-medium"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Comments;
