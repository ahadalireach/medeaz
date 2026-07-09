const mongoose = require('mongoose');
require('dotenv').config({ path: './api/.env' });

const MONGO_URI = process.env.MONGO_URI;

const clinicReviewSchema = new mongoose.Schema({}, { strict: false });
const ClinicReview = mongoose.model('ClinicReview', clinicReviewSchema, 'clinicreviews');

const clinicSchema = new mongoose.Schema({}, { strict: false });
const Clinic = mongoose.model('Clinic', clinicSchema, 'clinics');

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB!");

  const clinics = await Clinic.find({}).lean();
  console.log(`Found ${clinics.length} clinics:`);
  for (const c of clinics) {
    const reviews = await ClinicReview.find({ clinicId: c._id }).lean();
    console.log(`Clinic: ${c.name} (${c._id}) has ${reviews.length} reviews`);
    for (const r of reviews) {
      console.log(`  - Review: id=${r._id}, rating=${r.overallRating}, status=${r.status}, response=${JSON.stringify(r.clinicResponse)}`);
    }
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
