import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, 
  Plus, 
  FileText, 
  Mail, 
  Trash2, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  ExternalLink,
  Search,
  Building2,
  Lock
} from 'lucide-react';
import { getActiveFirm, getFirmClients, saveFirmClients, FirmClient } from '../lib/multiTenantDb';

export function ClientManagement() {
  const firm = getActiveFirm();
  const [clients, setClients] = useState<FirmClient[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [taxId, setTaxId] = useState('');

  const loadClients = () => {
    setClients(getFirmClients(firm.id));
  };

  useEffect(() => {
    loadClients();
    window.addEventListener('firm-clients-changed', loadClients);
    return () => window.removeEventListener('firm-clients-changed', loadClients);
  }, [firm.id]);

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) return;

    const newClient: FirmClient = {
      id: `client_${Date.now()}`,
      firmId: firm.id,
      companyName,
      contactName,
      contactEmail,
      taxId,
      status: 'active',
      auditCount: 0,
      createdAt: new Date().toISOString(),
    };

    const updated = [newClient, ...clients];
    saveFirmClients(firm.id, updated);
    setClients(updated);

    setShowAddModal(false);
    setCompanyName('');
    setContactName('');
    setContactEmail('');
    setTaxId('');
  };

  const handleDeleteClient = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove client ${name}?`)) {
      const updated = clients.filter(c => c.id !== id);
      saveFirmClients(firm.id, updated);
      setClients(updated);
    }
  };

  const filteredClients = clients.filter(c => 
    c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-600" />
              {firm.name} Clients
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Firm Client Directory & Portals
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your firm's business clients. Clients view their audit certificates and forensic ledgers directly inside your white-labeled portal.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Client Company
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search clients by name or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 shadow-xs"
          />
        </div>

        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200">
          Total Registered Clients: <strong>{clients.length}</strong>
        </span>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-purple-300 transition-all space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-2xl text-white font-extrabold flex items-center justify-center text-sm shadow-xs"
                  style={{ backgroundColor: firm.primaryColor }}
                >
                  {client.companyName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{client.companyName}</h3>
                  <span className="text-xs text-slate-500 block">Tax ID: {client.taxId || 'N/A'}</span>
                </div>
              </div>

              <button
                onClick={() => handleDeleteClient(client.id, client.companyName)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                title="Remove Client"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Primary Contact:</span>
                <strong className="text-slate-900">{client.contactName || 'Main Accounting Dept'}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Email Address:</span>
                <strong className="text-purple-700 font-mono">{client.contactEmail}</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                Audits Run: <strong>{client.auditCount}</strong>
              </span>

              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Portal Branded by {firm.name}
              </span>
            </div>
          </div>
        ))}

        {filteredClients.length === 0 && (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
            <Building className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-extrabold text-slate-900">No Clients Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click "Add New Client Company" to register your client firms under your white label portal.
            </p>
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Register Firm Client</h3>
                  <span className="text-xs text-slate-500">Client profile for {firm.name}</span>
                </div>
              </div>

              <form onSubmit={handleAddClient} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Company / Organization Name *</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Logistics Corp"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Primary Contact Person</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. David Miller (CFO)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Contact Email Address</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="david@acmelogistics.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Tax ID / Company Reg No</label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="XX-1234567"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-500/20"
                  >
                    Register Client
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
