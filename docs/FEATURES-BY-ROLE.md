# Pinkaroo Feature Documentation (By Role)

This document is the product feature reference for Pinkaroo. It includes:
- A general overview of the app
- Role definitions and permissions
- Feature breakdown by role
- Route-level feature inventory

Use this as the source of truth for product scope and role-based access behavior.

## 1) App Overview

Pinkaroo is a Canadian, local-first real estate platform built for:
- Home buyers and general users
- Realtors
- Brokers
- Office administrators
- System administrators

The app combines public home discovery with authenticated operational tools:
- Public listing browsing and map-first search
- Favorites and recently viewed flows
- Global area-unit preference toggle in the footer (imperial/metric)
- Role-aware dashboards
- CRM for client and interaction tracking
- Brokerage operations tools
- Administrative management and governance controls

## 2) Roles and Access Model

Pinkaroo currently uses these roles:
- `USER`
- `REALTOR`
- `BROKER`
- `OFFICE_ADMIN`
- `SYSTEM_ADMIN`

General rules:
- Most dashboard and management features require authentication.
- CRM is available to: Realtor, Broker, Office Admin, System Admin.
- MLS Search is restricted to: Realtor, Broker, Office Admin, System Admin.
- User-facing discovery pages remain publicly accessible.

## 3) High-Level Feature Matrix

Legend: Yes = available, Limited = partial/conditional, No = unavailable.

| Feature Area | Guest | User | Realtor | Broker | Office Admin | System Admin |
|---|---|---|---|---|---|---|
| Home page browsing/map/recently viewed | Yes | Yes | Yes | Yes | Yes | Yes |
| Browse listings + listing details | Yes | Yes | Yes | Yes | Yes | Yes |
| Favorites page and favorite actions | Limited | Yes | Yes | Yes | Yes | Yes |
| Why Pinkaroo / legal pages | Yes | Yes | Yes | Yes | Yes | Yes |
| MLS Search page and API | No | No | Yes | Yes | Yes | Yes |
| Dashboard landing page | No | Yes | Yes | Yes | Yes | Yes |
| Profile page | Limited | Yes | Yes | Yes | Yes | Yes |
| Add listing | No | No | Yes | No | No | No |
| CRM (clients/interactions) | No | No | Yes | Yes | Yes | Yes |
| Broker suite (team/perf/workload/comms/approvals) | No | No | No | Yes | No | No |
| Office admin dashboard | No | No | No | No | Yes | No |
| Admin operations page (`/admin`) | No | No | No | No | Yes | Yes |
| System admin governance (settings/permissions/audit) | No | No | No | No | No | Yes |

## 4) Detailed Feature Breakdown by Role

## Guest (anonymous)
- **Discovery**
  - Home page with hero, nearby map, recently viewed, filters, browse listings.
  - Listings index and listing details.
  - Public realtor profile pages.
- **Informational pages**
  - Why Pinkaroo, Privacy, Terms, Cookie Policy.
- **Access restrictions**
  - No dashboard access.
  - No MLS Search access.
  - No role-restricted management tools.

## User (`USER`)
- **Everything guest sees**, plus:
- **Authenticated user workspace**
  - Dashboard: personal summary cards (my listings, my favorites, realtor messages).
  - Favorites management and quick listing links.
  - Notifications view (including realtor/broker communication events).
  - Profile with role and personal details.
- **Access restrictions**
  - No MLS Search access.
  - No Add Listing page.
  - No CRM, broker, office admin, or system admin tooling.

## Realtor (`REALTOR`)
- **Everything User sees**, plus:
- **MLS tools**
  - MLS Search page and API-backed search.
- **Listing operations**
  - Add Listing (`/listings/new`) with map/geocode/photo upload flows.
- **CRM**
  - Create/edit/delete clients.
  - Track status pipeline.
  - Log interactions (call/email/meeting/etc.).
  - Message linked clients via notifications.
  - CRM charts (status distribution, interactions over time).
- **Dashboard additions**
  - Availability hours editor.
  - Client/interaction insights and notification workflows.

## Broker (`BROKER`)
- **Everything Realtor-level operational visibility needed for team leadership**, including MLS + CRM access.
- **Broker suite**
  - Broker dashboard overview KPIs and management center links.
  - Performance analytics (`/dashboard/broker/performance`).
  - Workload planning (`/dashboard/broker/workload`).
  - Client oversight (`/dashboard/broker/client-oversight`).
  - Communications/broadcasts (`/dashboard/broker/communications`).
  - Admin controls (`/dashboard/broker/admin-controls`).
  - Team management (`/dashboard/broker/team`).
  - Realtor drill-down dashboards (`/dashboard/broker/realtors`, `/dashboard/broker/realtors/[id]`).
  - Listing approvals queue (`/dashboard/broker/approvals`).
- **Analytics**
  - Weekly KPI trends (new listings, interactions, approvals resolved).
  - Team/realtor progress charts and revenue target tracking.

## Office Admin (`OFFICE_ADMIN`)
- **MLS + CRM access**
  - Can access MLS Search and CRM oversight.
- **Office admin operations**
  - Office admin dashboard with broker/realtor counts.
  - Weekly KPI trends (new brokers, new realtors, assignment updates).
  - Unassigned realtor visibility.
  - Jump-off into broker/realtor management workflows.
- **Admin operations page**
  - Access to `/admin` operational management tools (broker/realtor assignment flows).

## System Admin (`SYSTEM_ADMIN`)
- **Highest-level access**
  - MLS + CRM + admin operations access.
- **System governance**
  - System Admin dashboard:
    - App settings management
    - Permission policy management
    - Governance audit logs
  - Full administrative management and platform controls.

## 5) Route-Level Feature Inventory

## Public and Shared Pages
- `/` Home: hero, map, recently viewed, filters, browse listings, favorites sidebar behavior by auth state.
- `/listings` Listings index/search.
- `/listings/[id]` Listing detail (gallery, map, mortgage calc, realtor card, metadata).
- `/why-pinkaroo` Marketing and positioning page (includes role-aware content visibility).
- `/privacy`, `/terms`, `/cookie-policy` Legal/compliance pages.
- `/signin` Authentication entry.

## User Account Pages
- `/favorites` Saved listings.
- `/profile` Profile and account-facing data.
- `/notifications` Notification center.
- `/dashboard/notifications` Dashboard notification view.

## MLS
- `/mls-search` Role-restricted MLS search experience.
- `/api/mls/search` Role-restricted MLS search/import endpoint.
- `/api/cron/sync-mls` Scheduled MLS synchronization.

## Realtor / Sales Workflows
- `/listings/new` Add listing workflow.
- `/dashboard/crm` CRM client and interaction management.

## Broker Workflows
- `/dashboard/broker`
- `/dashboard/broker/performance`
- `/dashboard/broker/workload`
- `/dashboard/broker/client-oversight`
- `/dashboard/broker/communications`
- `/dashboard/broker/admin-controls`
- `/dashboard/broker/team`
- `/dashboard/broker/realtors`
- `/dashboard/broker/realtors/[id]`
- `/dashboard/broker/approvals`

## Office Admin and Admin Operations
- `/dashboard/office-admin`
- `/admin`
- `/admin/realtors/[id]`

## System Admin
- `/dashboard/system-admin`

## 6) Core API Capability Groups

Major API groups and what they power:
- **Listings**: `/api/listings`, `/api/listings/public`, `/api/listings/nearby`, `/api/listings/[id]`
  - Public browsing, listing CRUD, nearby map data.
- **Favorites**: `/api/favorites`, `/api/favorites/favorites`
  - Favorite/unfavorite and favorite retrieval.
- **Notifications**: `/api/notifications`, `/api/notifications/notifications`
  - In-app notification and communication workflows.
- **Clients/CRM**: `/api/clients`, `/api/clients/stats`, `/api/clients/interactions`, `/api/clients/[id]`, `/api/clients/[id]/interactions`
  - Client lifecycle and interaction logging.
- **Broker operations**: `/api/broker/*`
  - Performance, workload, teams, approvals, communications, admin controls, weekly KPIs.
- **Admin operations**: `/api/admin/*`
  - Broker/realtor/user management and assignment workflows.
- **System admin governance**: `/api/system-admin/*`
  - Settings, permissions, audit logs.
- **Auth and user identity**: `/api/auth/[...nextauth]`, `/api/auth/register`, `/api/users/[id]`
  - Session and account profile operations.

## 7) Notes and Maintenance

- This document reflects the current codebase behavior.
- Update this file whenever:
  - A new role is added
  - Route access rules change
  - New dashboard modules are introduced
  - MLS/CRM/admin permissions are modified

