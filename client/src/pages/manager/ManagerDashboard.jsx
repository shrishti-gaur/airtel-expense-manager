import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/loaders/LoadingSpinner';
import ExpenseForm from '../../components/common/ExpenseForm';
import StatusBadge from '../../components/common/StatusBadge';
import { INITIAL_CLAIMS } from '../../constants/mockData';
import {
  ClipboardCheck,
  Check,
  X,
  ShieldAlert,
  AlertTriangle,
  Eye,
  ArrowLeft,
  Users,
  TrendingUp,
  Award
} from 'lucide-react';

const ManagerDashboard = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null); // id of current claim being processed

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const claimId = searchParams.get('claimId');
  const { addNotification } = useUI();

  // Drawer popup states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeClaimData, setActiveClaimData] = useState(null);
  const [formMode, setFormMode] = useState('Submitted');

  const formatDateOnly = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return 'N/A';
    }
  };

  // Listen to path changes and search parameters to open/close drawer
  useEffect(() => {
    if (claimId) {
      const claim = claims.find((c) => c.id === claimId);
      if (claim) {
        setActiveClaimData(claim);
        setFormMode(claim.status);
        setIsFormOpen(true);
      }
    } else {
      setIsFormOpen(false);
      setActiveClaimData(null);
    }
  }, [claimId, claims, location.pathname]);

  useEffect(() => {
    // Simulate API fetch delay
    setTimeout(() => {
      // Load all claims belonging to the manager's department
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

  // Group claim analytics by employee for Team Summaries tab
  const getTeamStats = () => {
    const stats = {};
    claims.forEach((claim) => {
      const name = claim.employeeName || claim.employee || 'Other Employee';
      if (!stats[name]) {
        stats[name] = { total: 0, count: 0, statuses: {} };
      }
      stats[name].total += claim.amount;
      stats[name].count += 1;
      stats[name].statuses[claim.status] = (stats[name].statuses[claim.status] || 0) + 1;
    });
    return Object.entries(stats).map(([name, data]) => ({ name, ...data }));
  };

  const teamStats = getTeamStats();

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

      // Clear search query param to trigger clean drawer close
      if (searchParams.get('claimId') === claimId) {
        searchParams.delete('claimId');
        setSearchParams(searchParams);
      }

      // Trigger notifications and chime alerts based on action decisions
      const statusLabels = {
        Approved: { text: 'Claim Approved', desc: `Claim ${claimId} approved and forwarded to Finance review.`, type: 'success' },
        Returned: { text: 'Returned for Correction', desc: `Claim ${claimId} returned to employee for corrections.`, type: 'warning' },
      };

      const alertConf = statusLabels[decision] || { text: 'Claim Actioned', desc: `Claim ${claimId} updated to ${decision}.`, type: 'info' };
      addNotification(alertConf.text, alertConf.desc, alertConf.type);

    } catch (err) {
      console.error('[Manager Review] Action failed:', err);
    } finally {
      setActioning(null);
      setIsFormOpen(false);
    }
  };

  const handleRowClick = (claim) => {
    setSearchParams({ claimId: claim.id });
  };

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  // 1. RENDER PENDING REVIEWS ONLY VIEW
  if (location.pathname === '/manager/reviews') {
    return (
      <div className="space-y-6 animate-fade-in font-sans">
        {/* Back Link Header */}
        <div className="text-left">
          <button
            onClick={() => navigate('/manager')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors uppercase tracking-wider mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Workspace
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 font-display">
            Pending Reviews Queue
          </h1>
          <p className="text-sm text-slate-500">
            Approve or return team expense items. Approvals are immediately synced to the Finance desk.
          </p>
        </div>

        {/* Queue Table */}
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
                    <th className="py-3 px-4">Invoice Date</th>
                    <th className="py-3 px-4">Submission Date & Time</th>
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
                          {claim.employeeName || claim.employee}
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
                      <td className="py-4 px-4 text-slate-500 font-sans">{formatDateOnly(claim.invoiceDate)}</td>
                      <td className="py-4 px-4 text-slate-500 font-sans">{formatDateTime(claim.submissionDate)}</td>
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

        {/* Drawer popup */}
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
  }

  // 2. RENDER TEAM SUMMARIES ONLY VIEW
  if (location.pathname === '/manager/teams') {
    return (
      <div className="space-y-6 animate-fade-in font-sans">
        {/* Back Link Header */}
        <div className="text-left">
          <button
            onClick={() => navigate('/manager')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors uppercase tracking-wider mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Workspace
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 font-display">
            Team Workspace Summaries
          </h1>
          <p className="text-sm text-slate-500">
            High-level metrics tracking department expenditures, average claim rates, and item count summaries.
          </p>
        </div>

        {/* Team Analytics Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {teamStats.map((member) => (
            <Card key={member.name} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-base font-bold text-slate-800 font-display">{member.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">Cost Center: CC-ENG-402</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Claims</span>
                  <span className="text-2xl font-extrabold text-slate-800 font-display">₹{member.total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Progress visual indicator bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                  <span>Usage Rate</span>
                  <span>{member.count} claims submitted</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full bg-red-600 rounded-full" 
                    style={{ width: `${Math.min(100, (member.total / 30000) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Mini breakdown grid */}
              <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-100 text-center">
                <div className="text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Approved</span>
                  <span className="text-xs font-extrabold text-slate-700">{member.statuses.Approved || member.statuses.Reimbursed || 0} claims</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Pending</span>
                  <span className="text-xs font-extrabold text-slate-700">{member.statuses.Submitted || 0} claims</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Returned</span>
                  <span className="text-xs font-extrabold text-amber-600">{member.statuses.Returned || 0} claims</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 3. DEFAULT DASHBOARD VIEW
  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Dashboard Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-left">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 font-display">
            Manager Workspace
          </h1>
          <p className="text-sm text-slate-500">
            Review, approve, or return expense claims filed by your cost center employees.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/manager/teams')} className="flex items-center gap-1.5 shadow-sm">
            <Users className="h-4 w-4" />
            Team Summaries
          </Button>
          <Button variant="primary" onClick={() => navigate('/manager/reviews')} className="flex items-center gap-1.5 shadow-sm">
            <ClipboardCheck className="h-4 w-4" />
            Open Review Queue ({pendingRequests.length})
          </Button>
        </div>
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
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Finance Review</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 font-display">{metrics.Approved}</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold font-sans">Awaiting Audit</span>
          </div>
        </Card>

        {/* Card 4: Returned */}
        <Card className="border-t-4 border-t-amber-500 p-4 hover:scale-102 transition-transform">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Returned for Correction</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 font-display text-amber-600">{metrics.Returned}</span>
            <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold font-sans">Returned</span>
          </div>
        </Card>

        {/* Card 5: Reimbursed */}
        <Card className="border-t-4 border-t-green-600 p-4 hover:scale-102 transition-transform">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Approved & Synced to Oracle</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 font-display text-emerald-700">{metrics.Reimbursed}</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold font-sans">Synced</span>
          </div>
        </Card>
      </div>

      {/* Overview summaries - top active review claims */}
      <Card 
        title="Active Review Requests"
        headerAction={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/manager/reviews')}
            className="flex items-center gap-1.5 font-bold shadow-sm"
          >
            <ClipboardCheck className="h-4 w-4" />
            Manage Queue
          </Button>
        }
      >
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
                  <th className="py-3 px-4">Invoice Date</th>
                  <th className="py-3 px-4">Submission Date & Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {pendingRequests.slice(0, 3).map((claim) => (
                  <tr
                    key={claim.id}
                    onClick={() => handleRowClick(claim)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-4 text-left">
                      <div className="font-bold text-slate-800 group-hover:text-red-600 transition-colors">
                        {claim.employeeName || claim.employee}
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
                    <td className="py-4 px-4 text-slate-500 font-sans">{formatDateOnly(claim.invoiceDate)}</td>
                    <td className="py-4 px-4 text-slate-500 font-sans">{formatDateTime(claim.submissionDate)}</td>
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
        onClose={() => {
          if (claimId) {
            searchParams.delete('claimId');
            setSearchParams(searchParams);
          } else {
            setIsFormOpen(false);
          }
        }}
        mode={formMode}
        data={activeClaimData}
        onAction={handleAction}
        userRole="Manager"
      />
    </div>
  );
};

export default ManagerDashboard;
