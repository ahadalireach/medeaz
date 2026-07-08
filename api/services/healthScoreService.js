const Appointment = require("../models/Appointment");
const FollowUp = require("../models/FollowUp");

/**
 * Computes the patient's Health Engagement Score from behavioral signals.
 * This is a pure mathematical engagement proxy, NOT a clinical diagnosis.
 * 
 * @param {string} patientId - The MongoDB ID of the patient
 * @returns {Promise<Object>} - The computed score, labels, and breakdown
 */
async function computeHealthScore(patientId) {
  // Query appointments and follow-ups in parallel
  // Ensure appointments are sorted chronologically by dateTime so we can easily find the first appointment date
  const [appointments, followUps] = await Promise.all([
    Appointment.find({ patientId }).sort({ dateTime: 1 }).select("status dateTime"),
    FollowUp.find({ patientId }).select("status"),
  ]);

  const completed = appointments.filter((a) => a.status === "completed");
  const futureConfirmed = appointments.filter(a =>
    a.status === 'confirmed' && new Date(a.dateTime) > new Date()
  ).length;

  const totalAppointmentsCount = appointments.length;

  // Edge case: New patient (< 2 total appointments)
  const isNewPatient = totalAppointmentsCount < 2;

  // ==========================================
  // Signal A — Appointment Frequency (30 pts)
  // ==========================================
  const firstDate = appointments[0]?.dateTime || new Date();
  const monthsActive = Math.max(
    1,
    (Date.now() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  const rate = completed.length / monthsActive;
  const rawA = rate >= 1 ? 30 : rate >= 0.5 ? 20 : 
               rate >= 0.25 ? 12 : completed.length > 0 ? 6 : 0;
  const proactiveBonus = Math.min(futureConfirmed * 1.5, 3);
  const signalA = Math.min(30, rawA + proactiveBonus);

  // ==========================================
  // Signal B — Follow-Up Completion (25 pts)
  // ==========================================
  const totalFU = followUps.length;
  const doneFU = followUps.filter((f) => f.status === "completed").length;
  let signalB = 20; // Default/neutral if no follow-ups
  let followUpLabel = "No follow-ups assigned";

  if (totalFU > 0) {
    const completionRate = doneFU / totalFU;
    followUpLabel = `${Math.round(completionRate * 100)}% completed`;
    signalB = completionRate >= 1.0 ? 25 :
              completionRate >= 0.75 ? 18 :
              completionRate >= 0.5 ? 12 :
              completionRate >= 0.25 ? 6 : 0;
  }

  // ==========================================
  // Signal C — Appointment No-Show Rate (25 pts)
  // ==========================================
  const resolved = appointments.filter((a) =>
    ["completed", "no-show", "cancelled"].includes(a.status)
  );
  const noShows = appointments.filter((a) => a.status === "no-show").length;
  const noShowRate = resolved.length === 0 ? 0 : noShows / resolved.length;
  
  const signalC =
    noShowRate === 0    ? 25 :
    noShowRate <= 0.10  ? 18 :
    noShowRate <= 0.20  ? 10 :
    noShowRate <= 0.33  ?  4 :
    noShowRate <= 0.50  ?  1 : 0;

  const noShowLabel = `${noShows} no-shows of ${resolved.length} resolved`;

  // ==========================================
  // Signal D — Visit Recency (20 pts)
  // ==========================================
  // Find the last completed appointment (we can sort completed appointments by dateTime descending)
  const lastCompleted = completed.length > 0
    ? [...completed].sort((a, b) => b.dateTime - a.dateTime)[0].dateTime
    : null;

  const daysSince = lastCompleted
    ? (Date.now() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24)
    : 999;

  const signalD =
    daysSince <= 30  ? 20 :
    daysSince <= 60  ? 15 :
    daysSince <= 90  ? 10 :
    daysSince <= 180 ?  5 : 0;

  const recencyLabel = lastCompleted ? `${Math.round(daysSince)} days ago` : "No visits";

  // ==========================================
  // Total Score Calculation
  // ==========================================
  const totalScore = Math.round(signalA + signalB + signalC + signalD);

  // Determine score band label and color
  let label = "Poor";
  let color = "#ef4444"; // Red

  if (totalScore >= 80) {
    label = "Excellent";
    color = "#22c55e"; // Green
  } else if (totalScore >= 60) {
    label = "Good";
    color = "#84cc16"; // Lime
  } else if (totalScore >= 40) {
    label = "Fair";
    color = "#f59e0b"; // Amber
  } else if (totalScore >= 20) {
    label = "Low";
    color = "#f97316"; // Orange
  }

  return {
    score: totalScore,
    label,
    color,
    breakdown: {
      appointmentFrequency: {
        earned: Math.round(signalA),
        max: 30,
        label: `${rate.toFixed(1)} completed visits/month`,
      },
      followUpCompletion: {
        earned: signalB,
        max: 25,
        label: followUpLabel,
      },
      noShowRate: {
        earned: signalC,
        max: 25,
        label: noShowLabel,
      },
      visitRecency: {
        earned: signalD,
        max: 20,
        label: recencyLabel,
      },
    },
    isNewPatient
  };
}

module.exports = {
  computeHealthScore,
};
