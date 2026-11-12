/// <reference path="../pb_data/types.d.ts" />

// Remove the clearly-labelled end-to-end workflow test review created during
// verification of automatic review publication. Identified by its exact
// customer_name. Safe no-op on any database that does not contain it
// (e.g. production, which never received this test submission).

migrate(
  (app) => {
    let testReviews = [];
    try {
      testReviews = app.findRecordsByFilter(
        "reviews",
        "customer_name = 'Auto Publish Workflow Test'",
        "",
        0,
        0,
      );
    } catch (e) {
      if (e.message && e.message.includes("no rows in result set")) {
        testReviews = [];
      } else {
        throw e;
      }
    }
    testReviews.forEach((r) => {
      app.delete(r);
    });
  },
  (app) => {
    // One-way cleanup; nothing to restore.
  },
);
