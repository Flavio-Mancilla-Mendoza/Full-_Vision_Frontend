# Component Map — Inventory

This is an automated-first inventory of the main component groups in `src/components` to guide modularization.

## UI Primitives (`src/components/ui`)
- button.tsx
- input.tsx
- textarea.tsx
- select.tsx
- radio-group.tsx
- checkbox.tsx
- label.tsx
- alert.tsx
- toast.tsx
- dialog.tsx
- sheet.tsx
- sidebar.tsx
- loading.tsx
- progress.tsx
- separator.tsx
- tooltip.tsx
- dropdown-menu.tsx
- table.tsx
- tabs.tsx
- switch.tsx
- carousel.tsx
- card.tsx
- badge.tsx
- avatar.tsx
- optimized-image.tsx
- ConfirmDialog.tsx
- SearchBar.tsx
- scroll-area.tsx
- calendar.tsx
- toast.tsx
- toaster.tsx

## Layout (`src/components/layout`)
- Navbar.tsx
- Footer.tsx
- Layout.tsx

## Products (`src/components/products`)
- ProductCard.tsx
- ProductImage.tsx
- FeaturedProducts.tsx
- DynamicFilters.tsx

## Cart (`src/components/cart`)
- CartSummary.tsx
- CartItem.tsx
- CartDrawer.tsx
- GuestCartNotice.tsx

## Admin (`src/components/admin`)
- ProductManagement.tsx
- UserManagement.tsx
- SiteContentManager.tsx
- OrderManagement.tsx
- ImageUpload.tsx
- LocationManagement.tsx
- Many admin subcomponents under `admin/*` and `admin/orders/*`.

## Appointments (`src/components/appointments`)
- CreateAppointmentForm.tsx
- AppointmentCalendar.tsx
- UserAppointments.tsx
- AdminAppointments.tsx

## Carousels (`src/components/carousels`)
- SaleCarousel.tsx
- FeaturedProductsCarousel.tsx
- BestSellersCarousel.tsx
- CustomerCarousel.tsx

## Common (`src/components/common`)
- ErrorBoundary.tsx
- ErrorFallback.tsx
- LazyImage.tsx

---

Notes:
- The `ui` folder contains many small primitives that are ideal as a first package (`ui-primitives`).
- There are many admin-specific components that depend on services and hooks; extract them after the UI primitives to minimize breaking changes.
- Next recommended step: scaffold `packages/ui-components` and move `src/components/ui/*` there, exposing the same exports via an index barrel.

Full file list was inspected programmatically — this document is a curated summary.