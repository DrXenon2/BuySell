```bash

└── BuySell-main/
    └── BuySell-main/
        ├── .babelrc
        ├── .dockerignore
        ├── .env.development
        ├── .env.example
        ├── .env.production
        ├── .eslintrc.json
        ├── .gitattributes
        ├── .gitignore
        ├── .nvmrc
        ├── .prettierrc.json
        ├── CHANGELOG.md
        ├── CODE_OF_CONDUCT.md
        ├── CONTRIBUTING.md
        ├── Dockerfile
        ├── Dockerfile.prod
        ├── LICENSE
        ├── README.md
        ├── SECURITY.md
        ├── docker-compose.prod.yml
        ├── docker-compose.yml
        ├── ecosystem.config.js
        ├── fly.toml
        ├── netlify.toml
        ├── nginx.conf
        ├── package-lock.json
        ├── package.json
        ├── railway.json
        ├── render.yaml
        ├── replit.md
        ├── server.js
        ├── vercel.json
        ├── terraform/
        │   ├── backend.tf
        │   ├── main.tf
        │   ├── outputs.tf
        │   ├── providers.tf
        │   ├── variables.tf
        │   ├── versions.tf
        │   └── modules/
        │       ├── networking/
        │       │   ├── main.tf
        │       │   ├── outputs.tf
        │       │   └── variables.tf
        │       ├── database/
        │       │   ├── README.md
        │       │   ├── main.tf
        │       │   ├── outputs.tf
        │       │   └── variables.tf
        │       └── compute/
        │           ├── README.md
        │           ├── main.tf
        │           ├── outputs.tf
        │           └── variables.tf
        ├── scripts/
        │   ├── backup.sh
        │   ├── deploy.sh
        │   ├── healthcheck.sh
        │   ├── migrate.sh
        │   ├── restore.sh
        │   ├── seed.sh
        │   ├── setup-server.sh
        │   └── ssl-setup.sh
        ├── monitoring/
        │   ├── deploy-monitoring.sh
        │   ├── docker-compose.monitoring.yml
        │   ├── prometheus/
        │   │   ├── alertmanager.yml
        │   │   ├── alerts.yml
        │   │   └── prometheus.yml
        │   └── grafana/
        │       ├── provisioning/
        │       │   ├── api-metrics.json
        │       │   ├── business-metrics.json
        │       │   ├── dashboards.yml
        │       │   └── datasources.yml
        │       └── dashboards/
        │           ├── api-metrics.json
        │           ├── business-metrics.json
        │           ├── dashboard.yml
        │           ├── realtime-operations.json
        │           └── system-metrics.json
        ├── frontend/
        │   ├── .env.local
        │   ├── .env.production
        │   ├── .eslintrc.json
        │   ├── .prettierrc.json
        │   ├── jsconfig.json
        │   ├── middleware.js
        │   ├── next-env.d.ts
        │   ├── next.config.js
        │   ├── package.json
        │   ├── postcss.config.js
        │   ├── robots.config.js
        │   ├── sitemap.config.js
        │   ├── tailwind.config.js
        │   ├── tsconfig.json
        │   ├── tests/
        │   │   ├── jest.config.js
        │   │   ├── setup.js
        │   │   ├── unit/
        │   │   │   ├── components.test.js
        │   │   │   ├── hooks.test.js
        │   │   │   └── utils.test.js
        │   │   ├── integration/
        │   │   │   ├── auth.test.js
        │   │   │   ├── cart.test.js
        │   │   │   └── products.test.js
        │   │   └── e2e/
        │   │       ├── checkout-flow.test.js
        │   │       └── user-flow.test.js
        │   ├── src/
        │   │   ├── app.css
        │   │   ├── app.js
        │   │   ├── index.css
        │   │   ├── main.jsx
        │   │   ├── utils/
        │   │   │   ├── constants.js
        │   │   │   ├── cookies.js
        │   │   │   ├── debounce.js
        │   │   │   ├── errorHandler.js
        │   │   │   ├── formatters.js
        │   │   │   ├── helpers.js
        │   │   │   ├── imageUtils.js
        │   │   │   ├── index.js
        │   │   │   ├── localStorage.js
        │   │   │   ├── priceCalculator.js
        │   │   │   └── validators.js
        │   │   ├── styles/
        │   │   │   ├── animations.css
        │   │   │   ├── components.css
        │   │   │   ├── globals.css
        │   │   │   ├── notifications.css
        │   │   │   ├── responsive.css
        │   │   │   ├── themes.css
        │   │   │   └── variables.css
        │   │   ├── services/
        │   │   │   ├── analyticsService.js
        │   │   │   ├── api.js
        │   │   │   ├── authService.js
        │   │   │   ├── cartService.js
        │   │   │   ├── index.js
        │   │   │   ├── notificationService.js
        │   │   │   ├── orderService.js
        │   │   │   ├── paymentService.js
        │   │   │   ├── productService.js
        │   │   │   ├── reviewService.js
        │   │   │   ├── supabaseClient.js
        │   │   │   ├── uploadService.js
        │   │   │   └── userService.js
        │   │   ├── lib/
        │   │   │   ├── email-templates.js
        │   │   │   ├── index.js
        │   │   │   ├── resend.js
        │   │   │   ├── stripe.js
        │   │   │   ├── supabase.js
        │   │   │   └── validation.js
        │   │   ├── hooks/
        │   │   │   ├── useAnalytics.js
        │   │   │   ├── useApi.js
        │   │   │   ├── useAuth.js
        │   │   │   ├── useCart.js
        │   │   │   ├── useDebounce.js
        │   │   │   ├── useFilters.js
        │   │   │   ├── useForm.js
        │   │   │   ├── useLocalStorage.js
        │   │   │   ├── useNotification.js
        │   │   │   ├── useOrders.js
        │   │   │   ├── usePagination.js
        │   │   │   ├── useProducts.js
        │   │   │   ├── useSearch.js
        │   │   │   ├── useSupabase.js
        │   │   │   └── useUpload.js
        │   │   ├── contexts/
        │   │   │   ├── AppContext.jsx
        │   │   │   ├── AuthContext.jsx
        │   │   │   ├── CartContext.jsx
        │   │   │   ├── NotificationContext.jsx
        │   │   │   ├── SearchContext.jsx
        │   │   │   └── ThemeContext.jsx
        │   │   ├── config/
        │   │   │   ├── app.js
        │   │   │   ├── constants.js
        │   │   │   ├── countries.js
        │   │   │   ├── index.js
        │   │   │   ├── routes.js
        │   │   │   ├── settings.js
        │   │   │   └── supabase.js
        │   │   ├── components/
        │   │   │   ├── sql
        │   │   │   ├── ui/
        │   │   │   │   ├── Accordion.jsx
        │   │   │   │   ├── Alert.jsx
        │   │   │   │   ├── Avatar.jsx
        │   │   │   │   ├── Badge.jsx
        │   │   │   │   ├── Button.jsx
        │   │   │   │   ├── Card.jsx
        │   │   │   │   ├── Checkbox.jsx
        │   │   │   │   ├── Dialog.jsx
        │   │   │   │   ├── Drawer.jsx
        │   │   │   │   ├── Dropdown.jsx
        │   │   │   │   ├── ErrorBoundary.jsx
        │   │   │   │   ├── FilterBar.jsx
        │   │   │   │   ├── Icon.jsx
        │   │   │   │   ├── Image.jsx
        │   │   │   │   ├── Input.jsx
        │   │   │   │   ├── Loading.jsx
        │   │   │   │   ├── Modal.jsx
        │   │   │   │   ├── Pagination.jsx
        │   │   │   │   ├── Popover.jsx
        │   │   │   │   ├── Progress.jsx
        │   │   │   │   ├── Radio.jsx
        │   │   │   │   ├── Rating.jsx
        │   │   │   │   ├── SearchBar.jsx
        │   │   │   │   ├── Select.jsx
        │   │   │   │   ├── Skeleton.jsx
        │   │   │   │   ├── SortSelect.jsx
        │   │   │   │   ├── Spinner.jsx
        │   │   │   │   ├── Tabs.jsx
        │   │   │   │   ├── Textarea.jsx
        │   │   │   │   ├── Toast.jsx
        │   │   │   │   ├── Tooltip.jsx
        │   │   │   │   └── UploadImage.jsx
        │   │   │   ├── seller/
        │   │   │   │   ├── AnalyticsChart.jsx
        │   │   │   │   ├── InventoryManagement.jsx
        │   │   │   │   ├── OrderManagement.jsx
        │   │   │   │   ├── ProductForm.jsx
        │   │   │   │   ├── ProductList.jsx
        │   │   │   │   ├── SalesReport.jsx
        │   │   │   │   └── SellerDashboard.jsx
        │   │   │   ├── reviews/
        │   │   │   │   ├── RatingInput.jsx
        │   │   │   │   ├── ReviewCard.jsx
        │   │   │   │   ├── ReviewFilters.jsx
        │   │   │   │   ├── ReviewForm.jsx
        │   │   │   │   ├── ReviewList.jsx
        │   │   │   │   ├── ReviewStats.jsx
        │   │   │   │   └── VerifiedBadge.jsx
        │   │   │   ├── products/
        │   │   │   │   ├── BrandFilter.jsx
        │   │   │   │   ├── CategoryFilter.jsx
        │   │   │   │   ├── CompareProducts.jsx
        │   │   │   │   ├── PriceFilter.jsx
        │   │   │   │   ├── ProductActions.jsx
        │   │   │   │   ├── ProductCard.jsx
        │   │   │   │   ├── ProductDetail.jsx
        │   │   │   │   ├── ProductFilters.jsx
        │   │   │   │   ├── ProductGrid.jsx
        │   │   │   │   ├── ProductImages.jsx
        │   │   │   │   ├── ProductInfo.jsx
        │   │   │   │   ├── ProductList.jsx
        │   │   │   │   ├── ProductReviews.jsx
        │   │   │   │   ├── ProductSearch.jsx
        │   │   │   │   ├── ProductSpecifications.jsx
        │   │   │   │   ├── ProductVariants.jsx
        │   │   │   │   ├── QuickView.jsx
        │   │   │   │   ├── RatingFilter.jsx
        │   │   │   │   ├── RelatedProducts.jsx
        │   │   │   │   ├── SortOptions.jsx
        │   │   │   │   └── WishlistButton.jsx
        │   │   │   ├── orders/
        │   │   │   │   ├── EmptyOrders.jsx
        │   │   │   │   ├── OrderActions.jsx
        │   │   │   │   ├── OrderCard.jsx
        │   │   │   │   ├── OrderDetail.jsx
        │   │   │   │   ├── OrderInvoice.jsx
        │   │   │   │   ├── OrderItems.jsx
        │   │   │   │   ├── OrderList.jsx
        │   │   │   │   ├── OrderStatus.jsx
        │   │   │   │   └── OrderTracking.jsx
        │   │   │   ├── layout/
        │   │   │   │   ├── Breadcrumb.jsx
        │   │   │   │   ├── Footer.jsx
        │   │   │   │   ├── Header.jsx
        │   │   │   │   ├── Layout.jsx
        │   │   │   │   ├── MobileMenu.jsx
        │   │   │   │   ├── Navigation.jsx
        │   │   │   │   └── Sidebar.jsx
        │   │   │   ├── forms/
        │   │   │   │   └── ProductForm.jsx
        │   │   │   ├── cart/
        │   │   │   │   ├── AddToCart.jsx
        │   │   │   │   ├── CartButton.jsx
        │   │   │   │   ├── CartItem.jsx
        │   │   │   │   ├── CartSummary.jsx
        │   │   │   │   └── EmptyCart.jsx
        │   │   │   └── admin/
        │   │   │       ├── AdminDashboard.jsx
        │   │   │       ├── CategoryManagement.jsx
        │   │   │       ├── OrderManagement.jsx
        │   │   │       ├── ProductManagement.jsx
        │   │   │       ├── Reports.jsx
        │   │   │       ├── SystemSettings.jsx
        │   │   │       └── UserManagement.jsx
        │   │   ├── checkout/
        │   │   │   ├── AddressSelect.jsx
        │   │   │   ├── BillingForm.jsx
        │   │   │   ├── CheckoutGuard.jsx
        │   │   │   ├── CheckoutSteps.jsx
        │   │   │   ├── CouponCode.jsx
        │   │   │   ├── OrderConfirmation.jsx
        │   │   │   ├── OrderSummary.jsx
        │   │   │   ├── PaymentForm.jsx
        │   │   │   ├── PaymentMethods.jsx
        │   │   │   ├── ShippingForm.jsx
        │   │   │   └── ShippingOptions.jsx
        │   │   ├── cart/
        │   │   │   ├── AddToCart.jsx
        │   │   │   ├── CartButton.jsx
        │   │   │   ├── CartItem.jsx
        │   │   │   ├── CartList.jsx
        │   │   │   ├── CartQuantity.jsx
        │   │   │   ├── CartSidebar.jsx
        │   │   │   ├── CartSummary.jsx
        │   │   │   ├── CartTotal.jsx
        │   │   │   ├── EmptyCart.jsx
        │   │   │   └── MiniCart.jsx
        │   │   ├── auth/
        │   │   │   ├── AuthGuard.jsx
        │   │   │   ├── AuthLayout.jsx
        │   │   │   ├── ForgotPasswordForm.jsx
        │   │   │   ├── LoginForm.jsx
        │   │   │   ├── ProfileMenu.jsx
        │   │   │   ├── RegisterForm.jsx
        │   │   │   ├── ResetPasswordForm.jsx
        │   │   │   ├── RoleGuard.jsx
        │   │   │   └── SocialAuth.jsx
        │   │   ├── app/
        │   │   │   ├── error.jsx
        │   │   │   ├── globals.css
        │   │   │   ├── layout.jsx
        │   │   │   ├── loading.jsx
        │   │   │   ├── not-found.jsx
        │   │   │   ├── page.jsx
        │   │   │   ├── profile/
        │   │   │   │   ├── page.jsx
        │   │   │   │   ├── wishlist/
        │   │   │   │   │   └── page.jsx
        │   │   │   │   ├── settings/
        │   │   │   │   │   └── page.jsx
        │   │   │   │   ├── orders/
        │   │   │   │   │   ├── page.jsx
        │   │   │   │   │   ├── tracking/
        │   │   │   │   │   │   └── page.jsx
        │   │   │   │   │   └── [id]/
        │   │   │   │   │       └── page.jsx
        │   │   │   │   └── addresses/
        │   │   │   │       └── page.jsx
        │   │   │   ├── products/
        │   │   │   │   ├── layout.jsx
        │   │   │   │   ├── page.jsx
        │   │   │   │   ├── category/
        │   │   │   │   │   ├── page.jsx
        │   │   │   │   │   └── [slug]/
        │   │   │   │   │       └── page.jsx
        │   │   │   │   └── [id]/
        │   │   │   │       ├── loading.jsx
        │   │   │   │       └── page.jsx
        │   │   │   ├── dashboard/
        │   │   │   │   ├── layout.jsx
        │   │   │   │   ├── seller/
        │   │   │   │   │   ├── page.jsx
        │   │   │   │   │   ├── settings/
        │   │   │   │   │   │   └── page.jsx
        │   │   │   │   │   ├── products/
        │   │   │   │   │   │   ├── page.jsx
        │   │   │   │   │   │   ├── new/
        │   │   │   │   │   │   │   └── page.jsx
        │   │   │   │   │   │   ├── categories/
        │   │   │   │   │   │   │   └── page.jsx
        │   │   │   │   │   │   └── [id]/
        │   │   │   │   │   │       ├── edit.jsx
        │   │   │   │   │   │       └── page.jsx
        │   │   │   │   │   └── orders/
        │   │   │   │   │       ├── page.jsx
        │   │   │   │   │       ├── analytics/
        │   │   │   │   │       │   └── page.jsx
        │   │   │   │   │       └── [id]/
        │   │   │   │   │           └── page.jsx
        │   │   │   │   └── admin/
        │   │   │   │       ├── page.jsx
        │   │   │   │       ├── users/
        │   │   │   │       │   ├── page.jsx
        │   │   │   │       │   ├── sellers/
        │   │   │   │       │   │   └── page.jsx
        │   │   │   │       │   └── [id]/
        │   │   │   │       │       └── page.jsx
        │   │   │   │       ├── products/
        │   │   │   │       │   └── page.jsx
        │   │   │   │       ├── orders/
        │   │   │   │       │   └── page.jsx
        │   │   │   │       ├── categories/
        │   │   │   │       │   └── page.jsx
        │   │   │   │       └── analytics/
        │   │   │   │           └── page.jsx
        │   │   │   ├── checkout/
        │   │   │   │   ├── layout.jsx
        │   │   │   │   ├── page.jsx
        │   │   │   │   ├── shipping/
        │   │   │   │   │   └── page.jsx
        │   │   │   │   ├── payment/
        │   │   │   │   │   └── page.jsx
        │   │   │   │   └── confirmation/
        │   │   │   │       └── page.jsx
        │   │   │   ├── cart/
        │   │   │   │   ├── layout.jsx
        │   │   │   │   └── page.jsx
        │   │   │   ├── admin/
        │   │   │   │   ├── error.jsx
        │   │   │   │   ├── layout.jsx
        │   │   │   │   ├── loading.jsx
        │   │   │   │   ├── page.jsx
        │   │   │   │   ├── users/
        │   │   │   │   │   ├── page.jsx
        │   │   │   │   │   └── [id]/
        │   │   │   │   │       └── page.jsx
        │   │   │   │   ├── settings/
        │   │   │   │   │   └── page.jsx
        │   │   │   │   ├── reports/
        │   │   │   │   │   └── page.jsx
        │   │   │   │   ├── products/
        │   │   │   │   │   ├── page.jsx
        │   │   │   │   │   └── create/
        │   │   │   │   │       └── page.jsx
        │   │   │   │   ├── orders/
        │   │   │   │   │   ├── page.jsx
        │   │   │   │   │   └── [id]/
        │   │   │   │   │       └── page.jsx
        │   │   │   │   └── analytics/
        │   │   │   │       └── page.jsx
        │   │   │   ├── api/
        │   │   │   │   ├── webhooks/
        │   │   │   │   │   ├── stripe.js
        │   │   │   │   │   ├── supabase.js
        │   │   │   │   │   └── stripe/
        │   │   │   │   │       └── route.js
        │   │   │   │   ├── upload/
        │   │   │   │   │   └── route.js
        │   │   │   │   └── auth/
        │   │   │   │       ├── callback.js
        │   │   │   │       └── route.js
        │   │   │   └── (auth)/
        │   │   │       ├── reset-password/
        │   │   │       │   ├── layout.jsx
        │   │   │       │   └── page.jsx
        │   │   │       ├── register/
        │   │   │       │   ├── layout.jsx
        │   │   │       │   └── page.jsx
        │   │   │       ├── login/
        │   │   │       │   ├── layout.jsx
        │   │   │       │   └── page.jsx
        │   │   │       └── forgot-password/
        │   │   │           ├── layout.jsx
        │   │   │           └── page.jsx
        │   │   └── admin/
        │   │       ├── AdminDashboard.jsx
        │   │       ├── CategoryManagement.jsx
        │   │       ├── Dashboard.jsx
        │   │       ├── OrderManagement.jsx
        │   │       ├── ProductManagement.jsx
        │   │       ├── Reports.jsx
        │   │       ├── SystemSettings.jsx
        │   │       ├── UserManagement.jsx
        │   │       ├── admin.css
        │   │       ├── index.js
        │   │       └── layout.jsx
        │   ├── services/
        │   │   ├── analyticsService.js
        │   │   ├── api.js
        │   │   ├── authService.js
        │   │   ├── cartService.js
        │   │   ├── categoryService.js
        │   │   ├── configService.js
        │   │   ├── index.js
        │   │   ├── notificationService.js
        │   │   ├── orderService.js
        │   │   ├── paymentService.js
        │   │   ├── productService.js
        │   │   ├── reviewService.js
        │   │   ├── supabaseClient.js
        │   │   ├── uploadService.js
        │   │   └── userService.js
        │   └── public/
        │       ├── favicon.ico
        │       ├── index.html
        │       ├── manifest.json
        │       ├── robots.txt
        │       ├── sitemap.xml
        │       ├── src/
        │       │   ├── app.js
        │       │   ├── index.css
        │       │   ├── main.jsx
        │       │   ├── components/
        │       │   │   ├── App.jsx
        │       │   │   ├── Main.jsx
        │       │   │   ├── ui/
        │       │   │   │   ├── Button.jsx
        │       │   │   │   └── Input.jsx
        │       │   │   └── layout/
        │       │   │       ├── Breadcrumb.jsx
        │       │   │       ├── Footer.jsx
        │       │   │       ├── Header.jsx
        │       │   │       ├── Layout.jsx
        │       │   │       ├── MobileMenu.jsx
        │       │   │       ├── Navigation.jsx
        │       │   │       └── Sidebar.jsx
        │       │   └── app/
        │       │       ├── error.jsx
        │       │       ├── globals.css
        │       │       ├── layout.jsx
        │       │       ├── loading.jsx
        │       │       ├── not-found.jsx
        │       │       ├── page.jsx
        │       │       ├── products/
        │       │       │   ├── layout.jsx
        │       │       │   ├── page.jsx
        │       │       │   ├── category/
        │       │       │   │   ├── page.jsx
        │       │       │   │   └── [slug]/
        │       │       │   │       └── page.jsx
        │       │       │   └── [id]/
        │       │       │       ├── loading.jsx
        │       │       │       └── page.jsx
        │       │       ├── dashboard/
        │       │       │   ├── layout.jsx
        │       │       │   ├── settings/
        │       │       │   │   └── page.jsx
        │       │       │   ├── seller/
        │       │       │   │   ├── page.jsx
        │       │       │   │   ├── products/
        │       │       │   │   │   ├── page.jsx
        │       │       │   │   │   ├── new/
        │       │       │   │   │   │   └── page.jsx
        │       │       │   │   │   ├── categories/
        │       │       │   │   │   │   └── page.jsx
        │       │       │   │   │   └── [id]/
        │       │       │   │   │       ├── edit.jsx
        │       │       │   │   │       └── page.jsx
        │       │       │   │   └── orders/
        │       │       │   │       ├── page.jsx
        │       │       │   │       ├── settings/
        │       │       │   │       │   └── page.jsx
        │       │       │   │       ├── analytics/
        │       │       │   │       │   └── page.jsx
        │       │       │   │       └── [id]/
        │       │       │   │           └── page.jsx
        │       │       │   ├── profile/
        │       │       │   │   ├── page.jsx
        │       │       │   │   ├── wishlist/
        │       │       │   │   │   └── page.jsx
        │       │       │   │   ├── settings/
        │       │       │   │   │   └── page.jsx
        │       │       │   │   ├── orders/
        │       │       │   │   │   ├── page.jsx
        │       │       │   │   │   ├── wishlist/
        │       │       │   │   │   │   └── page.jsx
        │       │       │   │   │   ├── tracking/
        │       │       │   │   │   │   └── page.jsx
        │       │       │   │   │   ├── addresses/
        │       │       │   │   │   │   └── page.jsx
        │       │       │   │   │   └── [id]/
        │       │       │   │   │       └── page.jsx
        │       │       │   │   └── addresses/
        │       │       │   │       └── page.jsx
        │       │       │   └── admin/
        │       │       │       ├── page.jsx
        │       │       │       ├── users/
        │       │       │       │   ├── page.jsx
        │       │       │       │   ├── sellers/
        │       │       │       │   │   └── page.jsx
        │       │       │       │   └── [id]/
        │       │       │       │       └── page.jsx
        │       │       │       ├── products/
        │       │       │       │   └── page.jsx
        │       │       │       ├── orders/
        │       │       │       │   └── page.jsx
        │       │       │       ├── categories/
        │       │       │       │   └── page.jsx
        │       │       │       └── analytics/
        │       │       │           └── page.jsx
        │       │       ├── checkout/
        │       │       │   ├── layout.jsx
        │       │       │   ├── page.jsx
        │       │       │   ├── shipping/
        │       │       │   │   └── page.jsx
        │       │       │   ├── payment/
        │       │       │   │   └── page.jsx
        │       │       │   └── confirmation/
        │       │       │       └── page.jsx
        │       │       ├── cart/
        │       │       │   ├── layout.jsx
        │       │       │   └── page.jsx
        │       │       ├── admin/
        │       │       │   ├── layout.jsx
        │       │       │   ├── users/
        │       │       │   │   └── page.jsx
        │       │       │   ├── products/
        │       │       │   │   └── page.jsx
        │       │       │   ├── orders/
        │       │       │   │   └── page.jsx
        │       │       │   └── analytics/
        │       │       │       └── page.jsx
        │       │       ├── api/
        │       │       │   ├── webhooks/
        │       │       │   │   ├── stripe.js
        │       │       │   │   └── supabase.js
        │       │       │   ├── upload/
        │       │       │   │   └── route.js
        │       │       │   ├── auth/
        │       │       │   │   ├── callback.js
        │       │       │   │   └── route.js
        │       │       │   └── (auth)/
        │       │       │       ├── reset-password/
        │       │       │       │   ├── layout.jsx
        │       │       │       │   └── page.jsx
        │       │       │       ├── register/
        │       │       │       │   ├── layout.jsx
        │       │       │       │   └── page.jsx
        │       │       │       ├── login/
        │       │       │       │   ├── layout.jsx
        │       │       │       │   └── page.jsx
        │       │       │       ├── forgot-password/
        │       │       │       │   ├── layout.jsx
        │       │       │       │   └── page.jsx
        │       │       │       └── products/
        │       │       │           └── products/
        │       │       │               ├── layout.jsx
        │       │       │               └── page.jsx
        │       │       └── (auth)/
        │       │           ├── reset-password/
        │       │           │   ├── layout.jsx
        │       │           │   └── page.jsx
        │       │           ├── register/
        │       │           │   ├── layout.jsx
        │       │           │   └── page.jsx
        │       │           ├── login/
        │       │           │   ├── layout.jsx
        │       │           │   └── page.jsx
        │       │           └── forgot-password/
        │       │               ├── layout.jsx
        │       │               └── page.jsx
        │       ├── locales/
        │       │   ├── ar.json
        │       │   ├── en.json
        │       │   └── fr.json
        │       └── images/
        │           ├── icons/
        │           │   ├── analytics.svg
        │           │   ├── arrow-left.svg
        │           │   ├── arrow-right.svg
        │           │   ├── category.svg
        │           │   ├── check.svg
        │           │   ├── chevron-down.svg
        │           │   ├── chevron-up.svg
        │           │   ├── close.svg
        │           │   ├── customers.svg
        │           │   ├── dashboard.svg
        │           │   ├── error.svg
        │           │   ├── home.svg
        │           │   ├── info.svg
        │           │   ├── logout.svg
        │           │   ├── menu.svg
        │           │   ├── orders.svg
        │           │   ├── payments.svg
        │           │   ├── products.svg
        │           │   ├── profile.svg
        │           │   ├── search.svg
        │           │   ├── shipping.svg
        │           │   ├── star.svg
        │           │   ├── success.svg
        │           │   ├── user.svg
        │           │   └── warning.svg
        │           └── images/
        │               ├── products/
        │               │   ├── image-not-found.png
        │               │   ├── placeholder.jpg
        │               │   └── product-default.png
        │               ├── payments/
        │               │   ├── mastercard.png
        │               │   ├── mtn-money.png
        │               │   ├── orange-money.png
        │               │   ├── paypal.png
        │               │   ├── visa.png
        │               │   └── wave.png
        │               ├── logos/
        │               │   ├── android-chrome-192x192.png
        │               │   ├── apple-touch-icon.png
        │               │   ├── favicon-16x16.png
        │               │   ├── favicon-32x32.png
        │               │   ├── logo.png
        │               │   └── logo.svg
        │               └── categories/
        │                   ├── beauty.jpg
        │                   ├── books.jpg
        │                   ├── electronics.jpg
        │                   ├── fashion.jpg
        │                   ├── home.jpg
        │                   └── sports.jpg
        ├── docs/
        │   ├── API_DOCUMENTATION.md
        │   ├── API_REFERENCE.md
        │   ├── DATABASE_SCHEMA.md
        │   ├── DEPLOYMENT_GUIDE.md
        │   ├── DEVELOPER_GUIDE.md
        │   ├── SETUP_GUIDE.md
        │   ├── TROUBLESHOOTING.md
        │   └── USER_GUIDE.md
        ├── backend/
        │   ├── .env
        │   ├── .env.example
        │   ├── .env.test
        │   ├── .eslintrc.json
        │   ├── app.js
        │   ├── config.js
        │   ├── jsconfig.json
        │   ├── nodemon.json
        │   ├── package-lock.json
        │   ├── package.json
        │   ├── server.js
        │   ├── tests/
        │   │   ├── jest.config.js
        │   │   ├── package.json
        │   │   ├── setup.js
        │   │   ├── teardown.js
        │   │   ├── unit/
        │   │   │   ├── auth.test.js
        │   │   │   ├── orders.test.js
        │   │   │   ├── payments.test.js
        │   │   │   ├── products.test.js
        │   │   │   ├── utils/
        │   │   │   │   └── validators.test.js
        │   │   │   └── services/
        │   │   │       └── productService.test.js
        │   │   ├── integration/
        │   │   │   ├── api.test.js
        │   │   │   ├── auth.test.js
        │   │   │   ├── orders.test.js
        │   │   │   └── products.test.js
        │   │   └── e2e/
        │   │       ├── admin-flow.test.js
        │   │       └── user-flow.test.js
        │   ├── supabase/
        │   │   ├── .env.local
        │   │   ├── config.toml
        │   │   ├── storage/
        │   │   │   ├── buckets.sql
        │   │   │   ├── config.sql
        │   │   │   └── policies.sql
        │   │   ├── seed_data/
        │   │   │   ├── categories.sql
        │   │   │   ├── countries.sql
        │   │   │   ├── products.sql
        │   │   │   ├── settings.sql
        │   │   │   └── users.sql
        │   │   ├── migrations/
        │   │   │   ├── 001_initial_schema.sql
        │   │   │   ├── 002_auth_policies.sql
        │   │   │   ├── 003_sample_data.sql
        │   │   │   ├── 004_rls_policies.sql
        │   │   │   ├── 005_indexes_optimization.sql
        │   │   │   ├── 006_functions_triggers.sql
        │   │   │   ├── 007_security_policies.sql
        │   │   │   └── 008_upload_storage.sql
        │   │   └── functions/
        │   │       ├── package.json
        │   │       ├── utils/
        │   │       │   ├── backup_database.sql
        │   │       │   ├── calculate_shipping_cost.sql
        │   │       │   ├── cleanup_old_data.sql
        │   │       │   ├── generate_order_number.sql
        │   │       │   ├── send_bulk_notifications.sql
        │   │       │   └── update_updated_at.sql
        │   │       ├── promos/
        │   │       │   ├── generate_coupon.sql
        │   │       │   └── validate_coupon.sql
        │   │       ├── products/
        │   │       │   ├── handle_low_stock.sql
        │   │       │   ├── search_products.sql
        │   │       │   └── update_product_rating.sql
        │   │       ├── payments/
        │   │       │   ├── create_payment_intent.sql
        │   │       │   ├── handle_webhook.sql
        │   │       │   └── process_payment.sql
        │   │       ├── orders/
        │   │       │   ├── cancel_order.sql
        │   │       │   ├── create_order.sql
        │   │       │   └── update_order_status.sql
        │   │       └── auth/
        │   │           ├── handle_email_verification.sql
        │   │           ├── handle_new_user.sql
        │   │           └── handle_password_reset.sql
        │   ├── src/
        │   │   ├── app.js
        │   │   ├── index.js
        │   │   ├── validations/
        │   │   │   ├── authValidation.js
        │   │   │   ├── cartValidation.js
        │   │   │   ├── categoryValidation.js
        │   │   │   ├── index.js
        │   │   │   ├── orderValidation.js
        │   │   │   ├── paymentValidation.js
        │   │   │   ├── productValidation.js
        │   │   │   ├── reviewValidation.js
        │   │   │   └── userValidation.js
        │   │   ├── utils/
        │   │   │   ├── apiResponse.js
        │   │   │   ├── formatters.js
        │   │   │   ├── generators.js
        │   │   │   ├── helpers.js
        │   │   │   ├── imageProcessing.js
        │   │   │   ├── index.js
        │   │   │   ├── logger.js
        │   │   │   ├── metrics.js
        │   │   │   ├── security.js
        │   │   │   └── validators.js
        │   │   ├── services/
        │   │   │   ├── analyticsService.js
        │   │   │   ├── authService.js
        │   │   │   ├── cacheService.js
        │   │   │   ├── emailService.js
        │   │   │   ├── index.js
        │   │   │   ├── notificationService.js
        │   │   │   ├── paymentService.js
        │   │   │   ├── reportService.js
        │   │   │   ├── storageService.js
        │   │   │   └── supabaseService.js
        │   │   ├── routes/
        │   │   │   ├── admin.js
        │   │   │   ├── analytics.js
        │   │   │   ├── auth.js
        │   │   │   ├── cart.js
        │   │   │   ├── categories.js
        │   │   │   ├── index.js
        │   │   │   ├── orders.js
        │   │   │   ├── payments.js
        │   │   │   ├── products.js
        │   │   │   ├── reviews.js
        │   │   │   ├── uploads.js
        │   │   │   ├── users.js
        │   │   │   └── webhooks.js
        │   │   ├── models/
        │   │   │   ├── Address.js
        │   │   │   ├── Cart.js
        │   │   │   ├── Category.js
        │   │   │   ├── Coupon.js
        │   │   │   ├── Notification.js
        │   │   │   ├── Order.js
        │   │   │   ├── OrderItem.js
        │   │   │   ├── Payment.js
        │   │   │   ├── Product.js
        │   │   │   ├── Profile.js
        │   │   │   ├── Review.js
        │   │   │   ├── Settings.js
        │   │   │   ├── User.js
        │   │   │   ├── Wishlist.js
        │   │   │   └── index.js
        │   │   ├── middleware/
        │   │   │   ├── asyncHandler.js
        │   │   │   ├── auth.js
        │   │   │   ├── cache.js
        │   │   │   ├── errorHandler.js
        │   │   │   ├── index.js
        │   │   │   ├── logger.js
        │   │   │   ├── notFoundHandler.js
        │   │   │   ├── rateLimiter.js
        │   │   │   ├── requestId.js
        │   │   │   ├── sanitize.js
        │   │   │   ├── timeout.js
        │   │   │   ├── upload.js
        │   │   │   └── validation.js
        │   │   ├── jobs/
        │   │   │   ├── backupJobs.js
        │   │   │   ├── cleanupJobs.js
        │   │   │   ├── emailJobs.js
        │   │   │   ├── index.js
        │   │   │   ├── notificationJobs.js
        │   │   │   └── reportJobs.js
        │   │   ├── docs/
        │   │   │   ├── api.yaml
        │   │   │   ├── healthcheck.js
        │   │   │   ├── index.js
        │   │   │   ├── postman.json
        │   │   │   ├── setup.js
        │   │   │   ├── swagger.json
        │   │   │   ├── schemas/
        │   │   │   │   ├── auth.js
        │   │   │   │   ├── categories.js
        │   │   │   │   ├── index.js
        │   │   │   │   ├── orders.js
        │   │   │   │   ├── products.js
        │   │   │   │   └── users.js
        │   │   │   └── endpoints/
        │   │   │       ├── auth.js
        │   │   │       ├── categories.js
        │   │   │       ├── orders.js
        │   │   │       ├── products.js
        │   │   │       └── users.js
        │   │   ├── controllers/
        │   │   │   ├── adminController.js
        │   │   │   ├── analyticsController.js
        │   │   │   ├── authController.js
        │   │   │   ├── cartController.js
        │   │   │   ├── categoryController.js
        │   │   │   ├── index.js
        │   │   │   ├── orderController.js
        │   │   │   ├── paymentController.js
        │   │   │   ├── productController.js
        │   │   │   ├── reviewController.js
        │   │   │   ├── uploadController.js
        │   │   │   ├── userController.js
        │   │   │   └── webhookController.js
        │   │   └── config/
        │   │       ├── app.js
        │   │       ├── aws.js
        │   │       ├── cloudinary.js
        │   │       ├── config.js
        │   │       ├── constants.js
        │   │       ├── cors.js
        │   │       ├── database.js
        │   │       ├── helmet.js
        │   │       ├── index.js
        │   │       ├── rateLimit.js
        │   │       ├── redis.js
        │   │       ├── resend.js
        │   │       ├── stripe.js
        │   │       └── supabase.js
        │   └── scripts/
        │       ├── backup_database.sh
        │       ├── deploy.sh
        │       ├── export-swagger.js
        │       ├── generate-swagger-json.js
        │       ├── healthcheck.js
        │       ├── migrate.js
        │       ├── restore_database.sh
        │       ├── seed_database.js
        │       └── setup.js
        ├── .github/
        │   ├── FUNDING.yml
        │   ├── ISSUE_TEMPLATE.md
        │   ├── PULL_REQUEST_TEMPLATE.md
        │   ├── codeql-analysis.yml
        │   ├── security.yml
        │   ├── tests.yml
        │   ├── workflowsdeploy-staging.yml
        │   ├── workflows/
        │   │   ├── cd.yml
        │   │   ├── ci.yml
        │   │   ├── codeql-analysis.yml
        │   │   ├── codeql-config.yml
        │   │   ├── deploy-production.yml
        │   │   ├── deploy-staging.yml
        │   │   ├── security.yml
        │   │   └── tests.yml
        │   └── ISSUE_TEMPLATE/
        │       ├── bug_report.md
        │       └── feature_request.md
        └── shared/
            ├── utils/
            │   ├── constants.js
            │   ├── helpers.js
            │   └── validators.js
            ├── types/
            │   ├── api.ts
            │   ├── cart.ts
            │   ├── order.ts
            │   ├── payment.ts
            │   ├── product.ts
            │   └── user.ts
            └── config/
                ├── app.js
                └── email.js

