const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/User");
const Doctor = require("./models/Doctor");

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Find doctor user by email or name
        let doctorUser = await User.findOne({ email: "doctor@medeaz.com" });
        if (!doctorUser) {
           doctorUser = await User.findOne({ name: { $regex: /Ali/i }, role: "doctor" });
        }
        
        if (!doctorUser) {
           // If no doctor user found, we'll try to find any doctor
           doctorUser = await User.findOne({ role: "doctor" });
        }

        if (!doctorUser) {
            console.log("No doctor user found to seed.");
            process.exit(0);
        }

        console.log(`Found doctor user: ${doctorUser.name} (${doctorUser.email})`);

        let doctorProfile = await Doctor.findOne({ userId: doctorUser._id });
        if (!doctorProfile) {
            doctorProfile = new Doctor({ userId: doctorUser._id });
        }

        doctorProfile.fullName = "Dr. Ali Mahmood";
        doctorProfile.specialization = "General Physician";
        doctorProfile.bio = "Experienced General Physician with a demonstrated history of working in the medical practice industry.";
        doctorProfile.experience = 10;
        doctorProfile.consultationFee = 1500;
        doctorProfile.gender = "Male";
        doctorProfile.city = "Lahore";
        doctorProfile.languages = ["English", "Urdu"];
        
        await doctorProfile.save();
        
        console.log("Successfully seeded mock data for Dr. Ali (General Physician).");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding doctor:", error);
        process.exit(1);
    }
}

seed();
