# Database Schema

## 1. User (Community Member)
| Field | Type | Notes |
|---|---|---|
| `firebaseUid` | String (unique) | links to Firebase Auth / Local Dev Auth |
| `fullName`, `email`, `mobile` | String | Profile contact basics (masked before acceptance) |
| `age` | Number | User's age (validated 10+) |
| `ageGroup` | String | Auto-derived: `teenager` (10–17), `young_adult` (18–25), `adult` (26–59), `senior` (60+) |
| `city` | String | Selected predefined city (e.g. Chennai, Bengaluru, Mumbai, Delhi) |
| `community` | String | Dependent neighborhood area (e.g. Anna Nagar, T. Nagar) |
| `skills` | [String] | Skills the member can offer to neighbors |
| `interests` | [String] | Hobbies and companionship activities |
| `availability` | Object | Detailed slot availability (weekdays/weekends: morning/afternoon/evening) |
| `verificationStatus` | String | `Pending` / `Verified` / `Rejected` |
| `role` | String | `user` / `admin` |
| `isSuspended` | Boolean | True if account is suspended by Admin |
| `ratingAverage`, `ratingCount` | Number | Aggregated from member reviews |

## 2. HelpRequest
| Field | Type | Notes |
|---|---|---|
| `requester` | ObjectId -> User | Request creator |
| `type` | String | `help`, `companionship`, or `emergency` |
| `category` | String | Age-specific category (with icon and description) or `Other` |
| `title`, `description` | String | Request summary and details |
| `date`, `time` | String | Scheduled or requested date/time |
| `urgency` | String | `Normal`, `High`, `Urgent` |
| `city`, `community` | String | Predefined location boundaries (No exact GPS addresses) |
| `status` | String | `Pending`, `Accepted`, `In Progress`, `Completed`, `Cancelled` |
| `isEmergency` | Boolean | Flag for active emergency broadcast |
| `emergencyStatus` | String | `ACTIVE`, `ACCEPTED`, `RESOLVED` |
| `acceptedMember` | ObjectId -> User | Null until claimed; only one member can accept |
| `acceptedAt` | Date | Timestamp when accepted |
| `requesterReviewed`, `acceptedMemberReviewed` | Boolean | Review idempotency flags |

## 3. Notification
| Field | Type | Notes |
|---|---|---|
| `recipient` | ObjectId -> User | Receiver of notification |
| `type` | String | `EMERGENCY`, `MATCH`, `REQUEST_ACCEPTED`, `STATUS_UPDATE`, `COMMUNITY_REQUEST`, `REVIEW`, `REPORT` |
| `priority` | String | `NORMAL`, `HIGH`, `URGENT` |
| `title`, `message` | String | Notification content |
| `relatedRequest` | ObjectId -> HelpRequest | Associated request reference |
| `matchReasons` | [String] | Bullet points explaining why this request matches the member |
| `read` | Boolean | Read/unread flag |
| `createdAt` | Date | Timestamp |

## 4. Feedback (Review)
| Field | Type | Notes |
|---|---|---|
| `request` | ObjectId -> HelpRequest | Associated completed request |
| `fromUser` | ObjectId -> User | Member providing feedback |
| `toUser` | ObjectId -> User | Member receiving feedback |
| `rating` | Number | 1 to 5 stars |
| `comment` | String | Written testimonial/review |

## 5. Report (Safety & Moderation)
| Field | Type | Notes |
|---|---|---|
| `requestId` | ObjectId -> HelpRequest | Request during which incident occurred |
| `reporter` | ObjectId -> User | Member filing the report |
| `reportedUser` | ObjectId -> User | Member being reported |
| `reason` | String | `Inappropriate Behaviour`, `Misuse of Platform`, `False Request`, `Safety Concern`, `Other` |
| `description` | String | Detailed incident narrative |
| `status` | String | `Open`, `Under Review`, `Resolved`, `Rejected` |
| `actionTaken` | String | Admin action: `Warning`, `Suspend Member`, `Remove Request`, `Close Report` |
