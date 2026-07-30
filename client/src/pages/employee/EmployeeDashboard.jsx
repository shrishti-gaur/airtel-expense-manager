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
  Plus,
  UploadCloud,
  Eye,
  Edit2,
  AlertCircle,
  Upload,
  FileText,
  ArrowLeft,
  History,
  FileCheck
} from 'lucide-react';

const EmployeeDashboard = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const claimId = searchParams.get('claimId');
  const { runWithLoading, addNotification } = useUI();

  // Drawer popup states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('Create');
  const [activeClaimData, setActiveClaimData] = useState(null);

  // Drag and drop states for OCR
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

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

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const res = await api.get('/expense/my-claims');
        if (res && res.success && res.data) {
          setClaims(res.data.claims || []);
        }
      } catch (err) {
        console.error('Failed to fetch employee claims:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, []);

  // Listen to path changes and search parameters to open/close drawer
  useEffect(() => {
    if (claimId) {
      const claim = claims.find((c) => c.id === claimId);
      if (claim) {
        setActiveClaimData(claim);
        setFormMode(claim.status);
        setIsFormOpen(true);
      }
    } else if (location.pathname === '/employee/submit') {
      if (!isFormOpen) {
        setFormMode('Create');
        setIsFormOpen(true);
      }
    } else {
      setIsFormOpen(false);
      setActiveClaimData(null);
    }
  }, [location.pathname, claimId, claims]);

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
    setSearchParams({ claimId: claim.id });
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setActiveClaimData(null);
    if (claimId) {
      searchParams.delete('claimId');
      setSearchParams(searchParams);
    } else if (location.pathname === '/employee/submit') {
      navigate('/employee');
    }
  };

  const handleNewClaimClick = () => {
    setActiveClaimData(null);
    setFormMode('Create');
    setIsFormOpen(true);
    navigate('/employee/submit');
  };

  const handleQuickOcrClick = () => {
    navigate('/employee/scan');
  };

  // OCR Upload Actions
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleOcrFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleOcrFile(e.target.files[0]);
    }
  };

  const handleOcrFile = async (file) => {
    setSelectedFile(file);
    const sequence = [
      { message: 'Uploading Receipt...', duration: 1000 },
      { message: 'Reading Receipt...', duration: 1200 },
      { message: 'Extracting Text...', duration: 1500 },
      { message: 'Processing...', duration: 800 },
      { message: 'Almost Done...', duration: 600 }
    ];
    
    try {
      const formDataPayload = new FormData();
      formDataPayload.append('receipt', file);

      await runWithLoading(sequence, async () => {
        const res = await api.post('/ocr/process', formDataPayload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const extracted = res.data;
        const fileExt = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

        const claimData = {
          merchant: extracted.vendor || '',
          invoiceNumber: extracted.invoiceNumber || '',
          invoiceDate: extracted.date ? new Date(extracted.date).toISOString().split('T')[0] : '',
          submissionDate: new Date().toISOString(),
          amount: extracted.amount || '',
          tax: extracted.taxAmount || '',
          category: extracted.category || '',
          description: extracted.description || '',
          receiptUrl: extracted.receiptUrl,
          fileName: file.name,
          fileType: file.type || (fileExt === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : fileExt === '.pdf' ? 'application/pdf' : 'image/png'),
          fileSize: file.size,
          ocrOverallScore: extracted.confidenceScore ? Math.round(extracted.confidenceScore * 100) : null,
          ocrTimestamp: new Date().toISOString(),
          ocrConfidence: extracted.ocrConfidence || null,
        };

        setActiveClaimData(claimData);
        addNotification(
          'OCR Scanning Succeeded',
          claimData.amount
            ? `Successfully extracted ₹${Number(claimData.amount).toLocaleString('en-IN')} from "${file.name}". Review details in the form.`
            : `File "${file.name}" uploaded successfully. Fill in claim details.`,
          'success'
        );
        setFormMode('Create');
        setIsFormOpen(true);
        navigate('/employee/submit');
      });
    } catch (err) {
      console.error('Failed to process OCR receipt upload:', err);
      addNotification(
        'Upload & OCR Failed',
        err.message || 'Failed to upload or parse receipt file.',
        'error'
      );
    } finally {
      setSelectedFile(null);
    }
  };



  const handleFormSubmit = async (submittedData) => {
    setLoading(true);
    try {
      const isNew = !claims.some((item) => item.id === submittedData.id);

      if (isNew) {
        await api.post('/expense', submittedData);
        addNotification(
          submittedData.status === 'Draft' ? 'Claim Draft Saved' : 'Claim Submitted',
          submittedData.status === 'Draft'
            ? `Claim draft has been saved.`
            : `Claim for ₹${Number(submittedData.amount).toLocaleString('en-IN')} has been submitted for review.`,
          submittedData.status === 'Draft' ? 'info' : 'success'
        );
      } else {
        await api.put(`/expense/${submittedData.id}`, submittedData);
        addNotification(
          submittedData.status === 'Draft' ? 'Claim Draft Updated' : 'Claim Submitted',
          submittedData.status === 'Draft'
            ? `Claim draft ${submittedData.id} has been saved.`
            : `Claim ${submittedData.id} has been submitted for review.`,
          submittedData.status === 'Draft' ? 'info' : 'success'
        );
      }

      // Re-fetch claims from database
      const res = await api.get('/expense/my-claims');
      if (res && res.success && res.data) {
        setClaims(res.data.claims || []);
      }
    } catch (err) {
      console.error('Failed to submit claim:', err);
      addNotification('Submission Failed', err.message || 'An error occurred during submission', 'error');
    } finally {
      setLoading(false);
      setIsFormOpen(false);
      setActiveClaimData(null);
      navigate('/employee');
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  // 1. RENDER SCAN RECEIPT VIEW
  if (location.pathname === '/employee/scan') {
    return (
      <div className="space-y-6 animate-fade-in font-sans">
        {/* Back Link Header */}
        <div className="text-left">
          <button
            onClick={() => navigate('/employee')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors uppercase tracking-wider mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 font-display">
            Scan Receipt (OCR)
          </h1>
          <p className="text-sm text-slate-500">
            Upload receipt documents or invoices. Our AI parser automatically reads, verifies, and fills the claim fields.
          </p>
        </div>

        {/* Drag and Drop Box */}
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl transition-all ${
                dragActive 
                  ? 'border-red-500 bg-red-50/30' 
                  : 'border-slate-300 hover:border-red-500 hover:bg-slate-50/40'
              }`}
            >
              <UploadCloud className="h-16 w-16 text-slate-400 mb-4 animate-bounce" style={{ animationDuration: '3s' }} />
              <h3 className="text-base font-bold text-slate-800">
                Drag and drop your receipt here
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-6">
                Supports JPEG, PNG, PDF, and DOCX files up to 10MB
              </p>

              {/* Upload Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full justify-center items-center">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors">
                  <Upload className="h-4 w-4" />
                  Upload Receipt File
                  <input
                    type="file"
                    accept="image/*,application/pdf,.docx,.doc"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>
          </Card>
        </div>

        {/* Drawer popup */}
        <ExpenseForm
          isOpen={isFormOpen}
          onClose={handleFormClose}
          mode={formMode}
          data={activeClaimData}
          onSubmit={handleFormSubmit}
          userRole="Employee"
        />
      </div>
    );
  }

  // 2. RENDER CLAIM HISTORY ONLY VIEW
  if (location.pathname === '/employee/claims') {
    return (
      <div className="space-y-6 animate-fade-in font-sans">
        {/* Back Link Header */}
        <div className="text-left">
          <button
            onClick={() => navigate('/employee')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors uppercase tracking-wider mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 font-display">
            Claim History Ledger
          </h1>
          <p className="text-sm text-slate-500">
            View full record audits of your submitted and processed expense items.
          </p>
        </div>

        {/* Full Ledger */}
        <Card title="Claims History Ledger">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Claim ID</th>
                  <th className="py-3 px-4">Justification Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Invoice Date</th>
                  <th className="py-3 px-4">Submission Date & Time</th>
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
                      <td className="py-4 px-4 text-slate-500 font-sans">{formatDateOnly(claim.invoiceDate)}</td>
                      <td className="py-4 px-4 text-slate-500 font-sans">{formatDateTime(claim.submissionDate)}</td>
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

        {/* Drawer popup */}
        <ExpenseForm
          isOpen={isFormOpen}
          onClose={handleFormClose}
          mode={formMode}
          data={activeClaimData}
          onSubmit={handleFormSubmit}
          userRole="Employee"
        />
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
            <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold font-sans">Action Req.</span>
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

      {/* Claims Ledger Table Card */}
      <Card
        title="Recent Claim Submissions"
        headerAction={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/employee/claims')}
            className="flex items-center gap-1.5 font-bold shadow-sm"
          >
            <History className="h-4 w-4" />
            View Full Ledger
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Claim ID</th>
                <th className="py-3 px-4">Justification Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Invoice Date</th>
                <th className="py-3 px-4">Submission Date & Time</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
              {claims.slice(0, 5).map((claim) => {
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
                    <td className="py-4 px-4 text-slate-500 font-sans">{formatDateOnly(claim.invoiceDate)}</td>
                    <td className="py-4 px-4 text-slate-500 font-sans">{formatDateTime(claim.submissionDate)}</td>
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
        onClose={handleFormClose}
        mode={formMode}
        data={activeClaimData}
        onSubmit={handleFormSubmit}
        userRole="Employee"
      />
    </div>
  );
};

export default EmployeeDashboard;
