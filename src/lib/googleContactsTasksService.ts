import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  User 
} from 'firebase/auth';
import { auth } from './firebase';
import { getCachedGmailToken, setCachedGmailToken } from './gmailService';

export const CONTACTS_TASKS_SCOPES = [
  'https://www.googleapis.com/auth/contacts',
  'https://www.googleapis.com/auth/contacts.other.readonly',
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/directory.readonly',
  'https://www.googleapis.com/auth/user.addresses.read',
  'https://www.googleapis.com/auth/user.birthday.read',
  'https://www.googleapis.com/auth/user.emails.read',
  'https://www.googleapis.com/auth/user.gender.read',
  'https://www.googleapis.com/auth/user.organization.read',
  'https://www.googleapis.com/auth/user.phonenumbers.read',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/tasks.readonly',
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/drive'
];

let cachedContactsToken: string | null = null;

export function getCachedContactsToken(): string | null {
  return cachedContactsToken || getCachedGmailToken();
}

export function setCachedContactsToken(token: string | null) {
  cachedContactsToken = token;
  if (token) {
    setCachedGmailToken(token);
  }
}

export interface GoogleContactPerson {
  resourceName: string;
  etag?: string;
  names?: Array<{ displayName: string; givenName?: string; familyName?: string }>;
  emailAddresses?: Array<{ value: string; type?: string; displayName?: string }>;
  phoneNumbers?: Array<{ value: string; type?: string }>;
  organizations?: Array<{ name: string; title?: string; department?: string }>;
  photos?: Array<{ url: string }>;
  addresses?: Array<{ formattedValue: string; type?: string }>;
}

export interface GoogleTaskList {
  id: string;
  title: string;
  updated?: string;
  selfLink?: string;
}

export interface GoogleTaskItem {
  id: string;
  title: string;
  updated?: string;
  selfLink?: string;
  parent?: string;
  position?: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  completed?: string;
  deleted?: boolean;
  hidden?: boolean;
}

/**
 * Sign in to Google with Contacts and Tasks scopes
 */
export async function authenticateContactsAndTasks(): Promise<{ user: User; accessToken: string }> {
  const provider = new GoogleAuthProvider();
  CONTACTS_TASKS_SCOPES.forEach((scope) => {
    provider.addScope(scope);
  });

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken || null;

  if (!token) {
    throw new Error('Failed to acquire OAuth access token for Contacts & Tasks.');
  }

  setCachedContactsToken(token);
  return { user: result.user, accessToken: token };
}

/**
 * Fetch contacts list from Google People API
 */
export async function fetchGoogleContacts(pageSize = 100): Promise<{ connections: GoogleContactPerson[]; totalPeople: number }> {
  const token = getCachedContactsToken();
  if (!token) throw new Error('Not authenticated for Google Contacts.');

  const personFields = 'names,emailAddresses,phoneNumbers,organizations,photos,addresses';
  const url = `https://people.googleapis.com/v1/people/me/connections?pageSize=${pageSize}&personFields=${personFields}&sortOrder=FIRST_NAME_ASCENDING`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Google People API error: ${res.status}`);
  }

  const data = await res.json();
  return {
    connections: data.connections || [],
    totalPeople: data.totalPeople || (data.connections ? data.connections.length : 0)
  };
}

/**
 * Create a new contact in Google Contacts (with explicit user confirmation in UI)
 */
export async function createGoogleContact(contactData: {
  givenName: string;
  familyName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
}): Promise<GoogleContactPerson> {
  const token = getCachedContactsToken();
  if (!token) throw new Error('Not authenticated for Google Contacts.');

  const personBody: any = {
    names: [
      {
        givenName: contactData.givenName,
        familyName: contactData.familyName || '',
      }
    ]
  };

  if (contactData.email) {
    personBody.emailAddresses = [{ value: contactData.email, type: 'work' }];
  }

  if (contactData.phone) {
    personBody.phoneNumbers = [{ value: contactData.phone, type: 'work' }];
  }

  if (contactData.company || contactData.jobTitle) {
    personBody.organizations = [{
      name: contactData.company || '',
      title: contactData.jobTitle || '',
      type: 'work'
    }];
  }

  const res = await fetch('https://people.googleapis.com/v1/people:createContact', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(personBody)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to create contact in Google Contacts');
  }

  return await res.json();
}

/**
 * Delete a contact from Google Contacts (with explicit user confirmation in UI)
 */
export async function deleteGoogleContact(resourceName: string): Promise<void> {
  const token = getCachedContactsToken();
  if (!token) throw new Error('Not authenticated for Google Contacts.');

  const res = await fetch(`https://people.googleapis.com/v1/${resourceName}:deleteContact`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to delete contact');
  }
}

/**
 * Fetch user's Google Task Lists
 */
export async function fetchGoogleTaskLists(): Promise<GoogleTaskList[]> {
  const token = getCachedContactsToken();
  if (!token) throw new Error('Not authenticated for Google Tasks.');

  const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Google Tasks API error: ${res.status}`);
  }

  const data = await res.json();
  return data.items || [];
}

/**
 * Fetch tasks from a specific Task List
 */
export async function fetchGoogleTasks(taskListId = '@default'): Promise<GoogleTaskItem[]> {
  const token = getCachedContactsToken();
  if (!token) throw new Error('Not authenticated for Google Tasks.');

  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks?showCompleted=true&showHidden=true`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Google Tasks items error: ${res.status}`);
  }

  const data = await res.json();
  return data.items || [];
}

/**
 * Create a new task in Google Tasks
 */
export async function createGoogleTask(taskListId = '@default', taskData: {
  title: string;
  notes?: string;
  due?: string; // RFC 3339 timestamp
}): Promise<GoogleTaskItem> {
  const token = getCachedContactsToken();
  if (!token) throw new Error('Not authenticated for Google Tasks.');

  const body: any = {
    title: taskData.title,
    notes: taskData.notes || '',
  };

  if (taskData.due) {
    body.due = new Date(taskData.due).toISOString();
  }

  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to create Google Task');
  }

  return await res.json();
}

/**
 * Update task completion status
 */
export async function updateGoogleTaskStatus(taskListId: string, taskId: string, status: 'needsAction' | 'completed'): Promise<GoogleTaskItem> {
  const token = getCachedContactsToken();
  if (!token) throw new Error('Not authenticated for Google Tasks.');

  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status,
      completed: status === 'completed' ? new Date().toISOString() : null
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to update Google Task');
  }

  return await res.json();
}

/**
 * Delete task from Google Tasks (with user confirmation)
 */
export async function deleteGoogleTask(taskListId: string, taskId: string): Promise<void> {
  const token = getCachedContactsToken();
  if (!token) throw new Error('Not authenticated for Google Tasks.');

  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to delete task');
  }
}
