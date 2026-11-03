<!-- [NORTH] Current Phase 4 implementation and review notes. -->
# Phase 4: landing, rack and product details

The homepage uses the supplied campaign video, a single intro per session, image reveals, and a block dissolve between routes. The restored rack sits directly before Most Loved gifts. Titles and headers use the user's Fonarto font. Shop prices, rack tags, cart totals and admin prices use Ghana cedis (GH₵), preserving the existing numeric amounts.

Product details have one selectable main image with thumbnails, sticky desktop details and a stacked mobile layout. Colour swatches show a selected ring, checkmark and readable colour label. Colour links on catalogue cards open the product with that colour selected; refreshing product data preserves local choices. Size and colour still remain local, following the cart contract the user asked to preserve.

## Adinkra treatment

The pattern preserves sourced SVG geometry for Gye Nyame, Dwennimmen and the Sankofa bird. Source credits and licences are in frontend/src/assets/adinkra/README.md.

- Hero and footer: pale-gold symbols at 19% opacity. The footer uses exactly two horizontal rows of aligned Gye Nyame, Dwennimmen and Sankofa symbols, with a 360 × 100px repeat at 20% and 80% of its height.
- Buy two offer and the Get 20% off banner: warm-brown symbols at 22% opacity.
- Other page backgrounds, including the rack, Most Loved, You may also like and product details: the same symbols at 3.5% opacity, nearly blending into the surface.
- Product images and their reserved loading surfaces stay plain. Each opaque page surface has a single pattern layer.
- Repeat size: 360px desktop, 280px below 768px. The whole offers strip uses a dedicated 360 × 100px horizontal repeat with all three symbols aligned in one larger row. It spans all offer columns and never repeats vertically; Sankofa shares the row with Gye Nyame and Dwennimmen.
- Symbols are static CSS backgrounds, do not intercept clicks and are removed in forced-colors mode.

The Gift Guide title has extra line height and padding inside its intro masks, so Fonarto's caps are not clipped.

The shared branded page loader replaces the product, collection and wardrobe loading screens. A flex-column shop layout keeps the footer at the bottom of the viewport while content is loading or a page is short. The CSS spinner uses the existing Tailwind spin timing and stops under reduced motion; form loaders stay compact.

The footer's compact link grid measures about 240px high on desktop, 288px at 768px and 450px at 375px (previously 292px, 508px and 772px). Both symbol rows remain complete. The full shop navigation shows from 1024px upward; phones and tablets use a labelled menu control. Shared admin, bag and profile icons all have 44 × 44px controls and a 22px icon size.

Scroll reveals now cover collection cards, section headings, offer copy and editorial photography. They move 24px and fade over 500ms, staggered by 60ms; the original rack artwork and interactions remain untouched. Product hover zoom uses a separate media child at scale 1.04 over 250ms. Both treatments respect reduced motion, and hover motion is limited to fine pointers. Filter pills have been replaced by wrapping underlined category buttons with selected states and item counts.

The shopping bag now has image/name rows, labelled quantity and remove controls, discount breakdowns, a sticky desktop summary and a stacked mobile layout. It retains the existing cart thunk contracts and rollback behavior, with controls disabled during pending updates. Delivery/payment details remain available in an expandable section with visible input labels. Order submission was already unconnected to a backend; the new interface states that ordering is unavailable instead of showing a no-op Place Order button.

## Validation

- Production build passed; lint passed for the changed application source.
- All 34 browser checks passed: 24 Phase 4 checks and 10 transition/video checks, with no runtime exceptions.
- Checks cover 375px, 768px and desktop, rack placement and two-tap interaction, focus return, image loading, no reserved-space shift, product image selection, colour selection by touch, colour links across navigation, cedi cart prices/discounts/totals, reduced motion, grid retries and standalone rack preservation.
- Cart checks use an isolated read-only fixture and do not alter a real cart.
- The latest UI checks cover aligned icon controls and expanded navigation at 1024px, scroll entry states, product hover/reduced motion, wrapping category filters, profile-menu Escape handling, loader/footer placement and compact two-row footer geometry. Cart mutation checks are fulfilled entirely in the browser and cover pending controls, stock limits, rollback, removal and the empty state.
- The overlay watchdog releases clicks before the title reveal. Its title observer remains active until the heading arrives and cleans up on navigation; a slow route render no longer cancels the title reveal.

## Files changed for this revision

- frontend/src/styles/adinkra.css and typography.css
- frontend/src/styles/north.css
- frontend/src/pages/Landing.jsx, Catalogue.jsx, Category.jsx, Cart.jsx, Wardrobe.jsx and Login.jsx
- frontend/src/pages/admin/AdminInventory.jsx and Dashboard.jsx
- frontend/src/components/RevealGrid.jsx, Navbar.jsx, ProductSlider.jsx, SimilarProducts.jsx and AddProductForm.jsx
- frontend/src/components/Loader.jsx, ShopActions.jsx, UserAvatar.jsx, CollectionFilters.jsx, Checkout.jsx and Footer.jsx
- frontend/src/hooks/useScrollReveal.js
- frontend/src/components/rack/GarmentRack.jsx (stable browser-check selector; rack artwork and spacing preserved)
- frontend/src/utils/money.js and colour.js (new shared formatting/labels)
- frontend/src/hooks/usePageTransition.js
- frontend/src/App.jsx
- frontend/src/prototypes/wardrobe/products.js and WardrobePrototype.jsx
- frontend/public/fonts/ (regular, bold and light Fonarto; OTF sources, WOFF2 copies and supplied commercial-use licence)
- frontend/src/assets/adinkra/ (three source SVGs and credits)
- frontend/public/patterns/adinkra.svg, adinkra-light.svg and adinkra-subtle.svg
- frontend/public/patterns/adinkra-banner.svg and adinkra-footer.svg
- frontend/scripts/build-adinkra-pattern.mjs and download-adinkra.mjs
- frontend/scripts/check-north-phase4.mjs and check-block-transition.mjs
- frontend/artifacts/rack-restored/check-restore.mjs (selectors independent of currency)
- Browser screenshots and reports in frontend/artifacts/north-phase4/ and block-transition/

## Review notes

The portrait hero video crops tightly on desktop. The title is now fully visible at mobile widths. Product galleries still contain all existing images, including some unrelated garments, because no image-to-colour mapping exists in the product data. Selecting a colour does not invent a corresponding photo.

The rack retains its 13 original preview garments. These are not assigned unrelated live product IDs; purchasing remains disabled for preview pieces. The View all products link opens the live shop.

The supplied video is a 2.6MB, 1080 × 2048 H.264 web copy with no audio and faststart; the original download is preserved. The main JavaScript chunk remains about 2.43MB, with the existing build size warning. Phase 5 and Phase 6 have not started.

Screenshots to review: landing-rack-desktop.png, landing-hero-mobile.png, product-desktop.png, product-options-mobile.png and cart-cedis-desktop.png. The soft background is deliberately barely visible; the campaign areas retain the more visible symbols.

Latest UI review screenshots: footer-desktop.png, footer-mobile.png, header-hero-desktop.png, collection-filters-laptop.png, collection-filters-mobile.png, products-hover-desktop.png, loader-mobile.png, cart-refined-desktop.png and cart-refined-mobile.png. The cart previews use local fixtures, including simulated updates/removal and a failed update to verify rollback; no real cart was modified.
