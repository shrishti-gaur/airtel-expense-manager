import { CheckCircle, Clock, AlertTriangle, XCircle, FileText } from 'lucide-react';

/**
 * Reusable StatusBadge UI component
 * @param {string} status - Claim status state
 */
const StatusBadge = ({ status }) => {
  const styles = {
    Draft: 'bg-slate-100 text-slate-700 border-slate-200',
    Submitted: 'bg-blue-50 text-blue-700 border-blue-200',
    Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Returned: 'bg-amber-50 text-amber-700 border-amber-300',
    Reimbursed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const icons = {
    Draft: FileText,
    Submitted: Clock,
    Approved: CheckCircle,
    Returned: AlertTriangle,
    Reimbursed: CheckCircle,
    Rejected: XCircle,
  };

  const cleanStatus = status || 'Draft';
  const Icon = icons[cleanStatus] || Clock;
  const styleClass = styles[cleanStatus] || styles.Draft;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styleClass}`}>
      <Icon className="h-3.5 w-3.5" />
      {cleanStatus}
    </span>
  );
};

export default StatusBadge;
