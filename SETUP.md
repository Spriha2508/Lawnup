# LawnUp AI — Setup Guide

## Prerequisites

- Node.js 20+
- Expo CLI: `npm install -g expo-cli eas-cli`
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project (Blaze plan required for Cloud Functions)

---

## 1. Clone & install

```bash
git clone <repo>
cd Lawnup
npm install
cd functions && npm install && cd ..
```

---

## 2. Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a project.
2. Enable **Authentication** → Email/Password sign-in.
3. Enable **Firestore** → Start in production mode, region `asia-south1`.
4. Enable **Storage** → region `asia-south1`.
5. Download `google-services.json` → place in project root (Android).
6. Download `GoogleService-Info.plist` → place in project root (iOS).

---

## 3. Environment variables

```bash
cp .env.example .env
```

Fill in all `EXPO_PUBLIC_*` values from your Firebase project settings.

---

## 4. Firebase Functions — runtime secrets

```bash
firebase login
firebase use --add   # pick your project

firebase functions:config:set \
  openai.key="sk-..." \
  plantid.key="your_plant_id_api_key" \
  cashfree.app_id="your_cashfree_app_id" \
  cashfree.secret_key="your_cashfree_secret_key" \
  cashfree.webhook_secret="your_cashfree_webhook_secret" \
  openweather.key="your_openweather_api_key" \
  firebase.project_id="your_firebase_project_id"
```

---

## 5. Deploy Firestore rules & indexes

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

---

## 6. Deploy Cloud Functions

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

Expected deployed functions:
- `processPlantScan` — Plant.id scan + Storage upload
- `generateAIResponse` — GPT-4.1-mini chat with safety gate
- `fetchWeather` — OpenWeather cached per city
- `createCashfreeOrder` — Initiate payment
- `verifyPayment` — Server-side payment verification
- `cashfreeWebhook` — HMAC-verified payment events
- `sendReminder` — Scheduled FCM push (runs every 60 min)
- `checkUsageLimit` — Returns quota status

---

## 7. Run the app

```bash
# Expo Go (development)
npx expo start

# EAS Build (staging/production)
eas build --profile preview --platform ios
eas build --profile preview --platform android
```

---

## 8. Font assets

Place these Nunito font files in `assets/fonts/`:
- `Nunito-Regular.ttf`
- `Nunito-SemiBold.ttf`
- `Nunito-Bold.ttf`
- `Nunito-ExtraBold.ttf`

Download from [Google Fonts — Nunito](https://fonts.google.com/specimen/Nunito).

---

## 9. Cashfree webhook

In your Cashfree dashboard, set the webhook URL to:
```
https://asia-south1-YOUR_PROJECT_ID.cloudfunctions.net/cashfreeWebhook
```

Copy the webhook secret and set it via `cashfree.webhook_secret` in step 4.

---

## API keys needed

| Service | Where to get |
|---------|-------------|
| Plant.id v3 | [plant.id](https://plant.id) |
| OpenAI | [platform.openai.com](https://platform.openai.com) |
| OpenWeather | [openweathermap.org/api](https://openweathermap.org/api) |
| Cashfree | [merchant.cashfree.com](https://merchant.cashfree.com) |
| PostHog | [posthog.com](https://posthog.com) — free up to 1M events/month |
| ImageKit | [imagekit.io](https://imagekit.io) — free tier available |
