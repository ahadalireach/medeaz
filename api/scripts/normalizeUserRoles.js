/**
 * One-off migration: normalize User role/roles fields.
 *
 * The app has exactly three roles: patient, doctor, clinic_admin.
 * Over time the singular `role` field drifted from the `roles[]` array —
 * many accounts have `role: null` and one legacy account had `role: "user"`.
 * This backfills a valid singular `role` from `roles[]` (or repairs invalid
 * values) and ensures `roles[]` only contains valid entries.
 *
 * Run: node scripts/normalizeUserRoles.js
 */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const VALID_ROLES = ["doctor", "clinic_admin", "patient"];

function resolveRoles(doc) {
  // Clean the roles array to valid values only.
  let roles = Array.isArray(doc.roles)
    ? doc.roles.filter((r) => VALID_ROLES.includes(r))
    : [];

  // Determine the singular role.
  let role = VALID_ROLES.includes(doc.role) ? doc.role : null;
  if (!role) role = roles[0] || null;
  if (!role) role = "patient"; // last-resort default

  // Ensure roles array is populated and includes the singular role first.
  if (roles.length === 0) roles = [role];
  if (!roles.includes(role)) roles = [role, ...roles];

  return { role, roles };
}

async function run() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGO_URI is not set");

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const col = mongoose.connection.collection("users");
  const users = await col
    .find({}, { projection: { role: 1, roles: 1, email: 1 } })
    .toArray();
  console.log(`Scanning ${users.length} users...`);

  let updated = 0;
  const changes = [];
  for (const u of users) {
    const next = resolveRoles(u);
    const roleChanged = u.role !== next.role;
    const rolesChanged =
      JSON.stringify(u.roles || []) !== JSON.stringify(next.roles);

    if (roleChanged || rolesChanged) {
      await col.updateOne(
        { _id: u._id },
        { $set: { role: next.role, roles: next.roles, updatedAt: new Date() } }
      );
      updated++;
      changes.push(
        `  ${u.email}: role ${JSON.stringify(u.role)} -> ${JSON.stringify(
          next.role
        )} | roles ${JSON.stringify(u.roles)} -> ${JSON.stringify(next.roles)}`
      );
    }
  }

  console.log(`\nUpdated ${updated} user(s).`);
  if (changes.length) console.log(changes.join("\n"));

  // Verify: distinct values afterwards
  const byRole = await col
    .aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }, { $sort: { count: -1 } }])
    .toArray();
  console.log("\nDistinct `role` values now:");
  byRole.forEach((r) => console.log(`  ${JSON.stringify(r._id)} -> ${r.count}`));

  const invalid = await col.countDocuments({ role: { $nin: VALID_ROLES } });
  console.log(`\nRemaining invalid `.concat("`role` documents: "), invalid);

  await mongoose.disconnect();
  console.log("Done.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
