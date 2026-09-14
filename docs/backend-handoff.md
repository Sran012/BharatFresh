# BharatFresh Backend Handoff

## Architecture Summary

- Backend stack: `Node.js + Express 5 + TypeScript + PostgreSQL`
- Auth: phone OTP flow with mocked OTP in MVP
- Session model: bearer token returned after OTP verification
- Buyer ordering model: cart stages intent, checkout creates `market_requests`
- Seller ordering model: seller accepts eligible request item, which creates `order_assignments`
- Location model: lat/lng fields on buyer requests, addresses, and seller service area
- Map model: backend returns coordinates and approximate distances; mobile app renders markers and opens Google Maps externally

## OTP Strategy

Current MVP:
- `send-otp` stores a code and returns success
- dev OTP is always `111111`
- `verify-otp` verifies the code and issues auth token
- `register` finishes profile and role onboarding

Production swap-in:
- keep the same mobile flow
- replace only the server OTP provider implementation
- recommended providers: `Twilio Verify`, `MSG91`, or another India-focused SMS gateway

## External Services

- Maps rendering: mobile app responsibility
- Navigation: external Google Maps deep-link from mobile
- Push notifications: backend stores device tokens and notification records, ready for FCM integration
- Product images: MVP can use URL-based image fields first

## Data and Business Rules

- A buyer cannot directly place an order against a specific seller inventory item.
- Buyers browse products and sellers, then add request items to cart.
- Checkout converts all cart items into one market request with multiple request items.
- Only active sellers within configured radius and with matching in-stock inventory are eligible.
- First valid seller acceptance wins.
- Payment is offline.
- Delivery is seller-managed.

## Mobile App Contract

The mobile app should treat backend responses as the source of truth for:
- onboarding state
- user role
- price statistics
- seller eligibility
- request assignment
- order statuses
- notification list

The app should not locally infer:
- which seller wins
- whether a request expired
- whether inventory is still valid
- whether an order state transition is allowed

## Endpoint Guide

### Auth

`POST /api/auth/send-otp`

Request:
```json
{
  "phone": "+919999999999"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "phone": "+919999999999",
    "expiresAt": "2026-08-08T12:00:00.000Z",
    "devCode": "111111"
  }
}
```

`POST /api/auth/verify-otp`

Request:
```json
{
  "phone": "+919999999999",
  "code": "111111"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "Bearer-token-value",
    "user": {
      "id": "uuid",
      "phone": "+919999999999",
      "role": null,
      "name": null,
      "needsRegistration": true
    }
  }
}
```

`POST /api/auth/register`

Buyer request:
```json
{
  "name": "Rahul",
  "role": "buyer"
}
```

Seller request:
```json
{
  "name": "Sanjay",
  "role": "seller",
  "shopName": "Fresh Basket",
  "serviceLat": 28.6139,
  "serviceLng": 77.2090,
  "serviceRadiusKm": 5
}
```

### Buyer

`GET /api/buyer/profile`

`PUT /api/buyer/profile`
```json
{
  "name": "Rahul Sharma"
}
```

`GET /api/buyer/addresses`

`POST /api/buyer/addresses`
```json
{
  "label": "home",
  "fullAddress": "A-12, Green Park, New Delhi",
  "lat": 28.5584,
  "lng": 77.2066,
  "isDefault": true
}
```

### Seller

`GET /api/seller/profile`

`PUT /api/seller/profile`
```json
{
  "name": "Sanjay",
  "shopName": "Fresh Basket",
  "serviceLat": 28.6139,
  "serviceLng": 77.2090,
  "serviceRadiusKm": 5,
  "isActive": true
}
```

`POST /api/seller/inventory`
```json
{
  "productId": "uuid",
  "price": 28,
  "stockQty": 50,
  "unit": "kg",
  "inStock": true,
  "imageUrl": "https://example.com/tomato.jpg",
  "description": "Fresh local tomatoes"
}
```

### Discovery

`GET /api/products/search?q=tomato&lat=28.61&lng=77.20&radius=5`

Response includes:
- product info
- `lowestPrice`
- `highestPrice`
- `averagePrice`
- `sellerCount`
- seller list with distance

`GET /api/products/nearby?lat=28.61&lng=77.20&radius=5`

`GET /api/sellers/nearby?lat=28.61&lng=77.20&radius=5`

`GET /api/sellers/:id/inventory`

### Cart and Checkout

`POST /api/cart/items`
```json
{
  "productId": "uuid",
  "quantity": 3,
  "unit": "kg",
  "preferredPrice": 28,
  "buyerLat": 28.5584,
  "buyerLng": 77.2066,
  "note": "Need by evening"
}
```

`POST /api/orders/checkout`

Response:
```json
{
  "success": true,
  "data": {
    "marketRequestId": "uuid",
    "expiresAt": "2026-08-08T12:30:00.000Z",
    "itemCount": 2,
    "items": [
      {
        "requestItemId": "uuid",
        "productId": "uuid"
      }
    ]
  }
}
```

### Orders

Buyer:
- `GET /api/orders/buyer`

Seller:
- `GET /api/orders/seller`
- `GET /api/seller/requests`
- `POST /api/seller/requests/:id/accept`

Seller status update:
`PUT /api/orders/:id/status`
```json
{
  "status": "preparing"
}
```

Valid statuses:
- `accepted`
- `preparing`
- `out_for_delivery`
- `delivered`
- `cancelled`

### Notifications

`POST /api/notifications/tokens`
```json
{
  "platform": "android",
  "token": "fcm-device-token"
}
```

`GET /api/notifications`

## React Native Guidance

Buyer app should build:
- OTP login
- role onboarding
- home discovery
- search result list
- map view
- cart
- checkout
- order history/detail
- address management

Seller app should build:
- OTP login
- seller profile setup
- inventory CRUD
- incoming request list
- order acceptance
- active/completed order list
- status progression

Important UI rules:
- do not label any buyer flow as direct seller checkout
- clearly label payment as offline
- clearly label delivery as seller-managed
- order detail should show both buyer and seller coordinates once assigned
- map pins should use backend coordinates, not frontend-estimated locations
