import { PaymentRequest, OwnerFeedback, UserProfile } from '../types';
import { getOwnerFeedbacks } from './feedback';

export interface AppNotification {
  id: string;
  type: 'payment_approved' | 'payment_rejected' | 'payment_pending' | 'feedback_reply' | 'feedback_status' | 'system';
  title: string;
  titleAm: string;
  message: string;
  messageAm: string;
  timestamp: string;
  read: boolean;
  actionTab?: 'payments' | 'profile' | 'myListings' | 'notifications';
  relatedId?: string;
  metadata?: {
    planName?: string;
    amount?: number;
    transactionRef?: string;
    replyNotes?: string;
    reason?: string;
    rating?: number;
  };
}

const READ_STORAGE_KEY_PREFIX = 'bete_notifications_read_';

/**
 * Get read notification IDs for a given user
 */
export const getReadNotificationIds = (userEmailOrId: string): string[] => {
  if (typeof window === 'undefined' || !userEmailOrId) return [];
  try {
    const raw = localStorage.getItem(`${READ_STORAGE_KEY_PREFIX}${userEmailOrId.toLowerCase()}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = (userEmailOrId: string, notificationId: string): void => {
  if (typeof window === 'undefined' || !userEmailOrId) return;
  try {
    const current = getReadNotificationIds(userEmailOrId);
    if (!current.includes(notificationId)) {
      const updated = [...current, notificationId];
      localStorage.setItem(`${READ_STORAGE_KEY_PREFIX}${userEmailOrId.toLowerCase()}`, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('bete_notifications_updated'));
    }
  } catch {
    // fallback
  }
};

/**
 * Mark all notifications as read for a given user
 */
export const markAllNotificationsAsRead = (userEmailOrId: string, allIds: string[]): void => {
  if (typeof window === 'undefined' || !userEmailOrId) return;
  try {
    const current = getReadNotificationIds(userEmailOrId);
    const set = new Set([...current, ...allIds]);
    localStorage.setItem(`${READ_STORAGE_KEY_PREFIX}${userEmailOrId.toLowerCase()}`, JSON.stringify(Array.from(set)));
    window.dispatchEvent(new CustomEvent('bete_notifications_updated'));
  } catch {
    // fallback
  }
};

/**
 * Generate real user notifications combining:
 * 1. Payment acceptances & rejections (with owner notes)
 * 2. Owner replies to submitted feedbacks
 * 3. System plan activation alerts
 */
export const buildUserNotifications = (
  user: UserProfile | null,
  paymentRequests: PaymentRequest[]
): AppNotification[] => {
  if (!user) return [];

  const normUserEmail = (user.email || '').trim().toLowerCase();
  const normUserPhone = (user.phone || '').replace(/\D/g, '').slice(-9);
  const readIds = new Set(getReadNotificationIds(normUserEmail || user.id));

  const notifications: AppNotification[] = [];

  // 1. Payment Notifications (Approved, Rejected, Pending review)
  const userPayments = paymentRequests.filter(req => {
    const reqEmail = (req.userEmail || '').trim().toLowerCase();
    const reqPhone = (req.userPhone || '').replace(/\D/g, '').slice(-9);
    return req.userId === user.id || 
      (normUserEmail && reqEmail && reqEmail === normUserEmail) ||
      (normUserPhone && reqPhone && normUserPhone === reqPhone);
  });

  userPayments.forEach(req => {
    if (req.status === 'approved') {
      const id = `notif-pay-approved-${req.id}`;
      notifications.push({
        id,
        type: 'payment_approved',
        title: `Payment Accepted & Plan Activated: ${req.planName}`,
        titleAm: `ክፍያዎ ጸድቋል እና ፕላንዎ ነቅቷል፡ ${req.planName}`,
        message: `Your Telebirr payment of ${req.totalAmount.toLocaleString()} ETB (Ref: ${req.transactionRef}) has been accepted by the Owner! Your premium features and listing boosts are now active.`,
        messageAm: `የ ${req.totalAmount.toLocaleString()} ብር የቴሌብር ክፍያዎ (መለያ፡ ${req.transactionRef}) በባለቤቱ ተቀባይነት አግኝቷል! የፕላን ጥቅማጥቅሞችዎ አሁን ነቅተዋል።`,
        timestamp: req.reviewedAt || req.submittedAt,
        read: readIds.has(id),
        actionTab: 'payments',
        relatedId: req.id,
        metadata: {
          planName: req.planName,
          amount: req.totalAmount,
          transactionRef: req.transactionRef,
        }
      });
    } else if (req.status === 'rejected') {
      const id = `notif-pay-rejected-${req.id}`;
      const reason = req.rejectionReason || 'Could not verify receipt on Telebirr account';
      notifications.push({
        id,
        type: 'payment_rejected',
        title: `Payment Submission Update: ${req.planName}`,
        titleAm: `የክፍያ ማረጋገጫ ዝመና፡ ${req.planName}`,
        message: `Your payment request for ${req.planName} (${req.totalAmount.toLocaleString()} ETB) was reviewed by the Owner. Note: "${reason}". Please check your transaction details or contact support.`,
        messageAm: `ለ ${req.planName} ያቀረቡት የ ${req.totalAmount.toLocaleString()} ብር የክፍያ ጥያቄ በባለቤቱ ተገምግሟል። ማብራሪያ፡ "${reason}"።`,
        timestamp: req.reviewedAt || req.submittedAt,
        read: readIds.has(id),
        actionTab: 'payments',
        relatedId: req.id,
        metadata: {
          planName: req.planName,
          amount: req.totalAmount,
          transactionRef: req.transactionRef,
          reason,
        }
      });
    } else if (req.status === 'pending') {
      const id = `notif-pay-pending-${req.id}`;
      notifications.push({
        id,
        type: 'payment_pending',
        title: `Payment Queued for Review: ${req.planName}`,
        titleAm: `ክፍያዎ በባለቤቱ እየተጣራ ነው፡ ${req.planName}`,
        message: `Your payment request (${req.totalAmount.toLocaleString()} ETB, Ref: ${req.transactionRef}) was submitted successfully. The Owner is reviewing your submission.`,
        messageAm: `የ ${req.totalAmount.toLocaleString()} ብር የክፍያ ጥያቄዎ (መለያ፡ ${req.transactionRef}) ቀርቧል። በቅርቡ በባለቤቱ ተረጋግጦ ይጸድቃል።`,
        timestamp: req.submittedAt,
        read: readIds.has(id),
        actionTab: 'payments',
        relatedId: req.id,
        metadata: {
          planName: req.planName,
          amount: req.totalAmount,
          transactionRef: req.transactionRef,
        }
      });
    }
  });

  // 2. Feedback Notifications (Owner answers, status updates)
  const allFeedbacks = getOwnerFeedbacks();
  const userFeedbacks = allFeedbacks.filter(fb => {
    const fbEmail = (fb.email || '').trim().toLowerCase();
    const fbPhone = (fb.phone || '').replace(/\D/g, '').slice(-9);
    return (normUserEmail && fbEmail && fbEmail === normUserEmail) ||
           (normUserPhone && fbPhone && normUserPhone === fbPhone);
  });

  userFeedbacks.forEach(fb => {
    if (fb.status === 'replied' && fb.replyNotes) {
      const id = `notif-fb-reply-${fb.id}`;
      notifications.push({
        id,
        type: 'feedback_reply',
        title: `Owner Response to Your Feedback`,
        titleAm: `የባለቤቱ ምላሽ ለአስተያየትዎ`,
        message: `Owner Kaleb Bereket replied to your message (${fb.category.toUpperCase()}): "${fb.replyNotes}"`,
        messageAm: `የቤቴ ፈላጊ ባለቤት ለአስተያየትዎ ምላሽ ሰጥተዋል፡ "${fb.replyNotes}"`,
        timestamp: fb.createdAt,
        read: readIds.has(id),
        actionTab: 'notifications',
        relatedId: fb.id,
        metadata: {
          replyNotes: fb.replyNotes,
          rating: fb.rating,
        }
      });
    } else if (fb.status === 'read') {
      const id = `notif-fb-read-${fb.id}`;
      notifications.push({
        id,
        type: 'feedback_status',
        title: `Feedback Reviewed by Owner`,
        titleAm: `አስተያየትዎ በባለቤቱ ታይቷል`,
        message: `Your feedback regarding "${fb.propertyTitle || fb.category}" has been reviewed directly by the Owner.`,
        messageAm: `ስለ "${fb.propertyTitle || fb.category}" የላኩት አስተያየት በባለቤቱ በቀጥታ ተነቧል። እናመሰግናለን!`,
        timestamp: fb.createdAt,
        read: readIds.has(id),
        actionTab: 'notifications',
        relatedId: fb.id,
      });
    }
  });

  // 3. Welcome / System Notification
  const welcomeId = `notif-system-welcome-${user.id}`;
  notifications.push({
    id: welcomeId,
    type: 'system',
    title: `Welcome to Bete Finder, ${user.name}!`,
    titleAm: `እንኳን ወደ ቤቴ ፈላጊ በደህና መጡ፣ ${user.name}!`,
    message: `Your account is fully verified with ${user.email} and ${user.phone}. Track all payments, property listings, and owner responses here.`,
    messageAm: `መለያዎ በ ${user.email} እና ${user.phone} በተሳካ ሁኔታ ተመዝግቧል። ሁሉንም ክፍያዎች እና የባለቤት ምላሾችን እዚህ መከታተል ይችላሉ።`,
    timestamp: user.registeredAt || new Date().toISOString(),
    read: readIds.has(welcomeId),
    actionTab: 'profile',
  });

  // Sort newest first
  notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return notifications;
};
