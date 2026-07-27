import { ArrowRight, CreditCard, ShieldCheck } from 'lucide-react';
import Button from '../ui/Button';

/**
 * ActionButtons footer controls inside the drawer
 */
const ActionButtons = ({
  mode,
  userRole,
  onClose,
  onSaveDraft,
  onSubmitClaim,
  onApprove,
  onReturn,
  onReject,
  onDisburse,
  processing = false,
  showReturnRemarksFlag = false,
}) => {
  const isEditable = mode === 'Create' || mode === 'Draft' || mode === 'Returned';

  return (
    <div className="flex h-18 items-center justify-end gap-3 border-t border-slate-200 bg-white px-6">
      
      {/* 1. Editable states (Create / Draft / Returned) */}
      {isEditable && (
        <>
          <Button variant="outline" onClick={onClose} disabled={processing}>
            Cancel
          </Button>

          {mode !== 'Returned' && (
            <Button
              variant="outline"
              disabled={processing}
              onClick={onSaveDraft}
              className="hover:bg-slate-100 hover:text-slate-800"
            >
              Save Draft
            </Button>
          )}

          <Button
            variant="primary"
            disabled={processing}
            onClick={onSubmitClaim}
            className="flex items-center gap-1.5 font-semibold"
          >
            Submit Expense
            <ArrowRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* 2. Submitted / Awaiting Manager Review */}
      {mode === 'Submitted' && userRole === 'Manager' && !showReturnRemarksFlag && (
        <>
          <Button variant="outline" onClick={onClose} disabled={processing}>
            Cancel
          </Button>
          <Button
            variant="outline"
            disabled={processing}
            className="border-amber-300 hover:bg-amber-50 hover:text-amber-800"
            onClick={onReturn}
          >
            Return to Employee
          </Button>
          <Button
            variant="primary"
            disabled={processing}
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={onApprove}
          >
            Approve & Forward
          </Button>
        </>
      )}

      {/* 3. Approved / Awaiting Finance Disbursement */}
      {userRole === 'Finance' && (mode === 'Approved' || mode === 'Submitted') && (
        <>
          <Button variant="outline" onClick={onClose} disabled={processing}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={processing}
            onClick={onReject}
          >
            Reject Payout
          </Button>
          <Button
            variant="primary"
            disabled={processing}
            className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5"
            onClick={onDisburse}
          >
            <CreditCard className="h-4 w-4" />
            Disburse Payout & Sync ERP
          </Button>
        </>
      )}

      {/* 4. Closed View-Only States (Reimbursed / Rejected / Submitted by Employee / Approved by Employee) */}
      {(!isEditable && 
        !(mode === 'Submitted' && (userRole === 'Manager' || userRole === 'Finance')) && 
        !(mode === 'Approved' && userRole === 'Finance')) && (
        <Button variant="secondary" onClick={onClose}>
          Close Viewer
        </Button>
      )}
    </div>
  );
};

export default ActionButtons;
