import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/loaders/LoadingSpinner';
import ExpenseForm from '../../components/common/ExpenseForm';
import StatusBadge from '../../components/common/StatusBadge';
import { INITIAL_CLAIMS } from '../../constants/mockData';
import { ClipboardCheck, Check, X, ShieldAlert, AlertTriangle, Eye } from 'lucide-react';

const ManagerDashboard = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null); // id of current claim being processed

  // Drawer popup states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeClaimData, setActiveClaimData] = useState(null);
  const [formMode, setFormMode] = useState('Submitted');

  useEffect(() => {
    // Simulate API fetch delay
    setTimeout(() => {
      // Load all claims belonging to the manager's department / cost center
      // Let's filter out Sam Finance's claims since they are in Finance, and keep the others.
      const teamClaims = INITIAL_CLAIMS.filter(
        (claim) => claim.department === 'Engineering' || claim.department === 'Sales'
      );
      setClaims(teamClaims);
      setLoading(false);
    }, 400);
  }, []);

  // Compute team metrics
  const getMetrics = () => {
    const counts = { Draft: 0, Submitted: 0, Approved: 0, Returned: 0, Reimbursed: 0 };
    
    claims.forEach((claim) => {
      if (counts[claim.status] !== undefined) {
        counts[claim.status]++;
      }
    });

    return counts;
  };

  const metrics = getMetrics();
  
  // Pending queue is Submitted claims only
  const pendingRequests = claims.filter((claim) => claim.status === 'Submitted');

  const handleAction = async (claimId, decision, remarks = '') => {
    setActioning(claimId);
    try {
      // Update local state list
      const updatedClaims = claims.map((claim) =>
        claim.id === claimId
          ? { ...claim, status: decision, managerComments: remarks || `Reviewed by manager` }
          : claim
      );
      setClaims(updatedClaims);
    } catch (err) {
      console.error('[Manager Review] Action failed:', err);
    } finally {
      setActioning(null);
      setIsFormOpen(false);
    }
  };

  const handleRowClick = (claim) => {
    setActiveClaimData(claim);
    setFormMode(claim.status);
    setIsFormOpen(true);
  };

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Dashboard Header */}
      <div className="text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 font-display">
          Manager Workspace
        </h1>
        <p className="text-sm text-slate-500">
          Review, approve, or return expense claims filed by your cost center employees.
        </p>
      </div>

      {/* 5-Card Metrics Summaries Grid */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-5">
        
        {/* Card 1: Drafts */}
        <Card className="border-t-4 border-t-slate-400 p-4 hover:scale-102 transition-transform">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Team Drafts</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 font-display">{metrics.Draft}</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">Unsent</span>
          </div>
        </Card>

        {/* Card 2: Pending (Submitted) */}
        <Card className="border-t-4 border-t-blue-500 p-4 hover:scale-102 transition-transform">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Submitted Queue</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 font-display text-blue-600">{metrics.Submitted}</span>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold">Pending</span>
          </div>
        </Card>

        {/* Card 3: Approved */}
        <Card className="border-t-4 border-t-emerald-500 p-4 hover:scale-102 transition-transform">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Approved Ledger</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 font-display">{metrics.Approved}</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">Verified</span>
          </div>
        </Card>

        {/* Card 4: Returned */}
        <Card className="border-t-4 border-t-amber-500 p-4 hover:scale-102 transition-transform">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Returned Drafts</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 font-display text-amber-600">{metrics.Returned}</span>
            <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold">Corrections</span>
          </div>
        </Card>

        {/* Card 5: Reimbursed */}
        <Card className="border-t-4 border-t-green-600 p-4 hover:scale-102 transition-transform">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reimbursed</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 font-display text-emerald-700">{metrics.Reimbursed}</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Settled</span>
          </div>
        </Card>
      </div>

      {/* Pending Reviews Queue Table */}
      <Card title="Claims Pending Approval Queue">
        {pendingRequests.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <ClipboardCheck className="mx-auto h-12 w-12 text-slate-300 mb-2" />
            <p className="font-semibold">Review queue is empty</p>
            <p className="text-xs text-slate-400 mt-1">All team expense claims have been processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Justification Details</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {pendingRequests.map((claim) => (
                  <tr
                    key={claim.id}
                    onClick={() => handleRowClick(claim)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-4 text-left">
                      <div className="font-bold text-slate-800 group-hover:text-red-600 transition-colors">
                        {claim.employeeName}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono font-medium">Claim ID: {claim.id}</span>
                    </td>
                    <td className="py-4 px-4 text-left">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700 leading-tight">
                        {claim.category}
                        {claim.ocrOverallScore < 80 && (
                          <span className="inline-flex text-[9px] font-bold text-amber-600 bg-amber-50 px-1 rounded border border-amber-200">
                            Low OCR
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1 font-medium font-sans mt-0.5">
                        {claim.description}
                      </p>
                    </td>
                    <td className="py-4 px-4 font-extrabold text-slate-800">
                      ₹{claim.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4 text-slate-500 font-sans">{claim.date}</td>
                    <td className="py-4 px-4">
                      <StatusBadge status={claim.status} />
                    </td>
                    <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actioning !== null}
                          loading={actioning === claim.id}
                          className="hover:border-slate-400 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
                          onClick={() => handleRowClick(claim)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Review
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Compliance / Fraud audit logs */}
      <Card title="Compliance Oversight" className="bg-slate-50/30 border-dashed">
        <div className="flex items-start gap-3 text-left">
          <div className="rounded-lg bg-red-50 p-2 text-red-600">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 font-display">Automatic Compliance Policies Enabled</h4>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 font-medium font-sans">
              The dashboard queue integrates with AI compliance flags. Expenses containing warnings (e.g. duplicate bills, missing merchant details) will show an alert symbol, notifying managers before they execute approval actions.
            </p>
          </div>
        </div>
      </Card>

      {/* Reusable ExpenseForm Drawer Popup (Manager Audit context) */}
      <ExpenseForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        mode={formMode}
        data={activeClaimData}
        onAction={handleAction}
        userRole="Manager"
      />
    </div>
  );
};

export default ManagerDashboard;
