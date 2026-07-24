import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';
import Button from '../../components/ui/Button';

const NotFound = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.role === 'Manager') {
      navigate('/manager');
    } else if (user.role === 'Finance') {
      navigate('/finance');
    } else {
      navigate('/employee');
    }
  };

  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center text-center px-4 animate-fade-in font-sans">
      <div className="mb-6 rounded-full bg-red-50 p-4 text-red-600 border border-red-200">
        <AlertCircle className="h-12 w-12" />
      </div>
      
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-800 font-display">
        Page Not Found
      </h1>
      
      <p className="mt-2 max-w-md text-sm text-slate-500 leading-relaxed">
        The request was either denied due to role access constraints or the endpoint URL does not exist on this enterprise configuration.
      </p>

      <div className="mt-8 flex items-center justify-center gap-4">
        <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
        <Button variant="primary" onClick={handleBackToDashboard} className="flex items-center gap-1.5">
          <Home className="h-4 w-4" />
          Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
