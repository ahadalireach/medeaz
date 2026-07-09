const mongoose = require("mongoose");
require("dotenv").config();
const Clinic = require("./models/Clinic");
const Doctor = require("./models/Doctor");
const OPDToken = require("./models/OPDToken");

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Clear existing today's OPD tokens
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await OPDToken.deleteMany({ createdAt: { $gte: today } });
        console.log("Cleared existing OPD tokens for today");

        // Find a clinic
        const clinic = await Clinic.findOne({}).populate("doctors");
        if (!clinic) {
            console.log("No clinic found");
            process.exit(0);
        }

        if (!clinic.doctors || clinic.doctors.length === 0) {
            console.log("No doctors in clinic");
            process.exit(0);
        }

        const doctor = clinic.doctors[0];
        const doctorUserId = doctor.userId;
        const clinicId = clinic._id;

        const tokensToInsert = [
            {
                clinicId,
                doctorId: doctorUserId,
                tokenNumber: 1,
                patientName: "John Doe",
                patientPhone: "1234567890",
                status: "completed",
            },
            {
                clinicId,
                doctorId: doctorUserId,
                tokenNumber: 2,
                patientName: "Jane Smith",
                patientPhone: "0987654321",
                status: "called",
            },
            {
                clinicId,
                doctorId: doctorUserId,
                tokenNumber: 3,
                patientName: "Alice Johnson",
                patientPhone: "5551234567",
                status: "waiting",
            },
            {
                clinicId,
                doctorId: doctorUserId,
                tokenNumber: 4,
                patientName: "Bob Brown",
                patientPhone: "5559876543",
                status: "waiting",
            },
            {
                clinicId,
                doctorId: doctorUserId,
                tokenNumber: 5,
                patientName: "Charlie Davis",
                patientPhone: "5555555555",
                status: "waiting",
            },
        ];

        await OPDToken.insertMany(tokensToInsert);
        console.log("Successfully seeded 5 mock patient appointments in OPD queue.");

        process.exit(0);
    } catch (error) {
        console.error("Error seeding OPD tokens:", error);
        process.exit(1);
    }
}

seed();
