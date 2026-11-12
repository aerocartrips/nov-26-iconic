/// <reference path="../pb_data/types.d.ts" />

// Automatic publication of customer reviews.
//
// Root cause of "reviews not appearing on the public Reviews page": every
// submission was forced to `status = 'pending'` by the create rule
// (`@request.body.status = 'pending'`), while the public list/view rules only
// expose `status = 'approved'`. So genuine customer reviews sat invisibly in
// the database waiting for admin approval that the site owner did not want to
// perform manually.
//
// This migration switches the normal publication workflow to automatic:
//   - The create rule now forces public submissions to `status = 'approved'`,
//     so a valid review is published the moment it is saved. Clients still
//     cannot pick an arbitrary status (e.g. they cannot self-set a "rejected"
//     or future status), and admin-only update/delete rules are unchanged.
//   - Existing pending reviews that carry genuine submitted data AND explicit
//     consent are migrated to `approved` so previously-submitted customer
//     feedback becomes visible. Reviews that look like diagnostic/test data
//     (name contains "test"/"diag") are intentionally left pending so no test
//     content is promoted as genuine customer feedback.
//
// Admin moderation remains available (feature / verify purchase / reject /
// delete) but is no longer a prerequisite for ordinary reviews to appear.

migrate(
  (app) => {
    const reviews = app.findCollectionByNameOrId("reviews");

    // Force every public submission to be published immediately.
    reviews.createRule = "@request.body.status = 'approved'";
    app.save(reviews);

    // ---- Migrate eligible pending reviews to approved ----
    let pending = [];
    try {
      pending = app.findRecordsByFilter("reviews", "status = 'pending'", "", 0, 0);
    } catch (e) {
      if (e.message && e.message.includes("no rows in result set")) {
        pending = [];
      } else {
        throw e;
      }
    }

    for (const r of pending) {
      const name = String(r.get("customer_name") || "").trim();
      const text = String(r.get("review_text") || "").trim();
      const product = String(r.get("product_purchased") || "").trim();
      const category = String(r.get("category") || "").trim();
      const rating = Number(r.get("rating"));
      const consent = r.get("consent") === true;

      // Skip anything that looks like diagnostic/test data — never promote
      // test content as a genuine customer review.
      const looksLikeTest = /test|diag/i.test(name) || /test|diag/i.test(product);

      const genuine =
        consent &&
        !looksLikeTest &&
        name.length > 0 &&
        product.length > 0 &&
        category.length > 0 &&
        text.length >= 10 &&
        rating >= 1 &&
        rating <= 5;

      if (genuine) {
        r.set("status", "approved");
        app.save(r);
      }
    }
  },
  (app) => {
    // Revert the create rule to the previous pending-only behaviour.
    // The one-way data migration (pending -> approved) is intentionally NOT
    // reversed: we cannot reliably tell which approved reviews were originally
    // pending vs. already approved, and reverting would hide genuine customer
    // feedback again.
    const reviews = app.findCollectionByNameOrId("reviews");
    reviews.createRule = "@request.body.status = 'pending'";
    app.save(reviews);
  },
);
