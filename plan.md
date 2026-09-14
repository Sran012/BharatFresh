# BharatFresh — Build Plan

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React Native (Antigravity) |
| Backend | Node.js + Express 5 + TypeScript |
| Database | PostgreSQL (via `pg`) |
| Auth | Phone number + OTP (OTP verification deferred) |
| Maps | react-native-maps + Google Maps external links |
| Fonts | Plus Jakarta Sans + Inter (from `docs/design.md`) |

## Screen References

All UI references live in `docs/screens/`. Design system tokens (colors, typography, spacing, elevation, shapes) in `docs/design.md`.

| Screen | File | Role |
|--------|------|------|
| Buyer Home | `docs/screens/screen.png` | Search, categories, vendors, fresh arrivals |
| Map View | `docs/screens/screen2.png` | Map with vendor markers, filters, cards |
| Checkout | `docs/screens/screen3.png` | Cart items, address, bill, place order |
| Seller Dashboard | `docs/screens/screen4.png` | Earnings, orders, inventory list |

## Database Schema

### Tables

```
users
  id              UUID PK
  phone           VARCHAR(15) UNIQUE NOT NULL
  role            ENUM('buyer','seller') NOT NULL
  name            VARCHAR(100)
  created_at      TIMESTAMPTZ DEFAULT now()

buyer_profiles
  id              UUID PK
  user_id         UUID FK -> users(id)
  default_address JSONB

seller_profiles
  id              UUID PK
  user_id         UUID FK -> users(id)
  shop_name       VARCHAR(150)
  service_area    JSONB           -- {lat, lng, radius_km}
  rating          DECIMAL(2,1) DEFAULT 0
  is_active       BOOLEAN DEFAULT true

products
  id              UUID PK
  name            VARCHAR(150) NOT NULL
  category        VARCHAR(50)    -- leafy, root, fruits, organic
  unit            VARCHAR(20)    -- kg, g, piece, bunch
  image_url       TEXT

inventory_items
  id              UUID PK
  seller_id       UUID FK -> seller_profiles(id)
  product_id      UUID FK -> products(id)
  price           DECIMAL(8,2) NOT NULL
  stock_qty       INT DEFAULT 0
  in_stock        BOOLEAN DEFAULT true
  description     TEXT
  UNIQUE(seller_id, product_id)

addresses
  id              UUID PK
  user_id         UUID FK -> users(id)
  label           VARCHAR(30)    -- home, work, other
  full_address    TEXT NOT NULL
  lat             DECIMAL(9,6)
  lng             DECIMAL(9,6)
  is_default      BOOLEAN DEFAULT false

market_requests
  id              UUID PK
  buyer_id        UUID FK -> buyer_profiles(id)
  status          ENUM('pending','assigned','completed','expired','cancelled')
  created_at      TIMESTAMPTZ DEFAULT now()
  expires_at      TIMESTAMPTZ

market_request_items
  id              UUID PK
  request_id      UUID FK -> market_requests(id)
  product_id      UUID FK -> products(id)
  quantity        DECIMAL(8,2)
  unit            VARCHAR(20)
  preferred_price DECIMAL(8,2)
  buyer_lat       DECIMAL(9,6)
  buyer_lng       DECIMAL(9,6)

order_assignments
  id              UUID PK
  request_item_id UUID FK -> market_request_items(id)
  seller_id       UUID FK -> seller_profiles(id)
  status          ENUM('accepted','preparing','out_for_delivery','delivered','cancelled')
  accepted_at     TIMESTAMPTZ

notifications
  id              UUID PK
  user_id         UUID FK -> users(id)
  title           VARCHAR(200)
  body            TEXT
  read            BOOLEAN DEFAULT false
  created_at      TIMESTAMPTZ DEFAULT now()
```

### Indexes

- `inventory_items(seller_id)` — seller inventory lookups
- `inventory_items(product_id)` — product availability across sellers
- `market_requests(status, created_at)` — pending request polling
- `market_request_items(request_id)` — item detail fetch
- `seller_profiles(is_active, service_area)` — radius matching (use PostGIS or Haversine on lat/lng)
- `addresses(user_id)` — user address list

---

## Backend Tasks

### Phase 1: Project Scaffold

- [ ] 1.1 Init `server/src/` — `index.ts`, `app.ts`, `config.ts`
- [ ] 1.2 Add `tsconfig.json`, `package.json` scripts (`dev`, `build`, `start`)
- [ ] 1.3 PostgreSQL connection pool in `src/db/pool.ts`
- [ ] 1.4 Run migrations — create all tables above
- [ ] 1.5 Env vars: `DATABASE_URL`, `PORT`, `JWT_SECRET`

### Phase 2: Auth

- [ ] 2.1 `POST /auth/send-otp` — accept phone, store OTP in DB (or Redis), return success
- [ ] 2.2 `POST /auth/verify-otp` — accept phone + OTP, return JWT with `user_id` and `role`
- [ ] 2.3 `POST /auth/register` — complete profile after OTP (name, role selection)
- [ ] 2.4 Auth middleware — extract JWT, attach `req.user`
- [ ] 2.5 **OTP verification deferred** — stub the verify endpoint, return mock success for dev

### Phase 3: Seller Core

- [ ] 3.1 `GET/PUT /seller/profile` — fetch/update seller profile
- [ ] 3.2 `GET /seller/inventory` — list seller's inventory items
- [ ] 3.3 `POST /seller/inventory` — add inventory item (product_id, price, stock, unit, image)
- [ ] 3.4 `PUT /seller/inventory/:id` — edit price, stock, in_stock flag
- [ ] 3.5 `DELETE /seller/inventory/:id` — remove item

### Phase 4: Buyer Core

- [ ] 4.1 `GET /buyer/profile` — fetch/update buyer profile
- [ ] 4.2 `GET /addresses` — list buyer addresses
- [ ] 4.3 `POST /addresses` — add address
- [ ] 4.4 `PUT /addresses/:id` — update address

### Phase 5: Discovery

- [ ] 5.1 `GET /products/search?q=&lat=&lng=&radius=&min_price=&max_price=` — search products, return with seller info, price stats (min/max/avg), stock status
- [ ] 5.2 `GET /products/nearby?lat=&lng=&radius=` — nearby products for map/list view
- [ ] 5.3 `GET /sellers/nearby?lat=&lng=&radius=` — nearby sellers for map markers
- [ ] 5.4 `GET /sellers/:id/inventory` — view a specific seller's inventory

### Phase 6: Market Request + Orders

- [ ] 6.1 `POST /cart/items` — add market request item to cart (buyer-side staging)
- [ ] 6.2 `GET /cart` — list cart items
- [ ] 6.3 `DELETE /cart/items/:id` — remove cart item
- [ ] 6.4 `POST /orders/checkout` — broadcast each cart item to eligible nearby sellers, create `market_requests` + `market_request_items`
- [ ] 6.5 Eligibility filter — active sellers, within radius, has matching product in stock
- [ ] 6.6 `GET /seller/requests` — seller sees incoming market requests
- [ ] 6.7 `POST /seller/requests/:id/accept` — accept request, create `order_assignment`, assign first seller
- [ ] 6.8 `PUT /orders/:id/status` — seller updates order status (preparing -> out_for_delivery -> delivered)
- [ ] 6.9 `GET /buyer/orders` — buyer's active + past orders with status
- [ ] 6.10 `GET /orders/:id` — order detail with buyer+seller locations
- [ ] 6.11 Request expiry — cron or on-read check, expire requests after configurable window

### Phase 7: Notifications

- [ ] 7.1 FCM token registration endpoint
- [ ] 7.2 `GET /notifications` — list user notifications
- [ ] 7.3 Push notification triggers on: order accepted, status update, new request for seller, request expired

---

## Frontend Tasks (Antigravity / React Native)

### Phase 0: Project Setup

- [ ] 0.1 Init React Native project with Antigravity
- [ ] 0.2 Install deps: `react-native-maps`, `react-navigation`, `axios`, `@react-native-async-storage/async-storage`
- [ ] 0.3 Set up navigation: bottom tabs (buyer: Home, Cart, My Orders, Profile; seller: Home, Orders, Inventory, Profile)
- [ ] 0.4 Create design token file from `docs/design.md` — colors, typography, spacing, radii, shadows
- [ ] 0.5 Load fonts: Plus Jakarta Sans, Inter

### Phase 1: Auth Screens

- [ ] 1.1 Phone input screen — `TextInput` for phone, "Send OTP" button
- [ ] 1.2 OTP screen — 6-digit input, verify button, resend timer
- [ ] 1.3 Role selection — buyer or seller onboarding
- [ ] 1.4 Profile completion — name, (seller: shop name, service area)

### Phase 2: Shared Components

- [ ] 2.1 `ProductCard` — image, name, unit, price, add button (yellow, from design.md)
- [ ] 2.2 `SearchBar` — rounded input, voice icon, placeholder
- [ ] 2.3 `CategoryChips` — horizontal scroll, pill shape, active = green tertiary bg
- [ ] 2.4 `BottomNav` — 5 icons, active = primary green
- [ ] 2.5 `QuantitySelector` — minus/plus with count
- [ ] 2.6 `SellerCard` — name, rating, distance, badge, arrow
- [ ] 2.7 `MapMarker` — custom callout with seller name, price, distance

### Phase 3: Buyer Screens

- [ ] 3.1 **Home** (`screen.png`) — location header, search bar, hero banner, category row, vendors near you list, fresh arrivals horizontal scroll
- [ ] 3.2 **Map View** (`screen2.png`) — full map, filter chips (Near Me, Direct Farm, Top Rated), vendor cards at bottom
- [ ] 3.3 **Product Search Results** — list/map toggle, price stats bar (min/avg/max), product cards
- [ ] 3.4 **Cart / Checkout** (`screen3.png`) — item list, quantity adjust, address selector, bill details, place order button
- [ ] 3.5 **My Orders** — active orders with status, past orders, order detail with map (two pins)
- [ ] 3.6 **Profile** — edit name, phone, manage addresses, notification settings, logout

### Phase 4: Seller Screens

- [ ] 4.1 **Dashboard** (`screen4.png`) — online toggle, earnings card, orders count, inventory search, inventory list with stock toggle + edit
- [ ] 4.2 **Inventory Management** — add product form (name, category, price, unit, stock, image), edit, toggle in_stock
- [ ] 4.3 **Orders** — incoming market requests (accept/ignore), active orders, completed orders
- [ ] 4.4 **Order Detail** — buyer location on map, two pins, open Google Maps button, status update buttons
- [ ] 4.5 **Profile** — shop name, phone, address, service area, photo, settings

### Phase 5: Map Integration

- [ ] 5.1 `react-native-maps` setup with Google Maps provider
- [ ] 5.2 Buyer: show nearby seller markers, tap for preview card
- [ ] 5.3 After order acceptance: two-pin view (buyer + seller), distance label
- [ ] 5.4 External Google Maps link for navigation
- [ ] 5.5 Seller: register service area on map during onboarding

### Phase 6: Notifications

- [ ] 6.1 FCM setup
- [ ] 6.2 Push notification handler — deep link to relevant order screen

---

## Build Order

```
Backend Phase 1 → Frontend Phase 0 (parallel)
Backend Phase 2 → Frontend Phase 1
Backend Phase 3 + 4 → Frontend Phase 2 + 3 + 4
Backend Phase 5 → Frontend Phase 3 (discovery)
Backend Phase 6 → Frontend Phase 3 (cart/checkout) + Phase 4 (orders)
Backend Phase 7 → Frontend Phase 6
```

## Deferred

- OTP actual verification (SMS provider) — mock for now, implement when ready
- Payment processing — offline only
- Delivery management — seller handles
- Push notification provider setup (FCM) — structure ready, actual config later
- PostGIS — use Haversine formula for MVP radius queries, migrate if perf demands

## What This Plan Skips

- CI/CD pipeline — add when deploying
- Rate limiting — add when public
- Image upload service — use local storage or S3 bucket, decide later
- Admin panel — out of scope for MVP
- Multi-city — single city first
