import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/loaders/LoadingSpinner';
import ExpenseForm from '../../components/common/ExpenseForm';
import StatusBadge from '../../components/common/StatusBadge';
import { INITIAL_CLAIMS } from '../../constants/mockData';
import { Plus, UploadCloud, Eye, Edit2, AlertCircle } from 'lucide-react';

const EmployeeDashboard = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  // Drawer popup states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('Create');
  const [activeClaimData, setActiveClaimData] = useState(null);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      // Filter claims belonging to employee
      const employeeClaims = INITIAL_CLAIMS.filter(
        (claim) => claim.employeeName === 'John Employee'
      );
      setClaims(employeeClaims);
      setLoading(false);
    }, 400);
  }, []);

  // Compute metrics totals
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

  const handleRowClick = (claim) => {
    setActiveClaimData(claim);
    setFormMode(claim.status); // Set form mode directly to claim status
    setIsFormOpen(true);
  };

  const handleNewClaimClick = () => {
    setActiveClaimData(null);
    setFormMode('Create');
    setIsFormOpen(true);
  };

  const handleQuickOcrClick = () => {
    // Open in Create mode preloaded with simulated OCR preview data
    setActiveClaimData({
      merchant: 'Simulated Airtel Broadband Center',
      invoiceNumber: 'INV-OCR-2026',
      date: new Date().toISOString().split('T')[0],
      amount: 1499,
      tax: 228.66,
      category: 'Internet & Communications',
      description: 'AI Extracted broadband monthly subscription charges.',
      receiptUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600&auto=format&fit=crop',
      ocrOverallScore: 84,
      ocrTimestamp: new Date().toISOString(),
      ocrConfidence: { merchant: 95, invoiceNumber: 72, amount: 98, tax: 65, date: 92, category: 78 },
    });
    setFormMode('Create');
    setIsFormOpen(true);
  };

  const handleFormSubmit = (submittedData) => {
    // Save draft or submit claim locally to update lists
    const isNew = !claims.some((item) => item.id === submittedData.id);
    let updatedList = [];

    if (isNew) {
      updatedList = [
        {
          ...submittedData,
          employeeName: 'John Employee',
          title: submittedData.description.split('.')[0] || 'Expense Claim',
        },
        ...claims,
      ];
    } else {
      updatedList = claims.map((item) =>
        item.id === submittedData.id
          ? { ...item, ...submittedData, title: submittedData.description.split('.')[0] || item.title }
          : item
      );
    }

    setClaims(updatedList);
    setIsFormOpen(false);
  };

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-left">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 font-display">
            Employee Workspace
          </h1>
          <p className="text-sm text-slate-500">
            Create claims, upload receipt files for OCR extractions, and review settlement timelines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleQuickOcrClick} className="flex items-center gap-1.5 shadow-sm">
            <UploadCloud className="h-4 w-4" />
            Quick OCR Upload
          </Button>
          <Button variant="primary" onClick={handleNewClaimClick} className="flex items-center gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            New Claim
          </Button>
        </div>
      </div>

      {/* 5-Card Metrics Summaries Grid */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-5">
        
        {/* Card 1: Drafts */}
        <Card className="border-t-4 border-t-slate-400 p-4 hover:scale-102 transition-transform">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Drafts</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 font-display">{metrics.Draft}</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">Unsent</span>
          </div>
        </Card>

        {/* Card 2: Pending (Submitted) */}
        <Card className="border-t-4 border-t-blue-500 p-4 hover:scale-102 transition-transform">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Review</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 font-display">{metrics.Submitted}</span>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold">Awaiting</span>
          </div>
        </Card>

        {/* Card 3: Approved */}
        <Card className="border-t-4 border-t-emerald-500 p-4 hover:scale-102 transition-transform">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Approved Payouts</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 font-display">{metrics.Approved}</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">Verified</span>
          </div>
        </Card>

        {/* Card 4: Returned */}
        <Card className="border-t-4 border-t-amber-500 p-4 hover:scale-102 transition-transform">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Returned Corrections</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 font-display text-amber-600">{metrics.Returned}</span>
            <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold">Action Req.</span>
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

      {/* Claims History Table Card */}
      <Card title="Claims History Ledger">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Claim ID</th>
                <th className="py-3 px-4">Justification Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
              {claims.map((claim) => {
                const isReturned = claim.status === 'Returned';
                const isDraft = claim.status === 'Draft';

                return (
                  <tr
                    key={claim.id}
                    onClick={() => handleRowClick(claim)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-4 font-semibold text-slate-500 font-mono">{claim.id}</td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-800 leading-tight group-hover:text-red-600 transition-colors">
                        {claim.title}
                      </div>
                      <span className="text-[10px] text-slate-400 font-sans font-medium line-clamp-1">
                        {claim.description}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-semibold">{claim.category}</td>
                    <td className="py-4 px-4 text-slate-500 font-sans">{claim.date}</td>
                    <td className="py-4 px-4 font-extrabold text-slate-800">
                      ₹{claim.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={claim.status} />
                    </td>
                    <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        {isReturned || isDraft ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800"
                            onClick={() => handleRowClick(claim)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            Correct
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 hover:border-slate-400 hover:bg-slate-50"
                            onClick={() => handleRowClick(claim)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reusable ExpenseForm Drawer Popup */}
      <ExpenseForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        mode={formMode}
        data={activeClaimData}
        onSubmit={handleFormSubmit}
        userRole="Employee"
      />
    </div>
  );
};

export default EmployeeDashboard;
