const mongoose = require("mongoose");

const clinicSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    clinicName: {
      type: String,
      required: [true, "Please provide clinic name"],
    },
    address: {
      type: String,
      required: [true, "Please provide clinic address"],
    },
    phone: {
      type: String,
      required: [true, "Please provide contact number"],
    },
    // Other fields (subscription, doctors) will be asked on dashboard
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Clinic", clinicSchema);
