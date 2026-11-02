# NeighborLink — Smart Neighborhood Support System

> **Connect. Help. Belong.**  
> *"Your neighborhood is more than just the place where you live. Sometimes you need a helping hand. Sometimes you just need someone to be there. NeighborLink connects you with people in your community for both."*

---

## 🌟 The Core Concept: Mutual-Aid Community Members

NeighborLink is a neighborhood mutual-aid platform where every registered person is a **COMMUNITY MEMBER**.

There is **NO permanent Volunteer role**. A community member can:
- 🤝 **Need Help**: Request assistance with daily challenges.
- 🧑‍🤝‍🧑 **Find Companionship / Company**: Connect with neighbors for shared walks, studying, hobbies, or community events.
- 🌱 **Offer Help**: Browse open requests from nearby neighbors and lend a hand.

> **Key Rule**: A person can request help today and help another person tomorrow.

---

## 🚀 Key Features

### 1. Age-Adaptive Experience
NeighborLink automatically adapts its interface and request categories based on member age:
- **Teenagers (Age 10–17)**: Subject Tutoring, Exam Preparation, Programming Help, Project Guidance, Career Guidance, Skill Development, Study Together, Sports, Walks, etc., with built-in safety guardrails.
- **Young Adults (Age 18–25)**: Academic Support, Technical Help, Project Guidance, Career Guidance, Resume Help, Exercise, Shopping, Events, Exploring Nearby Places, etc.
- **Adults (Age 26–59)**: Elderly Parent Support, Childcare Support, Medical Appointment Assistance, Illness & Recovery, Important Errands, Household Assistance, Digital Services, etc.
- **Senior Citizens (Age 60+)**: Medicine, Doctor Visits, Medical Tests, Banking, Government Work, Phone Help, Travel Help, Home Help, Walk Together, Talk Together, etc. Features a **Senior Citizen Accessible Mode** with large buttons, high-contrast text, clear iconography, and simplified navigation.

### 2. Predefined City & Community Location Model
- **No live GPS tracking, no map tracking, and no exact street address collection.**
- Members select their **City** (e.g. Chennai, Bengaluru, Mumbai, Delhi) and their specific **Community / Area** (e.g. Anna Nagar, T. Nagar, Adyar).
- All requests and mutual aid are organized within these community boundaries to protect member privacy.

### 3. Smart Rule-Based Matching Engine (50–30–20)
When a request is posted, a transparent, explainable scoring engine ranks prospective helpers:
- **50% Skills & Interests**: Match between required category and member skills/interests.
- **30% Availability**: Match between requested time and member availability slots.
- **20% Community**: Proximity match within the same community and city.
- **Safety Filter**: Automatic age suitability filter protects younger members.
- Matches with $\ge 40\%$ generate a personalized **Good Match** notification with clear reasons (e.g., *"✓ Relevant skill"*, *"✓ Available at requested time"*, *"✓ Same community"*).

### 4. Dual-Layer Contact Privacy Enforcement
- **Before Acceptance**: Mobile numbers, phone numbers, and email addresses are **strictly masked** in both the backend API responses and the frontend UI.
- **After Acceptance**: Once a request is accepted, mutual contact information (Name, Age Group, Community, Mobile, Email) is unlocked exclusively for the requester and accepted helper with direct Call and Email buttons.

### 5. Persistent Emergency Help System
- Emergencies are persisted in MongoDB with `emergencyStatus: 'ACTIVE'` and broadcast to **every eligible member's dashboard** in that community.
- A persistent global emergency banner displays active emergencies with a life-safety advisory to contact emergency services (112).
- **Persistent by design**: Closing notifications, refreshing the page, or navigating away does not dismiss the emergency. It remains active until an accepted member claims it.
- When accepted, the emergency banner automatically clears from other members' screens.

### 6. Atomic Concurrency & Request Lifecycle
- Request acceptance uses atomic MongoDB operations (`findOneAndUpdate({ _id, status: 'Pending' })`) to guarantee that only **one** helper can accept a request, preventing race conditions.
- **Lifecycle**: `Pending` → `Accepted` → `In Progress` → `Completed` (or `Cancelled`).
- State stays synchronized in real time for both parties in the Activities center.

### 7. Post-Completion Feedback & Safety Reporting
- **Ratings & Reviews**: Both members submit 1–5 star ratings and written feedback after task completion.
- **Issue Reporting & Moderation**: Members can report safety concerns, inappropriate behaviour, false requests, or platform misuse. Reports are routed to the Admin Dashboard for review, warnings, or suspensions.

### 8. Comprehensive Admin Portal
- Platform metrics: Total Members, Active Requests, Accepted Requests, Active Emergencies, Open Reports, Feedback Overview.
- Member management: verify, suspend, or reactivate accounts.
- Emergency surveillance and live moderation.
- Report investigation and resolution actions (Warning, Suspend Member, Remove Request, Close Report).

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | React 18, Vite | Single Page Application with dynamic routing |
| **Styling** | Vanilla CSS Design System | Responsive, modern design with custom `.senior-theme` accessibility tokens |
| **Backend** | Node.js, Express.js | Modular RESTful API with middleware architecture |
| **Database** | MongoDB Atlas, Mongoose | Cloud-hosted document database |
| **Authentication** | Firebase Auth + Evaluator JWT | Email/password sign-up + instant evaluator persona quick-login |
| **Testing** | Jest, Supertest | Automated test suites for matching, concurrency, and privacy |

---

## 📁 Project Structure

```
neighborlink/
├── client/                      # React 18 + Vite Frontend
│   ├── src/
│   │   ├── components/          # Navbar, EmergencyBanner, RequestCard, ReportModal, etc.
│   │   ├── context/             # AuthContext (Firebase + Evaluator JWT + Senior detection)
│   │   ├── data/                # Predefined cities, communities, and age-specific categories
│   │   ├── pages/               # Landing, Login, Register, ProfileSetup, Dashboard,
│   │   │                        # CreateRequestFlow, OfferHelp, RequestDetails,
│   │   │                        # Activities, Notifications, Profile, AdminDashboard
│   │   ├── services/            # Axios API client with automatic token headers
│   │   └── styles/              # Global CSS tokens, accessible contrast, responsive breakpoints
│   └── index.html               # Semantic HTML5 with Google Fonts (Inter, Outfit)
├── server/                      # Node.js + Express.js Backend
│   ├── config/                  # Database and Firebase configurations
│   ├── controllers/             # userController, requestController, reportController, adminController, reviewController
│   ├── middleware/              # authMiddleware (Firebase ID token + Evaluator JWT), roleMiddleware, errorMiddleware
│   ├── models/                  # User, HelpRequest, Notification, Review, Report
│   ├── routes/                  # userRoutes, requestRoutes, reportRoutes, adminRoutes, notificationRoutes, reviewRoutes
│   ├── services/                # matchingEngine (50-30-20 formula), notificationService
│   ├── seed/                    # Comprehensive seed data script with 4 age personas
│   └── tests/                   # Jest automated test suites
├── docs/                        # Architecture, database schema, API documentation, diagrams
└── README.md
```

---

## ⚙️ Setup & Installation Instructions

### Prerequisites
- Node.js (v18 or higher) & npm
- MongoDB Atlas cluster (connection URI configured in `server/.env`)
- Firebase project (configured in `client/.env` and `server/.env`)

### 1. Clone & Install Dependencies

```bash
# Clone the repository
cd neighborlink

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment Configuration

#### Server (`server/.env`):
```ini
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=neighborlink_development_evaluator_jwt_secret_2026
CLIENT_ORIGIN=http://localhost:5173
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key
```

#### Client (`client/.env`):
```ini
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

---

## 🚀 Running the Application

### 1. Start the Backend Server
```bash
cd server
npm run dev
```
*Backend runs on `http://localhost:5000` (Health check: `GET http://localhost:5000/api/health`).*

### 2. Start the Frontend Client
```bash
cd client
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

### 3. Seed Demo Data (Optional)
To populate the database with realistic community members across all 4 age groups, sample requests, an active emergency, and moderation reports:
```bash
cd server
npm run seed
```

---

## 🧪 Testing

### Automated Test Suite
To execute the automated backend tests:
```bash
cd server
npm test
```
**Test Coverage Includes:**
- `smartMatchingAndPrivacy.test.js`: Validates the 50-30-20 matching algorithm and ensures contact details are strictly masked before acceptance.
- `requestAccept.test.js`: Proves that atomic request acceptance prevents duplicate acceptance and race conditions.
- `matchingEngine.test.js`: Tests score calculations across skills, availability, and community.
- `priorityEngine.test.js`: Tests rule-based priority categorization.

### Quick Evaluator Demo Logins
For quick evaluation without needing to register new Firebase accounts:
1. Open `http://localhost:5173/login`.
2. Click any of the **Quick Demo Login** persona chips:
   - **Admin**: `admin@neighborlink.demo` (Full platform governance and moderation)
   - **Senior (68y)**: `senior@neighborlink.demo` (Demonstrates Senior Accessible Mode)
   - **Helping Member**: `karthik@neighborlink.demo` (Adult member ready to offer help)
   - **Teenager (16y)**: `arjun@neighborlink.demo` (Youth interface with academic support)

---

## 📄 License
Academic Software Engineering Project — NeighborLink Mutual-Aid System.
