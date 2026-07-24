import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/loaders/LoadingSpinner';
import ExpenseForm from '../../components/common/ExpenseForm';
import api from '../../services/api';
import { FileSpreadsheet, Plus, UploadCloud, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const EmployeeDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Drawer States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('CREATE');
  const [activeClaimData, setActiveClaimData] = useState(null);

  // Mock Receipt URL
  const mockReceiptUrl = 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600&auto=format&fit=crop';

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await api.get('/dashboard/metrics');
        setMetrics(response.data);
      } catch (err) {
        console.warn('Dashboard fetch failed, using local simulation fallback:', err);
        setMetrics({
          totalSubmittedClaims: 6,
          totalSubmittedAmount: 5699,
          pendingAmount: 1499,
          approvedAmount: 3200,
          recentActivity: [
            {
              id: 'EXP-101',
              title: 'Airtel Broadband Fiber Bill',
              status: 'PENDING_APPROVAL',
              amount: 1499,
              date: '2026-07-20',
              merchant: 'Airtel India Broadband',
              invoiceNumber: 'INV-AIR-88210',
              currency: 'INR',
              tax: 228.66,
              category: 'Internet & Communications',
              department: 'Engineering',
              costCenter: 'CC-ENG-402',
              projectCode: 'PROJ-AIR-5G',
              expenseType: 'Reimbursable',
              description: 'Broadband connection charges for work-from-home setup.',
              receiptUrl: mockReceiptUrl,
              ocrOverallScore: 94,
              ocrTimestamp: '2026-07-20T12:00:00Z',
              ocrConfidence: { merchant: 98, invoiceNumber: 90, amount: 96, tax: 92, date: 95, category: 94 },
              employeeNotes: 'Please process for internet allowance.',
            },
            {
              id: 'EXP-102',
              title: 'Local travel - client meeting',
              status: 'APPROVED',
              amount: 700,
              date: '2026-07-18',
              merchant: 'Ola Fleet Technologies',
              invoiceNumber: 'INV-OLA-9923',
              currency: 'INR',
              tax: 35.0,
              category: 'Travel',
              department: 'Sales',
              costCenter: 'CC-SLS-101',
              projectCode: 'PROJ-IND-CLIENT',
              expenseType: 'Reimbursable',
              description: 'Travel from office to client site for project alignment meeting.',
              receiptUrl: mockReceiptUrl,
              ocrOverallScore: 89,
              ocrTimestamp: '2026-07-18T16:00:00Z',
              ocrConfidence: { merchant: 92, invoiceNumber: 85, amount: 95, tax: 80, date: 90, category: 88 },
              employeeNotes: 'Attaching Ola trip receipt.',
              managerComments: 'Approved. Essential client meeting.',
              financeComments: 'Payment disbursed via direct bank transfer.',
            },
            {
              id: 'EXP-103',
              title: 'Working dinner meals',
              status: 'RETURNED', // Returned Claim
              amount: 2500,
              date: '2026-07-15',
              merchant: 'Grand Taj Pavilion',
              invoiceNumber: 'INV-TAJ-7721',
              currency: 'INR',
              tax: 381.35,
              category: 'Meals',
              department: 'Engineering',
              costCenter: 'CC-ENG-402',
              projectCode: 'PROJ-AIR-5G',
              expenseType: 'Reimbursable',
              description: 'Team dinner with client stakeholders.',
              receiptUrl: mockReceiptUrl,
              ocrOverallScore: 74, // Low confidence
              ocrTimestamp: '2026-07-15T21:30:00Z',
              ocrConfidence: { merchant: 85, invoiceNumber: 52, amount: 89, tax: 45, date: 91, category: 70 },
              employeeNotes: 'Dinner expenses.',
              managerComments: 'Receipt file is blurry. Please upload a clear high-resolution invoice image and resubmit.',
            },
            {
              id: 'EXP-104',
              title: 'SaaS Tool Subscription',
              status: 'DRAFT', // Draft Claim
              amount: 1000,
              date: '2026-07-10',
              merchant: 'GitHub Inc',
              invoiceNumber: 'INV-GH-1229',
              currency: 'INR',
              tax: 152.54,
              category: 'Software Licences',
              department: 'Engineering',
              costCenter: 'CC-ENG-402',
              projectCode: 'PROJ-AIR-5G',
              expenseType: 'Corporate Card',
              description: 'Copilot license for developers.',
              receiptUrl: mockReceiptUrl,
              ocrOverallScore: 95,
              ocrTimestamp: '2026-07-10T10:00:00Z',
              ocrConfidence: { merchant: 99, invoiceNumber: 92, amount: 98, tax: 95, date: 97, category: 96 },
              employeeNotes: 'Draft workspace tool allocation.',
            }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const handleNewClaimClick = () => {
    setActiveClaimData(null);
    setFormMode('CREATE');
    setIsFormOpen(true);
  };

  const handleQuickOcrClick = () => {
    // Open in CREATE mode and preload simulated OCR parameters
    setActiveClaimData({
      merchant: 'Simulated Airtel Broadband Inc',
      invoiceNumber: 'INV-OCR-MOCK-1',
      date: new Date().toISOString().split('T')[0],
      amount: 1499,
      tax: 228.66,
      category: 'Internet & Communications',
      description: 'OCR Scanned Fiber Bill extractions',
      receiptUrl: mockReceiptUrl,
      ocrOverallScore: 88,
      ocrTimestamp: new Date().toISOString(),
      ocrConfidence: { merchant: 95, invoiceNumber: 72, amount: 98, tax: 65, date: 92, category: 78 },
    });
    setFormMode('CREATE');
    setIsFormOpen(true);
  };

  const handleRowClick = (claim) => {
    setActiveClaimData(claim);

    // Map claim status to correct ExpenseForm mode
    const statusModes = {
      DRAFT: 'EDIT_DRAFT',
      RETURNED: 'VIEW_RETURNED', // opens in edit mode showing manager comments
      PENDING_APPROVAL: 'VIEW_DRAFT', // view-only preview for employees
      APPROVED: 'VIEW_APPROVED',
      PROCESSED: 'VIEW_REIMBURSED',
      REJECTED: 'VIEW_DRAFT',
    };

    setFormMode(statusModes[claim.status] || 'VIEW_DRAFT');
    setIsFormOpen(true);
  };

  const handleFormSubmit = (submittedData) => {
    // Save draft or submit claim locally to update list
    const isNew = !metrics.recentActivity.some(item => item.id === submittedData.id);
    let updatedList = [];

    if (isNew) {
      updatedList = [
        {
          ...submittedData,
          title: submittedData.description.split('.')[0] || 'Expense Claim',
        },
        ...metrics.recentActivity
      ];
    } else {
      updatedList = metrics.recentActivity.map(item => 
        item.id === submittedData.id 
          ? { ...item, ...submittedData, title: submittedData.description.split('.')[0] || item.title }
          : item
      );
    }

    // Recalculate stats
    const totalClaims = updatedList.length;
    const pendingSum = updatedList
      .filter(item => item.status === 'PENDING_APPROVAL')
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const approvedSum = updatedList
      .filter(item => item.status === 'APPROVED' || item.status === 'PROCESSED')
      .reduce((sum, item) => sum + Number(item.amount), 0);

    setMetrics(prev => ({
      ...prev,
      totalSubmittedClaims: totalClaims,
      pendingAmount: pendingSum,
      approvedAmount: approvedSum,
      recentActivity: updatedList
    }));

    setIsFormOpen(false);
  };

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  const getStatusBadge = (status) => {
    const styles = {
      APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      PENDING_APPROVAL: 'bg-amber-50 text-amber-700 border-amber-200',
      RETURNED: 'bg-amber-100 text-amber-800 border-amber-300',
      REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
      DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
    };

    const icons = {
      APPROVED: CheckCircle,
      PENDING_APPROVAL: Clock,
      RETURNED: AlertCircle,
      REJECTED: AlertCircle,
      DRAFT: Clock,
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
          <Button variant="outline" onClick={handleQuickOcrClick} className="flex items-center gap-1.5">
            <UploadCloud className="h-4 w-4" />
            Quick OCR Upload
          </Button>
          <Button variant="primary" onClick={handleNewClaimClick} className="flex items-center gap-1.5">
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
                <tr
                  key={item.id}
                  onClick={() => handleRowClick(item)}
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                >
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

      {/* Reusable ExpenseForm Drawer */}
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
