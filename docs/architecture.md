# System Architecture

## Overview
NeighborLink is built as a decoupled 3-tier web application designed around the **Community Member** mutual-aid concept.

```
┌────────────────────────────────────────────────────────┐
│                   React + Vite Client                  │
│  - Senior Accessible Mode (60+) / Standard Mode (10-59)│
│  - Need Help / Companionship / Offer Help              │
│  - Persistent Emergency Banner Polling                 │
│  - Dual-Layer Contact Privacy Enforcement              │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / REST (JSON)
                            ▼
┌────────────────────────────────────────────────────────┐
│                  Express.js API Server                 │
│  - Dual Token Auth: Firebase ID Token + Evaluator JWT  │
│  - 50-30-20 Rule-Based Smart Matching Engine           │
│  - Atomic Race-Safe Acceptance Handler                 │
│  - Query-Level Privacy Sanitization Layer              │
│  - Admin Moderation & Surveillance Service             │
└───────────────────────────┬────────────────────────────┘
                            │ Mongoose ODM
                            ▼
┌────────────────────────────────────────────────────────┐
│                 MongoDB Atlas Database                 │
│  - Collections: Users, HelpRequests, Notifications,    │
│    Reviews, Reports                                    │
└────────────────────────────────────────────────────────┘
```

## Core Subsystems
1. **Age-Adaptive Interface Engine**: Detects age group (`teenager`, `young_adult`, `adult`, `senior`) and renders age-specific categories, safety filters, or senior accessibility accommodations.
2. **50-30-20 Smart Matching Engine**: Calculates transparent affinity based on Skills (50%), Availability (30%), and Community (20%).
3. **Emergency Broadcast Daemon**: Persists emergencies to MongoDB, keeps them active across refreshes, and pushes high-priority notifications until claimed.
4. **Dual-Layer Privacy Filter**: Sanitizes sensitive contact information (email/mobile) at both the API layer and the UI layer until a request is accepted.
5. **Issue & Moderation Engine**: Manages user reports through an admin investigation and enforcement workflow.
