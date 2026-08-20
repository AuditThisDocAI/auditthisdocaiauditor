import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  Building2, 
  Trash2, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck, 
  AlertTriangle,
  FileSearch,
  CheckCircle2,
  Lock,
  UserCheck,
  Plus
} from 'lucide-react';
import { 
  GoogleContactPerson, 
  fetchGoogleContacts, 
  createGoogleContact, 
  deleteGoogleContact, 
  authenticateContactsAndTasks, 
  getCachedContactsToken 
} from '../lib/googleContactsTasksService';

interface GoogleContactsManagerProps {
  onSendToAudit?: (contactInfoText: string) => void;
}

export function GoogleContactsManager({ onSendToAudit }: GoogleContactsManagerProps) {
  const [contacts, setContacts] = useState<GoogleContactPerson[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hasAuth, setHasAuth] = useState<boolean>(!!getCachedContactsToken());
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  // New Contact Modal / Form
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    givenName: '',
    familyName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: ''
  });

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<GoogleContactPerson | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (hasAuth) {
      loadContacts();
    }
  }, [hasAuth]);

  const handleConnect = async () => {
    setIsAuthenticating(true);
    setError(null);
    try {
      await authenticateContactsAndTasks();
      setHasAuth(true);
      await loadContacts();
    } catch (err: any) {
      console.error('Contacts auth error:', err);
      setError(err.message || 'Failed to authenticate Google Contacts.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const loadContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { connections } = await fetchGoogleContacts(100);
      setContacts(connections);
    } catch (err: any) {
      console.error('Failed to load contacts:', err);
      setError(err.message || 'Failed to fetch contacts from Google People API.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.givenName.trim()) {
      alert('First Name is required');
      return;
    }
    setCreating(true);
    try {
      await createGoogleContact(formData);
      setShowAddModal(false);
      setFormData({
        givenName: '',
        familyName: '',
        email: '',
        phone: '',
        company: '',
        jobTitle: ''
      });
      await loadContacts();
    } catch (err: any) {
      alert(err.message || 'Failed to create contact');
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteGoogleContact(deleteTarget.resourceName);
      setDeleteTarget(null);
      await loadContacts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete contact');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAuditContact = (contact: GoogleContactPerson) => {
    const name = contact.names?.[0]?.displayName || 'Unnamed Contact';
    const email = contact.emailAddresses?.[0]?.value || 'No Email';
    const phone = contact.phoneNumbers?.[0]?.value || 'No Phone';
    const org = contact.organizations?.[0]?.name || 'Unspecified Vendor / Org';
    const title = contact.organizations?.[0]?.title || 'Unknown Title';

    const textToAudit = `[VENDOR / CONTACT VERIFICATION AUDIT]
Contact Name: ${name}
Company / Organization: ${org}
Designation: ${title}
Email Address: ${email}
Phone Number: ${phone}
Resource ID: ${contact.resourceName}

Audit Objective: Verify vendor legitimacy, email domain integrity, corporate registration, and detect high-risk spoofing or impersonation signals before authorizing wire transfers.`;

    if (onSendToAudit) {
      onSendToAudit(textToAudit);
    } else {
      window.dispatchEvent(new CustomEvent('audit-text-dispatch', { detail: { text: textToAudit, title: `Vendor Verification: ${name}` } }));
      window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'landing' } }));
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const name = (c.names?.[0]?.displayName || '').toLowerCase();
    const email = (c.emailAddresses?.[0]?.value || '').toLowerCase();
    const company = (c.organizations?.[0]?.name || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || email.includes(q) || company.includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Google Contacts & Vendor Directory
              </h1>
              <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-blue-200">
                People API
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Synchronize vendor & client contacts, verify banking identity credentials, and run instant forensic checks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!hasAuth ? (
            <button
              onClick={handleConnect}
              disabled={isAuthenticating}
              className="py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>{isAuthenticating ? 'Connecting...' : 'Connect Google Contacts'}</span>
            </button>
          ) : (
            <>
              <button
                onClick={loadContacts}
                disabled={loading}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                title="Refresh contacts"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Vendor / Contact</span>
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Area */}
      {!hasAuth ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-2xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">Connect Your Google Contacts Directory</h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Link your Google People API to browse suppliers, cross-examine contact email domains with vendor invoices, and flag suspicious identity alterations.
          </p>
          <button
            onClick={handleConnect}
            disabled={isAuthenticating}
            className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-600/25 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>{isAuthenticating ? 'Authorizing...' : 'Authorize Google Contacts'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filter / Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search contacts by name, email, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="text-xs font-bold text-slate-500 flex items-center px-2">
              {filteredContacts.length} Contact{filteredContacts.length === 1 ? '' : 's'} Found
            </div>
          </div>

          {/* Contacts Grid */}
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">Loading contacts from Google People API...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-base">No contacts found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery ? 'Try refining your search keyword.' : 'Add your first supplier or client contact using the button above.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContacts.map((contact) => {
                const name = contact.names?.[0]?.displayName || 'Unnamed Contact';
                const email = contact.emailAddresses?.[0]?.value;
                const phone = contact.phoneNumbers?.[0]?.value;
                const org = contact.organizations?.[0]?.name;
                const title = contact.organizations?.[0]?.title;
                const photo = contact.photos?.[0]?.url;

                return (
                  <div 
                    key={contact.resourceName}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          {photo ? (
                            <img src={photo} alt={name} className="w-11 h-11 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 font-black flex items-center justify-center text-base">
                              {name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h3 className="font-extrabold text-sm text-slate-900 leading-snug">{name}</h3>
                            {org && (
                              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[150px]">{org}</span>
                                {title && <span className="text-slate-400">({title})</span>}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => setDeleteTarget(contact)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete contact"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {email && (
                          <div className="flex items-center gap-2 truncate">
                            <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <a href={`mailto:${email}`} className="hover:underline truncate">{email}</a>
                          </div>
                        )}
                        {phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{phone}</span>
                          </div>
                        )}
                        {!email && !phone && (
                          <span className="text-slate-400 italic text-[11px]">No email or phone recorded</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAuditContact(contact)}
                      className="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileSearch className="w-3.5 h-3.5 text-purple-600" />
                      <span>Audit Vendor Identity</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-lg font-black text-slate-900 mb-1">Add Google Contact / Vendor</h2>
            <p className="text-xs text-slate-500 mb-4">Create a new contact entry directly in your Google Account directory.</p>

            <form onSubmit={handleCreateContact} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.givenName}
                    onChange={(e) => setFormData({ ...formData, givenName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.familyName}
                    onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20"
                  placeholder="jane.doe@vendorcorp.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20"
                  placeholder="+1 (555) 019-2834"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Apex Supplies LLC"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Billing Manager"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer"
                >
                  {creating ? 'Saving...' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">Delete Contact</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Are you sure you want to delete <strong>{deleteTarget.names?.[0]?.displayName || 'this contact'}</strong> from Google Contacts? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
