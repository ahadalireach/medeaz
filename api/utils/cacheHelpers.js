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
    // If using Upstash Redis, keys pattern deletion might need SCAN.
    // Or we just don't do wildcard and invalidate current week and next week
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
