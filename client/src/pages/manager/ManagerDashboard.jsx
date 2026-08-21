import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/loaders/LoadingSpinner';
import ExpenseForm from '../../components/common/ExpenseForm';
import StatusBadge from '../../components/common/StatusBadge';
import api from '../../services/api';
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
  Award,
  User
} from 'lucide-react';

const ManagerDashboard = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [actioning, setActioning] = useState(null); // id of current claim being processed

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const claimId = searchParams.get('claimId');
  const { addNotification } = useUI();

  // Search states & handlers
  const [searchEmployeeId, setSearchEmployeeId] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchEmployeeId.trim()) return;
    setSearching(true);
    try {
      const res = await api.get(`/manager/search?employeeId=${searchEmployeeId.trim()}`);
      if (res && res.success && res.data) {
        setSearchResults(res.data.claims || []);
      }
    } catch (err) {
      console.error('Failed to search employee claims:', err);
      addNotification('Search Failed', err.message || 'Failed to search employee claims', 'error');
    } finally {
      setSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchEmployeeId('');
    setSearchResults(null);
  };

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
    const fetchClaims = async () => {
      try {
        const res = await api.get('/manager/pending');
        if (res && res.success && res.data) {
          setClaims(res.data.claims || []);
        }
      } catch (err) {
        console.error('Failed to fetch pending manager claims:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
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
      // POST manager review to database
      await api.post(`/manager/review/${claimId}`, { status: decision, remarks });

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

      // Re-fetch claims from database
      const res = await api.get('/manager/pending');
      if (res && res.success && res.data) {
        setClaims(res.data.claims || []);
      }
    } catch (err) {
      console.error('[Manager Review] Action failed:', err);
      addNotification('Review Failed', err.message || 'Failed to submit review', 'error');
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
                    <th className="py-3 px-4">Claim Details</th>
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
                          <div>
                            <div>{claim.category}</div>
                            {claim.subcategory && (
                              <div className="text-[10px] text-slate-400 font-normal font-sans mt-0.5">{claim.subcategory}</div>
                            )}
                          </div>
                          {claim.ocrOverallScore !== null && claim.ocrOverallScore !== undefined && (
                            <span className={`inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded border select-none ${
                              claim.ocrOverallScore >= 90
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                : claim.ocrOverallScore >= 75
                                  ? 'text-amber-700 bg-amber-50 border-amber-200'
                                  : 'text-rose-700 bg-rose-50 border-rose-200'
                            }`}>
                              {claim.ocrOverallScore}% OCR
                            </span>
                          )}
                        </div>
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
  const latestClaim = claims.length > 0
    ? [...claims].sort((a, b) => new Date(b.submissionDate || b.createdAt) - new Date(a.submissionDate || a.createdAt))[0]
    : null;

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

      {/* Redesigned Info & Activity Layout */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Manager Profile Card */}
        <Card title="Manager Profile">
          <div className="space-y-4 text-sm font-sans pt-1">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Manager Name</span>
              <span className="font-extrabold text-slate-800">{user?.name || 'Sarah Manager'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">OLM ID</span>
              <span className="font-bold text-slate-800 font-mono">{user?.id?.toUpperCase() || 'MGR_456'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Cost Centre</span>
              <span className="font-extrabold text-slate-800">{user?.costCenter || 'CC-ENG-402'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Department</span>
              <span className="font-extrabold text-slate-800">{user?.department || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Role</span>
              <span className="font-extrabold text-slate-800">Line Manager (Approver)</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Approval Authority</span>
              <span className="font-extrabold text-slate-800">Standard CFA Limits</span>
            </div>
            <div className="pt-2 text-left">
              <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block mb-1.5">Allowed Expense Categories</span>
              <div className="flex flex-wrap gap-1.5">
                {user?.allowedCategories && user.allowedCategories.length > 0 ? (
                  user.allowedCategories.map((cat) => (
                    <span key={cat} className="text-[11px] font-bold bg-red-50 text-red-600 px-2.5 py-0.5 rounded border border-red-100">
                      {cat}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">No categories assigned</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Latest Team Claim Activity Card */}
        <Card
          title="Latest Team Claim Activity"
          headerAction={
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/manager/reviews')}
              className="flex items-center gap-1.5 font-bold shadow-sm"
            >
              <ClipboardCheck className="h-4 w-4" />
              View Queue
            </Button>
          }
        >
          {latestClaim ? (
            <div className="space-y-4 text-sm font-sans pt-1">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Employee</span>
                <span className="font-extrabold text-slate-800">{latestClaim.employeeName || latestClaim.employee}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Claim ID & Title</span>
                <div className="text-right">
                  <span className="font-mono text-slate-500 font-semibold mr-2">{latestClaim.id}</span>
                  <span className="font-extrabold text-slate-800">{latestClaim.title}</span>
                </div>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Category</span>
                <span className="font-extrabold text-slate-800">
                  {latestClaim.category}
                  {latestClaim.subcategory && <span className="text-xs font-normal text-slate-400 ml-1">({latestClaim.subcategory})</span>}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Amount</span>
                <span className="font-extrabold text-slate-800">₹{latestClaim.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Status</span>
                <StatusBadge status={latestClaim.status} />
              </div>
              <div className="flex justify-between items-center pb-1">
                <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Actions</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={actioning !== null}
                  loading={actioning === latestClaim.id}
                  className="hover:border-slate-400 hover:bg-slate-50 text-slate-700 flex items-center gap-1 py-1 h-auto"
                  onClick={() => handleRowClick(latestClaim)}
                >
                  <Eye className="h-3 w-3" />
                  Review Claim
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 font-sans">
              <ClipboardCheck className="h-10 w-10 mb-2 opacity-40 text-slate-500" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">No team activity</span>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                No claims are currently pending manager review.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Employee Search Card */}
      <Card title="Employee Claims Search">
        <div className="space-y-4 text-left">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5" htmlFor="employeeSearchId">
                Employee OLM ID
              </label>
              <input
                id="employeeSearchId"
                type="text"
                placeholder="Enter Employee OLM ID (e.g. emp_123)"
                value={searchEmployeeId}
                onChange={(e) => setSearchEmployeeId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 px-4 text-sm text-slate-800 placeholder-slate-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleSearch} loading={searching}>
                Search Employee
              </Button>
              {searchResults !== null && (
                <Button variant="outline" onClick={handleClearSearch}>
                  Clear Results
                </Button>
              )}
            </div>
          </div>

          {/* Search Results Table */}
          {searchResults !== null && (
            <div className="mt-6 border-t border-slate-100 pt-6">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Search Results for Employee: {searchEmployeeId}</h3>
              {searchResults.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs">
                  No claims found for this employee under your allowed categories.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-2.5 px-3">Claim ID</th>
                        <th className="py-2.5 px-3">Title / Category</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {searchResults.map((claim) => (
                        <tr key={claim.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-3 font-mono">{claim.id}</td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-800">{claim.title}</div>
                            <span className="text-[10px] text-slate-400">{claim.category}</span>
                          </td>
                          <td className="py-3 px-3 font-extrabold text-slate-800">₹{claim.amount.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-3 font-sans text-slate-500">{formatDateOnly(claim.invoiceDate)}</td>
                          <td className="py-3 px-3">
                            <StatusBadge status={claim.status} />
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="py-1 h-auto text-[11px] font-bold hover:bg-slate-50 text-slate-700 border-slate-200"
                              onClick={() => handleRowClick(claim)}
                            >
                              Review
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Recent Claims Section */}
      <Card title="Recent Claims Queue">
        {claims.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <p className="font-semibold">No claims in queue</p>
            <p className="text-xs text-slate-400 mt-1">There are no claims associated with your allowed categories.</p>
          </div>
        ) : (
          <div className="overflow-x-auto text-left">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Claim Details</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Invoice Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {claims.slice(0, 10).map((claim) => (
                  <tr
                    key={claim.id}
                    onClick={() => handleRowClick(claim)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-800 group-hover:text-red-600 transition-colors">
                        {claim.employeeName || claim.employee}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono font-medium">ID: {claim.id}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-700">{claim.category}</div>
                      {claim.subcategory && (
                        <div className="text-[10px] text-slate-400 font-normal font-sans mt-0.5">{claim.subcategory}</div>
                      )}
                    </td>
                    <td className="py-4 px-4 font-extrabold text-slate-800">
                      ₹{claim.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4 text-slate-500 font-sans">{formatDateOnly(claim.invoiceDate)}</td>
                    <td className="py-4 px-4">
                      <StatusBadge status={claim.status} />
                    </td>
                    <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center gap-1 font-bold"
                        onClick={() => handleRowClick(claim)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* How to Approve a Claim Card (Instructions) */}
      <Card title="How to Approve a Claim">
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 text-sm text-slate-600 font-sans pt-1">
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
              Verification Checklist
            </h4>
            <ul className="list-disc pl-5 space-y-2 text-xs leading-relaxed">
              <li>Inspect the attached receipt image and check the automated OCR confidence score.</li>
              <li>Verify that the selected expense category and subcategory align with team duties.</li>
              <li>Confirm distance and per-km rates for conveyance claims against travel records.</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
              Oversight & Exceptions
            </h4>
            <ul className="list-disc pl-5 space-y-2 text-xs leading-relaxed">
              <li>Check automated compliance alerts indicating duplicate matches or blacklisted vendors.</li>
              <li>Ensure travel bookings match company booking policy or have exceptions attached.</li>
              <li>Approve to forward to Finance Audit desk, or return with detailed correction comments.</li>
            </ul>
          </div>
        </div>
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
