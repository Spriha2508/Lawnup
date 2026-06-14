import PostHog from 'posthog-react-native';
import { config } from '../../constants/config';

export const posthog = new PostHog(
  process.env.EXPO_PUBLIC_POSTHOG_KEY ?? 'PLACEHOLDER_KEY',
  {
    host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
    // Disable in dev to avoid polluting analytics data
    disabled: !config.ENABLE_POSTHOG || __DEV__,
  }
);

export type AnalyticsEvent =
  | 'plant_scanned'
  | 'plant_added'
  | 'plant_nicknamed'
  | 'nickname_skipped'
  | 'ai_chat_started'
  | 'ai_chat_completed'
  | 'reminder_created'
  | 'reminder_clicked'
  | 'subscription_screen_viewed'
  | 'subscription_started'
  | 'subscription_converted'
  | 'scan_failed'
  | 'quota_hit'
  | 'onboarding_completed'
  | 'app_opened'
  | 'scan_result_viewed'
  | 'plant_saved_from_scan'
  | 'plant_updated'
  | 'home_viewed'
  | 'home_quick_action'
  | 'home_section_cta'
  | 'home_learn_open'
  | 'home_premium_tap';

export const identifyUser = (uid: string, properties: Record<string, unknown>): void => {
  posthog.identify(uid, properties as any);
};

export const track = (event: AnalyticsEvent, properties?: Record<string, unknown>): void => {
  posthog.capture(event, properties as any);
};

export const resetAnalytics = (): void => {
  posthog.reset();
};
