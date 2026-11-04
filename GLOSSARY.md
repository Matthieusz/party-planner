# Venue Operations

An event-coordination product initially focused on hotels with multiple event rooms.

## Language

**Venue**:
A hotel, banquet hall, or other event-hosting establishment that the product serves.
_Avoid_: Account, organization, tenant

**Authenticated Identity**:
A person whose identity has been verified by signing in. Authentication alone does not establish Venue Membership or access.

**Staff Member**:
A person recorded in a Venue's staff directory. A Staff Member may be a designated lead without having a login.

**Venue Membership**:
The relationship linking an Authenticated Identity to a Staff Member at a Venue. An Authenticated Identity can exist without Venue Membership.

**Room**:
A physical event space within a Venue. Different Rooms can host different Events at the same time.
_Avoid_: Guest room

**Event**:
An organized occasion hosted at a Venue, such as a party.
_Avoid_: Booking, Party as separate domain concepts

**Event Plan**:
The shared description of an Event's arrangements and service requirements, owned by marketing.
_Avoid_: Agenda as a separate domain concept

**Draft**:
Changes to an Event Plan that marketing is preparing and has not yet published for operational use.
_Avoid_: Current instructions

**Published Revision**:
A numbered version of an Event Plan that marketing has released for operational use, with a publication time.
_Avoid_: Draft

**Activity**:
A part of an Event's running order, such as reception, dinner, or cake service. Its timing may be unknown.
_Avoid_: Session, Function

**Menu Template**:
A reusable set of dishes and serving notes used to prepare an Event Plan.
_Avoid_: Whole-event template

**Kitchen Lead**:
The person designated to receive an Event's published instructions on behalf of the kitchen.

**Service Lead**:
The person designated to receive an Event's published instructions on behalf of wait staff.

**Receipt Confirmation**:
A record that a designated lead confirmed receiving a particular Published Revision.
_Avoid_: Approval of the plan

**Correction Request**:
A staff-reported problem with a published Event Plan. Marketing resolves it through a published correction or an explanation that no change is needed.
_Avoid_: An edit to the official plan
