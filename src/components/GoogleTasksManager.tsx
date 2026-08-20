import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  ListTodo, 
  Plus, 
  Calendar, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  FileSearch, 
  AlertTriangle,
  FolderPlus,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { 
  GoogleTaskList, 
  GoogleTaskItem, 
  fetchGoogleTaskLists, 
  fetchGoogleTasks, 
  createGoogleTask, 
  updateGoogleTaskStatus, 
  deleteGoogleTask, 
  authenticateContactsAndTasks, 
  getCachedContactsToken 
} from '../lib/googleContactsTasksService';

interface GoogleTasksManagerProps {
  onSendToAudit?: (taskInfoText: string) => void;
}

export function GoogleTasksManager({ onSendToAudit }: GoogleTasksManagerProps) {
  const [taskLists, setTaskLists] = useState<GoogleTaskList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('@default');
  const [tasks, setTasks] = useState<GoogleTaskItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAuth, setHasAuth] = useState<boolean>(!!getCachedContactsToken());
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  // New Task Modal / State
  const [showAddTaskModal, setShowAddTaskModal] = useState<boolean>(false);
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskNotes, setTaskNotes] = useState<string>('');
  const [taskDueDate, setTaskDueDate] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);

  // Delete Target
  const [deleteTarget, setDeleteTarget] = useState<GoogleTaskItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (hasAuth) {
      loadTaskLists();
    }
  }, [hasAuth]);

  useEffect(() => {
    if (hasAuth && selectedListId) {
      loadTasks(selectedListId);
    }
  }, [hasAuth, selectedListId]);

  const handleConnect = async () => {
    setIsAuthenticating(true);
    setError(null);
    try {
      await authenticateContactsAndTasks();
      setHasAuth(true);
      await loadTaskLists();
    } catch (err: any) {
      console.error('Tasks auth error:', err);
      setError(err.message || 'Failed to authenticate Google Tasks.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const loadTaskLists = async () => {
    try {
      const lists = await fetchGoogleTaskLists();
      setTaskLists(lists);
      if (lists.length > 0 && selectedListId === '@default') {
        setSelectedListId(lists[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load task lists:', err);
      setError(err.message || 'Failed to load task lists.');
    }
  };

  const loadTasks = async (listId: string) => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchGoogleTasks(listId);
      setTasks(items);
    } catch (err: any) {
      console.error('Failed to load tasks:', err);
      setError(err.message || 'Failed to load tasks from Google Tasks.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setCreating(true);
    try {
      await createGoogleTask(selectedListId, {
        title: taskTitle.trim(),
        notes: taskNotes.trim() || undefined,
        due: taskDueDate || undefined
      });
      setTaskTitle('');
      setTaskNotes('');
      setTaskDueDate('');
      setShowAddTaskModal(false);
      await loadTasks(selectedListId);
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (task: GoogleTaskItem) => {
    const nextStatus = task.status === 'completed' ? 'needsAction' : 'completed';
    // Optimistic UI update
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
    try {
      await updateGoogleTaskStatus(selectedListId, task.id, nextStatus);
    } catch (err: any) {
      console.error('Failed to update task status:', err);
      await loadTasks(selectedListId);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteGoogleTask(selectedListId, deleteTarget.id);
      setDeleteTarget(null);
      await loadTasks(selectedListId);
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAuditTask = (task: GoogleTaskItem) => {
    const textToAudit = `[AUDIT ACTION ITEM & REMEDIATION TASK]
Task Title: ${task.title}
Notes & Scope: ${task.notes || 'No notes provided'}
Status: ${task.status === 'completed' ? 'Completed' : 'Pending Action'}
Due Date: ${task.due ? new Date(task.due).toLocaleDateString() : 'No deadline'}
Task ID: ${task.id}

Audit Objective: Evaluate audit remediation progress, identify overdue internal control deficiencies, and ensure compliance milestones are completed on schedule.`;

    if (onSendToAudit) {
      onSendToAudit(textToAudit);
    } else {
      window.dispatchEvent(new CustomEvent('audit-text-dispatch', { detail: { text: textToAudit, title: `Action Item Audit: ${task.title}` } }));
      window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'landing' } }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
            <CheckSquare className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Google Tasks & Audit Remediation
              </h1>
              <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
                Tasks API
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Organize forensic corrective actions, SOX compliance tasks, and synchronize deadlines directly with Google Tasks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!hasAuth ? (
            <button
              onClick={handleConnect}
              disabled={isAuthenticating}
              className="py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <CheckSquare className="w-4 h-4" />
              <span>{isAuthenticating ? 'Connecting...' : 'Connect Google Tasks'}</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => loadTasks(selectedListId)}
                disabled={loading}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                title="Refresh task list"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
              <button
                onClick={() => setShowAddTaskModal(true)}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Action Item</span>
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

      {/* Main Tasks Content */}
      {!hasAuth ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-2xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <ListTodo className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">Connect Your Google Tasks Account</h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Manage your remediation action plans, assign forensic compliance milestones, and track deadline statuses directly synced with Google Tasks.
          </p>
          <button
            onClick={handleConnect}
            disabled={isAuthenticating}
            className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <CheckSquare className="w-4 h-4" />
            <span>{isAuthenticating ? 'Authorizing...' : 'Authorize Google Tasks'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Task Lists Sidebar */}
          <div className="lg:col-span-1 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-2">
              My Task Lists
            </h3>
            <div className="space-y-1.5">
              {taskLists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => setSelectedListId(list.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-between cursor-pointer ${
                    selectedListId === list.id
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{list.title}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Tasks List */}
          <div className="lg:col-span-3 space-y-4">
            {loading ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-700">Fetching tasks from Google Tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 text-base">No tasks in this list</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Add an audit follow-up task or remediation action item using the button above.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => {
                  const isDone = task.status === 'completed';
                  return (
                    <div 
                      key={task.id}
                      className={`bg-white rounded-2xl border p-4 shadow-xs transition-all flex items-start justify-between gap-4 ${
                        isDone ? 'border-slate-200 bg-slate-50/50 opacity-75' : 'border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button
                          onClick={() => handleToggleStatus(task)}
                          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                            isDone 
                              ? 'bg-emerald-600 border-emerald-600 text-white' 
                              : 'border-slate-300 hover:border-emerald-500 bg-white'
                          }`}
                        >
                          {isDone && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <h4 className={`text-sm font-extrabold ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {task.title}
                          </h4>
                          {task.notes && (
                            <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap leading-relaxed">
                              {task.notes}
                            </p>
                          )}
                          {task.due && (
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 mt-2 bg-amber-50 px-2 py-0.5 rounded-md w-fit border border-amber-200">
                              <Calendar className="w-3 h-3 text-amber-600" />
                              <span>Due {new Date(task.due).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleAuditTask(task)}
                          className="py-1.5 px-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Run forensic audit on this remediation task"
                        >
                          <FileSearch className="w-3.5 h-3.5 text-purple-600" />
                          <span className="hidden sm:inline">Audit Scope</span>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(task)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-lg font-black text-slate-900 mb-1">Create Google Task / Action Item</h2>
            <p className="text-xs text-slate-500 mb-4">Add a new action item to sync with Google Tasks.</p>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="e.g. Verify vendor wire change documentation with CFO"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Details / Remediation Notes</label>
                <textarea
                  rows={3}
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Detailed instructions or invoice reference numbers..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Due Date (Optional)</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer"
                >
                  {creating ? 'Creating...' : 'Save Task'}
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
            <h3 className="text-base font-black text-slate-900 mb-1">Delete Task</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Are you sure you want to delete <strong>"{deleteTarget.title}"</strong> from Google Tasks?
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
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
