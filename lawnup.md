# Bageecha AI — Complete MVP Product Development Document
## Product + Frontend + Backend + AI + Knowledge Base + API + Infrastructure Blueprint

---

# 1. Product Overview

## Product Name
Bageecha AI

## Product Category
AI-powered gardening assistant

## Platform
- Android MVP
- iOS later

## Product Goal

Build an AI gardening ecosystem for Indian users that helps them:
- Identify plants
- Detect diseases
- Manage plants
- Receive smart care reminders
- Get AI-based gardening help
- Track personalized plants

---

# 2. Core Product Philosophy

The app is NOT just:
- a plant scanner
- a GPT wrapper
- a reminder app

The actual moat becomes:
- Indian gardening intelligence
- personalized plant ownership
- climate-aware AI
- emotional plant tracking
- contextual gardening guidance

---

# 3. MVP Objectives

- Fast launch
- Strong scan experience
- High retention
- Low infrastructure cost
- Validate subscription conversion

---

# 4. Final MVP Features

| Feature | MVP Status |
|---|---|
| Authentication | YES |
| Plant Scan | YES |
| Disease Detection | YES |
| AI Plant Chat | YES |
| Plant Nicknames | YES |
| My Plants Dashboard | YES |
| Water Reminders | YES |
| Subscription System | YES |
| Push Notifications | YES |
| Indian Knowledge Base | YES |
| Weather Intelligence | YES |
| Plant History | YES |

---

# 5. Final Tech Stack

## FRONTEND

| Layer | Technology |
|---|---|
| Mobile Framework | React Native |
| Runtime | Expo |
| Language | TypeScript |
| Styling | NativeWind |
| State Management | Zustand |
| Navigation | React Navigation |
| API Layer | Axios |

---

## BACKEND

| Layer | Technology |
|---|---|
| Backend Platform | Firebase |
| Functions | Firebase Functions |
| Database | Firestore |
| Storage | Firebase Storage |
| Notifications | Firebase FCM |

---

## AI & APIs

| Feature | Technology |
|---|---|
| Plant Detection | Plant.id API |
| AI Chat | OpenAI API |
| Weather Intelligence | OpenWeather API |

---

# 6. Core Product Modules

1. Authentication
2. Onboarding
3. Home Dashboard
4. Plant Scan
5. Disease Detection
6. AI Plant Doctor
7. My Plants
8. Reminder System
9. Subscription System
10. Notification Engine
11. Indian Knowledge Layer
12. Analytics

---

# 7. Authentication Module

## Features
- Email signup
- Login
- Forgot password
- Google Sign-In
- Session persistence

---

# Backend
Firebase Auth

---

# Database

/users

---

# User Schema

```json
{
  "uid": "firebase_uid",
  "name": "Spriha",
  "email": "user@email.com",
  "subscription": "free"
}
```

---

# 8. Plant Scan Module

## Features
- Camera upload
- Gallery upload
- Image compression
- Disease detection
- Scan history

---

# Backend Flow

Upload Image
→ Firebase Storage
→ Firebase Function
→ Plant.id API
→ Process Response
→ Save Scan Data
→ Return Results

---

# Database

/plant_scans

---

# 9. Plant Personalization System

## Features
- Save plants
- Custom nicknames
- Reminder setup
- Plant notes

---

# Example

| Species | Nickname |
|---|---|
| Money Plant | Lakshmi |

---

# Database

/user_plants

---

# User Plant Schema

```json
{
  "nickname": "Lakshmi",
  "speciesName": "Money Plant",
  "healthStatus": "Healthy",
  "wateringFrequency": 2
}
```

---

# 10. AI Plant Doctor Module

## Features
- conversational AI
- context-aware answers
- weather-aware responses
- plant-specific suggestions

---

# AI Backend Flow

User Prompt
→ Retrieve Plant Data
→ Retrieve Indian Knowledge
→ Build Prompt
→ OpenAI API
→ Save Chat
→ Return Response

---

# AI MODEL

GPT-4.1-mini

---

# Database

/chat_history

---

# 11. Indian Gardening Knowledge Base

## Purpose
Provide:
- India-specific gardening intelligence
- climate-aware guidance
- seasonal plant care
- localized recommendations

---

# Collections

/plant_knowledge
/indian_climate_data
/disease_treatments
/seasonal_guides

---

# Example Schema

```json
{
  "plantName": "Money Plant",
  "watering": {
    "summer": "1-2 days",
    "winter": "4-5 days"
  },
  "indiaRegions": [
    "Delhi",
    "Mumbai"
  ]
}
```

---

# 12. Reminder System

## Features
- Water reminders
- Fertilizer reminders
- Push notifications

---

# Notification Example

“Lakshmi is thirsty today 🌿”

---

# Database

/reminders

---

# 13. Subscription System

## Free Plan
- 2 scans/month
- limited AI chat

---

## Premium Plan
- 20+ scans/month
- unlimited AI chat

---

# Payment Flow

Subscription Screen
→ Razorpay Checkout
→ Backend Verification
→ Unlock Premium

---

# Database

/subscriptions

---

# 14. API Architecture

Frontend
→ Firebase Functions
→ Third Party APIs

---

# Firebase Functions

| Function | Purpose |
|---|---|
| processPlantScan | Plant analysis |
| generateAIResponse | AI responses |
| verifyPayment | Razorpay validation |
| sendReminder | Notifications |
| checkUsageLimit | Premium enforcement |

---

# 15. Analytics Layer

## Track
- Daily active users
- Scan frequency
- AI usage
- Subscription conversion

---

# Tools
- Firebase Analytics
- Crashlytics

---

# 16. Security Architecture

## NEVER EXPOSE
- OpenAI keys
- Plant.id keys
- payment secrets

---

# Security Rules

Users can access ONLY:
- their plants
- their scans
- their reminders

---

# 17. Development Phases

## Phase 1
- authentication
- navigation
- theme system

## Phase 2
- plant scan
- disease detection

## Phase 3
- AI chatbot
- Indian knowledge layer

## Phase 4
- reminders
- notifications

## Phase 5
- subscriptions
- usage limits

## Phase 6
- analytics
- QA
- deployment

---

# 18. Final Product Moat

- Indian gardening intelligence
- climate-aware AI
- personalized plant ownership
- emotional engagement
- regional knowledge base

---

END OF DOCUMENT
