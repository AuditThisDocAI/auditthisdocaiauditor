import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Trash2, 
  Mail, 
  Crown, 
  CheckCircle2, 
  X, 
  UserCheck, 
  Lock,
  Building2,
  KeyRound
} from 'lucide-react';
import { getActiveFirm, getFirmStaff, saveFirmStaff, StaffMember } from '../lib/multiTenantDb';

export function StaffManagement() {
  const firm = getActiveFirm();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'owner' | 'auditor' | 'viewer'>('auditor');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadStaff = () => {
    setStaffList(getFirmStaff(firm.id));
  };

  useEffect(() => {
    loadStaff();
    window.addEventListener('firm-staff-changed', loadStaff);
    return () => window.removeEventListener('firm-staff-changed', loadStaff);
  }, [firm.id]);

  const openGmailInvite = (member: StaffMember) => {
    const subject = `Invitation to join ${firm.name} Forensic Audit Team`;
    const body = `Hi ${member.name},\n\nYou have been invited to join ${firm.name} as a ${member.role.toUpperCase()} on our forensic document auditing portal.\n\nYou can access client ledgers and log in here:\n${window.location.origin}\n\nBest regards,\n${firm.senderName || firm.name}`;
    
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(member.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.open(gmailUrl, '_blank');
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffEmail) return;

    const newMember: StaffMember = {
      id: `staff_${Date.now()}`,
      firmId: firm.id,
      name: newStaffName || newStaffEmail.split('@')[0],
      email: newStaffEmail.toLowerCase().trim(),
      role: newStaffRole,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const updated = [...staffList, newMember];
    saveFirmStaff(firm.id, updated);
    setStaffList(updated);

    setShowInviteModal(false);
    setNewStaffName('');
    setNewStaffEmail('');
    
    // Open Gmail compose with prefilled invitation email
    openGmailInvite(newMember);

    setActionNotice(`Invitation prepared for ${newMember.email}! (Gmail Compose Window Opened)`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleRemoveStaff = (id: string, name: string) => {
    if (staffList.length <= 1) {
      alert('Your firm must retain at least one active firm owner.');
      return;
    }

    if (window.confirm(`Are you sure you want to revoke access for ${name}?`)) {
      const updated = staffList.filter(s => s.id !== id);
      saveFirmStaff(firm.id, updated);
      setStaffList(updated);

      setActionNotice(`Staff access revoked for ${name}.`);
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-600" />
              {firm.name} Staff Access
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Firm Accountants & Staff Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Grant auditor permissions to your firm's team members. Only staff registered under <strong>{firm.name}</strong> can access client ledgers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowInviteModal(true)}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 transition-all flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Invite Staff Member
        </button>
      </div>

      {actionNotice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-purple-50 border border-purple-200 text-purple-900 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-xs"
        >
          <CheckCircle2 className="w-5 h-5 text-purple-600" />
          {actionNotice}
        </motion.div>
      )}

      {/* Staff Roster Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Active Firm Roster ({staffList.length})</h3>
            <span className="text-xs text-slate-500">Firm ID: {firm.id}</span>
          </div>

          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Multi-Tenant Isolation Enforced
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {staffList.map((member) => (
            <div key={member.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-4">
                <div 
                  className="w-11 h-11 rounded-2xl text-white font-bold flex items-center justify-center text-sm shadow-sm"
                  style={{ backgroundColor: firm.primaryColor }}
                >
                  {member.name.charAt(0)}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">{member.name}</span>
                    {member.role === 'owner' && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-200">
                        <Crown className="w-3 h-3 text-amber-600" />
                        Firm Owner
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {member.email}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-700 block capitalize">
                    Role: {member.role}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    Access Active
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => openGmailInvite(member)}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                  title="Open Gmail Compose with Invitation"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Gmail Invite</span>
                </button>

                {member.role !== 'owner' && (
                  <button
                    onClick={() => handleRemoveStaff(member.id, member.name)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    title="Revoke Staff Access"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative"
            >
              <button
                onClick={() => setShowInviteModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Invite Firm Staff</h3>
                  <span className="text-xs text-slate-500">Assign permissions under {firm.name}</span>
                </div>
              </div>

              <form onSubmit={handleAddStaff} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Accountant Full Name</label>
                  <input
                    type="text"
                    required
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="e.g. David Vance, CPA"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Corporate Email Address</label>
                  <input
                    type="email"
                    required
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="dvance@yourfirm.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Permission Role</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-purple-600"
                  >
                    <option value="auditor">Auditor (Upload Ledgers & Run Forensic Audits)</option>
                    <option value="owner">Co-Owner (Full Branding & Staff Management)</option>
                    <option value="viewer">Viewer (Read-Only Audit Certificate Reports)</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-500/20 flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Send Invite via Gmail</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
