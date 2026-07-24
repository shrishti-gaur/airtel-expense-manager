import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/loaders/LoadingSpinner';
import ExpenseForm from '../../components/common/ExpenseForm';
import StatusBadge from '../../components/common/StatusBadge';
import { INITIAL_CLAIMS } from '../../constants/mockData';
import { CreditCard, CheckSquare, Square, RefreshCcw, Check, ShieldCheck, Eye } from 'lucide-react';

const FinanceDashboard = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaims, setSelectedClaims] = useState([]);
  const [processing, setProcessing] = useState(false);

  // Drawer popup states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeClaimData, setActiveClaimData] = useState(null);
  const [formMode, setFormMode] = useState('Approved');

  const [erpSyncLogs, setErpSyncLogs] = useState([
    { timestamp: '2026-07-24 12:40', voucher: 'ORACLE-EXP-1721805624', claimId: 'EXP-2026-102' },
    { timestamp: '2026-07-24 12:35', voucher: 'ORACLE-EXP-1721805315', claimId: 'EXP-2026-90' },
  ]);

  useEffect(() => {
    // Simulate loading delay
    setTimeout(() => {
      setClaims(INITIAL_CLAIMS);
      setLoading(false);
    }, 400);
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

  const handleLocalDisbursement = (claimIds, decision = 'Reimbursed', comments = '') => {
    const claimsToPay = claims.filter((claim) => claimIds.includes(claim.id));
    
    // Generate new ERP sync logs
    const newLogs = claimsToPay.map(claim => ({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      voucher: `ORACLE-EXP-${Math.floor(Math.random() * 90000000) + 10000000}`,
      claimId: claim.id
    }));

    const updatedClaims = claims.map((claim) =>
      claimIds.includes(claim.id)
        ? { ...claim, status: decision, financeComments: comments || 'Payment settled.' }
        : claim
    );

    setClaims(updatedClaims);
    setErpSyncLogs(prev => [...newLogs, ...prev]);
  };

  const executePayoutAction = async (claimId, action, comments = '') => {
    setProcessing(true);
    // Simulate latency
    setTimeout(() => {
      // Map action callback (Reimbursed represents payment disbursed)
      handleLocalDisbursement([claimId], action, comments);
      setProcessing(false);
      setIsFormOpen(false);
    }, 450);
  };

  const handleBulkDisbursement = async () => {
    if (selectedClaims.length === 0) return;
    setProcessing(true);

    setTimeout(() => {
      handleLocalDisbursement(selectedClaims, 'Reimbursed', 'Bulk processed disbursement.');
      setSelectedClaims([]);
      setProcessing(false);
    }, 600);
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
      {/* Welcome Header */}
      <div className="text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 font-display">
          Finance Controller Desk
        </h1>
        <p className="text-sm text-slate-500">
          Verify general ledger items, inspect compliance alerts, and disburse payouts synced to Oracle GL.
        </p>
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
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Approved Payouts</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 font-display text-emerald-600">{metrics.Approved}</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold font-sans">Awaiting Pay</span>
          </div>
        </Card>

        {/* Card 4: Returned */}
        <Card className="border-t-4 border-t-amber-500 p-4 hover:scale-102 transition-transform">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Returned Drafts</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 font-display text-amber-600">{metrics.Returned}</span>
            <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold font-sans">Rejected</span>
          </div>
        </Card>

        {/* Card 5: Reimbursed */}
        <Card className="border-t-4 border-t-green-600 p-4 hover:scale-102 transition-transform">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Settled Ledger</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 font-display text-emerald-700">{metrics.Reimbursed}</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold font-sans">Reimbursed</span>
          </div>
        </Card>
      </div>

      {/* Bulk Disbursements Actions */}
      <Card
        title="Pending Reimbursement Disbursements"
        headerAction={
          selectedClaims.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              loading={processing}
              onClick={handleBulkDisbursement}
              className="flex items-center gap-1.5 shadow-sm"
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
                      className="text-slate-500 hover:text-red-600"
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
                {pendingPayouts.map((claim) => (
                  <tr
                    key={claim.id}
                    onClick={() => handleRowClick(claim)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleSelectClaim(claim.id)}
                        className="text-slate-500 hover:text-red-600 animate-fade-in"
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
                        {claim.employee}
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
                    <td className="py-4 px-4 text-slate-500 font-sans">{claim.date}</td>
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
        onClose={() => setIsFormOpen(false)}
        mode={formMode}
        data={activeClaimData}
        onAction={executePayoutAction}
        userRole="Finance"
      />
    </div>
  );
};

export default FinanceDashboard;
