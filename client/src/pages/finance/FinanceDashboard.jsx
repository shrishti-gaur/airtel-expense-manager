import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/loaders/LoadingSpinner';
import ExpenseForm from '../../components/common/ExpenseForm';
import StatusBadge from '../../components/common/StatusBadge';
import api from '../../services/api';
import {
  CreditCard,
  CheckSquare,
  Square,
  RefreshCcw,
  Check,
  ShieldCheck,
  Eye,
  ArrowLeft,
  DollarSign,
  Briefcase
} from 'lucide-react';

const FinanceDashboard = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaims, setSelectedClaims] = useState([]);
  const [processing, setProcessing] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const claimId = searchParams.get('claimId');
  const { runWithLoading, addNotification } = useUI();

  // Drawer popup states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeClaimData, setActiveClaimData] = useState(null);
  const [formMode, setFormMode] = useState('Approved');

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

  const [erpSyncLogs, setErpSyncLogs] = useState([]);

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const res = await api.get('/finance/audit');
        if (res && res.success && res.data) {
          const fetchedClaims = res.data.claims || [];
          setClaims(fetchedClaims);

          // Dynamically compute ERP sync logs from reimbursed claims
          const reimbursed = fetchedClaims.filter((claim) => claim.status === 'Reimbursed');
          const logs = reimbursed.map((claim) => {
            const reimbHistory = claim.history?.find(h => h.action === 'REIMBURSED');
            return {
              timestamp: new Date(reimbHistory ? reimbHistory.timestamp : claim.updatedAt)
                .toISOString()
                .replace('T', ' ')
                .substring(0, 16),
              voucher: claim.oracleRefId || claim.id,
              claimId: claim.id
            };
          });
          setErpSyncLogs(logs);
        }
      } catch (err) {
        console.error('Failed to fetch finance audit claims:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, []);

  // Compute metrics totals (global corporate view)
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

  // Pending payouts are claims with status 'Approved'
  const pendingPayouts = claims.filter((claim) => claim.status === 'Approved');

  const toggleSelectClaim = (id) => {
    if (selectedClaims.includes(id)) {
      setSelectedClaims(selectedClaims.filter((claimId) => claimId !== id));
    } else {
      setSelectedClaims([...selectedClaims, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedClaims.length === pendingPayouts.length) {
      setSelectedClaims([]);
    } else {
      setSelectedClaims(pendingPayouts.map((claim) => claim.id));
    }
  };

  const fetchClaimsFromDb = async () => {
    try {
      const res = await api.get('/finance/audit');
      if (res && res.success && res.data) {
        const fetchedClaims = res.data.claims || [];
        setClaims(fetchedClaims);

        // Dynamically compute ERP sync logs from reimbursed claims
        const reimbursed = fetchedClaims.filter((claim) => claim.status === 'Reimbursed');
        const logs = reimbursed.map((claim) => {
          const reimbHistory = claim.history?.find(h => h.action === 'REIMBURSED');
          return {
            timestamp: new Date(reimbHistory ? reimbHistory.timestamp : claim.updatedAt)
              .toISOString()
              .replace('T', ' ')
              .substring(0, 16),
            voucher: claim.oracleRefId || claim.id,
            claimId: claim.id
          };
        });
        setErpSyncLogs(logs);
      }
    } catch (err) {
      console.error('Failed to fetch finance audit claims:', err);
    }
  };

  const executePayoutAction = async (claimId, action, comments = '') => {
    const sequence = [
      { message: 'Sending Request...', duration: 500 },
      { message: 'Processing...', duration: 500 },
      { message: 'Almost Done...', duration: 200 }
    ];

    runWithLoading(sequence, async () => {
      try {
        const erpAction = action === 'Reimbursed' ? 'PROCESS_PAYMENT' : 'REJECT_PAYMENT';
        await api.post('/finance/bulk-process', {
          claimIds: [claimId],
          action: erpAction,
          comments
        });

        addNotification(
          action === 'Reimbursed' ? 'Reimbursement Settled' : 'Claim Rejected',
          action === 'Reimbursed'
            ? `Payment disbursed and synced to Oracle ERP for claim ${claimId}.`
            : `Claim ${claimId} has been rejected by Finance.`,
          action === 'Reimbursed' ? 'success' : 'error'
        );

        await fetchClaimsFromDb();

        setIsFormOpen(false);
        if (searchParams.get('claimId') === claimId) {
          searchParams.delete('claimId');
          setSearchParams(searchParams);
        }
      } catch (err) {
        console.error('Disbursement processing failed:', err);
        addNotification('Processing Failed', err.message || 'Failed to process payout', 'error');
      }
    });
  };

  const handleBulkDisbursement = async () => {
    if (selectedClaims.length === 0) return;

    const sequence = [
      { message: 'Sending Request...', duration: 600 },
      { message: 'Processing...', duration: 600 },
      { message: 'Almost Done...', duration: 200 }
    ];

    runWithLoading(sequence, async () => {
      try {
        const claimCount = selectedClaims.length;
        await api.post('/finance/bulk-process', {
          claimIds: selectedClaims,
          action: 'PROCESS_PAYMENT',
          comments: 'Bulk processed disbursement.'
        });

        addNotification(
          'Bulk Disbursements Completed',
          `Successfully settled and synced ${claimCount} claims to Oracle General Ledger.`,
          'success'
        );

        setSelectedClaims([]);
        await fetchClaimsFromDb();
      } catch (err) {
        console.error('Bulk payment processing failed:', err);
        addNotification('Processing Failed', err.message || 'Failed to process bulk payments', 'error');
      }
    });
  };

  const handleRowClick = (claim) => {
    setSearchParams({ claimId: claim.id });
  };

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  // 1. RENDER AUDIT QUEUE VIEW ONLY
  if (location.pathname === '/finance/audit') {
    return (
      <div className="space-y-6 animate-fade-in font-sans">
        {/* Back Link Header */}
        <div className="text-left">
          <button
            onClick={() => navigate('/finance')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors uppercase tracking-wider mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Desk
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 font-display">
            Claims Audit Queue
          </h1>
          <p className="text-sm text-slate-500">
            Inspect manager-approved claims for policy compliance and complete financial audit reviews.
          </p>
        </div>

        {/* Audit Queue Table */}
        <Card title="Claims Audit Verification Queue">
          {pendingPayouts.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <Check className="mx-auto h-12 w-12 text-emerald-500 mb-2" />
              <p className="font-semibold">All payouts disbursed</p>
              <p className="text-xs text-slate-400 mt-1">Pending payments queue is empty.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Claim ID</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Category Details</th>
                    <th className="py-3 px-4">Invoice Date</th>
                    <th className="py-3 px-4">Submission Date & Time</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {pendingPayouts.map((claim) => (
                    <tr
                      key={claim.id}
                      onClick={() => handleRowClick(claim)}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-4 font-semibold text-slate-500 font-mono">{claim.id}</td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800 group-hover:text-red-600 transition-colors">
                          {claim.employeeName || claim.employee || 'Unknown Employee'}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-left">
                        <div className="flex items-center gap-1.5 font-bold text-slate-700">
                          {claim.category}
                          {claim.ocrOverallScore < 80 && (
                            <span className="inline-flex text-[9px] font-bold text-amber-600 bg-amber-50 px-1 rounded border border-amber-200">
                              Low OCR
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{claim.description}</p>
                      </td>
                      <td className="py-4 px-4 text-slate-500 font-sans">{formatDateOnly(claim.invoiceDate)}</td>
                      <td className="py-4 px-4 text-slate-500 font-sans">{formatDateTime(claim.submissionDate)}</td>
                      <td className="py-4 px-4">
                        <StatusBadge status={claim.status} />
                      </td>
                      <td className="py-4 px-4 text-right font-extrabold text-slate-900">
                        ₹{claim.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="hover:border-slate-400 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
                            onClick={() => handleRowClick(claim)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Audit
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
          onAction={executePayoutAction}
          userRole="Finance"
        />
      </div>
    );
  }

  // 2. RENDER BULK DISBURSEMENTS CONTROLLER VIEW
  if (location.pathname === '/finance/disbursements') {
    const totalPendingAmount = pendingPayouts.reduce((sum, claim) => sum + claim.amount, 0);

    return (
      <div className="space-y-6 animate-fade-in font-sans">
        {/* Back Link Header */}
        <div className="text-left">
          <button
            onClick={() => navigate('/finance')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors uppercase tracking-wider mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Desk
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 font-display">
            Bulk Payout disbursements
          </h1>
          <p className="text-sm text-slate-500">
            Disburse pending payouts in bulk to trigger ERP General Ledger sync vouchers.
          </p>
        </div>

        {/* Payout Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6 border-t-4 border-t-emerald-500">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pending Disbursements</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-slate-800 font-display">₹{totalPendingAmount.toLocaleString('en-IN')}</span>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">Total Queue</span>
            </div>
          </Card>
          
          <Card className="p-6 border-t-4 border-t-blue-500">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Claim Vouchers Count</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-slate-800 font-display">{pendingPayouts.length}</span>
              <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold">Unsettled</span>
            </div>
          </Card>

          <Card className="p-6 border-t-4 border-t-red-500">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Bulk Processor Status</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-lg font-bold text-red-600 uppercase tracking-wide">Ready for Batch</span>
            </div>
          </Card>
        </div>

        {/* Main Bulk Actions Card */}
        <Card title="Batch disbursement execution">
          <div className="p-6 text-center space-y-4 max-w-xl mx-auto">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 mx-auto">
              <CreditCard className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Run ERP Batch disbursement
            </h3>
            <p className="text-xs text-slate-500">
              This will disburse all {pendingPayouts.length} approved expense claims totaling ₹{totalPendingAmount.toLocaleString('en-IN')}. Oracle GL vouchers will be generated and logged dynamically.
            </p>
            <div className="pt-4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleBulkDisbursement}
                disabled={pendingPayouts.length === 0}
                className="w-full sm:w-auto shadow-sm"
              >
                Disburse All Approved Claims (₹{totalPendingAmount.toLocaleString('en-IN')})
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // 3. DEFAULT DASHBOARD VIEW
  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-left">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 font-display">
            Finance Controller Desk
          </h1>
          <p className="text-sm text-slate-500">
            Verify general ledger items, inspect compliance alerts, and disburse payouts synced to Oracle GL.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/finance/disbursements')} className="flex items-center gap-1.5 shadow-sm">
            <CreditCard className="h-4 w-4" />
            Disbursement Desk
          </Button>
          <Button variant="primary" onClick={() => navigate('/finance/audit')} className="flex items-center gap-1.5 shadow-sm">
            <ShieldCheck className="h-4 w-4" />
            Audit Claims ({pendingPayouts.length})
          </Button>
        </div>
      </div>

      {/* 5-Card Metrics Summaries Grid */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-5">
        {/* Card 1: Drafts */}
        <Card className="border-t-4 border-t-slate-400 p-4 hover:scale-102 transition-transform">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Drafts</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 font-display">{metrics.Draft}</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold font-sans">Unfiled</span>
          </div>
        </Card>

        {/* Card 2: Submitted */}
        <Card className="border-t-4 border-t-blue-500 p-4 hover:scale-102 transition-transform">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Reviews</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 font-display">{metrics.Submitted}</span>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold font-sans">Awaiting</span>
          </div>
        </Card>

        {/* Card 3: Approved */}
        <Card className="border-t-4 border-t-emerald-500 p-4 hover:scale-102 transition-transform">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Finance Review</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 font-display text-emerald-600">{metrics.Approved}</span>
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

      {/* Bulk Disbursements Actions */}
      <Card
        title="Recent Approved Claims Queue"
        headerAction={
          selectedClaims.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleBulkDisbursement}
              className="flex items-center gap-1.5 shadow-sm animate-fade-in"
            >
              <CreditCard className="h-4 w-4" />
              Disburse {selectedClaims.length} Claims
            </Button>
          )
        }
      >
        {pendingPayouts.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <Check className="mx-auto h-12 w-12 text-emerald-500 mb-2" />
            <p className="font-semibold">All payouts disbursed</p>
            <p className="text-xs text-slate-400 mt-1">Pending payments queue is empty.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4 w-12" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={toggleSelectAll}
                      className="text-slate-500 hover:text-red-600 cursor-pointer"
                    >
                      {selectedClaims.length === pendingPayouts.length ? (
                        <CheckSquare className="h-5 w-5 text-red-600" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4">Claim ID</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Category Details</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {pendingPayouts.slice(0, 3).map((claim) => (
                  <tr
                    key={claim.id}
                    onClick={() => handleRowClick(claim)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleSelectClaim(claim.id)}
                        className="text-slate-500 hover:text-red-600 animate-fade-in cursor-pointer"
                      >
                        {selectedClaims.includes(claim.id) ? (
                          <CheckSquare className="h-5 w-5 text-red-600" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-500 font-mono">{claim.id}</td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-800 group-hover:text-red-600 transition-colors">
                        {claim.employeeName || claim.employee || 'Unknown Employee'}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-left">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700">
                        {claim.category}
                        {claim.ocrOverallScore < 80 && (
                          <span className="inline-flex text-[9px] font-bold text-amber-600 bg-amber-50 px-1 rounded border border-amber-200">
                            Low OCR
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{claim.description}</p>
                    </td>
                    <td className="py-4 px-4 text-slate-500 font-sans">{formatDateOnly(claim.invoiceDate)}</td>
                    <td className="py-4 px-4 text-slate-500 font-sans">{formatDateTime(claim.submissionDate)}</td>
                    <td className="py-4 px-4">
                      <StatusBadge status={claim.status} />
                    </td>
                    <td className="py-4 px-4 text-right font-extrabold text-slate-900">
                      ₹{claim.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
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

      {/* Oracle Integration visual logger */}
      <Card title="Oracle ERP Sync Monitor" className="bg-slate-50/30 border-dashed">
        <div className="flex items-start gap-4 text-left">
          <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
            <RefreshCcw className="h-5 w-5 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <div className="flex-1 space-y-2">
            <h4 className="text-sm font-bold text-slate-800 font-display">Oracle General Ledger Sync Logs</h4>
            <div className="rounded-lg bg-white p-3 border border-slate-200/60 text-xs font-mono text-slate-500 space-y-1">
              {erpSyncLogs.map((log) => (
                <p key={log.voucher} className="flex items-center gap-1.5 animate-fade-in">
                  <span className="text-emerald-500">✔</span>
                  <span>[{log.timestamp}] ERP-GL: Voucher {log.voucher} generated successfully for claim {log.claimId}</span>
                </p>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 leading-normal font-sans font-medium">
              Disbursing payments sends transaction lines directly to the Oracle database mapping service in `src/integrations/oracle/`. The database hooks can be replaced in production with live Oracle CLI connectivity wrappers without altering frontend visual states.
            </p>
          </div>
        </div>
      </Card>

      {/* Reusable ExpenseForm Drawer Popup (Finance audit context) */}
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
        onAction={executePayoutAction}
        userRole="Finance"
      />
    </div>
  );
};

export default FinanceDashboard;
