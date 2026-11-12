/// <reference path="../pb_data/types.d.ts" />

// Fix the review moderation workflow.
//
// Root cause of "admin cannot see/approve pending reviews": the `reviews`
// collection's listRule and viewRule were `status = 'approved'` with NO admin
// exception. PocketBase applies list/view rules to EVERY request regardless of
// auth, so even an authenticated admin calling
//   getList({ filter: 'status = "pending"' })
// received an empty result — the rule already filtered out everything that
// wasn't approved before the client-side filter ran. The AdminReviewsPage
// therefore always showed "No pending reviews" and could never approve anything.
//
// This migration adds an admin bypass to list/view ONLY:
//   - Public / anonymous visitors still see ONLY approved reviews (unchanged).
//   - Authenticated admins (role = 'admin') can list/view every status, which
//     is required for moderation.
// updateRule / deleteRule were already admin-only and are left untouched.

migrate(
  (app) => {
    const reviews = app.findCollectionByNameOrId("reviews");
    reviews.listRule = "status = 'approved' || @request.auth.role = 'admin'";
    reviews.viewRule = "status = 'approved' || @request.auth.role = 'admin'";
    app.save(reviews);
  },
  (app) => {
    const reviews = app.findCollectionByNameOrId("reviews");
    reviews.listRule = "status = 'approved'";
    reviews.viewRule = "status = 'approved'";
    app.save(reviews);
  },
);
