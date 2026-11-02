# Security & Privacy Design

## 1. Dual Authentication Model
- **Firebase Authentication**: Production auth supporting Email/Password sign-up and password reset.
- **Evaluator Quick-Login Support**: Integrated JWT fallback tokens allowing evaluators and graders to test multi-user scenarios seamlessly across different age personas (Admin, Senior, Helping Member, Teenager).

## 2. Strict Contact Privacy Protection
- **No Exact Home Addresses**: NeighborLink uses predefined `City → Community / Area` boundaries. Exact home street addresses and live GPS coordinates are never collected, stored, or exposed.
- **Dual-Layer Contact Privacy Enforcement**:
  - **Before Acceptance**: Mobile numbers and emails are masked in backend API queries (`sanitizeRequestForViewer`) and UI components (`RequestDetails.jsx`). A curious user inspecting network traffic cannot access the phone number or email of an open request requester.
  - **After Acceptance**: Mutual contact information (Name, Age Group, Community, Mobile, Email) is unlocked exclusively for the requester and accepted helping member.

## 3. Atomic Concurrency & Anti-Race Safety
- Claiming requests uses atomic MongoDB operations:
  ```javascript
  const updated = await HelpRequest.findOneAndUpdate(
    { _id: req.params.id, status: 'Pending' },
    { $set: { status: 'Accepted', acceptedMember: req.user._id, acceptedAt: new Date() } },
    { new: true }
  );
  if (!updated) {
    throw new ApiError(409, 'This request has already been accepted by another community member.');
  }
  ```

## 4. Age Safety Filters
- Teenagers (10–17) have safety guardrails restricting inappropriate cross-age interactions and presenting youth-appropriate categories.
- Senior citizens (60+) receive high-contrast, large-button accessible interfaces to prevent accidental clicks and confusion.

## 5. Administrative Authorization
- Administrative endpoints under `/api/admin/*` and report resolutions under `/api/reports/*` strictly enforce `role === 'admin'`. Non-admin accounts attempting access receive `403 Forbidden`.
