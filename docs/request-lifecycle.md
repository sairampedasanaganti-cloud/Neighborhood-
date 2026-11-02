# Request Lifecycle & Status Synchronization

## Statuses
- **Pending**: Request is published and visible to community members. Any eligible neighbor can view details and offer help.
- **Accepted**: A neighbor has accepted the request. Contact info is mutually unlocked. Only one member can accept.
- **In Progress**: Either member marks the help or companionship activity as currently underway.
- **Completed**: Activity has concluded. Unlocks the 1–5 star rating and feedback form.
- **Cancelled**: Requester cancels an open request, or either member cancels an accepted request prior to completion.

## Status Synchronization Rules
- Changes made by either party immediately reflect on both members' dashboards and Activities tabs.
- Acceptance is guarded by MongoDB atomic updates (`findOneAndUpdate({ _id, status: 'Pending' })`), preventing double-claiming.
- For emergency requests, acceptance automatically clears the emergency status from other community members' dashboards.
