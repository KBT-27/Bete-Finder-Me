import { OwnerFeedback } from '../types';

const STORAGE_KEY = 'bete_finder_owner_feedbacks';

const INITIAL_DEMO_FEEDBACKS: OwnerFeedback[] = [
  {
    id: 'fb-demo-1',
    name: 'Abebe Tadesse',
    email: 'abebe.tadesse@gmail.com',
    phone: '+251911234567',
    category: 'rental',
    rating: 5,
    message: 'The Bole 2-bedroom rental was accurately described and the landlord contact was instantaneous. Excellent platform for finding reliable homes in Addis Ababa!',
    propertyTitle: 'Modern 2-Bedroom Luxury Apartment in Bole Atlas',
    status: 'new',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
  },
  {
    id: 'fb-demo-2',
    name: 'Bethlehem Haile',
    email: 'bethlehem.haile99@yahoo.com',
    phone: '+251922889900',
    category: 'platform',
    rating: 4,
    message: 'I really love the Telegram Bot and channel integration! Could you add filter by floor level (like G+1, G+2) directly in the mobile search bar?',
    status: 'read',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
  },
  {
    id: 'fb-demo-3',
    name: 'Dawit Mengistu (Landlord)',
    email: 'dawit.realestate@gmail.com',
    phone: '+251933445566',
    category: 'sale',
    rating: 5,
    message: 'Thank you Owner Kaleb for verifying my CMC Villa so quickly. Received 3 qualified buyer inquiries through Telebirr VIP within 48 hours.',
    propertyTitle: 'Executive G+2 Villa in CMC Country Club',
    status: 'replied',
    replyNotes: 'Thanked Dawit and offered 10% discount on next property listing.',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
  },
];

/**
 * Retrieve saved owner feedbacks from local storage or defaults
 */
export const getOwnerFeedbacks = (): OwnerFeedback[] => {
  if (typeof window === 'undefined') return INITIAL_DEMO_FEEDBACKS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('[Feedback] Error parsing local feedbacks:', err);
  }
  return INITIAL_DEMO_FEEDBACKS;
};

/**
 * Save feedbacks to local storage and broadcast change event
 */
export const saveOwnerFeedbacksLocally = (feedbacks: OwnerFeedback[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(feedbacks));
    window.dispatchEvent(new CustomEvent('bete_feedbacks_changed', { detail: feedbacks }));
  } catch (err) {
    console.warn('[Feedback] Error saving local feedbacks:', err);
  }
};

/**
 * Send a new feedback to the Owner
 */
export const sendOwnerFeedback = async (
  feedbackData: Omit<OwnerFeedback, 'id' | 'status' | 'createdAt'>
): Promise<{ success: boolean; feedback?: OwnerFeedback; message: string }> => {
  const newFeedback: OwnerFeedback = {
    ...feedbackData,
    id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    status: 'new',
    createdAt: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  };

  // Update local state immediately
  const existing = getOwnerFeedbacks();
  const updated = [newFeedback, ...existing];
  saveOwnerFeedbacksLocally(updated);

  // Sync to server
  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFeedback),
    });
    const data = await res.json();
    if (data.success && data.feedback) {
      return { success: true, feedback: data.feedback, message: 'Feedback sent directly to Owner successfully!' };
    }
  } catch (err: any) {
    console.warn('[Feedback] Server sync error, saved locally:', err);
  }

  return { 
    success: true, 
    feedback: newFeedback, 
    message: 'Feedback submitted and queued for the Owner!' 
  };
};

/**
 * Update feedback status (e.g. read, replied, archived)
 */
export const updateFeedbackStatus = async (
  id: string,
  status: OwnerFeedback['status'],
  replyNotes?: string
): Promise<OwnerFeedback[]> => {
  const existing = getOwnerFeedbacks();
  const updated = existing.map((fb) =>
    fb.id === id ? { ...fb, status, replyNotes: replyNotes !== undefined ? replyNotes : fb.replyNotes } : fb
  );
  saveOwnerFeedbacksLocally(updated);

  fetch(`/api/feedback/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, replyNotes }),
  }).catch(() => {});

  return updated;
};

/**
 * Delete a specific feedback
 */
export const deleteOwnerFeedback = async (id: string): Promise<OwnerFeedback[]> => {
  const existing = getOwnerFeedbacks();
  const updated = existing.filter((fb) => fb.id !== id);
  saveOwnerFeedbacksLocally(updated);

  fetch(`/api/feedback/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }).catch(() => {});

  return updated;
};

/**
 * Clear all feedbacks (Owner action)
 */
export const clearAllOwnerFeedbacks = async (): Promise<OwnerFeedback[]> => {
  saveOwnerFeedbacksLocally([]);

  fetch('/api/feedback/clear', {
    method: 'POST',
  }).catch(() => {});

  return [];
};

/**
 * Fetch latest feedbacks from server to sync with Owner view
 */
export const syncFeedbacksFromServer = async (): Promise<OwnerFeedback[]> => {
  try {
    const res = await fetch('/api/feedback');
    const data = await res.json();
    if (data.success && Array.isArray(data.feedbacks)) {
      saveOwnerFeedbacksLocally(data.feedbacks);
      return data.feedbacks;
    }
  } catch (err) {
    console.warn('[Feedback] Server sync fetch error:', err);
  }
  return getOwnerFeedbacks();
};
