```bash

BuySell/
├── .babelrc
├── .github/
│   ├── codeql-analysis.yml
│   ├── FUNDING.yml
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── ISSUE_TEMPLATE.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── security.yml
│   ├── tests.yml
│   ├── workflows/
│   │   ├── cd.yml
│   │   ├── ci.yml
│   │   ├── codeql-analysis.yml
│   │   ├── codeql-config.yml
│   │   ├── deploy-production.yml
│   │   ├── deploy-staging.yml
│   │   ├── security.yml
│   │   └── tests.yml
│   └── workflowsdeploy-staging.yml
├── .gitignore
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
│   ├── scripts/
│   │   ├── backup_database.sh
│   │   ├── deploy.sh
│   │   ├── export-swagger.js
│   │   ├── generate-swagger-json.js
│   │   ├── healthcheck.js
│   │   ├── migrate.js
│   │   ├── restore_database.sh
│   │   ├── seed_database.js
│   │   └── setup.js
│   ├── server.js
│   ├── src/
│   │   ├── app.js
│   │   ├── clients/
│   │   │   ├── mtnMoneyClient.js
│   │   │   ├── orangeMoneyClient.js
│   │   │   ├── stripeClient.js
│   │   │   └── wavePaymentClient.js
│   │   ├── config/
│   │   │   ├── app.js
│   │   │   ├── aws.js
│   │   │   ├── cloudinary.js
│   │   │   ├── config.js
│   │   │   ├── constants.js
│   │   │   ├── cors.js
│   │   │   ├── database.js
│   │   │   ├── helmet.js
│   │   │   ├── index.js
│   │   │   ├── rateLimit.js
│   │   │   ├── redis.js
│   │   │   ├── resend.js
│   │   │   ├── routes.js
│   │   │   ├── settings.js
│   │   │   ├── stripe.js
│   │   │   └── supabase.js
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
│   │   ├── docs/
│   │   │   ├── api.yaml
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.js
│   │   │   │   ├── categories.js
│   │   │   │   ├── orders.js
│   │   │   │   ├── products.js
│   │   │   │   └── users.js
│   │   │   ├── healthcheck.js
│   │   │   ├── index.js
│   │   │   ├── postman.json
│   │   │   ├── schemas/
│   │   │   │   ├── auth.js
│   │   │   │   ├── categories.js
│   │   │   │   ├── index.js
│   │   │   │   ├── orders.js
│   │   │   │   ├── products.js
│   │   │   │   └── users.js
│   │   │   ├── setup.js
│   │   │   └── swagger.json
│   │   ├── index.js
│   │   ├── jobs/
│   │   │   ├── backupJobs.js
│   │   │   ├── cleanupJobs.js
│   │   │   ├── emailJobs.js
│   │   │   ├── index.js
│   │   │   ├── notificationJobs.js
│   │   │   └── reportJobs.js
│   │   ├── lib/
│   │   │   ├── email-service.js
│   │   │   ├── email-templates.js
│   │   │   ├── index.js
│   │   │   ├── supabase.js
│   │   │   └── validation.js
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
│   │   ├── models/
│   │   │   ├── Address.js
│   │   │   ├── Cart.js
│   │   │   ├── Category.js
│   │   │   ├── Coupon.js
│   │   │   ├── index.js
│   │   │   ├── Notification.js
│   │   │   ├── Order.js
│   │   │   ├── OrderItem.js
│   │   │   ├── Payment.js
│   │   │   ├── Product.js
│   │   │   ├── Profile.js
│   │   │   ├── Review.js
│   │   │   ├── Settings.js
│   │   │   ├── User.js
│   │   │   └── Wishlist.js
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
│   │   ├── services/
│   │   │   ├── analyticsService.js
│   │   │   ├── authService.js
│   │   │   ├── cacheService.js
│   │   │   ├── emailService.js
│   │   │   ├── index.js
│   │   │   ├── notificationService.js
│   │   │   ├── paymentProcessingService.js
│   │   │   ├── paymentService.js
│   │   │   ├── reportService.js
│   │   │   ├── secondHandValidationService.js
│   │   │   ├── stockManagementService.js
│   │   │   ├── storageService.js
│   │   │   └── supabaseService.js
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
│   │   └── validations/
│   │       ├── authValidation.js
│   │       ├── cartValidation.js
│   │       ├── categoryValidation.js
│   │       ├── index.js
│   │       ├── orderValidation.js
│   │       ├── paymentValidation.js
│   │       ├── productValidation.js
│   │       ├── reviewValidation.js
│   │       └── userValidation.js
│   ├── supabase/
│   │   ├── .env.local
│   │   ├── config.toml
│   │   ├── functions/
│   │   │   ├── auth/
│   │   │   │   ├── handle_email_verification.sql
│   │   │   │   ├── handle_new_user.sql
│   │   │   │   └── handle_password_reset.sql
│   │   │   ├── orders/
│   │   │   │   ├── cancel_order.sql
│   │   │   │   ├── create_order.sql
│   │   │   │   └── update_order_status.sql
│   │   │   ├── package.json
│   │   │   ├── payments/
│   │   │   │   ├── create_payment_intent.sql
│   │   │   │   ├── handle_webhook.sql
│   │   │   │   └── process_payment.sql
│   │   │   ├── products/
│   │   │   │   ├── handle_low_stock.sql
│   │   │   │   ├── search_products.sql
│   │   │   │   └── update_product_rating.sql
│   │   │   ├── promos/
│   │   │   │   ├── generate_coupon.sql
│   │   │   │   └── validate_coupon.sql
│   │   │   └── utils/
│   │   │       ├── backup_database.sql
│   │   │       ├── calculate_shipping_cost.sql
│   │   │       ├── cleanup_old_data.sql
│   │   │       ├── generate_order_number.sql
│   │   │       ├── send_bulk_notifications.sql
│   │   │       └── update_updated_at.sql
│   │   ├── migrations/
│   │   │   ├── 001_initial_schema.sql
│   │   │   ├── 002_auth_policies.sql
│   │   │   ├── 003_sample_data.sql
│   │   │   ├── 004_rls_policies.sql
│   │   │   ├── 005_indexes_optimization.sql
│   │   │   ├── 006_functions_triggers.sql
│   │   │   ├── 007_security_policies.sql
│   │   │   └── 008_upload_storage.sql
│   │   ├── seed_data/
│   │   │   ├── categories.sql
│   │   │   ├── countries.sql
│   │   │   ├── products.sql
│   │   │   ├── settings.sql
│   │   │   └── users.sql
│   │   └── storage/
│   │       ├── buckets.sql
│   │       ├── config.sql
│   │       └── policies.sql
│   └── tests/
│       ├── e2e/
│       │   ├── admin-flow.test.js
│       │   └── user-flow.test.js
│       ├── integration/
│       │   ├── api.test.js
│       │   ├── auth.test.js
│       │   ├── orders.test.js
│       │   └── products.test.js
│       ├── jest.config.js
│       ├── package.json
│       ├── setup.js
│       ├── teardown.js
│       └── unit/
│           ├── auth.test.js
│           ├── orders.test.js
│           ├── payments.test.js
│           ├── products.test.js
│           ├── services/
│           │   └── productService.test.js
│           └── utils/
│               └── validators.test.js
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── docker-compose.prod.yml
├── docker-compose.yml
├── Dockerfile
├── Dockerfile.prod
├── dockerignore
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── API_REFERENCE.md
│   ├── DATABASE_SCHEMA.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── DEVELOPER_GUIDE.md
│   ├── SETUP_GUIDE.md
│   ├── TROUBLESHOOTING.md
│   └── USER_GUIDE.md
├── ecosystem.config.js
├── fly.toml
├── frontend/
│   ├── .env.local
│   ├── .eslintrc.json
│   ├── .prettierrc.json
│   ├── env.production
│   ├── jsconfig.json
│   ├── middleware.js
│   ├── next-env.d.ts
│   ├── next.config.js
│   ├── package.json
│   ├── postcss.config.js
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── images/
│   │   │   ├── icons/
│   │   │   │   ├── analytics.svg
│   │   │   │   ├── arrow-left.svg
│   │   │   │   ├── arrow-right.svg
│   │   │   │   ├── category.svg
│   │   │   │   ├── check.svg
│   │   │   │   ├── chevron-down.svg
│   │   │   │   ├── chevron-up.svg
│   │   │   │   ├── close.svg
│   │   │   │   ├── customers.svg
│   │   │   │   ├── dashboard.svg
│   │   │   │   ├── error.svg
│   │   │   │   ├── home.svg
│   │   │   │   ├── info.svg
│   │   │   │   ├── logout.svg
│   │   │   │   ├── menu.svg
│   │   │   │   ├── orders.svg
│   │   │   │   ├── payments.svg
│   │   │   │   ├── products.svg
│   │   │   │   ├── profile.svg
│   │   │   │   ├── search.svg
│   │   │   │   ├── shipping.svg
│   │   │   │   ├── star.svg
│   │   │   │   ├── success.svg
│   │   │   │   ├── user.svg
│   │   │   │   └── warning.svg
│   │   │   └── images/
│   │   │       ├── categories/
│   │   │       │   ├── beauty.jpg
│   │   │       │   ├── books.jpg
│   │   │       │   ├── electronics.jpg
│   │   │       │   ├── fashion.jpg
│   │   │       │   ├── home.jpg
│   │   │       │   └── sports.jpg
│   │   │       ├── logos/
│   │   │       │   ├── android-chrome-192x192.png
│   │   │       │   ├── apple-touch-icon.png
│   │   │       │   ├── favicon-16x16.png
│   │   │       │   ├── favicon-32x32.png
│   │   │       │   ├── logo.png
│   │   │       │   └── logo.svg
│   │   │       ├── payments/
│   │   │       │   ├── mastercard.png
│   │   │       │   ├── mtn-money.png
│   │   │       │   ├── orange-money.png
│   │   │       │   ├── paypal.png
│   │   │       │   ├── visa.png
│   │   │       │   └── wave.png
│   │   │       └── products/
│   │   │           ├── image-not-found.png
│   │   │           ├── placeholder.jpg
│   │   │           └── product-default.png
│   │   ├── index.html
│   │   ├── locales/
│   │   │   ├── ar.json
│   │   │   ├── en.json
│   │   │   └── fr.json
│   │   ├── manifest.json
│   │   ├── robots.txt
│   │   ├── sitemap.xml
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (auth)/
│   │       │   │   ├── forgot-password/
│   │       │   │   │   ├── layout.jsx
│   │       │   │   │   └── page.jsx
│   │       │   │   ├── login/
│   │       │   │   │   ├── layout.jsx
│   │       │   │   │   └── page.jsx
│   │       │   │   ├── register/
│   │       │   │   │   ├── layout.jsx
│   │       │   │   │   └── page.jsx
│   │       │   │   └── reset-password/
│   │       │   │       ├── layout.jsx
│   │       │   │       └── page.jsx
│   │       │   ├── admin/
│   │       │   │   ├── analytics/
│   │       │   │   │   └── page.jsx
│   │       │   │   ├── layout.jsx
│   │       │   │   ├── orders/
│   │       │   │   │   └── page.jsx
│   │       │   │   ├── products/
│   │       │   │   │   └── page.jsx
│   │       │   │   └── users/
│   │       │   │       └── page.jsx
│   │       │   ├── api/
│   │       │   │   ├── (auth)/
│   │       │   │   │   ├── forgot-password/
│   │       │   │   │   │   ├── layout.jsx
│   │       │   │   │   │   └── page.jsx
│   │       │   │   │   ├── login/
│   │       │   │   │   │   ├── layout.jsx
│   │       │   │   │   │   └── page.jsx
│   │       │   │   │   ├── products/
│   │       │   │   │   │   └── products/
│   │       │   │   │   │       ├── layout.jsx
│   │       │   │   │   │       └── page.jsx
│   │       │   │   │   ├── register/
│   │       │   │   │   │   ├── layout.jsx
│   │       │   │   │   │   └── page.jsx
│   │       │   │   │   └── reset-password/
│   │       │   │   │       ├── layout.jsx
│   │       │   │   │       └── page.jsx
│   │       │   │   ├── auth/
│   │       │   │   │   ├── callback.js
│   │       │   │   │   └── route.js
│   │       │   │   ├── upload/
│   │       │   │   │   └── route.js
│   │       │   │   └── webhooks/
│   │       │   │       ├── stripe.js
│   │       │   │       └── supabase.js
│   │       │   ├── cart/
│   │       │   │   ├── layout.jsx
│   │       │   │   └── page.jsx
│   │       │   ├── checkout/
│   │       │   │   ├── confirmation/
│   │       │   │   │   └── page.jsx
│   │       │   │   ├── layout.jsx
│   │       │   │   ├── page.jsx
│   │       │   │   ├── payment/
│   │       │   │   │   └── page.jsx
│   │       │   │   └── shipping/
│   │       │   │       └── page.jsx
│   │       │   ├── dashboard/
│   │       │   │   ├── admin/
│   │       │   │   │   ├── analytics/
│   │       │   │   │   │   └── page.jsx
│   │       │   │   │   ├── categories/
│   │       │   │   │   │   └── page.jsx
│   │       │   │   │   ├── orders/
│   │       │   │   │   │   └── page.jsx
│   │       │   │   │   ├── page.jsx
│   │       │   │   │   ├── products/
│   │       │   │   │   │   └── page.jsx
│   │       │   │   │   └── users/
│   │       │   │   │       ├── [id]/
│   │       │   │   │       │   └── page.jsx
│   │       │   │   │       ├── page.jsx
│   │       │   │   │       └── sellers/
│   │       │   │   │           └── page.jsx
│   │       │   │   ├── layout.jsx
│   │       │   │   ├── profile/
│   │       │   │   │   ├── addresses/
│   │       │   │   │   │   └── page.jsx
│   │       │   │   │   ├── orders/
│   │       │   │   │   │   ├── [id]/
│   │       │   │   │   │   │   └── page.jsx
│   │       │   │   │   │   ├── addresses/
│   │       │   │   │   │   │   └── page.jsx
│   │       │   │   │   │   ├── page.jsx
│   │       │   │   │   │   ├── tracking/
│   │       │   │   │   │   │   └── page.jsx
│   │       │   │   │   │   └── wishlist/
│   │       │   │   │   │       └── page.jsx
│   │       │   │   │   ├── page.jsx
│   │       │   │   │   ├── settings/
│   │       │   │   │   │   └── page.jsx
│   │       │   │   │   └── wishlist/
│   │       │   │   │       └── page.jsx
│   │       │   │   ├── seller/
│   │       │   │   │   ├── orders/
│   │       │   │   │   │   ├── [id]/
│   │       │   │   │   │   │   └── page.jsx
│   │       │   │   │   │   ├── analytics/
│   │       │   │   │   │   │   └── page.jsx
│   │       │   │   │   │   ├── page.jsx
│   │       │   │   │   │   └── settings/
│   │       │   │   │   │       └── page.jsx
│   │       │   │   │   ├── page.jsx
│   │       │   │   │   └── products/
│   │       │   │   │       ├── [id]/
│   │       │   │   │       │   ├── edit.jsx
│   │       │   │   │       │   └── page.jsx
│   │       │   │   │       ├── categories/
│   │       │   │   │       │   └── page.jsx
│   │       │   │   │       ├── new/
│   │       │   │   │       │   └── page.jsx
│   │       │   │   │       └── page.jsx
│   │       │   │   └── settings/
│   │       │   │       └── page.jsx
│   │       │   ├── error.jsx
│   │       │   ├── globals.css
│   │       │   ├── layout.jsx
│   │       │   ├── loading.jsx
│   │       │   ├── not-found.jsx
│   │       │   ├── page.jsx
│   │       │   └── products/
│   │       │       ├── [id]/
│   │       │       │   ├── loading.jsx
│   │       │       │   └── page.jsx
│   │       │       ├── category/
│   │       │       │   ├── [slug]/
│   │       │       │   │   └── page.jsx
│   │       │       │   └── page.jsx
│   │       │       ├── layout.jsx
│   │       │       └── page.jsx
│   │       ├── app.js
│   │       ├── components/
│   │       │   ├── App.jsx
│   │       │   ├── layout/
│   │       │   │   ├── Breadcrumb.jsx
│   │       │   │   ├── Footer.jsx
│   │       │   │   ├── Header.jsx
│   │       │   │   ├── Layout.jsx
│   │       │   │   ├── MobileMenu.jsx
│   │       │   │   ├── Navigation.jsx
│   │       │   │   └── Sidebar.jsx
│   │       │   ├── Main.jsx
│   │       │   └── ui/
│   │       │       ├── Button.jsx
│   │       │       └── Input.jsx
│   │       ├── index.css
│   │       └── main.jsx
│   ├── robots.config.js
│   ├── services/
│   │   ├── analyticsService.js
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── cartService.js
│   │   ├── categoryService.js
│   │   ├── configService.js
│   │   ├── index.js
│   │   ├── multiCartService.js
│   │   ├── notificationService.js
│   │   ├── officialStoresService.js
│   │   ├── orderService.js
│   │   ├── paymentService.js
│   │   ├── productService.js
│   │   ├── reviewService.js
│   │   ├── secondHandService.js
│   │   ├── stockService.js
│   │   ├── supabaseClient.js
│   │   ├── uploadService.js
│   │   └── userService.js
│   ├── sitemap.config.js
│   ├── src/
│   │   ├── admin/
│   │   │   ├── admin.css
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── CategoryManagement.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── index.js
│   │   │   ├── layout.jsx
│   │   │   ├── OrderManagement.jsx
│   │   │   ├── ProductManagement.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── SystemSettings.jsx
│   │   │   └── UserManagement.jsx
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── forgot-password/
│   │   │   │   │   ├── layout.jsx
│   │   │   │   │   └── page.jsx
│   │   │   │   ├── login/
│   │   │   │   │   ├── layout.jsx
│   │   │   │   │   └── page.jsx
│   │   │   │   ├── register/
│   │   │   │   │   ├── layout.jsx
│   │   │   │   │   └── page.jsx
│   │   │   │   └── reset-password/
│   │   │   │       ├── layout.jsx
│   │   │   │       └── page.jsx
│   │   │   ├── admin/
│   │   │   │   ├── analytics/
│   │   │   │   │   └── page.jsx
│   │   │   │   ├── error.jsx
│   │   │   │   ├── layout.jsx
│   │   │   │   ├── loading.jsx
│   │   │   │   ├── orders/
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── page.jsx
│   │   │   │   │   └── page.jsx
│   │   │   │   ├── page.jsx
│   │   │   │   ├── products/
│   │   │   │   │   ├── create/
│   │   │   │   │   │   └── page.jsx
│   │   │   │   │   └── page.jsx
│   │   │   │   ├── reports/
│   │   │   │   │   └── page.jsx
│   │   │   │   ├── settings/
│   │   │   │   │   └── page.jsx
│   │   │   │   └── users/
│   │   │   │       ├── [id]/
│   │   │   │       │   └── page.jsx
│   │   │   │       └── page.jsx
│   │   │   ├── api/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── callback.js
│   │   │   │   │   └── route.js
│   │   │   │   ├── upload/
│   │   │   │   │   └── route.js
│   │   │   │   └── webhooks/
│   │   │   │       ├── stripe/
│   │   │   │       │   └── route.js
│   │   │   │       ├── stripe.js
│   │   │   │       └── supabase.js
│   │   │   ├── boutiques-officielles/
│   │   │   │   └── page.jsx
│   │   │   ├── cart/
│   │   │   │   ├── layout.jsx
│   │   │   │   └── page.jsx
│   │   │   ├── categories/
│   │   │   │   └── [slug]/
│   │   │   │       └── page.jsx
│   │   │   ├── checkout/
│   │   │   │   ├── confirmation/
│   │   │   │   │   └── page.jsx
│   │   │   │   ├── layout.jsx
│   │   │   │   ├── page.jsx
│   │   │   │   ├── payment/
│   │   │   │   │   └── page.jsx
│   │   │   │   └── shipping/
│   │   │   │       └── page.jsx
│   │   │   ├── dashboard/
│   │   │   │   ├── admin/
│   │   │   │   │   ├── analytics/
│   │   │   │   │   │   └── page.jsx
│   │   │   │   │   ├── categories/
│   │   │   │   │   │   └── page.jsx
│   │   │   │   │   ├── orders/
│   │   │   │   │   │   └── page.jsx
│   │   │   │   │   ├── page.jsx
│   │   │   │   │   ├── products/
│   │   │   │   │   │   └── page.jsx
│   │   │   │   │   └── users/
│   │   │   │   │       ├── [id]/
│   │   │   │   │       │   └── page.jsx
│   │   │   │   │       ├── page.jsx
│   │   │   │   │       └── sellers/
│   │   │   │   │           └── page.jsx
│   │   │   │   ├── layout.jsx
│   │   │   │   └── seller/
│   │   │   │       ├── orders/
│   │   │   │       │   ├── [id]/
│   │   │   │       │   │   └── page.jsx
│   │   │   │       │   ├── analytics/
│   │   │   │       │   │   └── page.jsx
│   │   │   │       │   └── page.jsx
│   │   │   │       ├── page.jsx
│   │   │   │       ├── products/
│   │   │   │       │   ├── [id]/
│   │   │   │       │   │   ├── edit.jsx
│   │   │   │       │   │   └── page.jsx
│   │   │   │       │   ├── categories/
│   │   │   │       │   │   └── page.jsx
│   │   │   │       │   ├── new/
│   │   │   │       │   │   └── page.jsx
│   │   │   │       │   └── page.jsx
│   │   │   │       └── settings/
│   │   │   │           └── page.jsx
│   │   │   ├── djassa/
│   │   │   │   └── page.jsx
│   │   │   ├── error.jsx
│   │   │   ├── globals.css
│   │   │   ├── layout.jsx
│   │   │   ├── loading.jsx
│   │   │   ├── not-found.jsx
│   │   │   ├── page.jsx
│   │   │   ├── products/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── loading.jsx
│   │   │   │   │   └── page.jsx
│   │   │   │   ├── category/
│   │   │   │   │   ├── [slug]/
│   │   │   │   │   │   └── page.jsx
│   │   │   │   │   └── page.jsx
│   │   │   │   ├── layout.jsx
│   │   │   │   └── page.jsx
│   │   │   ├── profile/
│   │   │   │   ├── addresses/
│   │   │   │   │   └── page.jsx
│   │   │   │   ├── orders/
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── page.jsx
│   │   │   │   │   ├── page.jsx
│   │   │   │   │   └── tracking/
│   │   │   │   │       └── page.jsx
│   │   │   │   ├── page.jsx
│   │   │   │   ├── settings/
│   │   │   │   │   └── page.jsx
│   │   │   │   └── wishlist/
│   │   │   │       └── page.jsx
│   │   │   └── support/
│   │   │       └── page.jsx
│   │   ├── app.css
│   │   ├── app.js
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
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── CategoryManagement.jsx
│   │   │   │   ├── OrderManagement.jsx
│   │   │   │   ├── ProductManagement.jsx
│   │   │   │   ├── Reports.jsx
│   │   │   │   ├── SystemSettings.jsx
│   │   │   │   └── UserManagement.jsx
│   │   │   ├── cart/
│   │   │   │   ├── AddToCart.jsx
│   │   │   │   ├── CartButton.jsx
│   │   │   │   ├── CartItem.jsx
│   │   │   │   ├── CartSummary.jsx
│   │   │   │   └── EmptyCart.jsx
│   │   │   ├── categories/
│   │   │   │   ├── CategoryFilters.jsx
│   │   │   │   ├── CategoryGrid.jsx
│   │   │   │   ├── CategoryMegaMenu.jsx
│   │   │   │   ├── DjassaSection.jsx
│   │   │   │   └── OfficialStores.jsx
│   │   │   ├── forms/
│   │   │   │   └── ProductForm.jsx
│   │   │   ├── home/
│   │   │   │   ├── CategoryShowcase.jsx
│   │   │   │   ├── DjassaSpotlight.jsx
│   │   │   │   ├── FeaturedProducts.jsx
│   │   │   │   ├── HeroSection.jsx
│   │   │   │   ├── OfficialStoresBanner.jsx
│   │   │   │   └── SmartSuggestions.jsx
│   │   │   ├── layout/
│   │   │   │   ├── Breadcrumb.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Layout.jsx
│   │   │   │   ├── MobileMenu.jsx
│   │   │   │   ├── Navigation.jsx
│   │   │   │   └── Sidebar.jsx
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
│   │   │   ├── reviews/
│   │   │   │   ├── RatingInput.jsx
│   │   │   │   ├── ReviewCard.jsx
│   │   │   │   ├── ReviewFilters.jsx
│   │   │   │   ├── ReviewForm.jsx
│   │   │   │   ├── ReviewList.jsx
│   │   │   │   ├── ReviewStats.jsx
│   │   │   │   └── VerifiedBadge.jsx
│   │   │   ├── seller/
│   │   │   │   ├── AnalyticsChart.jsx
│   │   │   │   ├── InventoryManagement.jsx
│   │   │   │   ├── OrderManagement.jsx
│   │   │   │   ├── ProductForm.jsx
│   │   │   │   ├── ProductList.jsx
│   │   │   │   ├── SalesReport.jsx
│   │   │   │   └── SellerDashboard.jsx
│   │   │   ├── sql
│   │   │   └── ui/
│   │   │       ├── Accordion.jsx
│   │   │       ├── Alert.jsx
│   │   │       ├── Avatar.jsx
│   │   │       ├── Badge.jsx
│   │   │       ├── Button.jsx
│   │   │       ├── Card.jsx
│   │   │       ├── Checkbox.jsx
│   │   │       ├── Dialog.jsx
│   │   │       ├── Drawer.jsx
│   │   │       ├── Dropdown.jsx
│   │   │       ├── ErrorBoundary.jsx
│   │   │       ├── FilterBar.jsx
│   │   │       ├── Icon.jsx
│   │   │       ├── Image.jsx
│   │   │       ├── Input.jsx
│   │   │       ├── Loading.jsx
│   │   │       ├── Modal.jsx
│   │   │       ├── Pagination.jsx
│   │   │       ├── Popover.jsx
│   │   │       ├── Progress.jsx
│   │   │       ├── Radio.jsx
│   │   │       ├── Rating.jsx
│   │   │       ├── SearchBar.jsx
│   │   │       ├── Select.jsx
│   │   │       ├── Skeleton.jsx
│   │   │       ├── SortSelect.jsx
│   │   │       ├── Spinner.jsx
│   │   │       ├── Tabs.jsx
│   │   │       ├── Textarea.jsx
│   │   │       ├── Toast.jsx
│   │   │       ├── Tooltip.jsx
│   │   │       └── UploadImage.jsx
│   │   ├── config/
│   │   │   ├── app.js
│   │   │   ├── config/
│   │   │   │   ├── categories.js
│   │   │   │   ├── menu-structure.js
│   │   │   │   └── payment-methods.js
│   │   │   ├── constants.js
│   │   │   ├── countries.js
│   │   │   ├── index.js
│   │   │   ├── routes.js
│   │   │   ├── settings.js
│   │   │   └── supabase.js
│   │   ├── contexts/
│   │   │   ├── AppContext.jsx
│   │   │   ├── AuthContext.jsx
│   │   │   ├── CartContext.jsx
│   │   │   ├── CategoryContext.jsx
│   │   │   ├── index.jsx
│   │   │   ├── NotificationContext.jsx
│   │   │   ├── SearchContext.jsx
│   │   │   ├── SecondHandContext.jsx
│   │   │   ├── StockContext.jsx
│   │   │   ├── ThemeContext.jsx
│   │   │   └── UserContext.jsx
│   │   ├── hooks/
│   │   │   ├── useAnalytics.js
│   │   │   ├── useApi.js
│   │   │   ├── useAuth.js
│   │   │   ├── useCart.js
│   │   │   ├── useCategories.js
│   │   │   ├── useDebounce.js
│   │   │   ├── useFilters.js
│   │   │   ├── useForm.js
│   │   │   ├── useLocalStorage.js
│   │   │   ├── useMultiCart.js
│   │   │   ├── useNotification.js
│   │   │   ├── useOfficialStores.js
│   │   │   ├── useOrders.js
│   │   │   ├── usePagination.js
│   │   │   ├── useProducts.js
│   │   │   ├── useRecommendations.js
│   │   │   ├── useSearch.js
│   │   │   ├── useSecondHand.js
│   │   │   ├── useStockManagement.js
│   │   │   ├── useSupabase.js
│   │   │   └── useUpload.js
│   │   ├── index.css
│   │   ├── lib/
│   │   │   ├── email-templates.js
│   │   │   ├── index.js
│   │   │   ├── resend.js
│   │   │   ├── stripe.js
│   │   │   ├── supabase.js
│   │   │   └── validation.js
│   │   ├── main.jsx
│   │   ├── orders/
│   │   │   ├── EmptyOrders.jsx
│   │   │   ├── OrderActions.jsx
│   │   │   ├── OrderCard.jsx
│   │   │   ├── OrderDetail.jsx
│   │   │   ├── OrderInvoice.jsx
│   │   │   ├── OrderItems.jsx
│   │   │   ├── OrderList.jsx
│   │   │   ├── OrderStatus.jsx
│   │   │   └── OrderTracking.jsx
│   │   ├── products/
│   │   │   ├── BrandFilter.jsx
│   │   │   ├── CategoryFilter.jsx
│   │   │   ├── CompareProducts.jsx
│   │   │   ├── PriceFilter.jsx
│   │   │   ├── ProductActions.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── ProductFilters.jsx
│   │   │   ├── ProductGrid.jsx
│   │   │   ├── ProductImages.jsx
│   │   │   ├── ProductInfo.jsx
│   │   │   ├── ProductList.jsx
│   │   │   ├── ProductReviews.jsx
│   │   │   ├── ProductSearch.jsx
│   │   │   ├── ProductSpecifications.jsx
│   │   │   ├── ProductVariants.jsx
│   │   │   ├── QuickView.jsx
│   │   │   ├── RatingFilter.jsx
│   │   │   ├── RelatedProducts.jsx
│   │   │   ├── SortOptions.jsx
│   │   │   └── WishlistButton.jsx
│   │   ├── services/
│   │   │   ├── african-payments/
│   │   │   │   ├── mobile-money.js
│   │   │   │   ├── mtn-money.js
│   │   │   │   ├── orange-money.js
│   │   │   │   └── wave-payment.js
│   │   │   ├── analyticsService.js
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── cartService.js
│   │   │   ├── categoryService.js
│   │   │   ├── index.js
│   │   │   ├── multiCartService.js
│   │   │   ├── notificationService.js
│   │   │   ├── officialStoresService.js
│   │   │   ├── orderService.js
│   │   │   ├── paymentService.js
│   │   │   ├── productService.js
│   │   │   ├── reviewService.js
│   │   │   ├── secondHandService.js
│   │   │   ├── stockService.js
│   │   │   ├── supabaseClient.js
│   │   │   ├── uploadService.js
│   │   │   └── userService.js
│   │   ├── styles/
│   │   │   ├── animations.css
│   │   │   ├── components.css
│   │   │   ├── globals.css
│   │   │   ├── notifications.css
│   │   │   ├── responsive.css
│   │   │   ├── themes.css
│   │   │   └── variables.css
│   │   └── utils/
│   │       ├── constants.js
│   │       ├── cookies.js
│   │       ├── debounce.js
│   │       ├── errorHandler.js
│   │       ├── formatters.js
│   │       ├── helpers.js
│   │       ├── imageUtils.js
│   │       ├── index.js
│   │       ├── localStorage.js
│   │       ├── priceCalculator.js
│   │       └── validators.js
│   ├── tailwind.config.js
│   ├── tests/
│   │   ├── e2e/
│   │   │   ├── checkout-flow.test.js
│   │   │   └── user-flow.test.js
│   │   ├── integration/
│   │   │   ├── auth.test.js
│   │   │   ├── cart.test.js
│   │   │   └── products.test.js
│   │   ├── jest.config.js
│   │   ├── setup.js
│   │   └── unit/
│   │       ├── components.test.js
│   │       ├── hooks.test.js
│   │       └── utils.test.js
│   └── tsconfig.json
├── Jumia.html
├── LICENSE
├── monitoring/
│   ├── deploy-monitoring.sh
│   ├── docker-compose.monitoring.yml
│   ├── grafana/
│   │   ├── dashboards/
│   │   │   ├── api-metrics.json
│   │   │   ├── business-metrics.json
│   │   │   ├── dashboard.yml
│   │   │   ├── realtime-operations.json
│   │   │   └── system-metrics.json
│   │   └── provisioning/
│   │       ├── api-metrics.json
│   │       ├── business-metrics.json
│   │       ├── dashboards.yml
│   │       └── datasources.yml
│   └── prometheus/
│       ├── alertmanager.yml
│       ├── alerts.yml
│       └── prometheus.yml
├── netlify.toml
├── nginx.conf
├── package-lock.json
├── package.json
├── railway.json
├── README.md
├── render.yaml
├── replit.md
├── scripts/
│   ├── backup.sh
│   ├── deploy.sh
│   ├── healthcheck.sh
│   ├── migrate.sh
│   ├── restore.sh
│   ├── seed.sh
│   ├── setup-server.sh
│   └── ssl-setup.sh
├── SECURITY.md
├── server.js
├── shared/
│   ├── config/
│   │   ├── app.js
│   │   └── email.js
│   ├── types/
│   │   ├── api.ts
│   │   ├── cart.ts
│   │   ├── order.ts
│   │   ├── payment.ts
│   │   ├── product.ts
│   │   └── user.ts
│   └── utils/
│       ├── constants.js
│       ├── helpers.js
│       └── validators.js
├── terraform/
│   ├── backend.tf
│   ├── main.tf
│   ├── modules/
│   │   ├── compute/
│   │   │   ├── main.tf
│   │   │   ├── outputs.tf
│   │   │   ├── README.md
│   │   │   └── variables.tf
│   │   ├── database/
│   │   │   ├── main.tf
│   │   │   ├── outputs.tf
│   │   │   ├── README.md
│   │   │   └── variables.tf
│   │   └── networking/
│   │       ├── main.tf
│   │       ├── outputs.tf
│   │       └── variables.tf
│   ├── outputs.tf
│   ├── providers.tf
│   ├── variables.tf
│   └── versions.tf
└── vercel.json
