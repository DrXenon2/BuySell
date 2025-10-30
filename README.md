```bash

buy-sell-platform/
│
├── 📄 .dockerignore
├── 📄 .env.example
├── 📄 .env.production
├── 📄 .env.development
├── 📄 .gitattributes
├── 📄 .gitignore
├── 📄 .prettierrc.json
├── 📄 .eslintrc.json
├── 📄 .babelrc
├── 📄 .nvmrc
├── 📄 docker-compose.yml
├── 📄 docker-compose.prod.yml
├── 📄 Dockerfile
├── 📄 Dockerfile.prod
├── 📄 nginx.conf
├── 📄 vercel.json
├── 📄 netlify.toml
├── 📄 render.yaml
├── 📄 railway.json
├── 📄 fly.toml
├── 📄 ecosystem.config.js
├── 📄 package.json
├── 📄 package-lock.json
├── 📄 LICENSE
├── 📄 README.md
├── 📄 CHANGELOG.md
├── 📄 CONTRIBUTING.md
├── 📄 SECURITY.md
├── 📄 CODE_OF_CONDUCT.md
│
├── 📂 .github/
│   ├── 📄 FUNDING.yml
│   ├── 📄 PULL_REQUEST_TEMPLATE.md
│   ├── 📄 ISSUE_TEMPLATE.md
│   │
│   └── 📂 workflows/
│       ├── 📄 ci.yml
│       ├── 📄 cd.yml
│       ├── 📄 deploy-production.yml
│       ├── 📄 deploy-staging.yml
│       ├── 📄 tests.yml
│       ├── 📄 security.yml
│       └── 📄 codeql-analysis.yml
│
├── 📂 backend/
│   ├── 📄 package.json
│   ├── 📄 package-lock.json
│   ├── 📄 server.js
│   ├── 📄 app.js
│   ├── 📄 config.js
│   ├── 📄 .env
│   ├── 📄 .env.example
│   ├── 📄 .eslintrc.json
│   ├── 📄 jsconfig.json
│   ├── 📄 nodemon.json
│   │
│   ├── 📂 src/
│   │   ├── 📄 index.js
│   │   ├── 📄 app.js
│   │   │
│   │   ├── 📂 config/
│   │   │   ├── 📄 index.js
│   │   │   ├── 📄 database.js
│   │   │   ├── 📄 supabase.js
│   │   │   ├── 📄 resend.js
│   │   │   ├── 📄 stripe.js
│   │   │   ├── 📄 cloudinary.js
│   │   │   ├── 📄 aws.js
│   │   │   ├── 📄 cors.js
│   │   │   ├── 📄 helmet.js
│   │   │   ├── 📄 rateLimit.js
│   │   │   └── 📄 constants.js
│   │   │
│   │   ├── 📂 controllers/
│   │   │   ├── 📄 index.js
│   │   │   ├── 📄 authController.js
│   │   │   ├── 📄 userController.js
│   │   │   ├── 📄 productController.js
│   │   │   ├── 📄 categoryController.js
│   │   │   ├── 📄 orderController.js
│   │   │   ├── 📄 cartController.js
│   │   │   ├── 📄 reviewController.js
│   │   │   ├── 📄 paymentController.js
│   │   │   ├── 📄 webhookController.js
│   │   │   ├── 📄 uploadController.js
│   │   │   ├── 📄 analyticsController.js
│   │   │   └── 📄 adminController.js
│   │   │
│   │   ├── 📂 routes/
│   │   │   ├── 📄 index.js
│   │   │   ├── 📄 auth.js
│   │   │   ├── 📄 users.js
│   │   │   ├── 📄 products.js
│   │   │   ├── 📄 categories.js
│   │   │   ├── 📄 orders.js
│   │   │   ├── 📄 cart.js
│   │   │   ├── 📄 reviews.js
│   │   │   ├── 📄 payments.js
│   │   │   ├── 📄 webhooks.js
│   │   │   ├── 📄 uploads.js
│   │   │   ├── 📄 analytics.js
│   │   │   └── 📄 admin.js
│   │   │
│   │   ├── 📂 middleware/
│   │   │   ├── 📄 index.js
│   │   │   ├── 📄 auth.js
│   │   │   ├── 📄 validation.js
│   │   │   ├── 📄 errorHandler.js
│   │   │   ├── 📄 asyncHandler.js
│   │   │   ├── 📄 logger.js
│   │   │   ├── 📄 rateLimiter.js
│   │   │   ├── 📄 sanitize.js
│   │   │   ├── 📄 cache.js
│   │   │   └── 📄 upload.js
│   │   │
│   │   ├── 📂 models/
│   │   │   ├── 📄 index.js
│   │   │   ├── 📄 User.js
│   │   │   ├── 📄 Profile.js
│   │   │   ├── 📄 Product.js
│   │   │   ├── 📄 Category.js
│   │   │   ├── 📄 Order.js
│   │   │   ├── 📄 OrderItem.js
│   │   │   ├── 📄 Cart.js
│   │   │   ├── 📄 Review.js
│   │   │   ├── 📄 Address.js
│   │   │   ├── 📄 Payment.js
│   │   │   ├── 📄 Notification.js
│   │   │   └── 📄 Settings.js
│   │   │
│   │   ├── 📂 services/
│   │   │   ├── 📄 index.js
│   │   │   ├── 📄 authService.js
│   │   │   ├── 📄 emailService.js
│   │   │   ├── 📄 paymentService.js
│   │   │   ├── 📄 notificationService.js
│   │   │   ├── 📄 storageService.js
│   │   │   ├── 📄 analyticsService.js
│   │   │   ├── 📄 cacheService.js
│   │   │   ├── 📄 supabaseService.js
│   │   │   └── 📄 reportService.js
│   │   │
│   │   ├── 📂 utils/
│   │   │   ├── 📄 index.js
│   │   │   ├── 📄 helpers.js
│   │   │   ├── 📄 validators.js
│   │   │   ├── 📄 formatters.js
│   │   │   ├── 📄 generators.js
│   │   │   ├── 📄 logger.js
│   │   │   ├── 📄 security.js
│   │   │   ├── 📄 imageProcessing.js
│   │   │   └── 📄 apiResponse.js
│   │   │
│   │   ├── 📂 validations/
│   │   │   ├── 📄 index.js
│   │   │   ├── 📄 authValidation.js
│   │   │   ├── 📄 userValidation.js
│   │   │   ├── 📄 productValidation.js
│   │   │   ├── 📄 orderValidation.js
│   │   │   ├── 📄 paymentValidation.js
│   │   │   └── 📄 reviewValidation.js
│   │   │
│   │   ├── 📂 jobs/
│   │   │   ├── 📄 index.js
│   │   │   ├── 📄 emailJobs.js
│   │   │   ├── 📄 cleanupJobs.js
│   │   │   ├── 📄 reportJobs.js
│   │   │   └── 📄 notificationJobs.js
│   │   │
│   │   └── 📂 docs/
│   │       ├── 📄 api.yaml
│   │       ├── 📄 swagger.json
│   │       └── 📄 postman.json
│   │
│   ├── 📂 supabase/
│   │   ├── 📄 config.toml
│   │   ├── 📄 .env.local
│   │   │
│   │   ├── 📂 migrations/
│   │   │   ├── 📄 001_initial_schema.sql
│   │   │   ├── 📄 002_auth_policies.sql
│   │   │   ├── 📄 003_sample_data.sql
│   │   │   ├── 📄 004_rls_policies.sql
│   │   │   ├── 📄 005_indexes_optimization.sql
│   │   │   ├── 📄 006_functions_triggers.sql
│   │   │   └── 📄 007_security_policies.sql
│   │   │
│   │   ├── 📂 seed_data/
│   │   │   ├── 📄 categories.sql
│   │   │   ├── 📄 products.sql
│   │   │   ├── 📄 users.sql
│   │   │   ├── 📄 settings.sql
│   │   │   └── 📄 countries.sql
│   │   │
│   │   ├── 📂 storage/
│   │   │   ├── 📄 buckets.sql
│   │   │   ├── 📄 policies.sql
│   │   │   └── 📄 config.sql
│   │   │
│   │   └── 📂 functions/
│   │       ├── 📄 package.json
│   │       │
│   │       ├── 📂 auth/
│   │       │   ├── 📄 handle_new_user.sql
│   │       │   ├── 📄 handle_email_verification.sql
│   │       │   └── 📄 handle_password_reset.sql
│   │       │
│   │       ├── 📂 payments/
│   │       │   ├── 📄 process_payment.sql
│   │       │   ├── 📄 handle_webhook.sql
│   │       │   └── 📄 create_payment_intent.sql
│   │       │
│   │       ├── 📂 orders/
│   │       │   ├── 📄 create_order.sql
│   │       │   ├── 📄 update_order_status.sql
│   │       │   └── 📄 cancel_order.sql
│   │       │
│   │       ├── 📂 products/
│   │       │   ├── 📄 update_product_rating.sql
│   │       │   ├── 📄 handle_low_stock.sql
│   │       │   └── 📄 search_products.sql
│   │       │
│   │       └── 📂 utils/
│   │           ├── 📄 generate_order_number.sql
│   │           └── 📄 update_updated_at.sql
│   │
│   ├── 📂 scripts/
│   │   ├── 📄 deploy.sh
│   │   ├── 📄 backup_database.sh
│   │   ├── 📄 restore_database.sh
│   │   ├── 📄 seed_database.js
│   │   ├── 📄 migrate.js
│   │   ├── 📄 setup.js
│   │   └── 📄 healthcheck.js
│   │
│   └── 📂 tests/
│       ├── 📄 setup.js
│       ├── 📄 teardown.js
│       ├── 📄 jest.config.js
│       │
│       ├── 📂 unit/
│       │   ├── 📄 auth.test.js
│       │   ├── 📄 products.test.js
│       │   ├── 📄 orders.test.js
│       │   └── 📄 payments.test.js
│       │
│       ├── 📂 integration/
│       │   ├── 📄 api.test.js
│       │   ├── 📄 auth.test.js
│       │   └── 📄 orders.test.js
│       │
│       └── 📂 e2e/
│           ├── 📄 user-flow.test.js
│           └── 📄 admin-flow.test.js
│
├── 📂 frontend/
│   ├── 📄 .env.local
│   ├── 📄 .env.production
│   ├── 📄 .eslintrc.json
│   ├── 📄 .prettierrc.json
│   ├── 📄 next.config.js
│   ├── 📄 tailwind.config.js
│   ├── 📄 postcss.config.js
│   ├── 📄 tsconfig.json
│   ├── 📄 jsconfig.json
│   ├── 📄 sitemap.config.js
│   ├── 📄 robots.config.js
│   ├── 📄 package.json
│   ├── 📄 package-lock.json
│   │
│   ├── 📂 public/
│   │   ├── 📄 favicon.ico
│   │   ├── 📄 manifest.json
│   │   ├── 📄 robots.txt
│   │   ├── 📄 sitemap.xml
│   │   │
│   │   ├── 📂 images/
│   │   │   ├── 📂 icons/
│   │   │   │   ├── 📄 cart.svg
│   │   │   │   ├── 📄 user.svg
│   │   │   │   ├── 📄 search.svg
│   │   │   │   ├── 📄 heart.svg
│   │   │   │   ├── 📄 star.svg
│   │   │   │   ├── 📄 menu.svg
│   │   │   │   ├── 📄 close.svg
│   │   │   │   ├── 📄 arrow-right.svg
│   │   │   │   ├── 📄 arrow-left.svg
│   │   │   │   ├── 📄 chevron-down.svg
│   │   │   │   ├── 📄 chevron-up.svg
│   │   │   │   ├── 📄 check.svg
│   │   │   │   ├── 📄 error.svg
│   │   │   │   ├── 📄 warning.svg
│   │   │   │   ├── 📄 info.svg
│   │   │   │   ├── 📄 success.svg
│   │   │   │   ├── 📄 loading.svg
│   │   │   │   ├── 📄 home.svg
│   │   │   │   ├── 📄 category.svg
│   │   │   │   ├── 📄 orders.svg
│   │   │   │   ├── 📄 profile.svg
│   │   │   │   ├── 📄 settings.svg
│   │   │   │   ├── 📄 logout.svg
│   │   │   │   ├── 📄 dashboard.svg
│   │   │   │   ├── 📄 products.svg
│   │   │   │   ├── 📄 analytics.svg
│   │   │   │   ├── 📄 customers.svg
│   │   │   │   ├── 📄 payments.svg
│   │   │   │   └── 📄 shipping.svg
│   │   │   │
│   │   │   ├── 📂 logos/
│   │   │   │   ├── 📄 logo.png
│   │   │   │   ├── 📄 logo.svg
│   │   │   │   ├── 📄 favicon-16x16.png
│   │   │   │   ├── 📄 favicon-32x32.png
│   │   │   │   ├── 📄 apple-touch-icon.png
│   │   │   │   └── 📄 android-chrome-192x192.png
│   │   │   │
│   │   │   ├── 📂 products/
│   │   │   │   ├── 📄 placeholder.jpg
│   │   │   │   ├── 📄 product-default.png
│   │   │   │   └── 📄 image-not-found.png
│   │   │   │
│   │   │   ├── 📂 categories/
│   │   │   │   ├── 📄 electronics.jpg
│   │   │   │   ├── 📄 fashion.jpg
│   │   │   │   ├── 📄 home.jpg
│   │   │   │   ├── 📄 beauty.jpg
│   │   │   │   ├── 📄 sports.jpg
│   │   │   │   └── 📄 books.jpg
│   │   │   │
│   │   │   └── 📂 payments/
│   │   │       ├── 📄 visa.png
│   │   │       ├── 📄 mastercard.png
│   │   │       ├── 📄 paypal.png
│   │   │       ├── 📄 orange-money.png
│   │   │       ├── 📄 mtn-money.png
│   │   │       └── 📄 wave.png
│   │   │
│   │   └── 📂 locales/
│   │       ├── 📄 fr.json
│   │       ├── 📄 en.json
│   │       └── 📄 ar.json
│   │
│   ├── 📂 src/
│   │   ├── 📄 app.js
│   │   ├── 📄 main.jsx
│   │   ├── 📄 index.css
│   │   ├── 📄 App.css
│   │   │
│   │   ├── 📂 app/ (Next.js App Router)
│   │   │   ├── 📄 layout.jsx
│   │   │   ├── 📄 page.jsx
│   │   │   ├── 📄 loading.jsx
│   │   │   ├── 📄 error.jsx
│   │   │   ├── 📄 not-found.jsx
│   │   │   ├── 📄 globals.css
│   │   │   │
│   │   │   ├── 📂 api/
│   │   │   │   ├── 📂 auth/
│   │   │   │   │   ├── 📄 route.js
│   │   │   │   │   └── 📄 callback.js
│   │   │   │   │
│   │   │   │   ├── 📂 webhooks/
│   │   │   │   │   ├── 📄 stripe.js
│   │   │   │   │   └── 📄 supabase.js
│   │   │   │   │
│   │   │   │   └── 📂 upload/
│   │   │   │       └── 📄 route.js
│   │   │   │
│   │   │   ├── 📂 (auth)/
│   │   │   │   ├── 📂 login/
│   │   │   │   │   ├── 📄 page.jsx
│   │   │   │   │   └── 📄 layout.jsx
│   │   │   │   │
│   │   │   │   ├── 📂 register/
│   │   │   │   │   ├── 📄 page.jsx
│   │   │   │   │   └── 📄 layout.jsx
│   │   │   │   │
│   │   │   │   ├── 📂 forgot-password/
│   │   │   │   │   ├── 📄 page.jsx
│   │   │   │   │   └── 📄 layout.jsx
│   │   │   │   │
│   │   │   │   └── 📂 reset-password/
│   │   │   │       ├── 📄 page.jsx
│   │   │   │       └── 📄 layout.jsx
│   │   │   │
│   │   │   ├── 📂 products/
│   │   │   │   ├── 📄 page.jsx
│   │   │   │   ├── 📄 layout.jsx
│   │   │   │   │
│   │   │   │   ├── 📂 [id]/
│   │   │   │   │   ├── 📄 page.jsx
│   │   │   │   │   └── 📄 loading.jsx
│   │   │   │   │
│   │   │   │   └── 📂 category/
│   │   │   │       ├── 📂 [slug]/
│   │   │   │       │   └── 📄 page.jsx
│   │   │   │       │
│   │   │   │       └── 📄 page.jsx
│   │   │   │
│   │   │   ├── 📂 cart/
│   │   │   │   ├── 📄 page.jsx
│   │   │   │   └── 📄 layout.jsx
│   │   │   │
│   │   │   ├── 📂 checkout/
│   │   │   │   ├── 📄 page.jsx
│   │   │   │   ├── 📄 layout.jsx
│   │   │   │   │
│   │   │   │   ├── 📂 shipping/
│   │   │   │   │   └── 📄 page.jsx
│   │   │   │   │
│   │   │   │   ├── 📂 payment/
│   │   │   │   │   └── 📄 page.jsx
│   │   │   │   │
│   │   │   │   └── 📂 confirmation/
│   │   │   │       └── 📄 page.jsx
│   │   │   │
│   │   │   ├── 📂 dashboard/
│   │   │   │   ├── 📄 layout.jsx
│   │   │   │   │
│   │   │   │   ├── 📂 seller/
│   │   │   │   │   ├── 📄 page.jsx
│   │   │   │   │   │
│   │   │   │   │   ├── 📂 products/
│   │   │   │   │   │   ├── 📄 page.jsx
│   │   │   │   │   │   │
│   │   │   │   │   │   ├── 📂 new/
│   │   │   │   │   │   │   └── 📄 page.jsx
│   │   │   │   │   │   │
│   │   │   │   │   │   ├── 📂 [id]/
│   │   │   │   │   │   │   ├── 📄 page.jsx
│   │   │   │   │   │   │   └── 📄 edit.jsx
│   │   │   │   │   │   │
│   │   │   │   │   │   └── 📂 categories/
│   │   │   │   │   │       └── 📄 page.jsx
│   │   │   │   │   │
│   │   │   │   │   ├── 📂 orders/
│   │   │   │   │   │   ├── 📄 page.jsx
│   │   │   │   │   │   │
│   │   │   │   │   │   ├── 📂 [id]/
│   │   │   │   │   │   │   └── 📄 page.jsx
│   │   │   │   │   │   │
│   │   │   │   │   │   └── 📂 analytics/
│   │   │   │   │   │       └── 📄 page.jsx
│   │   │   │   │   │
│   │   │   │   │   └── 📂 settings/
│   │   │   │   │       └── 📄 page.jsx
│   │   │   │   │
│   │   │   │   └── 📂 admin/
│   │   │   │       ├── 📄 page.jsx
│   │   │   │       │
│   │   │   │       ├── 📂 users/
│   │   │   │       │   ├── 📄 page.jsx
│   │   │   │       │   │
│   │   │   │       │   ├── 📂 [id]/
│   │   │   │       │   │   └── 📄 page.jsx
│   │   │   │       │   │
│   │   │   │       │   └── 📂 sellers/
│   │   │   │       │       └── 📄 page.jsx
│   │   │   │       │
│   │   │   │       ├── 📂 products/
│   │   │   │       │   └── 📄 page.jsx
│   │   │   │       │
│   │   │   │       ├── 📂 categories/
│   │   │   │       │   └── 📄 page.jsx
│   │   │   │       │
│   │   │   │       ├── 📂 orders/
│   │   │   │       │   └── 📄 page.jsx
│   │   │   │       │
│   │   │   │       └── 📂 analytics/
│   │   │   │           └── 📄 page.jsx
│   │   │   │
│   │   │   ├── 📂 profile/
│   │   │   │   ├── 📄 page.jsx
│   │   │   │   │
│   │   │   │   ├── 📂 orders/
│   │   │   │   │   ├── 📄 page.jsx
│   │   │   │   │   │
│   │   │   │   │   ├── 📂 [id]/
│   │   │   │   │   │   └── 📄 page.jsx
│   │   │   │   │   │
│   │   │   │   │   └── 📂 tracking/
│   │   │   │   │       └── 📄 page.jsx
│   │   │   │   │
│   │   │   │   ├── 📂 addresses/
│   │   │   │   │   └── 📄 page.jsx
│   │   │   │   │
│   │   │   │   ├── 📂 wishlist/
│   │   │   │   │   └── 📄 page.jsx
│   │   │   │   │
│   │   │   │   └── 📂 settings/
│   │   │   │       └── 📄 page.jsx
│   │   │   │
│   │   │   └── 📂 admin/
│   │   │       ├── 📄 layout.jsx
│   │   │       │
│   │   │       ├── 📂 users/
│   │   │       │   └── 📄 page.jsx
│   │   │       │
│   │   │       ├── 📂 products/
│   │   │       │   └── 📄 page.jsx
│   │   │       │
│   │   │       ├── 📂 orders/
│   │   │       │   └── 📄 page.jsx
│   │   │       │
│   │   │       └── 📂 analytics/
│   │   │           └── 📄 page.jsx
│   │   │
│   │   ├── 📂 components/ (Pages Router)
│   │   │   ├── 📄 App.jsx
│   │   │   ├── 📄 Main.jsx
│   │   │   │
│   │   │   ├── 📂 layout/
│   │   │   │   ├── 📄 Header.jsx
│   │   │   │   ├── 📄 Footer.jsx
│   │   │   │   ├── 📄 Navigation.jsx
│   │   │   │   ├── 📄 Sidebar.jsx
│   │   │   │   ├── 📄 MobileMenu.jsx
│   │   │   │   ├── 📄 Breadcrumb.jsx
│   │   │   │   └── 📄 Layout.jsx
│   │   │   │
│   │   │   ├── 📂 ui/
│   │   │   │   ├── 📄 Button.jsx
│   │   │   │   ├── 📄 Input.jsx
│   │   │   │   ├── 📄 Textarea.jsx
│   │   │   │   ├── 📄 Select.jsx
│   │   │   │   ├── 📄 Checkbox.jsx
│   │   │   │   ├── 📄 Radio.jsx
│   │   │   │   ├── 📄 Modal.jsx
│   │   │   │   ├── 📄 Dialog.jsx
│   │   │   │   ├── 📄 Drawer.jsx
│   │   │   │   ├── 📄 Toast.jsx
│   │   │   │   ├── 📄 Alert.jsx
│   │   │   │   ├── 📄 Badge.jsx
│   │   │   │   ├── 📄 Card.jsx
│   │   │   │   ├── 📄 Tabs.jsx
│   │   │   │   ├── 📄 Accordion.jsx
│   │   │   │   ├── 📄 Dropdown.jsx
│   │   │   │   ├── 📄 Pagination.jsx
│   │   │   │   ├── 📄 Progress.jsx
│   │   │   │   ├── 📄 Skeleton.jsx
│   │   │   │   ├── 📄 Tooltip.jsx
│   │   │   │   ├── 📄 Popover.jsx
│   │   │   │   ├── 📄 Avatar.jsx
│   │   │   │   ├── 📄 Image.jsx
│   │   │   │   ├── 📄 Icon.jsx
│   │   │   │   ├── 📄 Spinner.jsx
│   │   │   │   ├── 📄 Loading.jsx
│   │   │   │   ├── 📄 ErrorBoundary.jsx
│   │   │   │   ├── 📄 SearchBar.jsx
│   │   │   │   ├── 📄 FilterBar.jsx
│   │   │   │   ├── 📄 SortSelect.jsx
│   │   │   │   └── 📄 Rating.jsx
│   │   │   │
│   │   │   ├── 📂 auth/
│   │   │   │   ├── 📄 LoginForm.jsx
│   │   │   │   ├── 📄 RegisterForm.jsx
│   │   │   │   ├── 📄 ForgotPasswordForm.jsx
│   │   │   │   ├── 📄 ResetPasswordForm.jsx
│   │   │   │   ├── 📄 AuthLayout.jsx
│   │   │   │   ├── 📄 SocialAuth.jsx
│   │   │   │   ├── 📄 AuthGuard.jsx
│   │   │   │   ├── 📄 RoleGuard.jsx
│   │   │   │   └── 📄 ProfileMenu.jsx
│   │   │   │
│   │   │   ├── 📂 products/
│   │   │   │   ├── 📄 ProductCard.jsx
│   │   │   │   ├── 📄 ProductGrid.jsx
│   │   │   │   ├── 📄 ProductList.jsx
│   │   │   │   ├── 📄 ProductDetail.jsx
│   │   │   │   ├── 📄 ProductImages.jsx
│   │   │   │   ├── 📄 ProductInfo.jsx
│   │   │   │   ├── 📄 ProductActions.jsx
│   │   │   │   ├── 📄 ProductVariants.jsx
│   │   │   │   ├── 📄 ProductReviews.jsx
│   │   │   │   ├── 📄 ProductSpecifications.jsx
│   │   │   │   ├── 📄 RelatedProducts.jsx
│   │   │   │   ├── 📄 ProductSearch.jsx
│   │   │   │   ├── 📄 ProductFilters.jsx
│   │   │   │   ├── 📄 CategoryFilter.jsx
│   │   │   │   ├── 📄 PriceFilter.jsx
│   │   │   │   ├── 📄 BrandFilter.jsx
│   │   │   │   ├── 📄 RatingFilter.jsx
│   │   │   │   ├── 📄 SortOptions.jsx
│   │   │   │   ├── 📄 QuickView.jsx
│   │   │   │   ├── 📄 CompareProducts.jsx
│   │   │   │   └── 📄 WishlistButton.jsx
│   │   │   │
│   │   │   ├── 📂 cart/
│   │   │   │   ├── 📄 CartItem.jsx
│   │   │   │   ├── 📄 CartList.jsx
│   │   │   │   ├── 📄 CartSummary.jsx
│   │   │   │   ├── 📄 CartTotal.jsx
│   │   │   │   ├── 📄 CartSidebar.jsx
│   │   │   │   ├── 📄 EmptyCart.jsx
│   │   │   │   ├── 📄 CartQuantity.jsx
│   │   │   │   ├── 📄 AddToCart.jsx
│   │   │   │   ├── 📄 CartButton.jsx
│   │   │   │   └── 📄 MiniCart.jsx
│   │   │   │
│   │   │   ├── 📂 checkout/
│   │   │   │   ├── 📄 CheckoutSteps.jsx
│   │   │   │   ├── 📄 ShippingForm.jsx
│   │   │   │   ├── 📄 BillingForm.jsx
│   │   │   │   ├── 📄 PaymentForm.jsx
│   │   │   │   ├── 📄 OrderSummary.jsx
│   │   │   │   ├── 📄 AddressSelect.jsx
│   │   │   │   ├── 📄 ShippingOptions.jsx
│   │   │   │   ├── 📄 PaymentMethods.jsx
│   │   │   │   ├── 📄 CouponCode.jsx
│   │   │   │   ├── 📄 OrderConfirmation.jsx
│   │   │   │   └── 📄 CheckoutGuard.jsx
│   │   │   │
│   │   │   ├── 📂 orders/
│   │   │   │   ├── 📄 OrderCard.jsx
│   │   │   │   ├── 📄 OrderList.jsx
│   │   │   │   ├── 📄 OrderDetail.jsx
│   │   │   │   ├── 📄 OrderItems.jsx
│   │   │   │   ├── 📄 OrderStatus.jsx
│   │   │   │   ├── 📄 OrderTracking.jsx
│   │   │   │   ├── 📄 OrderActions.jsx
│   │   │   │   ├── 📄 OrderInvoice.jsx
│   │   │   │   └── 📄 EmptyOrders.jsx
│   │   │   │
│   │   │   ├── 📂 reviews/
│   │   │   │   ├── 📄 ReviewCard.jsx
│   │   │   │   ├── 📄 ReviewList.jsx
│   │   │   │   ├── 📄 ReviewForm.jsx
│   │   │   │   ├── 📄 ReviewStats.jsx
│   │   │   │   ├── 📄 RatingInput.jsx
│   │   │   │   ├── 📄 ReviewFilters.jsx
│   │   │   │   └── 📄 VerifiedBadge.jsx
│   │   │   │
│   │   │   ├── 📂 dashboard/
│   │   │   │   ├── 📄 DashboardLayout.jsx
│   │   │   │   ├── 📄 SidebarMenu.jsx
│   │   │   │   ├── 📄 StatsCard.jsx
│   │   │   │   ├── 📄 Chart.jsx
│   │   │   │   ├── 📄 DataTable.jsx
│   │   │   │   ├── 📄 Pagination.jsx
│   │   │   │   ├── 📄 SearchFilter.jsx
│   │   │   │   ├── 📄 ActionButtons.jsx
│   │   │   │   └── 📄 EmptyState.jsx
│   │   │   │
│   │   │   ├── 📂 seller/
│   │   │   │   ├── 📄 SellerDashboard.jsx
│   │   │   │   ├── 📄 ProductForm.jsx
│   │   │   │   ├── 📄 ProductList.jsx
│   │   │   │   ├── 📄 OrderManagement.jsx
│   │   │   │   ├── 📄 AnalyticsChart.jsx
│   │   │   │   ├── 📄 InventoryManagement.jsx
│   │   │   │   └── 📄 SalesReport.jsx
│   │   │   │
│   │   │   └── 📂 admin/
│   │   │       ├── 📄 AdminDashboard.jsx
│   │   │       ├── 📄 UserManagement.jsx
│   │   │       ├── 📄 ProductManagement.jsx
│   │   │       ├── 📄 OrderManagement.jsx
│   │   │       ├── 📄 CategoryManagement.jsx
│   │   │       ├── 📄 SystemSettings.jsx
│   │   │       └── 📄 Reports.jsx
│   │   │
│   │   ├── 📂 contexts/
│   │   │   ├── 📄 AuthContext.jsx
│   │   │   ├── 📄 CartContext.jsx
│   │   │   ├── 📄 ThemeContext.jsx
│   │   │   ├── 📄 NotificationContext.jsx
│   │   │   ├── 📄 SearchContext.jsx
│   │   │   └── 📄 AppContext.jsx
│   │   │
│   │   ├── 📂 hooks/
│   │   │   ├── 📄 useAuth.js
│   │   │   ├── 📄 useProducts.js
│   │   │   ├── 📄 useCart.js
│   │   │   ├── 📄 useOrders.js
│   │   │   ├── 📄 useSupabase.js
│   │   │   ├── 📄 useLocalStorage.js
│   │   │   ├── 📄 useDebounce.js
│   │   │   ├── 📄 usePagination.js
│   │   │   ├── 📄 useForm.js
│   │   │   ├── 📄 useApi.js
│   │   │   ├── 📄 useNotification.js
│   │   │   ├── 📄 useSearch.js
│   │   │   ├── 📄 useFilters.js
│   │   │   └── 📄 useAnalytics.js
│   │   │
│   │   ├── 📂 services/
│   │   │   ├── 📄 api.js
│   │   │   ├── 📄 supabaseClient.js
│   │   │   ├── 📄 authService.js
│   │   │   ├── 📄 productService.js
│   │   │   ├── 📄 orderService.js
│   │   │   ├── 📄 cartService.js
│   │   │   ├── 📄 paymentService.js
│   │   │   ├── 📄 reviewService.js
│   │   │   ├── 📄 userService.js
│   │   │   ├── 📄 uploadService.js
│   │   │   ├── 📄 analyticsService.js
│   │   │   └── 📄 notificationService.js
│   │   │
│   │   ├── 📂 utils/
│   │   │   ├── 📄 helpers.js
│   │   │   ├── 📄 validators.js
│   │   │   ├── 📄 formatters.js
│   │   │   ├── 📄 constants.js
│   │   │   ├── 📄 debounce.js
│   │   │   ├── 📄 localStorage.js
│   │   │   ├── 📄 cookies.js
│   │   │   ├── 📄 errorHandler.js
│   │   │   ├── 📄 imageUtils.js
│   │   │   └── 📄 priceCalculator.js
│   │   │
│   │   ├── 📂 styles/
│   │   │   ├── 📄 globals.css
│   │   │   ├── 📄 variables.css
│   │   │   ├── 📄 components.css
│   │   │   ├── 📄 responsive.css
│   │   │   ├── 📄 animations.css
│   │   │   └── 📄 themes.css
│   │   │
│   │   ├── 📂 assets/
│   │   │   ├── 📂 icons/
│   │   │   └── 📂 images/
│   │   │
│   │   ├── 📂 config/
│   │   │   ├── 📄 routes.js
│   │   │   ├── 📄 app.js
│   │   │   ├── 📄 supabase.js
│   │   │   ├── 📄 constants.js
│   │   │   ├── 📄 settings.js
│   │   │   └── 📄 countries.js
│   │   │
│   │   └── 📂 lib/
│   │       ├── 📄 supabase.js
│   │       ├── 📄 resend.js
│   │       ├── 📄 stripe.js
│   │       ├── 📄 validation.js
│   │       └── 📄 email-templates.js
│   │
│   ├── 📂 tests/
│   │   ├── 📄 setup.js
│   │   ├── 📄 jest.config.js
│   │   │
│   │   ├── 📂 unit/
│   │   │   ├── 📄 components.test.js
│   │   │   ├── 📄 hooks.test.js
│   │   │   └── 📄 utils.test.js
│   │   │
│   │   ├── 📂 integration/
│   │   │   ├── 📄 auth.test.js
│   │   │   ├── 📄 products.test.js
│   │   │   └── 📄 cart.test.js
│   │   │
│   │   └── 📂 e2e/
│   │       ├── 📄 user-flow.test.js
│   │       └── 📄 checkout-flow.test.js
│   │
│   └── 📂 scripts/
│       ├── 📄 build.js
│       ├── 📄 deploy.js
│       ├── 📄 sitemap.js
│       └── 📄 generate-icons.js
│
├── 📂 shared/
│   ├── 📂 types/
│   │   ├── 📄 user.ts
│   │   ├── 📄 product.ts
│   │   ├── 📄 order.ts
│   │   ├── 📄 cart.ts
│   │   ├── 📄 payment.ts
│   │   └── 📄 api.ts
│   │
│   ├── 📂 utils/
│   │   ├── 📄 constants.js
│   │   ├── 📄 helpers.js
│   │   └── 📄 validators.js
│   │
│   └── 📂 config/
│       ├── 📄 app.js
│       └── 📄 email.js
│
├── 📂 docs/
│   ├── 📄 API_DOCUMENTATION.md
│   ├── 📄 DEPLOYMENT_GUIDE.md
│   ├── 📄 DATABASE_SCHEMA.md
│   ├── 📄 USER_GUIDE.md
│   ├── 📄 DEVELOPER_GUIDE.md
│   ├── 📄 API_REFERENCE.md
│   ├── 📄 SETUP_GUIDE.md
│   └── 📄 TROUBLESHOOTING.md
│
├── 📂 scripts/
│   ├── 📄 deploy.sh
│   ├── 📄 backup.sh
│   ├── 📄 restore.sh
│   ├── 📄 migrate.sh
│   ├── 📄 seed.sh
│   ├── 📄 healthcheck.sh
│   ├── 📄 setup-server.sh
│   └── 📄 ssl-setup.sh
│
├── 📂 terraform/
│   ├── 📄 main.tf
│   ├── 📄 variables.tf
│   ├── 📄 outputs.tf
│   ├── 📄 backend.tf
│   └── 📂 modules/
│       ├── 📂 database/
│       │   ├── 📄 main.tf
│       │   ├── 📄 variables.tf
│       │   └── 📄 outputs.tf
│       │
│       ├── 📂 compute/
│       │   ├── 📄 main.tf
│       │   ├── 📄 variables.tf
│       │   └── 📄 outputs.tf
│       │
│       └── 📂 networking/
│           ├── 📄 main.tf
│           ├── 📄 variables.tf
│           └── 📄 outputs.tf
│
└── 📂 monitoring/
    ├── 📄 docker-compose.monitoring.yml
    ├── 📂 prometheus/
    │   ├── 📄 prometheus.yml
    │   └── 📄 alerts.yml
    │
    └── 📂 grafana/
        ├── 📂 dashboards/
        │   ├── 📄 dashboard.yml
        │   ├── 📄 api-metrics.json
        │   ├── 📄 business-metrics.json
        │   └── 📄 system-metrics.json
        │
        └── 📂 provisioning/
            ├── 📄 dashboards.yml
            └── 📄 datasources.yml.    Je fais quoi ?

