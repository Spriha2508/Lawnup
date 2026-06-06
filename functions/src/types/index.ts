import { Timestamp, FieldValue } from 'firebase-admin/firestore';

export interface UserDoc {
  uid: string;
  name: string;
  email: string;
  city: string;
  climateZone: 'north' | 'south' | 'coastal' | 'hilly';
  subscription: 'free' | 'premium';
  fcmToken: string;
  onboardingComplete: boolean;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

export interface UsageDoc {
  uid: string;
  month: string;
  scansUsed: number;
  scanLimit: number;
  aiChatsUsed: number;
  aiChatLimit: number;
  moderationFlags?: number;
  lastResetAt: Timestamp | FieldValue;
}

export interface SubscriptionDoc {
  uid: string;
  plan: 'free' | 'premium';
  status: 'active' | 'expired' | 'cancelled' | 'grace_period' | 'pending' | 'payment_failed';
  cashfreeOrderId?: string;
  cashfreePaymentId?: string;
  cashfreeSubscriptionId?: string;
  planType?: 'monthly' | 'annual';
  startDate: Timestamp | FieldValue;
  endDate: Timestamp | FieldValue;
  autoRenew: boolean;
  gracePeriodEndsAt?: Timestamp | FieldValue;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

export interface PlantMemoryDoc {
  plantId: string;
  nickname: string;
  memorySummary: string;
  recurringIssues: string[];
  userCarePattern: string;
  recoveryHistory: string[];
  lastUpdated: Timestamp | FieldValue;
  totalInteractions: number;
}

export interface CashfreeOrderPayload {
  order_id: string;
  order_amount: number;
  order_currency: 'INR';
  customer_details: {
    customer_id: string;
    customer_email: string;
    customer_phone: string;
  };
  order_meta?: { return_url?: string; notify_url?: string };
}
