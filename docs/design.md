---
name: Bharat Fresh
colors:
  surface: '#fbf9f9'
  surface-dim: '#dbdad9'
  surface-bright: '#fbf9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#e9e8e7'
  surface-container-highest: '#e3e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#40493d'
  inverse-surface: '#303031'
  inverse-on-surface: '#f2f0f0'
  outline: '#707a6c'
  outline-variant: '#bfcaba'
  surface-tint: '#1b6d24'
  primary: '#0d631b'
  on-primary: '#ffffff'
  primary-container: '#2e7d32'
  on-primary-container: '#cbffc2'
  inverse-primary: '#88d982'
  secondary: '#795900'
  on-secondary: '#ffffff'
  secondary-container: '#fec330'
  on-secondary-container: '#6f5100'
  tertiary: '#4d5950'
  on-tertiary: '#ffffff'
  tertiary-container: '#657167'
  on-tertiary-container: '#e8f5e9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a3f69c'
  primary-fixed-dim: '#88d982'
  on-primary-fixed: '#002204'
  on-primary-fixed-variant: '#005312'
  secondary-fixed: '#ffdfa0'
  secondary-fixed-dim: '#f8bd2a'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5c4300'
  tertiary-fixed: '#d9e6da'
  tertiary-fixed-dim: '#bdcabe'
  on-tertiary-fixed: '#131e17'
  on-tertiary-fixed-variant: '#3e4a41'
  background: '#fbf9f9'
  on-background: '#1b1c1c'
  surface-variant: '#e3e2e2'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.5px
  price-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  margin-mobile: 16px
  gutter: 12px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style
The design system is centered on the "Farm-to-Table" philosophy, emphasizing freshness, reliability, and community trust. It utilizes a **Modern Corporate** style infused with organic warmth to bridge the gap between high-tech logistics and traditional marketplaces. 

The aesthetic is characterized by high-clarity layouts, generous whitespace to evoke cleanliness, and a focus on high-fidelity food photography. The emotional response should be one of "effortless health"—making the act of buying vegetables feel as fresh as the produce itself.

## Colors
The palette is rooted in the "Bharat Green" (#2E7D32), representing vitality and growth. This is complemented by "Sunshine Yellow" (#FBC02D) for high-intent actions like adding to cart or highlighting daily deals. 

- **Primary:** Used for main branding, primary buttons, and active navigation states.
- **Secondary/Accent:** Reserved for price tags, promotions, and star ratings.
- **Surface Tiers:** Uses a very light gray (#F5F5F5) for the base background, with pure white (#FFFFFF) reserved for elevated cards to create a clear visual hierarchy.
- **Functional Colors:** Standard success (green), error (red), and warning (amber) tones should be used for status messaging.

## Typography
This design system employs a dual-font strategy. **Plus Jakarta Sans** provides a friendly, slightly rounded character for headlines and price displays, ensuring the app feels approachable. **Inter** is used for all body text and UI labels to maintain maximum legibility at small mobile scales and dense data environments like cart listings.

Scale hierarchy is strictly enforced to guide the user's eye from the product name down to weight and pricing. Use sentence case for all UI labels to maintain a conversational tone.

## Layout & Spacing
The layout follows a 4px baseline grid. On mobile, a standard 16px side margin is used to frame the content. 

- **Card-Based Architecture:** All primary produce items are housed in cards. In a standard mobile view, use a 2-column grid for "Produce Categories" and a single-column horizontal scroll or vertical list for "Featured Deals."
- **Touch Targets:** Minimum touch target size is 44x44px. 
- **Vertical Rhythm:** Use 24px spacing between different sections (e.g., between "Top Rated" and "All Vegetables") and 8px between elements within a card (e.g., between image and title).

## Elevation & Depth
Depth is created through **Ambient Shadows** and **Tonal Layering**. 
- **Level 0 (Base):** Background color (#F5F5F5).
- **Level 1 (Cards):** White surfaces with a very soft, diffused shadow (Y: 2px, Blur: 8px, Opacity: 4% Black). These are used for product tiles.
- **Level 2 (Navigation/Sticky):** Bottom navigation bars and floating action buttons use a more pronounced shadow (Y: 4px, Blur: 12px, Opacity: 8% Black) to indicate they sit above the scrollable content.
- **Level 3 (Modals):** Full-screen overlays or bottom sheets for "Filters" or "Cart Summary."

## Shapes
The shape language is "Soft-Friendly." 
- **Standard Cards:** Use a 12px corner radius (`rounded-lg` in this system).
- **Buttons & Inputs:** Use a 12px corner radius to match cards, creating a unified look.
- **Chips/Badges:** Use a pill-shape (fully rounded) for category tags and status indicators (e.g., "In Stock").
- **Product Images:** Images within cards should inherit the card's top-radius but remain flat at the bottom if they bleed into text areas.

## Components
- **Primary Button:** High-contrast #2E7D32 background with White text. Used for "Place Order."
- **Quantity Selector:** A combined component with "-" and "+" icons. Use the primary green for icons and a neutral light-gray background.
- **Product Card:** Must include a high-resolution image placeholder (top), product name (Bold), weight/unit (Muted Body), and price (Price-display). The "Add" button should be a prominent Yellow (#FBC02D) icon or text button in the bottom right.
- **Search Bar:** A wide, 12px rounded input with a subtle inner border and a "Search for 'Tomato'..." placeholder. Include a voice-search icon to improve accessibility for diverse user groups.
- **Category Chips:** Horizontal scrolling list of text-only chips with a light-green tertiary background when active.
- **Bottom Navigation:** Fixed at the bottom with 5 icons: Home, Categories, Fresh Pass (Loyalty), My Orders, and Profile. Use primary green for the active state.
 
