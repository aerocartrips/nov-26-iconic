/// <reference path="../pb_data/types.d.ts" />

// Customer Reviews & Testimonials feature.
// 1. Adds a locked `role` select field to the `users` auth collection so an
//    administrator can moderate reviews (role = 'admin'). The field is locked
//    per hard rule #4 so a member cannot self-promote.
// 2. Creates a `reviews` collection. Submissions are anonymous-create,
//    public-read only when status = 'approved', and admin-only write/delete.
//    Nothing is ever auto-published — every review starts as 'pending'.

migrate(
  (app) => {
    // ---- 1. Add locked `role` field to users ----
    const users = app.findCollectionByNameOrId("users");

    if (!users.fields.getByName("role")) {
      users.fields.add(
        new SelectField({
          name: "role",
          required: false,
          maxSelect: 1,
          values: ["member", "admin"],
        }),
      );
    }

    // Lock the privileged `role` field on create + update.
    // Public sign-up may omit role or set it to 'member' only.
    users.createRule =
      "@request.body.role:isset = false || @request.body.role = 'member'";
    // A member can edit their own profile but cannot change their role;
    // only an admin may change anyone's role.
    users.updateRule =
      "(id = @request.auth.id && @request.body.role:changed = false) || @request.auth.role = 'admin'";
    app.save(users);

    // ---- 2. Create the `reviews` collection ----
    let reviews;
    try {
      reviews = app.findCollectionByNameOrId("reviews");
    } catch (_) {
      reviews = new Collection({
        type: "base",
        name: "reviews",
        // Public may list/view ONLY approved reviews.
        listRule: "status = 'approved'",
        viewRule: "status = 'approved'",
        // Anyone (including anonymous visitors) may submit a review.
        createRule: "",
        // Only admins may moderate / edit / delete reviews.
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
          { name: "customer_name", type: "text", required: true, max: 120 },
          { name: "business_name", type: "text", max: 160 },
          { name: "order_number", type: "text", max: 40 },
          { name: "product_purchased", type: "text", required: true, max: 200 },
          {
            name: "category",
            type: "select",
            required: true,
            maxSelect: 1,
            values: [
              "Wedding Hampers",
              "Corporate Gifting",
              "MDF & Leatherette Baskets",
              "Jute & Cotton Canvas Bags",
              "Custom Packaging",
            ],
          },
          { name: "rating", type: "number", required: true, min: 1, max: 5 },
          { name: "review_text", type: "text", required: true, max: 2000 },
          {
            name: "media",
            type: "file",
            maxSelect: 1,
            maxSize: 10485760,
            mimeTypes: [
              "image/jpeg",
              "image/png",
              "image/webp",
              "image/gif",
              "video/mp4",
              "video/quicktime",
              "video/webm",
            ],
          },
          { name: "consent", type: "bool" },
          {
            name: "status",
            type: "select",
            required: true,
            maxSelect: 1,
            values: ["pending", "approved", "rejected"],
          },
          { name: "verified_purchase", type: "bool" },
          { name: "featured", type: "bool" },
          { name: "admin_notes", type: "text", max: 1000 },
          {
            name: "owner",
            type: "relation",
            maxSelect: 1,
            collectionId: users.id,
            cascadeDelete: false,
          },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
          "CREATE INDEX idx_reviews_status ON reviews (status)",
          "CREATE INDEX idx_reviews_category ON reviews (category)",
          "CREATE INDEX idx_reviews_featured ON reviews (featured)",
        ],
      });
      app.save(reviews);
    }
  },
  (app) => {
    // down: remove reviews collection and the role field
    try {
      const reviews = app.findCollectionByNameOrId("reviews");
      app.delete(reviews);
    } catch (e) {
      if (!e.message.includes("no rows in result set")) throw e;
    }

    try {
      const users = app.findCollectionByNameOrId("users");
      if (users.fields.getByName("role")) {
        users.fields.removeByName("role");
      }
      // Restore the original open sign-up / self-edit rules.
      users.createRule = "";
      users.updateRule = "id = @request.auth.id";
      app.save(users);
    } catch (e) {
      if (!e.message.includes("no rows in result set")) throw e;
    }
  },
);
