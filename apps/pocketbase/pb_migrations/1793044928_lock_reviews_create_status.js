/// <reference path="../pb_data/types.d.ts" />

// Security hardening for the `reviews` collection.
//
// Root-cause diagnosis of the reported "reviews not showing" issue found NO
// persistence or retrieval bug: POST persists correctly and GET returns
// approved reviews correctly. The empty public list is simply because every
// submitted review starts as `status = 'pending'` and the public list/view
// rules filter `status = 'approved'` — i.e. moderation working as designed.
//
// The one real defect found: `createRule` was `""` (anyone can create) with
// no constraint on the `status` field, so a client could POST
// `status: 'approved'` directly and bypass moderation entirely. This migration
// tightens the create rule so public submissions are forced to `pending`,
// preserving the existing moderation flow (admin still approves via the
// admin UI, which uses an admin JWT that bypasses these rules).
//
// It also removes the two diagnostic test reviews created during diagnosis
// (by customer_name), so no fake test data reaches the published site.

migrate(
  (app) => {
    const reviews = app.findCollectionByNameOrId("reviews");

    // Force public submissions to start as 'pending'. The WriteReviewDialog
    // already sends status='pending'; this enforces it server-side so the
    // moderation gate cannot be bypassed by a direct API call.
    reviews.createRule = "@request.body.status = 'pending'";

    app.save(reviews);

    // ---- Clean up diagnostic test reviews created during diagnosis ----
    // Safe no-op on any database that doesn't contain them (e.g. production).
    const testReviews = app.findRecordsByFilter(
      "reviews",
      "customer_name = 'Diag Test' || customer_name = 'Approved Test User'",
      "",
      0,
      0,
    );
    testReviews.forEach((r) => {
      app.delete(r);
    });
  },
  (app) => {
    // Revert: restore the original open create rule.
    const reviews = app.findCollectionByNameOrId("reviews");
    reviews.createRule = "";
    app.save(reviews);
  },
);
