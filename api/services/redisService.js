const redisClient = require("../config/redis");
 
// Helper to safely parse JSON or return the object/string as-is
const parseCachedValue = (val) => {
  if (!val) return null;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return val;
  }
};
 
// Store refresh token in Redis with 7 days expiry
const storeRefreshToken = async (userId, token) => {
  const expiryInSeconds = 7 * 24 * 60 * 60; // 7 days
  await redisClient.set(`refresh_token:${userId}`, token, {
    ex: expiryInSeconds,
  });
};
 
// Retrieve refresh token from Redis
const getRefreshToken = async (userId) => {
  return await redisClient.get(`refresh_token:${userId}`);
};
 
// Delete refresh token from Redis
const deleteRefreshToken = async (userId) => {
  await redisClient.del(`refresh_token:${userId}`);
};
 
// Store registration data in Redis for 24 hours
const storePendingUser = async (token, userData) => {
  const expiryInSeconds = 24 * 60 * 60; // 24 hours
  await redisClient.set(`pending_user:${token}`, userData, {
    ex: expiryInSeconds,
  });
};
 
const getPendingUser = async (token) => {
  const cached = await redisClient.get(`pending_user:${token}`);
  return parseCachedValue(cached);
};
 
const deletePendingUser = async (token) => {
  await redisClient.del(`pending_user:${token}`);
};
 
// Store reset token with 1 hour expiry
const storeResetToken = async (token, userId) => {
  await redisClient.set(`reset_token:${token}`, userId.toString(), {
    ex: 3600,
  });
};
 
const getResetUserId = async (token) => {
  return await redisClient.get(`reset_token:${token}`);
};
 
const deleteResetToken = async (token) => {
  await redisClient.del(`reset_token:${token}`);
};
 
// Store clinic ops chat history
const storeClinicOpsSession = async (userId, history) => {
  const expiryInSeconds = 24 * 60 * 60; // 24 hours
  await redisClient.set(`clinic_ops_session:${userId}`, history, {
    ex: expiryInSeconds,
  });
};
 
const getClinicOpsSession = async (userId) => {
  const cached = await redisClient.get(`clinic_ops_session:${userId}`);
  return parseCachedValue(cached);
};
 
// Store doctor copilot chat history
const storeDoctorCopilotSession = async (userId, history) => {
  const expiryInSeconds = 24 * 60 * 60; // 24 hours
  await redisClient.set(`doctor_copilot_session:${userId}`, history, {
    ex: expiryInSeconds,
  });
};
 
const getDoctorCopilotSession = async (userId) => {
  const cached = await redisClient.get(`doctor_copilot_session:${userId}`);
  return parseCachedValue(cached);
};
 
// Store patient assistant chat history
const storePatientAssistantSession = async (userId, history) => {
  const expiryInSeconds = 24 * 60 * 60; // 24 hours
  await redisClient.set(`patient_assistant_session:${userId}`, history, {
    ex: expiryInSeconds,
  });
};
 
const getPatientAssistantSession = async (userId) => {
  const cached = await redisClient.get(`patient_assistant_session:${userId}`);
  return parseCachedValue(cached);
};
 
module.exports = {
  storeRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  storePendingUser,
  getPendingUser,
  deletePendingUser,
  storeResetToken,
  getResetUserId,
  deleteResetToken,
  storeClinicOpsSession,
  getClinicOpsSession,
  storeDoctorCopilotSession,
  getDoctorCopilotSession,
  storePatientAssistantSession,
  getPatientAssistantSession,
  storeClinicContext: async (clinicId, context) => {
    await redisClient.set(`clinic_context_${clinicId}`, JSON.stringify(context), {
      ex: 60,
    });
  },
  getClinicContext: async (clinicId) => {
    const cached = await redisClient.get(`clinic_context_${clinicId}`);
    return parseCachedValue(cached);
  },
  deleteClinicContext: async (clinicId) => {
    await redisClient.del(`clinic_context_${clinicId}`);
  },
};
