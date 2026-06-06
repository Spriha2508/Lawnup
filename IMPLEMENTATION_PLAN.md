# LawnUp AI — Complete Implementation Blueprint

---

## 0. Name Alignment

The original spec uses "Bageecha AI" internally. Using **LawnUp AI** as the product name throughout this plan with `lawnup` as the internal package/bundle identifier (`com.lawnup.app`).

---

## 1. COMPLETE SYSTEM ARCHITECTURE

### 1.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     MOBILE CLIENT                           │
│   React Native + Expo + TypeScript + NativeWind + Zustand   │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS / Firebase SDK
┌──────────────────────▼──────────────────────────────────────┐
│                  FIREBASE LAYER                             │
│  Auth │ Firestore │ Storage │ Functions │ FCM │ Analytics   │
└──────┬───────────┬──────────┬───────────┬────┬─────────────┘
       │           │          │           │    │
  ┌────▼────┐ ┌───▼───┐ ┌────▼────┐ ┌───▼──┐ │
  │Plant.id │ │OpenAI │ │Cashfree │ │OWM   │ │
  │  API    │ │  API  │ │Webhook  │ │API   │ │
  └─────────┘ └───────┘ └─────────┘ └──────┘ │
                                              │
                                     ┌────────▼────────┐
                                     │ Firebase FCM    │
                                     │ (Push Engine)   │
                                     └─────────────────┘
```

### 1.2 Frontend Architecture

- **Expo SDK 51+** with New Architecture (Fabric + JSI) enabled
- Feature-based folder structure (not layer-based)
- Every feature is self-contained: screen + hook + store slice + types
- `NativeWind v4` for Tailwind-style styling — compiled at build time, zero runtime overhead
- `Zustand` for global state, `react-query` (TanStack Query) for server state / caching
- `Axios` instance with interceptors for auth token injection and retry logic

### 1.3 Backend Architecture

- All backend logic lives in **Firebase Cloud Functions (Node 20, TypeScript)**
- No custom server — zero devops overhead, scales to zero, pay-per-call
- All third-party API keys are environment variables in Firebase Functions config — never on client
- Firestore as primary database with composite indexes defined in `firestore.indexes.json`
- Firebase Storage for images with lifecycle policies (auto-delete after 90 days)

### 1.4 AI Orchestration Architecture

```
User Message
    ↓
[Firebase Function: generateAIResponse]
    ↓
1. Validate auth + check quota
    ↓
2. Run OpenAI Moderation API on user message (safety gate)
    ↓
3. Fetch user's plant data + nickname from Firestore
    ↓
4. Fetch relevant Indian knowledge docs (tag-matched)
    ↓
5. Fetch OpenWeather data (user's city)
    ↓
6. Assemble system prompt (nickname + plant context + weather + KB snippets)
    ↓
7. Call OpenAI GPT-4.1-mini with assembled messages
    ↓
8. Stream/return response
    ↓
9. Save chat turn to /chat_history
    ↓
10. Decrement AI usage quota
```

### 1.5 Scaling Strategy (Low-Cost MVP)

- Firebase Spark → Blaze plan only when Functions needed (pay-per-use, ~$0.40/million invocations)
- Plant.id: free tier = 100 requests/month; premium at $9/month for 500 — sufficient for MVP
- OpenAI: GPT-4.1-mini at ~$0.15/1M input tokens; aggressive prompt compression keeps cost <$0.01/chat
- OpenWeather: free tier = 1,000 calls/day — cache response per city per 3 hours in Firestore

---

## 2. COMPLETE REACT NATIVE FOLDER STRUCTURE

```
lawnup/
├── app.json                          # Expo config
├── eas.json                          # EAS Build config
├── tsconfig.json
├── package.json
├── .env.example                      # Template — never commit .env
├── babel.config.js
├── metro.config.js
│
├── assets/
│   ├── fonts/                        # Custom fonts (e.g. Nunito)
│   ├── images/
│   └── animations/                   # Lottie JSON files
│
├── src/
│   ├── app/                          # Root-level wiring
│   │   ├── App.tsx                   # Root component
│   │   ├── providers/
│   │   │   ├── QueryProvider.tsx     # TanStack Query client
│   │   │   ├── ThemeProvider.tsx
│   │   │   └── NotificationProvider.tsx
│   │   └── index.ts
│   │
│   ├── navigation/
│   │   ├── RootNavigator.tsx         # Auth gate
│   │   ├── AuthNavigator.tsx         # Login/Signup/ForgotPassword
│   │   ├── OnboardingNavigator.tsx
│   │   ├── MainTabNavigator.tsx      # Bottom tabs
│   │   ├── ScanNavigator.tsx         # Scan stack
│   │   └── types.ts                  # NavigationProp types
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── screens/
│   │   │   │   ├── LoginScreen.tsx
│   │   │   │   ├── SignupScreen.tsx
│   │   │   │   └── ForgotPasswordScreen.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   ├── store/
│   │   │   │   └── authStore.ts      # Zustand slice
│   │   │   ├── services/
│   │   │   │   └── authService.ts    # Firebase Auth calls
│   │   │   └── types.ts
│   │   │
│   │   ├── onboarding/
│   │   │   ├── screens/
│   │   │   │   ├── WelcomeScreen.tsx
│   │   │   │   ├── LocationScreen.tsx    # City selection for weather
│   │   │   │   └── GoalScreen.tsx
│   │   │   └── store/
│   │   │       └── onboardingStore.ts
│   │   │
│   │   ├── home/
│   │   │   ├── screens/
│   │   │   │   └── HomeScreen.tsx
│   │   │   ├── components/
│   │   │   │   ├── WeatherBanner.tsx
│   │   │   │   ├── PlantHealthSummary.tsx
│   │   │   │   ├── TodayReminders.tsx    # Shows "Luna needs water today"
│   │   │   │   └── QuickScanButton.tsx
│   │   │   └── hooks/
│   │   │       └── useHomeData.ts
│   │   │
│   │   ├── scan/
│   │   │   ├── screens/
│   │   │   │   ├── ScanLandingScreen.tsx
│   │   │   │   ├── CameraScreen.tsx
│   │   │   │   ├── ProcessingScreen.tsx
│   │   │   │   ├── ScanResultScreen.tsx
│   │   │   │   └── NicknameScreen.tsx    # "What would you like to call it?"
│   │   │   ├── components/
│   │   │   │   ├── ScanFrame.tsx
│   │   │   │   ├── HealthBadge.tsx
│   │   │   │   └── DiseaseCard.tsx
│   │   │   ├── hooks/
│   │   │   │   └── usePlantScan.ts
│   │   │   ├── services/
│   │   │   │   └── scanService.ts        # Calls processPlantScan Function
│   │   │   ├── store/
│   │   │   │   └── scanStore.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── my-plants/
│   │   │   ├── screens/
│   │   │   │   ├── MyPlantsScreen.tsx
│   │   │   │   ├── PlantDetailScreen.tsx
│   │   │   │   ├── AddPlantScreen.tsx
│   │   │   │   └── EditPlantScreen.tsx
│   │   │   ├── components/
│   │   │   │   ├── PlantCard.tsx         # Always shows nickname prominently
│   │   │   │   ├── PlantHealthRing.tsx
│   │   │   │   └── WateringSchedule.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useMyPlants.ts
│   │   │   ├── services/
│   │   │   │   └── plantsService.ts
│   │   │   ├── store/
│   │   │   │   └── plantsStore.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── ai-doctor/
│   │   │   ├── screens/
│   │   │   │   ├── ChatScreen.tsx
│   │   │   │   └── ChatHistoryScreen.tsx
│   │   │   ├── components/
│   │   │   │   ├── ChatBubble.tsx
│   │   │   │   ├── TypingIndicator.tsx
│   │   │   │   ├── PlantContextChip.tsx  # Shows "Talking about: Luna"
│   │   │   │   └── SuggestedQuestions.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAIChat.ts
│   │   │   ├── services/
│   │   │   │   └── chatService.ts
│   │   │   ├── store/
│   │   │   │   └── chatStore.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── reminders/
│   │   │   ├── screens/
│   │   │   │   ├── RemindersScreen.tsx
│   │   │   │   └── AddReminderScreen.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useReminders.ts
│   │   │   ├── services/
│   │   │   │   └── reminderService.ts
│   │   │   └── types.ts
│   │   │
│   │   └── subscription/
│   │       ├── screens/
│   │       │   ├── PaywallScreen.tsx
│   │       │   └── SubscriptionSuccessScreen.tsx
│   │       ├── components/
│   │       │   └── PlanComparisonCard.tsx
│   │       ├── hooks/
│   │       │   └── useSubscription.ts
│   │       ├── services/
│   │       │   └── subscriptionService.ts
│   │       └── types.ts
│   │
│   ├── shared/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Avatar.tsx
│   │   │   │   ├── BottomSheet.tsx
│   │   │   │   ├── Skeleton.tsx          # Loading skeleton
│   │   │   │   └── EmptyState.tsx
│   │   │   ├── layout/
│   │   │   │   ├── SafeScreen.tsx
│   │   │   │   └── KeyboardAwareView.tsx
│   │   │   └── feedback/
│   │   │       ├── Toast.tsx
│   │   │       ├── ErrorBoundary.tsx
│   │   │       └── LoadingOverlay.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useDebounce.ts
│   │   │   ├── useImagePicker.ts
│   │   │   ├── usePermissions.ts
│   │   │   ├── useNetworkStatus.ts
│   │   │   └── usePushNotifications.ts
│   │   │
│   │   └── utils/
│   │       ├── imageCompressor.ts        # expo-image-manipulator
│   │       ├── dateUtils.ts
│   │       ├── plantUtils.ts
│   │       └── errorHandler.ts
│   │
│   ├── services/
│   │   ├── firebase/
│   │   │   ├── firebaseConfig.ts         # initializeApp
│   │   │   ├── firestore.ts              # db instance + helpers
│   │   │   ├── storage.ts
│   │   │   ├── functions.ts              # httpsCallable wrappers
│   │   │   └── messaging.ts              # FCM token management
│   │   ├── analytics/
│   │   │   └── posthog.ts                # PostHog client + event helpers
│   │   └── api/
│   │       └── axiosInstance.ts          # Base Axios with interceptors
│   │
│   ├── stores/
│   │   └── rootStore.ts                  # Combines all Zustand slices
│   │
│   ├── constants/
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   ├── typography.ts
│   │   ├── plants.ts                     # Static plant category data
│   │   └── config.ts                     # App-level feature flags
│   │
│   └── types/
│       ├── firestore.types.ts            # Mirrors Firestore schemas
│       ├── api.types.ts
│       ├── navigation.types.ts
│       └── global.d.ts
│
└── functions/                            # Firebase Cloud Functions
    ├── src/
    │   ├── index.ts                      # Exports all functions
    │   ├── plant/
    │   │   ├── processPlantScan.ts
    │   │   └── plantHelpers.ts
    │   ├── ai/
    │   │   ├── generateAIResponse.ts
    │   │   ├── promptBuilder.ts          # Injects nickname into all prompts
    │   │   ├── knowledgeRetriever.ts
    │   │   ├── moderationLayer.ts        # OpenAI Moderation API
    │   │   └── memoryManager.ts          # Plant personality memory
    │   ├── reminders/
    │   │   ├── sendReminder.ts
    │   │   └── reminderScheduler.ts      # Pub/Sub cron
    │   ├── subscription/
    │   │   ├── createCashfreeOrder.ts    # Creates order via Cashfree API
    │   │   ├── verifyPayment.ts          # HMAC verification (Cashfree)
    │   │   └── cashfreeWebhook.ts        # Handles recurring/renewal events
    │   ├── usage/
    │   │   └── checkUsageLimit.ts
    │   ├── weather/
    │   │   └── fetchWeather.ts
    │   ├── middleware/
    │   │   ├── authMiddleware.ts
    │   │   └── rateLimiter.ts
    │   └── types/
    │       └── index.ts
    ├── package.json
    └── tsconfig.json
```

---

## 3. COMPLETE FIREBASE ARCHITECTURE

### 3.1 Firestore Collections

```
/users/{uid}
  └── (see schema section 5)

/users/{uid}/plants/{plantId}               ← subcollection
/users/{uid}/reminders/{reminderId}         ← subcollection
/users/{uid}/chat_history/{chatId}          ← subcollection
/users/{uid}/plant_memory/{plantId}         ← personality memory subcollection

/plant_scans/{scanId}
/subscriptions/{uid}
/usage/{uid}                                ← monthly quota tracking

/knowledge/
  └── plants/{plantId}
  └── diseases/{diseaseId}
  └── seasonal_guides/{guideId}
  └── climate_zones/{zoneId}

/cache/
  └── weather/{city}                        ← 3-hour weather cache
```

### 3.2 Indexing Strategy (`firestore.indexes.json`)

```json
{
  "indexes": [
    {
      "collectionGroup": "plant_scans",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reminders",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "nextScheduled", "order": "ASCENDING" },
        { "fieldPath": "isActive", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "plants",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "healthStatus", "order": "ASCENDING" }
      ]
    }
  ]
}
```

### 3.3 Firebase Storage Organization

```
gs://lawnup-prod.appspot.com/
├── scans/{uid}/{scanId}/{timestamp}.webp      ← compressed WebP
├── plants/{uid}/{plantId}/thumbnail.webp
└── knowledge/                                 ← static KB images (CDN-cached via ImageKit)
```

**Lifecycle Rule:** Auto-delete `scans/` objects older than 90 days (cost control).

### 3.4 Firebase Functions Structure

- Runtime: Node 20, TypeScript, 256MB RAM, 60s timeout
- Region: `asia-south1` (Mumbai) for lowest latency to Indian users
- All callable functions use `functions.region('asia-south1').https.onCall`
- Pub/Sub scheduled functions via Cloud Scheduler for reminders

### 3.5 Rate Limiting Strategy

- Per-user rate limits stored in `/usage/{uid}` with Firestore transactions
- Redis not needed at MVP scale — Firestore transactions are sufficient
- Function-level: Firebase App Check enforced on all callable functions

### 3.6 Caching Strategy

| Data | Cache Location | TTL |
|---|---|---|
| Weather data | Firestore `/cache/weather/{city}` | 3 hours |
| Plant knowledge docs | Client-side TanStack Query cache | 24 hours |
| User plants list | TanStack Query staleTime: 5 min | 5 minutes |
| Subscription status | Zustand + AsyncStorage | 1 hour |
| Plant images | ImageKit CDN | 7 days |

### 3.7 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    match /users/{uid}/plants/{plantId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    match /users/{uid}/reminders/{reminderId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    match /users/{uid}/chat_history/{chatId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    match /users/{uid}/plant_memory/{plantId} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if false; // Only Cloud Functions write here
    }

    match /plant_scans/{scanId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
    }

    match /subscriptions/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if false; // Only Cloud Functions write here
    }

    match /usage/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if false;
    }

    match /knowledge/{document=**} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

---

## 4. COMPLETE AI ARCHITECTURE

### 4.1 Prompt Engineering Strategy

**System Prompt Template (assembled per request):**

```
You are LawnUp AI, an expert Indian gardening assistant.
You speak in a warm, encouraging tone like a knowledgeable neighbor.
You have deep knowledge of Indian climate zones, seasonal gardening,
and plants common in Indian homes and gardens.

CURRENT CONTEXT:
- User's city: {city}
- Current weather: {temp}°C, {condition}, humidity {humidity}%
- Season: {season} (based on Indian calendar)
- User's plants: {plant_list_json}
- Active plant focus: {nickname} ({species})
- Plant health: {health_status}
- Last watered: {last_watered}

PLANT MEMORY SUMMARY:
{plant_memory_summary}

KNOWLEDGE BASE CONTEXT:
{retrieved_kb_snippets}

RULES:
- ALWAYS refer to the plant by its nickname ({nickname}), never just "your plant"
  e.g. "Looks like Luna may need watering today" not "Your snake plant needs water"
- Always give India-specific advice (soil, climate, seasons)
- If you don't know something specific, say so — don't hallucinate
- Keep responses under 200 words unless a detailed answer is requested
- Use simple, conversational language (avoid jargon)
- NEVER guarantee disease cures or provide human medical advice
- NEVER recommend specific chemical dosages — always say "follow label instructions"
- If disease is severe, always recommend consulting a local nursery
```

### 4.2 Knowledge Retrieval Strategy

- Each KB document has tags: `["money_plant", "summer", "north_india", "watering"]`
- Tag-match algorithm: extract intent keywords from user message → match against KB document tags
- Return top 3 matching KB snippets (max 300 chars each) — injected into system prompt
- No vector DB at MVP (cost prohibitive) — tag matching is sufficient for structured knowledge
- Future: migrate to Pinecone/Vertex AI Matching Engine when >10,000 KB docs

### 4.3 Chat Memory Strategy

- Store last 10 conversation turns per plant session in Firestore
- Load last 5 turns into OpenAI messages array (beyond that, token cost > value)
- Session scoped per plant: separate chat history per user plant prevents context bleed
- Long-term plant personality memory stored in `/users/{uid}/plant_memory/{plantId}` (see Section 21)

```typescript
const messages = [
  { role: "system", content: assembledSystemPrompt },
  ...last5Turns.map(turn => ({
    role: turn.role,
    content: turn.content
  })),
  { role: "user", content: currentUserMessage }
];
```

### 4.4 Token Optimization

| Optimization | Saving |
|---|---|
| GPT-4.1-mini instead of GPT-4o | ~15x cheaper |
| Limit history to 5 turns | ~40% token reduction |
| KB snippets max 300 chars each | ~60% vs full docs |
| Max response 200 tokens enforced | Hard cap cost |
| Compress plant list to JSON summary | vs verbose description |
| Plant memory summary max 150 tokens | Fixed overhead |

**Estimated cost per chat message:** ~$0.002–0.005 (sub-1 cent)

### 4.5 Hallucination Prevention

1. System prompt explicitly says "if you don't know, say so"
2. KB snippets are injected as ground-truth, not suggestions
3. Plant data (watering frequency, health) comes from Firestore — injected as facts, not inferred
4. Weather data is real-time — AI never guesses current weather
5. For disease treatment: always add disclaimer "verify with local nursery"
6. Safety constraints in system prompt prevent dangerous chemical/dosage advice

### 4.6 Weather Context Integration

```typescript
// Cache: check Firestore /cache/weather/{city} — if < 3hr old, return cached
// Else: call OpenWeather API, save to cache, return
const weather = await getOrFetchWeather(userCity);

// Injected into prompt as:
// "Current weather: 34°C, Sunny, humidity 65%. It is currently peak summer."
```

---

## 5. COMPLETE DATABASE DESIGN

### 5.1 `/users/{uid}`

```typescript
interface UserDoc {
  uid: string;
  name: string;
  email: string;
  city: string;
  climateZone: string;             // 'north' | 'south' | 'coastal' | 'hilly'
  subscription: 'free' | 'premium';
  fcmToken: string;
  onboardingComplete: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 5.2 `/users/{uid}/plants/{plantId}`

```typescript
interface UserPlantDoc {
  plantId: string;
  userId: string;
  nickname: string;                // "Luna" — required, set during NicknameScreen
  speciesName: string;             // "Snake Plant"
  scientificName?: string;
  imageUrl: string;
  healthStatus: 'Healthy' | 'Needs Attention' | 'Critical';
  wateringFrequencyDays: number;
  lastWateredAt: Timestamp;
  nextWaterAt: Timestamp;          // Computed: lastWateredAt + frequency
  fertilizeFrequencyDays?: number;
  lastFertilizedAt?: Timestamp;
  notes?: string;
  location?: string;               // "Balcony", "Living room"
  addedFromScanId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:** `userId ASC + healthStatus ASC`, `userId ASC + nextWaterAt ASC`

### 5.3 `/plant_scans/{scanId}`

```typescript
interface PlantScanDoc {
  scanId: string;
  userId: string;
  imageUrl: string;
  status: 'processing' | 'completed' | 'failed';
  plantIdResult: {
    commonName: string;
    scientificName: string;
    confidence: number;
    isHealthy: boolean;
    diseases: Array<{
      name: string;
      probability: number;
      description: string;
      treatment: {
        chemical?: string;
        biological?: string;
        prevention: string;
      };
    }>;
  } | null;
  createdAt: Timestamp;
}
```

**Indexes:** `userId ASC + createdAt DESC`

### 5.4 `/users/{uid}/chat_history/{chatId}`

```typescript
interface ChatDoc {
  chatId: string;
  plantId?: string;
  plantNickname?: string;          // Stored for display in chat history list
  role: 'user' | 'assistant';
  content: string;
  contextSnapshot?: {
    weather: string;
    plantHealth: string;
  };
  tokensUsed?: number;
  createdAt: Timestamp;
}
```

### 5.5 `/users/{uid}/reminders/{reminderId}`

```typescript
interface ReminderDoc {
  reminderId: string;
  userId: string;
  plantId: string;
  plantNickname: string;           // "Luna" — drives all notification copy
  type: 'water' | 'fertilize' | 'repot' | 'custom';
  message: string;                 // "Luna is thirsty today 🌿"
  frequencyDays: number;
  nextScheduled: Timestamp;
  lastSentAt?: Timestamp;
  isActive: boolean;
  timezone: string;                // 'Asia/Kolkata'
  createdAt: Timestamp;
}
```

**Indexes:** `userId ASC + nextScheduled ASC + isActive ASC`

### 5.6 `/subscriptions/{uid}`

```typescript
interface SubscriptionDoc {
  uid: string;
  plan: 'free' | 'premium';
  status: 'active' | 'expired' | 'cancelled' | 'grace_period';
  cashfreeOrderId?: string;        // From createCashfreeOrder response
  cashfreePaymentId?: string;      // From payment success callback
  cashfreeSubscriptionId?: string; // For recurring plans
  planType: 'monthly' | 'annual';
  startDate: Timestamp;
  endDate: Timestamp;
  autoRenew: boolean;
  gracePeriodEndsAt?: Timestamp;   // 3-day grace on payment failure
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 5.7 `/usage/{uid}`

```typescript
interface UsageDoc {
  uid: string;
  month: string;                   // "2026-06" — reset monthly
  scansUsed: number;
  scanLimit: number;               // 2 free, 20 premium
  aiChatsUsed: number;
  aiChatLimit: number;             // 10 free, unlimited (-1)
  lastResetAt: Timestamp;
}
```

### 5.8 `/knowledge/plants/{plantId}`

```typescript
interface PlantKnowledgeDoc {
  plantId: string;
  commonName: string;
  hindiName?: string;
  scientificName: string;
  tags: string[];
  regions: string[];
  watering: {
    summer: string;
    winter: string;
    monsoon: string;
  };
  sunlight: string;
  soil: string;
  commonDiseases: string[];
  tips: string[];
  seasonalCare: {
    summer: string;
    winter: string;
    monsoon: string;
  };
  updatedAt: Timestamp;
}
```

### 5.9 `/users/{uid}/plant_memory/{plantId}`

```typescript
interface PlantMemoryDoc {
  plantId: string;
  nickname: string;
  memorySummary: string;           // Compressed narrative, max 300 chars
  recurringIssues: string[];       // ["yellowing leaves", "overwatering tendency"]
  userCarePattern: string;         // "waters irregularly, engaged every 3-4 days"
  recoveryHistory: string[];       // ["recovered from root rot in June 2026"]
  lastUpdated: Timestamp;
  totalInteractions: number;
}
```

---

## 6. COMPLETE API DESIGN (Firebase Functions)

### 6.1 `processPlantScan` — `onCall`

**Request:**
```typescript
{ imageBase64: string; }
```

**Flow:**
1. Verify auth + App Check
2. Check scan quota via `/usage/{uid}` (Firestore transaction)
3. Decode base64 → upload to Firebase Storage → get download URL
4. Call Plant.id API with download URL
5. Save scan result to `/plant_scans/{scanId}`
6. Decrement scan quota
7. Return scan result

**Response:**
```typescript
{
  scanId: string;
  plantName: string;
  confidence: number;
  isHealthy: boolean;
  diseases: DiseaseResult[];
  suggestedActions: string[];
}
```

**Error handling:** `QUOTA_EXCEEDED`, `PLANT_NOT_IDENTIFIED`, `UPLOAD_FAILED`

### 6.2 `generateAIResponse` — `onCall`

**Request:**
```typescript
{
  message: string;
  plantId?: string;
  sessionId?: string;
}
```

**Flow:**
1. Verify auth + check chat quota
2. Run OpenAI Moderation API — block if flagged (see Section 20)
3. Retrieve plant data + nickname + memory summary
4. Assemble prompt with full context
5. Call GPT-4.1-mini
6. Return response + update memory summary async

**Response:**
```typescript
{
  reply: string;
  chatId: string;
  tokensUsed: number;
  chatsRemaining: number;
}
```

### 6.3 `createCashfreeOrder` — `onCall`

**Request:**
```typescript
{
  planType: 'monthly' | 'annual';
}
```

**Flow:**
1. Verify auth
2. Call Cashfree Orders API with `order_amount`, `order_currency: 'INR'`, `customer_details`
3. Store pending order reference in `/subscriptions/{uid}` with `status: 'pending'`
4. Return session data to client

**Response:**
```typescript
{
  orderId: string;
  paymentSessionId: string;      // Used by Cashfree SDK on client
  amount: number;
  currency: 'INR';
}
```

### 6.4 `verifyPayment` — `onCall`

**Request:**
```typescript
{
  orderId: string;
  orderToken?: string;           // Optional — webhook is primary verification path
  planType: 'monthly' | 'annual';
}
```

**Flow:**
1. Verify auth
2. Call Cashfree `GET /orders/{orderId}` to fetch payment status server-side
3. Confirm `order_status === 'PAID'`
4. Idempotency check: if `cashfreeOrderId` already exists in `/subscriptions/{uid}`, return early
5. Update `/subscriptions/{uid}` to premium
6. Update `/usage/{uid}` limits
7. Send FCM "Payment confirmed" push

**Response:** `{ success: boolean; plan: string; expiresAt: string; }`

### 6.5 `cashfreeWebhook` — `onRequest` (HTTPS POST)

- Validates `x-webhook-signature` using HMAC-SHA256 with Cashfree webhook secret
- Handles events: `PAYMENT_SUCCESS`, `PAYMENT_FAILED`, `SUBSCRIPTION_ACTIVATED`, `SUBSCRIPTION_CANCELLED`
- All writes to `/subscriptions/{uid}` use idempotency check on `cashfreeOrderId`
- No auth required — signature validation IS the auth

```typescript
// Signature verification
const computedSignature = crypto
  .createHmac('sha256', CASHFREE_WEBHOOK_SECRET)
  .update(rawBody)
  .digest('base64');

if (computedSignature !== req.headers['x-webhook-signature']) {
  return res.status(401).send('Invalid signature');
}
```

### 6.6 `sendReminder` — Pub/Sub scheduled (`every 60 minutes`)

- Queries all active reminders where `nextScheduled <= now AND nextScheduled > now - 1hr`
- Uses `plantNickname` from reminder doc to build personalized push copy
- Sends FCM push per reminder
- Updates `lastSentAt` and computes next `nextScheduled`
- Batches FCM sends (max 500 per batch)

### 6.7 `checkUsageLimit` — `onCall`

**Request:** `{ action: 'scan' | 'chat'; }`
**Response:** `{ allowed: boolean; used: number; limit: number; resetsAt: string; }`

---

## 7. COMPLETE SUBSCRIPTION ARCHITECTURE

### 7.1 Cashfree Payment Flow

```
Client: Load Paywall Screen
  ↓
Client: Call Firebase Function createCashfreeOrder(planType)
  ↓
Function: Create Order via Cashfree Orders API
  ↓
Function: Return { orderId, paymentSessionId, amount }
  ↓
Client: Initialize Cashfree SDK with paymentSessionId
  ↓
Client: Open Cashfree Checkout (cashfree-pg-react-native)
  ↓
User: Completes payment (UPI / Card / NetBanking / Wallet)
  ↓
Client: Receive payment callback { order_id, order_status }
  ↓
Client: Call verifyPayment({ orderId, planType })
  ↓
Function: Fetch order status from Cashfree API (server-side verification)
  ↓
Function: Confirm order_status === 'PAID'
  ↓
Function: Idempotency check on cashfreeOrderId
  ↓
Function: Update /subscriptions/{uid} → premium
  ↓
Function: Update /usage/{uid} limits
  ↓
Function: Send FCM "Payment confirmed" push
  ↓
Client: Navigate to SubscriptionSuccessScreen
```

### 7.2 Webhook Handling (Recurring Subscriptions)

Cashfree sends webhooks for subscription lifecycle events:

| Event | Action |
|---|---|
| `PAYMENT_SUCCESS` | Set `status = 'active'`, extend `endDate` |
| `SUBSCRIPTION_ACTIVATED` | Set `autoRenew = true`, store `cashfreeSubscriptionId` |
| `SUBSCRIPTION_CANCELLED` | Set `status = 'cancelled'`, `autoRenew = false` |
| `PAYMENT_FAILED` | Set `status = 'grace_period'`, compute `gracePeriodEndsAt = now + 3d` |
| Grace period expired | Scheduled function checks `gracePeriodEndsAt <= now` → set `status = 'expired'`, downgrade to free |

### 7.3 Idempotency Handling

```typescript
// In verifyPayment and cashfreeWebhook:
const subRef = db.collection('subscriptions').doc(uid);
return db.runTransaction(async (t) => {
  const sub = await t.get(subRef);
  if (sub.exists && sub.data()?.cashfreeOrderId === orderId) {
    return { success: true, alreadyProcessed: true }; // Idempotent — safe to return
  }
  t.set(subRef, { ...premiumData, cashfreeOrderId: orderId }, { merge: true });
});
```

### 7.4 Quota Enforcement

```typescript
async function checkAndDecrementQuota(uid: string, action: 'scan' | 'chat') {
  const usageRef = db.collection('usage').doc(uid);
  return db.runTransaction(async (t) => {
    const usage = await t.get(usageRef);
    const data = usage.data() as UsageDoc;

    const currentMonth = getCurrentMonth();
    if (data.month !== currentMonth) {
      t.update(usageRef, { month: currentMonth, scansUsed: 0, aiChatsUsed: 0 });
      return { allowed: true };
    }

    if (action === 'scan' && data.scansUsed >= data.scanLimit) {
      throw new functions.https.HttpsError('resource-exhausted', 'QUOTA_EXCEEDED');
    }
    if (action === 'chat' && data.aiChatLimit !== -1 && data.aiChatsUsed >= data.aiChatLimit) {
      throw new functions.https.HttpsError('resource-exhausted', 'QUOTA_EXCEEDED');
    }

    const field = action === 'scan' ? 'scansUsed' : 'aiChatsUsed';
    t.update(usageRef, { [field]: FieldValue.increment(1) });
    return { allowed: true };
  });
}
```

---

## 8. COMPLETE NOTIFICATION SYSTEM

### 8.1 Architecture

```
Cloud Scheduler → Pub/Sub Topic "reminder-tick" (every 60 min)
                    ↓
               Firebase Function: processReminders
                    ↓
               Query Firestore: reminders where nextScheduled <= now
                    ↓
               Build nickname-personalized FCM message per user
                    ↓
               FCM Admin SDK sendEachForMulticast (batch 500)
                    ↓
               Update nextScheduled = nextScheduled + frequencyDays
```

### 8.2 FCM Message Structure — Nickname-Personalized

Every notification uses the plant's nickname. Message templates vary by reminder type:

```typescript
const messageTemplates = {
  water: [
    `${nickname} is thirsty today 🌿`,
    `Time to water ${nickname}! The soil looks dry.`,
    `${nickname} is waiting for a drink 💧`,
  ],
  fertilize: [
    `${nickname} could use some nutrients today 🌱`,
    `Feed ${nickname} today for healthy growth!`,
  ],
  repot: [
    `${nickname} may be ready for a bigger home 🪴`,
  ],
};

const message = {
  token: user.fcmToken,
  notification: {
    title: `${nickname} needs you`,
    body: pickRandom(messageTemplates[reminder.type]),
  },
  data: {
    type: reminder.type + '_reminder',
    plantId: reminder.plantId,
    plantNickname: nickname,
    screen: 'PlantDetail',
  },
  android: {
    priority: 'high',
    notification: { channelId: 'plant-reminders', sound: 'default' },
  },
};
```

### 8.3 Timezone Handling

- Store `timezone: 'Asia/Kolkata'` on every reminder
- Scheduler runs every 60 minutes UTC
- All MVP users are IST — field is present for future multi-region expansion

### 8.4 Retry Logic

- If FCM send fails (invalid token): mark `fcmToken` as stale on user doc
- Store `failedReminders[]` — retry on next hourly tick (max 3 retries)
- After 3 failures: set reminder `isActive = false`, log to Analytics

### 8.5 Client-Side FCM Setup

```typescript
// On app launch, after auth:
const token = await messaging().getToken();
await updateDoc(userRef, { fcmToken: token });

// Handle foreground messages — show in-app toast with nickname
messaging().onMessage(async (remoteMessage) => {
  showToast(remoteMessage.notification?.body);
});

// Handle background tap → deep link to plant detail
messaging().onNotificationOpenedApp((remoteMessage) => {
  const { screen, plantId } = remoteMessage.data;
  navigation.navigate(screen, { plantId });
});
```

---

## 9. COMPLETE STATE MANAGEMENT DESIGN

### 9.1 Zustand Store Structure

```typescript
// authStore.ts
interface AuthState {
  user: UserDoc | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: UserDoc | null) => void;
  signOut: () => Promise<void>;
}

// plantsStore.ts
interface PlantsState {
  plants: UserPlantDoc[];
  selectedPlantId: string | null;
  isLoading: boolean;
  setPlants: (plants: UserPlantDoc[]) => void;
  addPlant: (plant: UserPlantDoc) => void;
  updatePlant: (id: string, updates: Partial<UserPlantDoc>) => void;
  removePlant: (id: string) => void;
  selectPlant: (id: string | null) => void;
  // Convenience selector — used across home, chat, reminders
  getSelectedNickname: () => string | null;
}

// chatStore.ts
interface ChatState {
  messages: ChatDoc[];
  isTyping: boolean;
  currentPlantId: string | null;
  currentPlantNickname: string | null;   // Surfaced in ChatScreen header
  appendMessage: (msg: ChatDoc) => void;
  setTyping: (v: boolean) => void;
  setActivePlant: (plantId: string, nickname: string) => void;
  clearChat: () => void;
}

// scanStore.ts
interface ScanState {
  currentScan: PlantScanDoc | null;
  pendingNickname: string | null;        // Set during NicknameScreen
  scanHistory: PlantScanDoc[];
  isScanning: boolean;
  setScan: (scan: PlantScanDoc | null) => void;
  setScanning: (v: boolean) => void;
  setPendingNickname: (name: string) => void;
}

// subscriptionStore.ts
interface SubscriptionState {
  plan: 'free' | 'premium';
  scansRemaining: number;
  chatsRemaining: number;
  setPlan: (plan: 'free' | 'premium') => void;
  setUsage: (scans: number, chats: number) => void;
}
```

### 9.2 Server State (TanStack Query)

```typescript
// Plant list — stale after 5 minutes
useQuery(['plants', uid], () => plantsService.getAll(uid), {
  staleTime: 5 * 60 * 1000,
});

// Plant knowledge — stale after 24 hours
useQuery(['knowledge', speciesName], () => knowledgeService.get(speciesName), {
  staleTime: 24 * 60 * 60 * 1000,
  cacheTime: 48 * 60 * 60 * 1000,
});

// Scan history — stale after 2 minutes
useQuery(['scans', uid], () => scanService.getHistory(uid), {
  staleTime: 2 * 60 * 1000,
});
```

### 9.3 Persistence

- `zustand/middleware/persist` + `AsyncStorage` for: auth state, subscription plan, user city
- TanStack Query memory cache for server data (no disk persistence — always revalidate)

---

## 10. COMPLETE MOBILE APP NAVIGATION FLOW

```
RootNavigator
├── [unauthenticated] → AuthNavigator
│   ├── LoginScreen
│   ├── SignupScreen
│   └── ForgotPasswordScreen
│
├── [authenticated + !onboardingComplete] → OnboardingNavigator
│   ├── WelcomeScreen
│   ├── LocationScreen              ← City selection (weather)
│   └── GoalScreen                  ← "What do you grow?" (personalization)
│
└── [authenticated + onboardingComplete] → MainTabNavigator
    ├── Tab: Home
    │   └── HomeScreen              ← "Luna needs water today" banner
    │
    ├── Tab: Scan
    │   └── ScanNavigator
    │       ├── ScanLandingScreen
    │       ├── CameraScreen
    │       ├── ProcessingScreen
    │       ├── ScanResultScreen    ← Shows plant identification result
    │       └── NicknameScreen      ← "What would you like to call it?"
    │                                  Examples shown: Luna, Coco, Lakshmi, Basil Bhai
    │
    ├── Tab: My Plants
    │   └── MyPlantsScreen          ← Grid of plants by nickname
    │       ├── PlantDetailScreen   ← "Luna — Snake Plant" header
    │       ├── AddPlantScreen      ← Includes nickname input
    │       └── EditPlantScreen     ← Edit nickname anytime
    │
    ├── Tab: AI Doctor
    │   └── ChatScreen              ← "Talking about: Luna" chip at top
    │       └── ChatHistoryScreen   ← Grouped by plant nickname
    │
    └── Tab: Profile
        ├── RemindersScreen         ← "Luna — Water every 3 days"
        ├── AddReminderScreen
        └── PaywallScreen
            └── SubscriptionSuccessScreen
```

**Deep link scheme:** `lawnup://plant/{plantId}`, `lawnup://chat/{plantId}`

---

## 11. COMPLETE UI/UX SYSTEM

### 11.1 Design System

```typescript
// constants/colors.ts
export const colors = {
  primary: '#2D6A4F',        // Deep garden green
  primaryLight: '#52B788',
  accent: '#F4A261',         // Warm orange
  background: '#F8FAF5',     // Off-white, organic feel
  surface: '#FFFFFF',
  textPrimary: '#1B1B1B',
  textSecondary: '#6B7280',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#E5E7EB',
};

// constants/spacing.ts
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

// constants/typography.ts
export const typography = {
  h1: { fontSize: 28, fontWeight: '700', fontFamily: 'Nunito-Bold' },
  h2: { fontSize: 22, fontWeight: '700', fontFamily: 'Nunito-Bold' },
  body: { fontSize: 16, fontFamily: 'Nunito-Regular' },
  caption: { fontSize: 12, fontFamily: 'Nunito-Regular' },
};
```

### 11.2 Dark Mode

- NativeWind `dark:` classes throughout
- Zustand `themeStore` with `colorScheme: 'light' | 'dark' | 'system'`
- `useColorScheme()` from React Native for system detection

### 11.3 Animation Strategy

- `react-native-reanimated` v3 for gesture/layout animations
- `lottie-react-native` for: scan processing, empty states, success celebrations
- `react-native-skeleton-placeholder` for loading skeletons on all list screens
- Spring animations for plant card transitions

### 11.4 Nickname-Driven Emotional UX Strategy

The nickname system is not a cosmetic feature — it is the core retention mechanism. Every touch point in the app uses the plant's nickname to create a sense of ownership and emotional connection.

**Why nicknames drive retention:**

| Mechanism | Effect |
|---|---|
| Ownership language ("your Luna") | Creates psychological attachment vs generic "your plant" |
| Personalized notifications | "Luna is thirsty" has 2–3x higher CTR than "Water reminder" |
| AI using nickname | Creates illusion of the AI "knowing" the plant — deeper engagement |
| Named streak mechanic | "You've cared for Luna 7 days" feels like caring for a pet, not a task |
| Habit formation | Named entities trigger stronger routine behaviors (ref: Tamagotchi effect) |

**NicknameScreen UX design:**

- Shown immediately after scan result, before saving to My Plants
- Full-screen modal with large text input, playful placeholder: "Luna? Coco? Basil Bhai?"
- Pre-suggested names based on species: Tulsi → "Tulsi Devi", Rose → "Gulabo", Money Plant → "Lakshmi"
- Skip option available but nudged away with copy: "Give it a name — you'll love it more!"
- On submit: Lottie celebration animation plays ("Nice to meet {nickname}! 🌿")

**Nickname consistency across all surfaces:**

- Home dashboard: "Luna needs water today" — never "Snake Plant needs water"
- AI Doctor: System prompt enforces nickname usage (see Section 4.1)
- Reminders list: Primary label is nickname, species name is secondary
- Push notifications: All copy templates use `${nickname}` (see Section 8.2)
- Chat history: Grouped and labelled by nickname
- Analytics events: `plant_nickname` property on every plant-related event

**Streak mechanic:**

```typescript
// Displayed on PlantDetailScreen
const streak = getDaysSinceFirstCare(plant.createdAt);
// "You've cared for Luna for {streak} days 🌿"
```

### 11.5 Empty States

- No plants: illustrated empty garden with "Add your first plant" CTA
- No scan history: "Take your first scan and learn what's in your garden"
- No chat history: 3 suggested starter questions using plant nickname if one is selected

### 11.6 Skeleton Loaders

Every data-fetching screen shows a skeleton during load — never a spinner. Skeletons match exact layout of loaded content to prevent layout shift.

---

## 12. COMPLETE AI KNOWLEDGE BASE DESIGN

### 12.1 Data Structure

- **Plant docs** (`/knowledge/plants/`): one doc per species, India-specific care
- **Disease docs** (`/knowledge/diseases/`): one doc per disease, organic + chemical treatment
- **Seasonal guides** (`/knowledge/seasonal_guides/`): 4 seasonal docs per region
- **Climate zones** (`/knowledge/climate_zones/`): North/South/Coastal/Hilly India

### 12.2 Tagging System

Every KB doc has `tags[]` — hierarchical with underscores:
```
"money_plant", "indoor", "low_maintenance", "air_purifier",
"summer_care", "north_india", "watering_heavy", "yellow_leaves"
```

**Retrieval algorithm:**
```typescript
function extractTags(userMessage: string, plantData: UserPlantDoc): string[] {
  const tags: string[] = [];

  tags.push(plantData.speciesName.toLowerCase().replace(' ', '_'));

  const month = new Date().getMonth();
  if (month >= 2 && month <= 5) tags.push('summer_care');
  else if (month >= 6 && month <= 9) tags.push('monsoon_care');
  else tags.push('winter_care');

  if (/water|thirst|dry/i.test(userMessage)) tags.push('watering');
  if (/yellow|brown|spot|disease/i.test(userMessage)) tags.push('disease');
  if (/fertiliz|feed|nutrient/i.test(userMessage)) tags.push('fertilizing');

  return tags;
}
// Firestore: tags array-contains-any extractedTags, limit 3
```

### 12.3 MVP Knowledge Base Seed Data (20 plants)

Money Plant, Tulsi, Aloe Vera, Rose, Hibiscus, Jasmine, Curry Leaf, Coriander, Mint, Neem, Rubber Plant, Peace Lily, Snake Plant, Bamboo, Mango (balcony), Tomato, Chilli, Marigold, Bougainvillea, Fern.

### 12.4 Multilingual Future Support

- Add `hindiName` and `hindiTips[]` fields to plant docs now (populate later)
- Same doc structure, multiple language fields — no separate collections needed
- When user locale is `hi`, inject Hindi tips into prompt

---

## 13. COMPLETE DEVOPS & DEPLOYMENT PLAN

### 13.1 Environments

| Env | Firebase Project | App Bundle |
|---|---|---|
| Development | `lawnup-dev` | `com.lawnup.app.dev` |
| Staging | `lawnup-staging` | `com.lawnup.app.staging` |
| Production | `lawnup-prod` | `com.lawnup.app` |

### 13.2 EAS Configuration (`eas.json`)

```json
{
  "build": {
    "development": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "env": { "FIREBASE_PROJECT_ID": "lawnup-dev" }
    },
    "staging": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "env": { "FIREBASE_PROJECT_ID": "lawnup-staging" }
    },
    "production": {
      "distribution": "store",
      "android": { "buildType": "aab" },
      "env": { "FIREBASE_PROJECT_ID": "lawnup-prod" }
    }
  }
}
```

### 13.3 CI/CD Pipeline (GitHub Actions)

```yaml
# Push to main → production EAS build + Firebase deploy
# Push to develop → staging EAS build + Firebase deploy

jobs:
  deploy-functions:
    - npm ci && npm run build
    - firebase deploy --only functions,firestore:rules --project $ENV

  build-android:
    - eas build --platform android --profile $PROFILE --non-interactive
```

### 13.4 Secrets Management

- Firebase Functions config: `firebase functions:config:set openai.key="..." plantid.key="..." cashfree.key="..." cashfree.secret="..."`
- GitHub Actions: secrets in repo secrets, injected at build time
- Never in `app.json`, `.env` committed to repo, or client-side code

### 13.5 Monitoring

- Firebase Crashlytics: crash-free session rate target >99%
- Firebase Performance: monitor Function cold starts (target <2s)
- Firebase Analytics + PostHog: custom events for every core action
- Alert policy: Function error rate >5% in 10 min → email alert

### 13.6 Rollback Strategy

- Firebase Functions: per-function deploy → `firebase deploy --only functions:processPlantScan`
- Firestore rules: version-controlled, `git revert` + redeploy in <5 min
- EAS: submit previous build from EAS dashboard, no new build needed
- Feature flags: `constants/config.ts` `ENABLE_AI_CHAT: boolean` — kill features without deploy

---

## 14. COMPLETE SECURITY ARCHITECTURE

### 14.1 Client-Side

- **Firebase App Check** (Play Integrity on Android) — blocks non-app callers
- **No API keys in client bundle** — all third-party calls proxied through Firebase Functions
- **Image upload:** client compresses to WebP <500KB, uploads via short-lived tokens
- **Prompt injection prevention:** user input sanitized — strip HTML, limit 500 chars, injected as `role: "user"` content only; further filtered by Moderation API (see Section 20)

### 14.2 Function-Level Auth

```typescript
// Every callable function:
if (!context.auth) throw new HttpsError('unauthenticated', 'Auth required');
if (!context.app) throw new HttpsError('unauthenticated', 'App Check required');
const uid = context.auth.uid;
// All Firestore reads use uid from token — never from client payload
```

### 14.3 Abuse Prevention

- **Scan/chat abuse**: Firestore transaction quota check — atomic, race-condition proof
- **Storage abuse**: Rules enforce `request.auth != null` and `resource.size < 5MB`
- **Payment abuse**: Cashfree server-side verification + idempotency check on `cashfreeOrderId`
- **AI abuse**: OpenAI Moderation API blocks flagged messages before they reach GPT-4.1-mini

### 14.4 Image Upload Security Rules

```javascript
match /scans/{uid}/{scanId}/{file} {
  allow write: if request.auth != null
    && request.auth.uid == uid
    && request.resource.size < 5 * 1024 * 1024
    && request.resource.contentType.matches('image/.*');
  allow read: if request.auth != null && request.auth.uid == uid;
}
```

---

## 15. COMPLETE COST OPTIMIZATION STRATEGY

### 15.1 Firebase Cost Estimates (Monthly, 1,000 MAU)

| Service | Usage Estimate | Cost |
|---|---|---|
| Firestore reads | ~500K/month | ~$0.30 |
| Firestore writes | ~50K/month | ~$0.09 |
| Functions invocations | ~100K/month | ~$0.04 |
| Functions compute | 100K × 256MB × 2s | ~$0.13 |
| Storage | ~5GB | ~$0.13 |
| FCM | Free | $0 |
| **Total Firebase** | | **~$0.70/month** |

### 15.2 OpenAI Cost Estimates

- GPT-4.1-mini: $0.15/1M input, $0.60/1M output
- Average chat: ~800 input tokens + 200 output = $0.00024/message
- 1,000 MAU × 10 chats/month = 10,000 messages = **~$2.40/month**
- Moderation API: $0.002/1K tokens — negligible at MVP scale (~$0.10/month)

### 15.3 Plant.id Cost

- Free tier: 100 requests/month (dev/early launch)
- $9/month plan: 500 requests (covers ~250 free users at 2 scans each)

### 15.4 Image Optimization

- Client compresses to WebP, max 800×800px, quality 75% before upload
- Typical compressed size: 50–150KB (vs 3–8MB raw)
- `expo-image-manipulator` for compression — on-device, zero network cost
- ImageKit free tier: 20GB bandwidth/month — sufficient for MVP (see Section 19)

### 15.5 Caching as Cost Reduction

- Weather API: cached 3 hours → ~95% reduction in OWM calls
- Plant knowledge: cached 24 hours client-side → ~80% reduction in Firestore reads
- TanStack Query: prevents duplicate requests within session

### 15.6 PostHog Cost

- PostHog Cloud: free up to 1M events/month — covers MVP entirely
- No cost until significant scale

---

## 16. COMPLETE MVP TIMELINE (6 Weeks, 1 Developer)

| Week | Focus | Deliverables |
|---|---|---|
| **W1** | Foundation | Expo setup, Firebase project, Auth (email + Google), navigation skeleton, NativeWind theme, Zustand stores, CI/CD pipeline, PostHog integration |
| **W2** | Plant Scan + Nickname | Camera/gallery flow, image compression, `processPlantScan` Function, Plant.id integration, ScanResultScreen, NicknameScreen, scan history |
| **W3** | My Plants | My Plants dashboard, Plant detail, nickname system, add/edit/delete, plant health tracking, nickname editing |
| **W4** | AI Doctor | Chat UI with nickname context chip, `generateAIResponse` Function, moderation layer, knowledge base seed (20 plants), prompt engineering with nickname rules, weather integration |
| **W5** | Reminders + Notifications | Reminder CRUD, nickname-personalized FCM messages, Cloud Scheduler + Pub/Sub, deep link from notification |
| **W6** | Subscription + QA + Deploy | Cashfree integration, `createCashfreeOrder` + `verifyPayment` Functions, webhook handler, quota enforcement, PaywallScreen, E2E testing, EAS production build, Play Store submission |

---

## 17. COMPLETE SCALING ROADMAP

### MVP → V2 Architecture Evolution

| Feature | MVP | V2 |
|---|---|---|
| Knowledge retrieval | Tag matching | Pinecone/Vertex vector search |
| AI model | GPT-4.1-mini | Fine-tuned model on Indian plant data |
| Chat memory | Last 5 turns + memory summary | Full session summary + embeddings |
| Plant memory | Compressed narrative in Firestore | Vector embeddings per plant |
| Backend | Firebase Functions | Add Cloud Run for long-running tasks |
| Database | Firestore | Firestore + BigQuery for analytics |
| Payments | Cashfree one-time | Cashfree recurring subscriptions |
| Images | Firebase Storage + ImageKit | Dedicated CDN with auto-resize pipeline |
| Analytics | PostHog Cloud | PostHog self-hosted + custom dashboards |

### V3+ Possibilities

- **Marketplace**: Sell plants, seeds, tools within app (moat via user trust + nickname attachment)
- **Community**: Shared garden posts with plant nicknames ("Luna's first bloom!")
- **IoT**: Soil moisture sensor integration (ESP32 + Firebase Realtime DB)
- **Regional language**: Hindi/Tamil/Bengali UI via i18n; nickname suggestions in regional languages
- **Expert network**: Connect users to local nurseries via in-app chat

---

## 18. PRODUCT ANALYTICS ARCHITECTURE

### 18.1 Why PostHog

PostHog is the recommended analytics platform for LawnUp AI at MVP and beyond.

| Capability | Value for LawnUp |
|---|---|
| Session replay | Watch real users navigate scan → nickname → add plant flow |
| Funnels | Visualize drop-off between Install → Signup → First Scan → Premium |
| Retention cohorts | Track D1/D7/D30 retention by onboarding cohort |
| Feature flags | Roll out AI memory or new nickname suggestions to 10% of users |
| Mobile analytics | React Native SDK with Expo support |
| Startup pricing | Free up to 1M events/month — zero cost at MVP scale |
| Self-hostable | Can migrate to self-hosted when data sovereignty matters |

### 18.2 Implementation

```typescript
// src/services/analytics/posthog.ts
import PostHog from 'posthog-react-native';

export const posthog = new PostHog('YOUR_POSTHOG_KEY', {
  host: 'https://app.posthog.com',
  disabled: __DEV__,              // No events in development
});

// Identify user after auth
export const identifyUser = (uid: string, properties: object) => {
  posthog.identify(uid, properties);
};

// Typed event helper
export const track = (event: AnalyticsEvent, properties?: object) => {
  posthog.capture(event, properties);
};

type AnalyticsEvent =
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
  | 'quota_hit';
```

### 18.3 Key Events Schema

| Event | Properties |
|---|---|
| `plant_scanned` | `species`, `confidence`, `is_healthy`, `disease_detected` |
| `plant_added` | `species`, `has_nickname`, `from_scan` |
| `plant_nicknamed` | `nickname_length`, `species`, `used_suggestion` |
| `nickname_skipped` | `species` — tracks resistance to the feature |
| `ai_chat_started` | `plant_id`, `plant_nickname`, `has_active_plant` |
| `ai_chat_completed` | `plant_id`, `turns`, `tokens_used`, `plan` |
| `reminder_clicked` | `reminder_type`, `plant_nickname`, `hours_since_sent` |
| `subscription_converted` | `plan_type`, `scan_count_at_conversion`, `chat_count_at_conversion` |
| `quota_hit` | `action`, `plan` — conversion trigger event |

### 18.4 Core Funnels

**Activation Funnel:**
```
Install → Signup → First Scan → NicknameScreen → Plant Added → Reminder Created
```
Track completion % at each step. Drop-off at NicknameScreen → test skip rate vs. long-term retention correlation.

**Revenue Funnel:**
```
quota_hit → subscription_screen_viewed → subscription_started → subscription_converted
```
Measure conversion rate from quota hit. If <10% → revisit paywall copy or pricing.

**Engagement Loop:**
```
Reminder notification opened → App opened → Chat or Water action taken → Reminder re-engaged
```

### 18.5 Retention Cohorts

- D1, D7, D30 retention tracked by signup week
- Segment: "users who named their plant vs. skipped" — hypothesis: named users retain 2x
- Segment: "users with 2+ plants" — hypothesis: multi-plant users churn 50% less

### 18.6 Feature Flags (PostHog)

```typescript
// Gradual rollout of AI memory feature
if (await posthog.isFeatureEnabled('ai_plant_memory')) {
  // Include memory summary in prompt
}

// A/B test nickname screen copy
const nicknameVariant = await posthog.getFeatureFlag('nickname_screen_copy');
// 'control': "What would you like to call it?"
// 'test': "Give it a name — plants with names thrive more!"
```

---

## 19. IMAGE CDN & MEDIA OPTIMIZATION

### 19.1 Architecture

```
User Camera/Gallery
    ↓
expo-image-manipulator (on-device)
    → Resize to max 800×800px
    → Convert to WebP
    → Quality: 75%
    ↓
Firebase Storage Upload (~50–150KB)
    ↓
ImageKit Origin (Firebase Storage as origin)
    ↓
ImageKit CDN (global edge delivery)
    ↓
Client: expo-image with CDN URL + query params
```

### 19.2 ImageKit Setup

ImageKit supports Firebase Storage as a direct origin — zero migration required. Configure in ImageKit dashboard: `Origin URL = gs://lawnup-prod.appspot.com`.

All plant images are then accessed via:
```
https://ik.imagekit.io/lawnup/plants/{uid}/{plantId}/thumbnail.webp
  ?tr=w-200,h-200,fo-auto,q-80
```

**Transformation parameters:**
- `w-200,h-200` — thumbnail size for plant cards
- `fo-auto` — smart face/object cropping
- `q-80` — 80% quality (good balance for plant images)
- `f-webp` — force WebP output for all clients that support it

### 19.3 Recommended Image Sizes

| Context | Dimensions | Transformation |
|---|---|---|
| Plant card thumbnail | 200×200 | `tr=w-200,h-200,q-80` |
| Plant detail hero | 600×400 | `tr=w-600,h-400,q-85` |
| Scan result | 400×400 | `tr=w-400,h-400,q-85` |
| Chat context chip | 40×40 | `tr=w-40,h-40,r-max` |

### 19.4 Lazy Loading

```typescript
// Use expo-image (not React Native Image) for built-in lazy loading + caching
import { Image } from 'expo-image';

<Image
  source={{ uri: imagekitUrl }}
  placeholder={blurhash}            // Show blurry placeholder instantly
  contentFit="cover"
  transition={300}                  // Fade in on load
  cachePolicy="memory-disk"         // Aggressive caching
/>
```

### 19.5 CDN Caching Strategy

| Resource | CDN TTL | Reason |
|---|---|---|
| Plant thumbnails | 7 days | Rarely change after upload |
| Knowledge base images | 30 days | Static content |
| Scan images | 1 day | May need to update |

ImageKit automatically adds `Cache-Control` headers based on configured rules.

### 19.6 Cost Optimization

- ImageKit free tier: 20GB bandwidth/month, 20GB storage
- Sufficient for ~10,000 plant images at ~100KB each = ~1GB storage
- Bandwidth: 1,000 MAU × 50 image loads/session × 50KB avg = ~2.5GB/month — well within free tier
- Paid plan needed only at significant scale (>50,000 MAU)

### 19.7 Storage Lifecycle Policy

```json
{
  "lifecycle": {
    "rule": [
      {
        "action": { "type": "Delete" },
        "condition": {
          "age": 90,
          "matchesPrefix": ["scans/"]
        }
      }
    ]
  }
}
```

Scan images (used only for analysis) are deleted after 90 days. Plant profile images are kept indefinitely — they are the user's asset.

### 19.8 Future Scalability

- Community feature: user-submitted photos → ImageKit moderation pipeline
- Marketplace: product photos → dedicated ImageKit folder with seller-scoped access
- Heavy traffic: ImageKit enterprise plan + multi-CDN (Cloudflare in front of ImageKit)

---

## 20. AI SAFETY & MODERATION LAYER

### 20.1 Architecture

```
User Message
    ↓
[Firebase Function: generateAIResponse]
    ↓
moderationLayer.ts
    ↓
OpenAI Moderation API
    ↓
┌───────────────┬───────────────────┐
│ FLAGGED       │ SAFE              │
│               │                   │
│ Return safe   │ Proceed to        │
│ decline msg   │ AI response       │
│ Log event     │ generation        │
│ Increment     │                   │
│ abuse counter │                   │
└───────────────┴───────────────────┘
```

### 20.2 OpenAI Moderation API Integration

```typescript
// functions/src/ai/moderationLayer.ts
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function moderateMessage(
  uid: string,
  message: string
): Promise<{ safe: boolean; reason?: string }> {

  const result = await openai.moderations.create({ input: message });
  const [output] = result.results;

  if (output.flagged) {
    // Increment abuse counter in Firestore
    await db.collection('usage').doc(uid).update({
      moderationFlags: FieldValue.increment(1),
    });

    // Log for audit (no PII in log)
    console.warn(`Moderation flag for uid=${uid}`, output.categories);

    return {
      safe: false,
      reason: getModerationReason(output.categories),
    };
  }

  return { safe: true };
}

function getModerationReason(categories: Record<string, boolean>): string {
  if (categories['violence']) return 'VIOLENCE';
  if (categories['hate']) return 'HATE';
  if (categories['self-harm']) return 'SELF_HARM';
  return 'POLICY_VIOLATION';
}
```

### 20.3 Blocked Content Categories

| Category | Block Rule | Safe Response |
|---|---|---|
| Harmful pesticide misuse | Any message asking for "maximum dose" or mixing instructions | "For pesticide dosage, always follow the label. I can't recommend exceeding safe limits." |
| Dangerous chemical combinations | Queries about mixing fertilizers/pesticides unsafely | "Mixing chemicals can be dangerous. Please consult a local nursery or agricultural expert." |
| Human medical advice | "Can I eat this?", "Is this safe for my child?" | "I'm a plant care assistant, not a medical advisor. Please consult a doctor for health concerns." |
| Illegal substances | Grow instructions for controlled plants | Decline with no explanation |
| Spam/abuse | Repeated identical messages, prompt injection attempts | "Let's talk about your plants! Ask me anything about {nickname}." |

### 20.4 Prompt Injection Prevention

Beyond the Moderation API, the function layer applies these defenses:

```typescript
function sanitizeInput(message: string): string {
  return message
    .replace(/<[^>]*>/g, '')              // Strip HTML tags
    .replace(/\[INST\]|\[\/INST\]/g, '') // Strip LLM instruction markers
    .replace(/system:/gi, '')             // Prevent role injection
    .substring(0, 500)                    // Hard length limit
    .trim();
}
```

User input is **always** injected as `role: "user"` content, never appended to the system prompt string. This structurally prevents prompt injection from escaping the user turn.

### 20.5 System-Level Safety Constraints

These rules are baked into the system prompt (see Section 4.1) and cannot be overridden by user messages:

- **Never guarantee disease cures** — "This treatment often helps" not "This will cure it"
- **Never provide specific chemical dosages** — Always "follow label instructions"
- **Never provide human medical advice** — Hard boundary with redirect
- **Never recommend illegal activity** — Cultivating controlled plants etc.
- **Always add nursery disclaimer** for severe disease cases

### 20.6 Abuse Pattern Detection

```typescript
// If moderationFlags > 5 in current month → auto-restrict account
// Stored in /usage/{uid}.moderationFlags
// Cloud Function checks this on every generateAIResponse call
if (usage.moderationFlags >= 5) {
  throw new HttpsError('permission-denied', 'ACCOUNT_RESTRICTED');
}
```

### 20.7 Audit Logging

For compliance and product safety, log every moderation flag to a separate `moderation_logs` collection (no message content stored, only metadata):

```typescript
interface ModerationLog {
  uid: string;           // Hashed for pseudonymization in production
  flaggedAt: Timestamp;
  reason: string;        // Category, not message content
  plantId?: string;
}
```

Retain logs for 90 days. Review weekly during MVP to catch edge cases in the system prompt.

---

## 21. PLANT PERSONALITY MEMORY SYSTEM

### 21.1 Vision

LawnUp AI's long-term moat is not the scan feature or even the chat feature — it is **accumulated plant intelligence**. After 3 months of use, the app should feel like it genuinely knows each plant and the user's care habits better than any generic gardening app ever could.

A user who has talked about Luna for 90 days should get responses like:
> "Luna's been recovering well since that fungal issue in June — she's looking much healthier now. Given you tend to water a bit irregularly, keep an eye on the soil this week."

That level of recall is impossible without structured memory.

### 21.2 Memory Architecture

Memory operates at two levels:

**Level 1: Short-term (chat session)**
- Last 5 turns loaded into OpenAI messages array
- Cleared on new chat session
- Already implemented in Section 4.3

**Level 2: Long-term (plant personality)**
- Stored in `/users/{uid}/plant_memory/{plantId}`
- Updated asynchronously after each chat session
- Summarized into a compact narrative — injected into every system prompt

### 21.3 Memory Document Structure

```typescript
// Already defined in Section 5.9
interface PlantMemoryDoc {
  plantId: string;
  nickname: string;
  memorySummary: string;           // 150-300 chars — compressed narrative
  recurringIssues: string[];       // ["yellowing leaves", "overwatering tendency"]
  userCarePattern: string;         // "waters irregularly, checks in every 3-4 days"
  recoveryHistory: string[];       // ["recovered from root rot in June 2026"]
  lastUpdated: Timestamp;
  totalInteractions: number;
}
```

### 21.4 Memory Update Pipeline

Memory is updated **after** the chat response is returned — never blocking the response path:

```typescript
// In generateAIResponse, after returning the response:
updatePlantMemoryAsync(uid, plantId, chatTurn).catch(console.error);

// functions/src/ai/memoryManager.ts
async function updatePlantMemoryAsync(
  uid: string,
  plantId: string,
  newTurn: { userMessage: string; aiResponse: string }
) {
  const memoryRef = db
    .collection('users').doc(uid)
    .collection('plant_memory').doc(plantId);

  const existing = await memoryRef.get();
  const memory = existing.data() as PlantMemoryDoc | undefined;

  // Only re-summarize every 5 interactions to control OpenAI cost
  const totalInteractions = (memory?.totalInteractions ?? 0) + 1;
  if (totalInteractions % 5 !== 0) {
    await memoryRef.set({ totalInteractions }, { merge: true });
    return;
  }

  // Build summarization prompt (cheap — uses last 5 turns only)
  const summaryPrompt = buildMemorySummaryPrompt(memory, newTurn);
  const summary = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [{ role: 'user', content: summaryPrompt }],
    max_tokens: 200,
  });

  await memoryRef.set({
    memorySummary: summary.choices[0].message.content,
    totalInteractions,
    lastUpdated: FieldValue.serverTimestamp(),
  }, { merge: true });
}
```

### 21.5 Memory Cost Optimization

| Strategy | Effect |
|---|---|
| Summarize every 5 interactions | ~80% reduction in summarization calls |
| Max 200 tokens per summary | Hard cost cap |
| GPT-4.1-mini for summarization | 15x cheaper than GPT-4o |
| Async update (non-blocking) | Zero latency impact on chat |
| Single doc per plant | O(1) read — no query cost |

**Estimated memory cost at 1,000 MAU:**
- 10 chats/user/month = 10,000 total chats
- Summarize every 5 = 2,000 summarization calls
- ~200 tokens each = $0.006/call → **~$12/month at 1,000 MAU**
- Acceptable. Scale with premium-only memory if needed.

### 21.6 Memory Injection into Prompt

```typescript
// In promptBuilder.ts
const memory = await getPlantMemory(uid, plantId);

const memorySection = memory
  ? `PLANT MEMORY SUMMARY:\n${memory.memorySummary}\nRecurring issues: ${memory.recurringIssues.join(', ')}`
  : `PLANT MEMORY SUMMARY:\nNo history yet — this is an early conversation with ${nickname}.`;
```

Memory is injected between the weather context and KB snippets. It adds ~100-150 tokens to the prompt — a worthwhile cost for dramatically more relevant responses.

### 21.7 Why This Becomes the Moat

Every competitor can replicate a scan feature. No competitor can replicate 6 months of accumulated plant history for Luna specifically, in the user's city, accounting for their care patterns. This data is non-transferable and non-replicable without the user re-investing months of interaction. That is a structural retention and switching-cost moat.

### 21.8 Future: Vector Memory

At V2 scale (10,000+ MAU), migrate memory to vector embeddings:

- Each chat turn → embed with `text-embedding-3-small` → store in Pinecone
- Retrieval: semantic search over all past turns for a given plant
- Enables: "Last time you asked about yellow leaves on Luna, here's what we found..."
- Cost at V2: ~$0.02/1,000 embeddings — still very low

---

## BUILD ORDER SUMMARY

```
Phase 1: Foundation (W1)
  → expo init + firebase setup + auth + navigation + PostHog

Phase 2: Core Value (W2–W3)
  → scan + nickname system + my plants (this IS the product)

Phase 3: Intelligence (W4)
  → AI chat + moderation + knowledge base + plant memory foundation

Phase 4: Retention (W5)
  → nickname-personalized reminders + push notifications

Phase 5: Revenue (W6)
  → Cashfree subscriptions + quota gates (this is the business)

Phase 6: Ship (W6 end)
  → QA + EAS build + Play Store
```

---

*Say `build phase 1` to begin scaffolding the complete Expo project with Firebase, auth, navigation, NativeWind theme system, Zustand stores, and PostHog analytics.*
