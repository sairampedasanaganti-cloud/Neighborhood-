# Notification System Flow

NeighborLink features an explainable, in-app notification center that prioritizes urgent requests and keeps members informed.

## Notification Priorities

| Priority | Level | Usage |
|---|---|---|
| **URGENT** | 🔴 Highest | Active emergency broadcasts in the member's community. |
| **HIGH** | 🟠 Elevated | Direct request acceptance alerts and status transitions. |
| **NORMAL** | 🔵 Standard | Smart match recommendations, community requests, reviews, safety reports. |

## Notification Types & Triggers

1. **EMERGENCY**: Triggered when any member in the user's community posts an emergency help request.
2. **MATCH**: Triggered when a new request matches the member's skills, availability, and community (Match Score $\ge 40\%$). Includes bulleted explanation reasons.
3. **REQUEST_ACCEPTED**: Sent to the requester when a neighbor accepts their request, providing contact details.
4. **STATUS_UPDATE**: Sent to both members when status changes to `In Progress` or `Completed`.
5. **REVIEW**: Sent to a member when their partner submits feedback and a rating.
6. **REPORT**: Sent to administrators when a community member reports an issue.
