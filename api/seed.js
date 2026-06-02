/**
 * Medeaz Database Seed Script — Pakistani Data
 *
 * Usage:  node seed.js
 *
 * Password for ALL accounts: Test@12345
 *
 * Creates:
 *   5 Clinics  (+ 5 clinic_admin users)
 *   20 Doctors (4 per clinic  + doctor User accounts)
 *   8 Patients (+ patient User accounts)
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User    = require("./models/User");
const Doctor  = require("./models/Doctor");
const Clinic  = require("./models/Clinic");
const Patient = require("./models/Patient");

// ─── helpers ────────────────────────────────────────────────────────────────

const PASSWORD = "Test@12345";
// Do NOT pre-hash — User model's pre-save hook handles bcrypt hashing

const SCHEDULE = {
  monday:    ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
  tuesday:   ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
  wednesday: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
  thursday:  ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
  friday:    ["09:00", "10:00", "11:00"],
  saturday:  [],
  sunday:    [],
};

// ─── raw data ────────────────────────────────────────────────────────────────

const CLINICS_DATA = [
  {
    name:    "Shifa International Hospital",
    address: "H-8/4, Pitras Bokhari Road, Islamabad",
    phone:   "051-8464646",
    email:   "info@shifa.com.pk",
    city:    "Islamabad",
  },
  {
    name:    "Aga Khan University Hospital",
    address: "Stadium Road, Karachi",
    phone:   "021-34930051",
    email:   "info@aku.edu.pk",
    city:    "Karachi",
  },
  {
    name:    "Lahore General Hospital Clinic",
    address: "Jail Road, Lahore",
    phone:   "042-35761999",
    email:   "info@lgh.com.pk",
    city:    "Lahore",
  },
  {
    name:    "CMH Rawalpindi Medical Centre",
    address: "The Mall, Rawalpindi Cantonment, Rawalpindi",
    phone:   "051-9270340",
    email:   "info@cmhrawalpindi.com",
    city:    "Rawalpindi",
  },
  {
    name:    "Allied Hospital Faisalabad",
    address: "Jail Road, Near DHQ, Faisalabad",
    phone:   "041-9220456",
    email:   "info@alliedhospital.com.pk",
    city:    "Faisalabad",
  },
];

const ADMINS_DATA = [
  { name: "Dr. Tariq Mahmood",     email: "admin.shifa@medeaz.pk",    phone: "0300-1234501" },
  { name: "Dr. Salma Baig",        email: "admin.aku@medeaz.pk",      phone: "0300-1234502" },
  { name: "Dr. Asim Raza",         email: "admin.lgh@medeaz.pk",      phone: "0300-1234503" },
  { name: "Dr. Nadia Hussain",     email: "admin.cmh@medeaz.pk",      phone: "0300-1234504" },
  { name: "Dr. Usman Farooq",      email: "admin.allied@medeaz.pk",   phone: "0300-1234505" },
];

const DOCTORS_DATA = [
  // Shifa – Islamabad
  { fullName: "Dr. Imran Khan",       email: "imran.khan@medeaz.pk",       phone: "0311-2345601", specialization: "Cardiologist",        fee: 3000, licenseNo: "PMC-ISB-001", exp: 12, bio: "Specialist in interventional cardiology with 12 years at NICVD." },
  { fullName: "Dr. Sana Mirza",       email: "sana.mirza@medeaz.pk",       phone: "0311-2345602", specialization: "Gynecologist",        fee: 2500, licenseNo: "PMC-ISB-002", exp:  8, bio: "Expert in high-risk pregnancies and laparoscopic surgery." },
  { fullName: "Dr. Ali Hassan",       email: "ali.hassan@medeaz.pk",       phone: "0311-2345603", specialization: "Neurologist",         fee: 3500, licenseNo: "PMC-ISB-003", exp: 15, bio: "Fellowship trained neurologist, specializing in epilepsy and stroke." },
  { fullName: "Dr. Rabia Iqbal",      email: "rabia.iqbal@medeaz.pk",      phone: "0311-2345604", specialization: "Pediatrician",        fee: 2000, licenseNo: "PMC-ISB-004", exp:  6, bio: "Dedicated to children's health from newborn to adolescence." },

  // Aga Khan – Karachi
  { fullName: "Dr. Faisal Rehman",    email: "faisal.rehman@medeaz.pk",    phone: "0321-3456701", specialization: "Orthopedic Surgeon",  fee: 4000, licenseNo: "PMC-KHI-001", exp: 18, bio: "Joint replacement and sports injury specialist." },
  { fullName: "Dr. Ayesha Siddiqui",  email: "ayesha.siddiqui@medeaz.pk",  phone: "0321-3456702", specialization: "Dermatologist",       fee: 2500, licenseNo: "PMC-KHI-002", exp:  9, bio: "Cosmetic and medical dermatology including vitiligo management." },
  { fullName: "Dr. Zubair Ahmed",     email: "zubair.ahmed@medeaz.pk",     phone: "0321-3456703", specialization: "General Physician",   fee: 1500, licenseNo: "PMC-KHI-003", exp: 15, bio: "Primary care and internal medicine with 15 years of practice." },
  { fullName: "Dr. Hina Qureshi",     email: "hina.qureshi@medeaz.pk",     phone: "0321-3456704", specialization: "ENT Specialist",      fee: 2000, licenseNo: "PMC-KHI-004", exp: 11, bio: "Ear, nose and throat diseases including hearing loss management." },

  // LGH – Lahore
  { fullName: "Dr. Kamran Baig",      email: "kamran.baig@medeaz.pk",      phone: "0331-4567801", specialization: "Gastroenterologist",  fee: 3000, licenseNo: "PMC-LHR-001", exp: 10, bio: "Endoscopy and hepatology specialist with 10 years experience." },
  { fullName: "Dr. Noor ul Ain",      email: "noor.ain@medeaz.pk",         phone: "0331-4567802", specialization: "Ophthalmologist",     fee: 2500, licenseNo: "PMC-LHR-002", exp:  7, bio: "Cataract, glaucoma and refractive surgery specialist." },
  { fullName: "Dr. Shahzad Malik",    email: "shahzad.malik@medeaz.pk",    phone: "0331-4567803", specialization: "Pulmonologist",       fee: 2500, licenseNo: "PMC-LHR-003", exp: 13, bio: "Respiratory diseases, asthma and COPD management." },
  { fullName: "Dr. Mehwish Tariq",    email: "mehwish.tariq@medeaz.pk",    phone: "0331-4567804", specialization: "Psychiatrist",        fee: 3000, licenseNo: "PMC-LHR-004", exp:  5, bio: "Mental health specialist focusing on anxiety, depression and PTSD." },

  // CMH – Rawalpindi
  { fullName: "Dr. Aamir Nazir",      email: "aamir.nazir@medeaz.pk",      phone: "0341-5678901", specialization: "Urologist",           fee: 3500, licenseNo: "PMC-RWP-001", exp: 14, bio: "Laparoscopic urological surgery and kidney stone treatment." },
  { fullName: "Dr. Samia Zafar",      email: "samia.zafar@medeaz.pk",      phone: "0341-5678902", specialization: "Endocrinologist",     fee: 3000, licenseNo: "PMC-RWP-002", exp:  8, bio: "Diabetes, thyroid disorders and hormonal imbalances." },
  { fullName: "Dr. Bilal Chaudhry",   email: "bilal.chaudhry@medeaz.pk",   phone: "0341-5678903", specialization: "Cardiologist",        fee: 4000, licenseNo: "PMC-RWP-003", exp: 20, bio: "Cardiac catheterization and echocardiography expert." },
  { fullName: "Dr. Zara Amjad",       email: "zara.amjad@medeaz.pk",       phone: "0341-5678904", specialization: "General Physician",   fee: 1500, licenseNo: "PMC-RWP-004", exp:  4, bio: "Family medicine and preventive healthcare." },

  // Allied – Faisalabad
  { fullName: "Dr. Tariq Azeem",      email: "tariq.azeem@medeaz.pk",      phone: "0311-6789001", specialization: "Orthopedic Surgeon",  fee: 3500, licenseNo: "PMC-FSD-001", exp: 16, bio: "Spine surgery and trauma orthopaedics." },
  { fullName: "Dr. Farah Naz",        email: "farah.naz@medeaz.pk",        phone: "0311-6789002", specialization: "Gynecologist",        fee: 2500, licenseNo: "PMC-FSD-002", exp:  9, bio: "Obstetrics and gynaecological oncology." },
  { fullName: "Dr. Hamza Sheikh",     email: "hamza.sheikh@medeaz.pk",     phone: "0311-6789003", specialization: "Pediatrician",        fee: 2000, licenseNo: "PMC-FSD-003", exp:  3, bio: "Child development and neonatal intensive care." },
  { fullName: "Dr. Naila Pervez",     email: "naila.pervez@medeaz.pk",     phone: "0311-6789004", specialization: "Dermatologist",       fee: 2500, licenseNo: "PMC-FSD-004", exp:  7, bio: "Skin allergies, eczema and cosmetic procedures." },
];

const PATIENTS_DATA = [
  { name: "Ahmed Ali",         email: "ahmed.ali@medeaz.pk",         phone: "0300-9871001", dob: "1990-05-14", gender: "male",   bloodGroup: "B+",  address: "House 12, Street 4, F-7/2, Islamabad" },
  { name: "Fatima Zahra",      email: "fatima.zahra@medeaz.pk",      phone: "0312-9871002", dob: "1995-11-22", gender: "female", bloodGroup: "O+",  address: "Flat 3B, Gulshan-e-Iqbal Block 13, Karachi" },
  { name: "Muhammad Usman",    email: "m.usman@medeaz.pk",           phone: "0333-9871003", dob: "1988-03-07", gender: "male",   bloodGroup: "A+",  address: "24 Model Town Extension, Lahore" },
  { name: "Saba Noor",         email: "saba.noor@medeaz.pk",         phone: "0345-9871004", dob: "2000-08-30", gender: "female", bloodGroup: "AB+", address: "Sector G-9/4, Near Bari Imam, Islamabad" },
  { name: "Hassan Mehmood",    email: "hassan.mehmood@medeaz.pk",    phone: "0321-9871005", dob: "1985-01-17", gender: "male",   bloodGroup: "B-",  address: "Satellite Town Block A, Rawalpindi" },
  { name: "Madiha Rana",       email: "madiha.rana@medeaz.pk",       phone: "0311-9871006", dob: "1998-07-03", gender: "female", bloodGroup: "O-",  address: "People's Colony No. 1, Faisalabad" },
  { name: "Bilal Azhar",       email: "bilal.azhar@medeaz.pk",       phone: "0301-9871007", dob: "1993-12-25", gender: "male",   bloodGroup: "A-",  address: "University Road, Peshawar" },
  { name: "Nadia Saleem",      email: "nadia.saleem@medeaz.pk",      phone: "0341-9871008", dob: "2002-04-11", gender: "female", bloodGroup: "B+",  address: "Circular Road, Near Clock Tower, Multan" },
];

// ─── main seed ───────────────────────────────────────────────────────────────

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.\n");

  // ── wipe existing seed data ──────────────────────────────────────────────
  const seedEmails = [
    ...ADMINS_DATA.map(a => a.email),
    ...DOCTORS_DATA.map(d => d.email),
    ...PATIENTS_DATA.map(p => p.email),
  ];

  const existingUsers = await User.find({ email: { $in: seedEmails } });
  const existingIds   = existingUsers.map(u => u._id);

  await Doctor.deleteMany({ userId: { $in: existingIds } });
  await Patient.deleteMany({ userId: { $in: existingIds } });

  const existingClinicAdminIds = existingUsers.filter(u => u.roles.includes("clinic_admin")).map(u => u._id);
  await Clinic.deleteMany({ adminId: { $in: existingClinicAdminIds } });
  await User.deleteMany({ email: { $in: seedEmails } });

  console.log("Cleared previous seed data.\n");

  // ── 1. Create clinic admins + clinics ────────────────────────────────────
  const createdClinics = [];

  for (let i = 0; i < CLINICS_DATA.length; i++) {
    const adminData  = ADMINS_DATA[i];
    const clinicData = CLINICS_DATA[i];

    const adminUser = await User.create({
      name:        adminData.name,
      email:       adminData.email,
      phone:       adminData.phone,
      password:    PASSWORD,
      roles:       ["clinic_admin"],
      authProvider: "local",
      isVerified:  true,
    });

    const clinic = await Clinic.create({
      name:    clinicData.name,
      address: clinicData.address,
      phone:   clinicData.phone,
      email:   clinicData.email,
      adminId: adminUser._id,
      doctors: [],
      workingHours: {
        monday:    { open: "09:00", close: "17:00", closed: false },
        tuesday:   { open: "09:00", close: "17:00", closed: false },
        wednesday: { open: "09:00", close: "17:00", closed: false },
        thursday:  { open: "09:00", close: "17:00", closed: false },
        friday:    { open: "09:00", close: "13:00", closed: false },
        saturday:  { open: "09:00", close: "13:00", closed: true  },
        sunday:    { open: "09:00", close: "13:00", closed: true  },
      },
    });

    createdClinics.push(clinic);
    console.log(`  Clinic [${i + 1}] ${clinicData.name}  |  admin: ${adminData.email}`);
  }

  console.log();

  // ── 2. Create doctors (4 per clinic) ─────────────────────────────────────
  for (let i = 0; i < DOCTORS_DATA.length; i++) {
    const d         = DOCTORS_DATA[i];
    const clinicIdx = Math.floor(i / 4);          // 4 doctors per clinic
    const clinic    = createdClinics[clinicIdx];

    const userDoc = await User.create({
      name:         d.fullName,
      email:        d.email,
      phone:        d.phone,
      password:     PASSWORD,
      roles:        ["doctor"],
      authProvider: "local",
      isVerified:   true,
    });

    const doctorProfile = await Doctor.create({
      userId:          userDoc._id,
      fullName:        d.fullName,
      specialization:  d.specialization,
      licenseNo:       d.licenseNo,
      bio:             d.bio,
      clinicId:        clinic._id,
      consultationFee: d.fee,
      experience:      d.exp,
      schedule:        SCHEDULE,
      averageRating:   parseFloat((3.8 + Math.random() * 1.2).toFixed(1)),
      totalReviews:    Math.floor(Math.random() * 80) + 10,
    });

    await Clinic.findByIdAndUpdate(clinic._id, {
      $push: { doctors: doctorProfile._id },
    });

    console.log(`  Doctor  ${d.fullName.padEnd(28)}  ${d.specialization.padEnd(22)}  clinic: ${clinic.name}`);
  }

  console.log();

  // ── 3. Create patients ────────────────────────────────────────────────────
  for (const p of PATIENTS_DATA) {
    const userDoc = await User.create({
      name:         p.name,
      email:        p.email,
      phone:        p.phone,
      password:     PASSWORD,
      roles:        ["patient"],
      authProvider: "local",
      isVerified:   true,
    });

    await Patient.create({
      userId:     userDoc._id,
      name:       p.name,
      email:      p.email,
      contact:    p.phone,
      dob:        new Date(p.dob),
      gender:     p.gender,
      bloodGroup: p.bloodGroup,
      address:    p.address,
      allergies:  [],
    });

    console.log(`  Patient ${p.name.padEnd(22)}  ${p.email}`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`
═══════════════════════════════════════════════════════════════
  SEED COMPLETE  —  Password for ALL accounts: ${PASSWORD}
═══════════════════════════════════════════════════════════════

  CLINIC ADMINS
  ┌─────────────────────────────────────────────────────────┐`);

  ADMINS_DATA.forEach((a, i) => {
    console.log(`  │  ${CLINICS_DATA[i].name.padEnd(36)} ${a.email}`);
  });

  console.log(`  └─────────────────────────────────────────────────────────┘

  DOCTORS  (${DOCTORS_DATA.length} total, 4 per clinic)
  ┌─────────────────────────────────────────────────────────┐`);

  DOCTORS_DATA.forEach(d => {
    console.log(`  │  ${d.fullName.padEnd(28)} ${d.email}`);
  });

  console.log(`  └─────────────────────────────────────────────────────────┘

  PATIENTS  (${PATIENTS_DATA.length} total)
  ┌─────────────────────────────────────────────────────────┐`);

  PATIENTS_DATA.forEach(p => {
    console.log(`  │  ${p.name.padEnd(22)} ${p.email}`);
  });

  console.log(`  └─────────────────────────────────────────────────────────┘
`);

  await mongoose.disconnect();
  console.log("Disconnected. Done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
