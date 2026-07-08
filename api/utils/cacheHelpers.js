const redis = require('../config/redis');

exports.invalidateScheduleCache = async (doctorId, date) => {
  try {
    const d = new Date(date);
    const dayOfWeek = d.getDay();
    const diffToMonday = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(d.setDate(diffToMonday));
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    
    const cacheKey = `schedule:${doctorId.toString()}:${weekStartStr}`;
    await redis.del(cacheKey);
  } catch (error) {
    console.error('Failed to invalidate schedule cache:', error.message);
  }
};

exports.invalidateAllDoctorScheduleCaches = async (doctorId) => {
  try {
    const now = new Date();
    
    const invalidateForDate = async (targetDate) => {
      const d = new Date(targetDate);
      const dayOfWeek = d.getDay();
      const diffToMonday = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const weekStart = new Date(d.setDate(diffToMonday));
      weekStart.setHours(0, 0, 0, 0);
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const cacheKey = `schedule:${doctorId.toString()}:${weekStartStr}`;
      await redis.del(cacheKey);
    };

    await invalidateForDate(now);
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    await invalidateForDate(nextWeek);
  } catch (error) {
    console.error('Failed to invalidate all doctor schedule caches:', error.message);
  }
};

exports.getCache = async (key) => {
  try {
    const cached = await redis.get(key);
    if (!cached) return null;
    return typeof cached === 'string' ? JSON.parse(cached) : cached;
  } catch (err) {
    console.error(`Redis getCache error for key ${key}:`, err.message);
    return null;
  }
};

exports.setCache = async (key, data, ttl = 300) => {
  try {
    await redis.set(key, JSON.stringify(data), { ex: ttl });
  } catch (err) {
    console.error(`Redis setCache error for key ${key}:`, err.message);
  }
};

exports.delCache = async (key) => {
  try {
    await redis.del(key);
  } catch (err) {
    console.error(`Redis delCache error for key ${key}:`, err.message);
  }
};

exports.deleteKeysByPattern = async (pattern) => {
  try {
    if (typeof redis.keys === 'function') {
      const keys = await redis.keys(pattern);
      if (keys && keys.length > 0) {
        await Promise.all(keys.map(key => redis.del(key)));
      }
    }
  } catch (err) {
    console.error(`Error deleting keys by pattern ${pattern}:`, err.message);
  }
};

exports.invalidateAppointmentsCache = async (clinicId, doctorId, patientId) => {
  try {
    if (clinicId) await exports.deleteKeysByPattern(`clinic:appointments:${clinicId.toString()}:*`);
    if (doctorId) await exports.deleteKeysByPattern(`doctor:appointments:${doctorId.toString()}:*`);
    if (patientId) await exports.deleteKeysByPattern(`patient:appointments:${patientId.toString()}:*`);
  } catch (err) {
    console.error('Failed to invalidate appointments cache:', err.message);
  }
};

exports.invalidatePatientsCache = async (clinicId, doctorId) => {
  try {
    if (clinicId) await exports.deleteKeysByPattern(`clinic:patients:${clinicId.toString()}:*`);
    if (doctorId) await exports.deleteKeysByPattern(`doctor:patients:${doctorId.toString()}:*`);
  } catch (err) {
    console.error('Failed to invalidate patients cache:', err.message);
  }
};

exports.invalidateDoctorsCache = async (clinicId) => {
  try {
    if (clinicId) await exports.deleteKeysByPattern(`clinic:doctors:${clinicId.toString()}:*`);
    await exports.deleteKeysByPattern(`patient:doctors:*`);
  } catch (err) {
    console.error('Failed to invalidate doctors cache:', err.message);
  }
};

exports.invalidateClinicsCache = async () => {
  try {
    await exports.deleteKeysByPattern(`patient:clinics:*`);
  } catch (err) {
    console.error('Failed to invalidate clinics cache:', err.message);
  }
};

exports.invalidateAppointmentsCache = async (clinicId, doctorId, patientId) => {
  try {
    if (clinicId) await exports.deleteKeysByPattern(`clinic:appointments:${clinicId.toString()}:*`);
    if (doctorId) await exports.deleteKeysByPattern(`doctor:appointments:${doctorId.toString()}:*`);
    if (patientId) await exports.deleteKeysByPattern(`patient:appointments:${patientId.toString()}:*`);
  } catch (err) {
    console.error('Failed to invalidate appointments cache:', err.message);
  }
};

exports.invalidatePatientHealthScoreCache = async (patientId) => {
  try {
    if (patientId) {
      await redis.del(`patient_health_score_${patientId.toString()}`);
      
      const PatientScore = require('../models/PatientScore');
      if (PatientScore) {
        await PatientScore.deleteOne({ patientId: patientId.toString() });
      }
    }
  } catch (err) {
    console.error('Failed to invalidate patient health score cache:', err.message);
  }
};
