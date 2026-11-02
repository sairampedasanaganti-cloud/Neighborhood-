# API Documentation

Base URL: `http://localhost:5000/api` (or your deployed backend URL).
All protected routes require header: `Authorization: Bearer <Firebase ID token or JWT>`.

---

## 1. /api/users

### POST /users/register
Initialize or link a community member profile.
- Auth: Required
- Body: `{ fullName, email, mobile, age, city, community, interests, skills, availability }`
- Response: `201 { success: true, data: User }`

### GET /users/me
Retrieve the authenticated member's profile.
- Response: `200 { success: true, data: User }`

### PATCH /users/me
Update editable profile information.
- Body: `{ fullName, mobile, city, community, interests, skills, availability }`
- Response: `200 { success: true, data: User }`

---

## 2. /api/requests

### POST /requests
Create a Help, Companionship, or Emergency request.
- Auth: Required
- Body: `{ type: 'help'|'companionship'|'emergency', category, title, description, date, time, urgency, city, community }`
- Behavior:
  - If `type === 'emergency'`, sets `isEmergency: true`, `emergencyStatus: 'ACTIVE'`, and broadcasts urgent notifications to all community members.
  - Runs smart matching engine and notifies best-matched community members.
- Response: `201 { success: true, data: HelpRequest }`

### GET /requests
Browse active community requests.
- Query: `community, type, urgency, category, status(default Pending)`
- Privacy rule: Contact information (email/mobile) is stripped for all viewers.

### GET /requests/recommended
Get personalized ranked requests for the current member using the 50-30-20 formula.
- Response: `200 { success: true, data: [{ request, score, matchReasons }] }`

### GET /requests/emergencies/active
Get active community emergencies.
- Response: `200 { success: true, data: HelpRequest[] }`

### GET /requests/activities
Get the logged-in member's activities (where member is requester OR accepted helper).
- Query: `status=active|completed|cancelled`
- Response: `200 { success: true, data: HelpRequest[] }`

### GET /requests/:id
View single request details.
- Privacy rule:
  - Before acceptance: contact info (email, mobile) is masked.
  - After acceptance: both requester and accepted helper can view full contact info.

### POST /requests/:id/accept
Claim a pending request.
- Atomic race-safe check: `findOneAndUpdate({ _id, status: 'Pending' })`.
- Behavior:
  - Sets `acceptedMember: req.user._id`, `status: 'Accepted'`.
  - If emergency, updates `emergencyStatus: 'ACCEPTED'` (disappears from other members' emergency alert).
  - Sends mutual notifications to requester and accepted member.

### PATCH /requests/:id/status
Update request status (`In Progress`, `Completed`, `Cancelled`).
- Auth: Requester or Accepted Member.
- Synchronizes status for both parties.

### POST /requests/:id/reviews
Submit rating and feedback after completion.
- Body: `{ rating: 1-5, comment }`
- Only allowed when request is `Completed`.

---

## 3. /api/reports

### POST /reports
Report a member or incident.
- Body: `{ requestId, reportedUserId, reason, description }`
- Reasons: `Inappropriate Behaviour`, `Misuse of Platform`, `False Request`, `Safety Concern`, `Other`
- Response: `201 { success: true, data: Report }`

### GET /reports (Admin Only)
List reports for moderation.
- Query: `status=Open|Under Review|Resolved`

### PATCH /reports/:id (Admin Only)
Resolve report and execute moderation action.
- Body: `{ status: 'Resolved'|'Rejected', actionTaken: 'Warning'|'Suspend Member'|'Remove Request'|'Close Report', adminNotes }`

---

## 4. /api/admin (Admin Only)

### GET /admin/stats
Returns platform health metrics:
`{ totalMembers, activeRequests, acceptedRequests, activeEmergencies, openReports, feedbackOverview }`

### GET /admin/users
List and filter community members.

### PATCH /admin/users/:id/verification
Approve or reject verification (`Verified`, `Rejected`).

### PATCH /admin/users/:id/suspend
Suspend or reactivate member account (`{ isSuspended: true/false, reason }`).

### GET /admin/emergencies
Monitor all active and historical emergencies.

---

## 5. /api/notifications

### GET /notifications
Fetch member notifications with unread count.

### PATCH /notifications/:id/read
Mark single notification as read.

### PATCH /notifications/read-all
Mark all notifications as read.
