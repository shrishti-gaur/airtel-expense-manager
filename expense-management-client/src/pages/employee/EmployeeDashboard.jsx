import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/loaders/LoadingSpinner';
import api from '../../services/api';
import { FileSpreadsheet, Plus, UploadCloud, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const EmployeeDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to pull metrics from backend dashboard API
    const loadDashboard = async () => {
      try {
        const response = await api.get('/dashboard/metrics');
        setMetrics(response.data);
      } catch (err) {
        console.warn('Dashboard fetch failed, using local simulation fallback:', err);
        // Local fallback matching backend mock structure
        setMetrics({
          totalSubmittedClaims: 5,
          totalSubmittedAmount: 3200,
          pendingAmount: 2500,
          approvedAmount: 700,
          recentActivity: [
            { id: 'EXP-101', title: 'Airtel Broadband Fiber Bill', status: 'PENDING_APPROVAL', amount: 1499, date: '2026-07-20' },
            { id: 'EXP-102', title: 'Local travel - client meeting', status: 'APPROVED', amount: 700, date: '2026-07-18' },
            { id: 'EXP-103', title: 'Working dinner meals', status: 'REJECTED', amount: 1000, date: '2026-07-15' },
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  const getStatusBadge = (status) => {
    const styles = {
      APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      PENDING_APPROVAL: 'bg-amber-50 text-amber-700 border-amber-200',
      REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
    };

    const icons = {
      APPROVED: CheckCircle,
      PENDING_APPROVAL: Clock,
      REJECTED: AlertCircle,
    };

    const Icon = icons[status] || Clock;
    const styleClass = styles[status] || styles.PENDING_APPROVAL;

    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold ${styleClass}`}>
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 font-display">
            Employee Workspace
          </h1>
          <p className="text-sm text-slate-500">
            Submit expense claims, track receipt OCR scanner uploads, and view payout logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-1.5">
            <UploadCloud className="h-4 w-4" />
            Quick OCR Upload
          </Button>
          <Button variant="primary" className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            New Claim
          </Button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-l-4 border-l-slate-400">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Claims Submitted</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-slate-800 font-display">
              {metrics?.totalSubmittedClaims || 0}
            </span>
            <span className="text-xs text-slate-500 font-medium font-sans">Active entries</span>
          </div>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Amount</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-slate-800 font-display">
              ₹{metrics?.pendingAmount?.toLocaleString('en-IN') || '0'}
            </span>
            <span className="text-xs text-slate-500 font-medium font-sans">Awaiting approval</span>
          </div>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Approved Reimbursement</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-slate-800 font-display">
              ₹{metrics?.approvedAmount?.toLocaleString('en-IN') || '0'}
            </span>
            <span className="text-xs text-slate-500 font-medium font-sans">Disbursed successfully</span>
          </div>
        </Card>
      </div>

      {/* Main Table section */}
      <Card title="Recent Claims & Activities">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Claim ID</th>
                <th className="py-3 px-4">Title / Description</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
              {metrics?.recentActivity?.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4 font-semibold text-slate-500 font-mono">{item.id}</td>
                  <td className="py-4 px-4 font-medium text-slate-800">{item.title}</td>
                  <td className="py-4 px-4 text-slate-500 font-sans">{item.date}</td>
                  <td className="py-4 px-4 font-bold text-slate-800">₹{item.amount.toLocaleString('en-IN')}</td>
                  <td className="py-4 px-4">{getStatusBadge(item.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Future roadmap reminder card */}
      <Card title="System Architect Notes" className="bg-slate-50/30 border-dashed">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-red-50 p-2 text-red-600">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 font-display">Active Modules Integrations Pending</h4>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              The Employee interface communicates with client routes `scan` and `submit`. Under the hood, the client's `api.js` connects to backend routes `/api/v1/ocr/scan` and `/api/v1/expense/`. OCR scanning hooks up to Google Vertex AI models, matching claims data against enterprise policies dynamically.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;
