# Party Planner

## Working product direction

Status: product direction confirmed on 2026-11-02. This document describes intended behavior, not currently implemented capabilities.

The initial customers are hotels with multiple event rooms, where different events can run at the same time.

The initial version assigns one room to each event. The hotel can host different events in different rooms at the same time; supporting one event across multiple rooms is deferred.

The product's first job is to ensure marketing, kitchen, and wait staff share one complete, current event plan.

The motivation comes from firsthand experience working as a waiter: agendas supplied by marketing sometimes lack key information, and the three teams have worked from three different versions of the same event agenda. The specific differences in that incident are not recalled.

## Confirmed workflow and needs

Marketing owns the event plan. Wait staff currently receive printed agendas.

Kitchen and service staff can flag errors or request corrections in the app. Marketing edits and publishes the official plan.

Marketing resolves a correction request either by publishing a correction or by explaining why no change is needed. The requester can see the outcome. Publishing an unrelated revision does not resolve the request.

All staff at the hotel can read its published event plans and request corrections, including when covering for other staff. Marketing controls drafts and publication.

Printed plans will continue to support service initially. Staff may consult the app as a reference during service; a workflow that depends on using the app during service is deferred.

From the waiter's perspective, the plan needs to communicate:

- What gets served.
- Whether there is a cake, including relevant timing information.
- Anything guests bring themselves.
- Special requests.
- Known dietary needs, including vegetarian and vegan guests.

Dietary needs are recorded as meal counts with optional serving instructions, such as a table reference. A named guest list is not required for this initial scope.

An event plan contains lightweight activities, such as reception, dinner, and cake service. Each activity has optional timing and uses the event's room. The plan records total expected attendance and allows a different expected count per activity; unknown counts are clearly marked.

For cake, dietary needs, guest-supplied items, and special requests, the plan distinguishes confirmed absence from information that is not yet known. Empty information must not silently mean "none."

## Publishing and timing

Every published plan has a revision number and publication time, both included on the printout. Subsequent revisions show what changed.

Publication requires an event name, date, room, and designated kitchen and service leads. Other operational details may remain explicitly unknown.

Marketing may publish a plan with unknown details. The unresolved details remain clearly listed on the printout; publication does not imply completeness.

The plan supports a running order with timings when available. Times may be approximate or explicitly unknown; a timed running order is not a prerequisite for publishing.

Activities default to the event's starting date and may specify a later date, including after midnight. Their timing can still be unknown.

Marketing saves edits in a draft and deliberately publishes the next revision when it is ready to distribute. The app's service reference shows the latest published revision.

When a published plan changes, marketing is responsible for directly notifying a designated kitchen lead and service lead. Each lead confirms receipt of the revision; the app records each team's confirmation.

Each event identifies its kitchen lead and service lead. The same person may lead more than one event.

For the initial release, marketing notifies leads through direct conversation or existing communication channels. The app records which published revision each lead confirms receiving. Automated notifications are deferred.

Marketing can record a lead's verbal confirmation without requiring the lead to log in. The record identifies the confirming lead, the revision received, and that marketing entered the record. Every new published revision requires fresh confirmation from both leads.

Designated leads with login accounts can also confirm receipt directly. Direct confirmation and verbal confirmation recorded by marketing are distinguishable.

Cancelling a published event produces a clearly marked cancellation revision. Marketing notifies both leads and records fresh receipt confirmations. Earlier revisions remain available as history; cancellation is prominent in the app and printable plan.

Cancellation ends the planning workflow in the initial release. Reinstating an event is deferred; receipt recording and historical reference remain available.

The initial release uses one shared, complete printout for all three teams, with clearly organized sections. Department-specific print layouts are deferred.

Marketing may preview and print drafts with a prominent "DRAFT — NOT PUBLISHED" label. Draft prints have no published revision number and cannot receive receipt confirmations. Kitchen and service staff see published plans only.

Concurrent draft edits must not silently overwrite one another. A stale save is stopped, the person's unsaved work is preserved, and they can review the latest draft. Automatic merging is deferred.

## Initial release boundary

The release focuses on preparing, publishing, printing, and correcting event plans, plus tracking receipt by designated leads. Reusable menu templates contain dishes and serving notes. Applying a template copies its contents into the event plan; the copy can be adapted for the event, and later template edits do not change existing event plans. Whole-event templates are not part of the initial template scope.

Kitchen staff maintain menu templates. Marketing selects and adapts their copies in individual event plans.

A menu template is applied to a selected activity. Application adds its dishes; replacing existing dishes is a separate explicit choice.

The initial rollout is a manually configured pilot for one hotel. Self-service hotel setup and staff invitations are deferred; hotel data remains separated in the data model.

Live course tracking, seating charts, client CRM, and a booking-sales pipeline are deferred.

## Finding events

The app opens to a hotel-wide view of events by date and room. It shows unresolved information and whether the designated leads have received the latest published revision.

Plans refresh when opened, when staff return to the tab, and on explicit refresh. The app shows when information was last checked and checks for a newer revision before printing. Continuous live updates are deferred.

## Reshaping the scope

This plan captures the product direction confirmed during the interview. Keep the existing technical foundation. The implementation sequence, contracts, and agreed test seams are in [the implementation plan](./docs/implementation-plan.md).
