export const INDIAN_CLIMATE_ZONES = ['north', 'south', 'coastal', 'hilly'] as const;
export type ClimateZone = (typeof INDIAN_CLIMATE_ZONES)[number];

export const INDIAN_CITIES = [
  'Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow',
  'Chandigarh', 'Bhopal', 'Indore', 'Kochi', 'Nagpur',
  'Patna', 'Vadodara', 'Surat', 'Coimbatore', 'Visakhapatnam',
] as const;

export const PLANT_LOCATIONS = [
  'Balcony', 'Living Room', 'Bedroom', 'Kitchen', 'Garden',
  'Terrace', 'Office', 'Bathroom', 'Corridor',
] as const;

export const HEALTH_STATUSES = ['Healthy', 'Needs Attention', 'Critical'] as const;
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export const REMINDER_TYPES = ['water', 'fertilize', 'repot', 'custom'] as const;
export type ReminderType = (typeof REMINDER_TYPES)[number];

// Nickname suggestions shown on NicknameScreen by species
export const NICKNAME_SUGGESTIONS: Record<string, string[]> = {
  'Money Plant': ['Lakshmi', 'Lucky', 'Hari'],
  'Snake Plant': ['Luna', 'Naga', 'Arrow'],
  'Aloe Vera': ['Alia', 'Vera', 'Sunny'],
  'Tulsi': ['Tulsi Devi', 'Holy', 'Vrinda'],
  'Rose': ['Gulabo', 'Rosa', 'Gulab'],
  'Hibiscus': ['Gudhal', 'Hiba', 'Ruby'],
  'Curry Leaf': ['Kadi', 'Patta', 'Chef'],
  default: ['Luna', 'Coco', 'Basil Bhai', 'Buddy', 'Sunny'],
};

// Reminder message templates — nickname is injected at runtime
export const REMINDER_MESSAGES = {
  water: [
    '{nickname} is thirsty today',
    'Time to water {nickname}! The soil looks dry.',
    '{nickname} is waiting for a drink',
  ],
  fertilize: [
    '{nickname} could use some nutrients today',
    'Feed {nickname} today for healthy growth!',
  ],
  repot: [
    '{nickname} may be ready for a bigger home',
    "Give {nickname} more room to grow!",
  ],
  custom: [
    "{nickname} needs your attention today",
  ],
} as const;
