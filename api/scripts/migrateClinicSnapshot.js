const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: './.env' });

const Appointment = require('../models/Appointment');
const Clinic = require('../models/Clinic');

async function runMigration() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const appointments = await Appointment.find({ 
      clinicId: { $ne: null }, 
      clinicSnapshot: { $exists: false } 
    });

    console.log(`Found ${appointments.length} appointments to migrate...`);

    let migrated = 0;
    for (const appt of appointments) {
      const clinic = await Clinic.findById(appt.clinicId)
        .select('name address phone').lean();
      
      if (clinic) {
        await Appointment.findByIdAndUpdate(appt._id, {
          $set: {
            clinicSnapshot: {
              clinicId: clinic._id,
              clinicName: clinic.name,
              clinicCity: clinic.address?.city,
              clinicPhone: clinic.phone
            }
          }
        });
        migrated++;
      }
    }
    
    console.log(`Successfully migrated ${migrated} appointments.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
