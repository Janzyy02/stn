import React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Clock, LogOut, ShieldCheck } from "lucide-react";

const PendingApproval = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-amber-50 rounded-full">
            <Clock size={48} className="text-amber-500 animate-pulse" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Account Pending Approval
        </h2>

        <p className="text-slate-600 mb-8">
          Thank you for registering! Your account is currently being reviewed by
          a<span className="font-semibold text-indigo-600"> Super Admin</span>.
          You will gain access to the system once your request is approved.
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400 bg-slate-50 py-3 rounded-lg">
            <ShieldCheck size={16} />
            <span>Estimated wait time: 24-48 hours</span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 rounded-xl transition-all"
          >
            <LogOut size={18} />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
