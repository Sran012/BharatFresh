# BharatFresh Product Requirements Document

## 1. Product Overview

### Product Name
BharatFresh

### Product Type
Mobile marketplace app for vegetables and fresh produce with two user roles:
- Buyer
- Seller

### Core Idea
Buyers discover vegetables from nearby sellers, compare prices, and place orders. Sellers manage inventory and can fulfill buyer demand. The platform does not process payments and does not manage delivery logistics. Sellers deliver directly and collect payment outside the platform.

### Product Positioning
This is not a full e-commerce platform. It is a local fresh produce discovery and order-matching platform that combines:
- A catalog marketplace
- A gig-like fulfillment model for nearby sellers
- Map-based local discovery

## 2. Problem Statement

Local vegetable buying is fragmented. Buyers often do not know:
- Which sellers nearby have the required items
- Which seller offers the best price
- Which seller can fulfill quickly

Small sellers often lack:
- A simple digital storefront
- Consistent local demand visibility
- A way to respond quickly to nearby purchase intent

## 3. Product Goals

### Primary Goals
- Help buyers discover nearby vegetable sellers and compare offerings easily
- Help sellers get more local orders without running a full online shop
- Enable quick matching between local demand and available seller inventory

### Secondary Goals
- Make price comparison transparent
- Support map-based purchase decisions
- Allow flexible price-based order requests

## 4. Non-Goals

The first version will not include:
- Online payment collection
- Platform-managed delivery or rider assignment
- Wallet, refunds, or settlement
- Subscription plans
- Complex bidding or auction systems
- Multi-city ops tooling

## 5. User Roles

### Buyer
People looking to purchase vegetables from nearby sellers.

### Seller
Local vegetable vendors or fresh produce sellers who maintain stock and deliver orders themselves.

## 6. Core Product Model

The app uses a single order mode: **Market Request**. There is no direct ordering from a specific seller. All purchases go through the market request flow.

### Market Request
Buyer creates a demand request instead of choosing one seller immediately. The request includes:
- Product(s)
- Quantity
- Preferred price range or average-price intent
- Delivery location
- Optional time preference

The request is broadcast to eligible nearby sellers. Sellers can accept or ignore. Once a seller accepts, the order is assigned and the buyer sees seller details.

Best for:
- Buyers who care more about convenience than seller selection
- Buyers who want local sellers to compete on fulfillment
- Buyers who want price flexibility

### Core Rule
All buyer selections go to cart first as market request items. Checkout broadcasts each item to eligible nearby sellers. There is no direct ordering from a specific seller.

## 7. Key User Experience

## 7.1 Seller App Structure

Seller bottom tabs:
- Home
- Orders
- Inventory
- Profile

### Seller Home
Purpose:
- Quick operational overview

Key content:
- Today's active orders
- New nearby market requests
- Inventory alerts
- Out-of-stock reminders

### Seller Orders
Purpose:
- Manage incoming demand and active deliveries

Two order sections:
- Market Requests: nearby buyer requests the seller can accept or ignore
- Completed orders

Key actions:
- Accept order
- Reject or ignore order
- Mark order status progression
- View buyer location on in-app map (two pins — buyer and seller)
- Open Google Maps externally for navigation

Suggested order statuses:
- New
- Accepted
- Preparing
- Out for Delivery
- Delivered
- Cancelled

### Seller Inventory
Purpose:
- Create and manage product listings

Key actions:
- Add product
- Edit product
- Set price
- Set stock quantity
- Mark in stock / out of stock
- Add unit type such as kg, gram, bunch, piece
- Add photo

Suggested product fields:
- Product name
- Category
- Price
- Unit
- Stock quantity
- In-stock flag
- Product image
- Description optional

### Seller Profile
Purpose:
- Identity and store management

Key content and actions:
- Personal details
- Shop name
- Phone number
- Address
- Service area
- Profile photo
- Settings

## 7.2 Buyer App Structure

Buyer bottom tabs:
- Home
- Cart
- My Orders
- Profile

### Buyer Home
Purpose:
- Product discovery across nearby sellers (inventory browsing only, no direct ordering)

Key modules:
- Search bar
- Filters
- Category browsing
- Nearby products with stock info
- Map view toggle
- List view toggle

Note: Buyers browse what's available but all ordering goes through market request. No direct add-to-cart from a specific seller's inventory.

Search and filter examples:
- Product name
- Distance
- Price range
- In stock only

### Buyer Cart
Purpose:
- Review selected products before placing the final order

Key behavior:
- All selections go to cart first
- A cart item stores product, quantity, buyer location, and request criteria
- On `Place Order`, the system broadcasts each item to eligible nearby sellers
- One checkout may create multiple downstream market requests

### Buyer My Orders
Purpose:
- Track placed orders and request history

Key content:
- Active market requests with status
- After seller accepts: in-app map showing two pins — buyer location and seller location with approximate distance
- Seller name, shop name, and phone number
- Past orders
- Order status timeline
- Push notifications on status updates

### Buyer Profile
Purpose:
- Account and app settings

Key actions:
- Edit name
- Edit phone
- Manage saved addresses
- Notification settings
- Logout

## 8. Discovery and Ordering Experience

This is the most important part of the product.

## 8.1 Buyer Discovery Flow

Buyer enters app and sees:
- Search
- Nearby products
- Nearby sellers
- Map with seller markers

The buyer can switch between:
- Product List View
- Map View

### Map View Behavior
Seller markers show:
- Seller/store name
- Starting price or selected product price
- Approximate distance
- Availability indicator

When a buyer taps a marker:
- Product preview opens
- Buyer can view what the seller has in stock
- Buyer can initiate a market request for those products

## 8.2 Flexible Price Discovery

This is the feature you were describing and it is strong if framed clearly.

When buyer searches for a product, show:
- Lowest price nearby
- Highest price nearby
- Average price nearby
- Number of sellers with stock

Then allow buyer to choose one of two actions:
- Filter sellers by custom price range
- Add a market request item to cart at average price or chosen price band

### Example
Buyer searches for tomatoes.
System shows:
- Lowest: Rs 22/kg
- Average: Rs 28/kg
- Highest: Rs 34/kg
- 11 sellers nearby

Buyer can then:
- Set custom range Rs 23 to Rs 29 and browse matching sellers
- Add request: "Need 3 kg tomatoes near average market price" to cart

This should be shown on the same search result screen, below the map/list results.

## 8.3 Market Request Flow

1. Buyer searches product or set of products
2. Buyer selects `Request from Nearby Sellers`
3. Buyer enters quantity, price preference, and location
4. Buyer adds the request item to cart
5. Buyer goes to cart
6. Buyer places order
7. System sends request to eligible nearby sellers
8. Sellers view request in Orders tab
9. Seller accepts request
10. System assigns request to first acceptable seller based on platform logic
11. Buyer receives seller confirmation
12. Seller sees buyer location on map
13. Seller delivers and collects payment offline

## 9. Matching Logic

### Eligibility Rules for Seller Notifications
Seller should receive a market request only if:
- Seller is active
- Seller is within defined radius of buyer
- Seller has matching product in inventory, if strict inventory matching is enabled
- Seller has item marked in stock, if stock gating is enabled

### Assignment Logic
For MVP:
- Radius-based seller targeting
- First valid seller acceptance wins

## 10. Location and Map Requirements

Location is central to the product.

### Buyer Side
- Detect current location or allow manual address selection
- Show nearby sellers on map during discovery
- Show approximate distance
- Use location in market request flow for radius-based seller matching
- After seller accepts: in-app map with two pins (buyer + seller) and approximate distance
- Tap pin to open Google Maps externally for navigation

### Seller Side
- Seller registers service location
- After accepting order: in-app map with two pins (seller + buyer)
- Tap to open Google Maps externally for navigation

## 11. Notifications

### Buyer Notifications
- Order accepted
- Order status updated
- Request expired if no seller accepts

### Seller Notifications
- New nearby market request
- Order cancelled
- Inventory reminders optional

Push notifications are critical for seller response speed.

## 12. Functional Requirements

### Authentication
- Buyer signup/login
- Seller signup/login
- Role-based onboarding

### Buyer Functional Requirements
- Search products
- Filter results
- View map/list results during discovery
- View product details and stock availability across sellers
- View seller info (name, distance, availability)
- Add market-request items to cart
- Place final order from cart
- Track orders with in-app map showing buyer and seller locations after acceptance
- Manage profile and addresses

### Seller Functional Requirements
- Signup/login
- Create seller profile
- Add and manage inventory
- Receive market requests
- Accept or ignore requests
- Track active and completed orders
- View buyer location on in-app map after acceptance
- Open Google Maps for navigation
- Update order status

## 13. Data Objects

Core entities:
- User
- BuyerProfile
- SellerProfile
- Address
- Product
- InventoryItem
- Cart
- CartItem
- MarketRequest
- MarketRequestItem
- OrderAssignment
- Notification
- ServiceArea
- LocationPoint

## 14. Business Rules

- Platform does not collect money
- Platform does not assign delivery agents
- Seller is responsible for delivery
- Seller is responsible for cash collection or off-platform payment collection
- Buyer should clearly see that payment happens offline
- Buyer should clearly see that final fulfillment depends on seller acceptance
- Market requests should expire after a configurable time window
- Every buyer selection goes to cart first
- Checkout processes each cart item according to its mode

## 15. Risks and Product Challenges

### Trust Risk
Because payment and delivery are offline, disputes may be harder to resolve.

### Inventory Accuracy Risk
If sellers do not maintain stock properly, buyer trust drops quickly.

### Response Time Risk
Market request flow only works if sellers respond quickly.

### Multi-Seller Complexity
Allowing one cart across many sellers creates operational complexity early.

## 16. Suggested V1 Scope

### Must Have
- Buyer and seller authentication
- Seller inventory management
- Buyer search and filter
- Buyer map and list discovery
- Market request flow through cart (single ordering mechanism)
- Seller order acceptance
- In-app map with two-pin location sharing after order acceptance (react-native-maps)
- External Google Maps navigation link
- Order tracking statuses
- Offline payment messaging
- Basic notifications
- Price range based discovery
- Average price insight on search results

## 17. Success Metrics

### Buyer Metrics
- Search-to-order conversion
- Number of orders per active buyer
- Market request acceptance rate
- Time from order creation to seller acceptance

### Seller Metrics
- Active sellers with inventory
- Seller response rate
- Seller acceptance rate
- Order completion rate

### Marketplace Metrics
- Orders per day
- Average order acceptance time
- Inventory coverage for top products
- Cancellation rate

## 18. Open Questions

- Should market requests require strict inventory matching or can sellers accept manually?
- What should be the default seller radius: 2 km, 5 km, or configurable?
- Should buyer see exact seller location before placing order or only approximate area?
- Should first seller acceptance lock a market request immediately?
- How long before a market request expires?

## 19. Product Decision Recommendation

For MVP, the product structure is:

1. Buyer can search products and discover what's available nearby (map and list)
2. Buyer browses seller inventory in discovery but cannot order directly from a specific seller
3. Buyer adds market-request items to cart
4. Buyer places one final order from cart
5. The system broadcasts each cart item to eligible nearby sellers
6. Seller manages inventory and accepts market requests
7. Delivery and payment remain completely outside the platform

This keeps the product simple with one ordering mechanism: market request.
