const mongoose = require('mongoose');
const Appointment = require('../../models/Appointment');
const Doctor = require('../../models/Doctor');
const User = require('../../models/User');
const RevenueEntry = require('../../models/RevenueEntry');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');

// ─────────────────────────────────────────────
// Date range helpers
// ─────────────────────────────────────────────
function getDateRange(period) {
  const now = new Date();
  switch (period) {
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay()); // Sunday start
      d.setHours(0, 0, 0, 0);
      return [d, now];
    }
    case 'quarter': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      d.setHours(0, 0, 0, 0);
      return [d, now];
    }
    case 'all':
      return [new Date(0), now];
    case 'month':
    default: {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      return [d, now];
    }
  }
}

function getPreviousRange(period) {
  const [from, to] = getDateRange(period);
  const span = to - from;
  return [new Date(from - span), new Date(from)];
}

// ─────────────────────────────────────────────
// Signal scoring functions
// ─────────────────────────────────────────────
function computeSignalA(completionRate) {
  if (completionRate === null || completionRate === undefined) return 15; // neutral
  if (completionRate >= 1.0)  return 30;
  if (completionRate >= 0.9)  return 26;
  if (completionRate >= 0.8)  return 20;
  if (completionRate >= 0.7)  return 13;
  if (completionRate >= 0.6)  return 7;
  return 0;
}

function computeSignalB(avgRating, reviewCount) {
  if (!reviewCount || reviewCount < 3) return 15; // insufficient data — neutral
  if (avgRating >= 4.8) return 25;
  if (avgRating >= 4.5) return 21;
  if (avgRating >= 4.0) return 16;
  if (avgRating >= 3.5) return 11;
  if (avgRating >= 3.0) return 6;
  return 0;
}

function computeSignalC(onTimeRate) {
  if (onTimeRate === null || onTimeRate === undefined) return 10; // neutral
  if (onTimeRate >= 1.0)  return 20;
  if (onTimeRate >= 0.9)  return 17;
  if (onTimeRate >= 0.8)  return 13;
  if (onTimeRate >= 0.7)  return 8;
  return 3;
}

function computeSignalD(followUpCount, completed) {
  if (!completed) return 0;
  const rate = followUpCount / completed;
  if (rate >= 0.5)  return 15;
  if (rate >= 0.35) return 11;
  if (rate >= 0.2)  return 7;
  if (rate >= 0.1)  return 3;
  return 0;
}

function computeSignalE(doctorRevenue, maxRevenue) {
  if (!maxRevenue || maxRevenue === 0) return 5; // neutral
  const ratio = doctorRevenue / maxRevenue;
  if (ratio >= 0.9) return 10;
  if (ratio >= 0.7) return 8;
  if (ratio >= 0.5) return 6;
  if (ratio >= 0.3) return 4;
  if (ratio >= 0.1) return 2;
  return 0;
}

function getScoreLabel(score) {
  if (score >= 85) return 'Exceptional';
  if (score >= 70) return 'Strong';
  if (score >= 55) return 'Good';
  if (score >= 40) return 'Average';
  return 'Needs Review';
}

// ─────────────────────────────────────────────
// Main aggregation pipeline
// ─────────────────────────────────────────────
async function runAggregation(clinicId, from, to) {
  const ObjectId = mongoose.Types.ObjectId;
  const cId = new ObjectId(clinicId);

  const stats = await Doctor.aggregate([
    {
      $match: {
        clinicId: cId
      }
    },
    // Join with User collection to get doctor user account details (photo, name fallback)
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
    // Join with appointments for this doctor at this clinic within date range
    {
      $lookup: {
        from: 'appointments',
        let: { docUserId: '$userId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$doctorId', '$$docUserId'] },
                  { $eq: ['$clinicId', cId] },
                  { $gte: ['$dateTime', from] },
                  { $lte: ['$dateTime', to] }
                ]
              }
            }
          }
        ],
        as: 'appts'
      }
    },
    // Join with followups
    {
      $lookup: {
        from: 'followups',
        let: { docUserId: '$userId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$doctorId', '$$docUserId'] },
                  { $gte: ['$createdAt', from] },
                  { $lte: ['$createdAt', to] }
                ]
              }
            }
          }
        ],
        as: 'followUps'
      }
    },
    // Join with revenue entries for this doctor at this clinic within date range
    {
      $lookup: {
        from: 'revenueentries',
        let: { docUserId: '$userId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$doctorUserId', '$$docUserId'] },
                  { $eq: ['$clinicId', cId] },
                  { $gte: ['$occurredAt', from] },
                  { $lte: ['$occurredAt', to] }
                ]
              }
            }
          }
        ],
        as: 'revenues'
      }
    },
    {
      $project: {
        _id: '$userId',
        doctorId: '$userId',
        fullName: { $ifNull: ['$fullName', { $ifNull: ['$userInfo.name', 'Unknown Doctor'] }] },
        specialization: { $ifNull: ['$specialization', ''] },
        photo: { $ifNull: ['$userInfo.photo', null] },
        joinDate: { $ifNull: ['$createdAt', null] },
        consultationFee: { $ifNull: ['$consultationFee', 0] },

        totalAppointments: { $size: '$appts' },
        completed: {
          $size: {
            $filter: {
              input: '$appts',
              as: 'a',
              cond: { $eq: ['$$a.status', 'completed'] }
            }
          }
        },
        noShow: {
          $size: {
            $filter: {
              input: '$appts',
              as: 'a',
              cond: { $eq: ['$$a.status', 'no-show'] }
            }
          }
        },
        cancelledByDoctor: {
          $size: {
            $filter: {
              input: '$appts',
              as: 'a',
              cond: {
                $and: [
                  { $eq: ['$$a.status', 'cancelled'] },
                  { $eq: ['$$a.cancelledBy', 'doctor'] }
                ]
              }
            }
          }
        },
        cancelledByPatient: {
          $size: {
            $filter: {
              input: '$appts',
              as: 'a',
              cond: {
                $and: [
                  { $eq: ['$$a.status', 'cancelled'] },
                  { $eq: ['$$a.cancelledBy', 'patient'] }
                ]
              }
            }
          }
        },
        cancelledUnknown: {
          $size: {
            $filter: {
              input: '$appts',
              as: 'a',
              cond: {
                $and: [
                  { $eq: ['$$a.status', 'cancelled'] },
                  { $eq: ['$$a.cancelledBy', null] }
                ]
              }
            }
          }
        },

        totalRevenue: {
          $reduce: {
            input: '$revenues',
            initialValue: 0,
            in: { $add: ['$$value', { $ifNull: ['$$this.doctorShare', 0] }] }
          }
        },
        clinicRevenue: {
          $reduce: {
            input: '$revenues',
            initialValue: 0,
            in: { $add: ['$$value', { $ifNull: ['$$this.clinicShare', 0] }] }
          }
        },

        ratedAppointments: {
          $size: {
            $filter: {
              input: '$appts',
              as: 'a',
              cond: { $gt: ['$$a.rating', null] }
            }
          }
        },

        totalRatingSum: {
          $reduce: {
            input: {
              $filter: {
                input: '$appts',
                as: 'a',
                cond: { $gt: ['$$a.rating', null] }
              }
            },
            initialValue: 0,
            in: { $add: ['$$value', { $ifNull: ['$$this.rating', 0] }] }
          }
        },

        startedAppointments: {
          $size: {
            $filter: {
              input: '$appts',
              as: 'a',
              cond: { $gt: ['$$a.actualStartTime', null] }
            }
          }
        },

        onTimeCount: {
          $size: {
            $filter: {
              input: '$appts',
              as: 'a',
              cond: {
                $and: [
                  { $gt: ['$$a.actualStartTime', null] },
                  { $lte: [{ $subtract: ['$$a.actualStartTime', '$$a.dateTime'] }, 15 * 60 * 1000] }
                ]
              }
            }
          }
        },

        uniquePatients: {
          $size: {
            $setUnion: {
              $map: {
                input: '$appts',
                as: 'a',
                in: '$$a.patientId'
              }
            }
          }
        },

        followUpsList: '$followUps'
      }
    },
    {
      $project: {
        doctorId: 1,
        fullName: 1,
        specialization: 1,
        photo: 1,
        joinDate: 1,
        consultationFee: 1,
        totalAppointments: 1,
        completed: 1,
        noShow: 1,
        cancelledByDoctor: 1,
        cancelledByPatient: 1,
        cancelledUnknown: 1,
        totalRevenue: 1,
        ratedAppointments: 1,
        totalRatingSum: 1,
        startedAppointments: 1,
        onTimeCount: 1,
        uniquePatientCount: '$uniquePatients',
        reviewCount: '$ratedAppointments',
        followUpCount: { $size: '$followUpsList' },

        avgRevenue: {
          $cond: [
            { $gt: ['$completed', 0] },
            { $divide: ['$totalRevenue', '$completed'] },
            0
          ]
        },

        avgRating: {
          $cond: [
            { $gt: ['$ratedAppointments', 0] },
            { $divide: ['$totalRatingSum', '$ratedAppointments'] },
            null
          ]
        },

        onTimeRate: {
          $cond: [
            { $gt: ['$startedAppointments', 0] },
            { $divide: ['$onTimeCount', '$startedAppointments'] },
            null
          ]
        },

        completionRate: {
          $cond: [
            { $gt: [{ $add: ['$completed', '$noShow', '$cancelledByDoctor'] }, 0] },
            { $divide: ['$completed', { $add: ['$completed', '$noShow', '$cancelledByDoctor'] }] },
            null
          ]
        }
      }
    }
  ]);

  return stats;
}

// ─────────────────────────────────────────────
// Build leaderboard from raw stats
// ─────────────────────────────────────────────
async function buildLeaderboard(stats, previousRankMap = {}) {
  if (!stats.length) return [];

  const maxRevenue = Math.max(...stats.map(d => d.totalRevenue || 0));

  const withScores = stats.map(doc => {
    const A = computeSignalA(doc.completionRate);
    const B = computeSignalB(doc.avgRating, doc.reviewCount);
    const C = computeSignalC(doc.onTimeRate);
    const D = computeSignalD(doc.followUpCount, doc.completed);
    const E = computeSignalE(doc.totalRevenue || 0, maxRevenue);
    const score = Math.round(A + B + C + D + E);
    const label = getScoreLabel(score);
    return { ...doc, score, label, signals: { A, B, C, D, E } };
  });

  // Sort by score desc
  withScores.sort((a, b) => b.score - a.score);

  // Assign rank + rank change
  return withScores.map((doc, idx) => {
    const currentRank = idx + 1;
    const prevRank = previousRankMap[doc.doctorId?.toString()];
    const rankChange = prevRank ? prevRank - currentRank : 0;
    return { ...doc, rank: currentRank, rankChange };
  });
}

// ─────────────────────────────────────────────
// GET /api/clinic/performance?period=month
// ─────────────────────────────────────────────
exports.getLeaderboard = asyncHandler(async (req, res) => {
  const clinicId = req.user.clinicId;
  if (!clinicId) throw new ApiError(404, 'Clinic not found');

  const period = req.query.period || 'month';
  const bypassCache = req.query.bypassCache === 'true';
  const cacheKey = `clinic_performance_${clinicId}_${period}`;

  // ── Redis cache check ──
  if (!bypassCache) {
    let cached;
    try {
      const { redisClient } = require('../../services/redisService');
      if (redisClient) {
        const raw = await redisClient.get(cacheKey);
        if (raw) {
          return res.status(200).json(new ApiResponse(200, JSON.parse(raw), 'Performance data (cached)'));
        }
      }
    } catch(e) { /* non-critical */ }
  }

  const [from, to] = getDateRange(period);
  const [prevFrom, prevTo] = getPreviousRange(period);

  // Run current + previous period in parallel
  const [currentStats, prevStats] = await Promise.all([
    runAggregation(clinicId, from, to),
    runAggregation(clinicId, prevFrom, prevTo)
  ]);

  // Build previous rank map for rank change calculation
  const prevMaxRevenue = Math.max(...(prevStats.map(d => d.totalRevenue || 0)), 1);
  const prevWithScores = prevStats.map(doc => {
    const score = Math.round(
      computeSignalA(doc.completionRate) +
      computeSignalB(doc.avgRating, doc.reviewCount) +
      computeSignalC(doc.onTimeRate) +
      computeSignalD(doc.followUpCount, doc.completed) +
      computeSignalE(doc.totalRevenue || 0, prevMaxRevenue)
    );
    return { doctorId: doc.doctorId?.toString(), score };
  }).sort((a, b) => b.score - a.score);

  const previousRankMap = {};
  prevWithScores.forEach((d, i) => { previousRankMap[d.doctorId] = i + 1; });

  const leaderboard = await buildLeaderboard(currentStats, previousRankMap);

  // Clinic-wide totals
  const clinicTotals = {
    totalAppointments: leaderboard.reduce((s, d) => s + (d.totalAppointments || 0), 0),
    totalRevenue:      leaderboard.reduce((s, d) => s + (d.clinicRevenue || 0), 0),
    avgRating:         (() => {
      const ratedDocs = leaderboard.filter(d => d.avgRating !== null && d.reviewCount > 0);
      const totalRatings = ratedDocs.reduce((s, d) => s + (d.avgRating * d.reviewCount), 0);
      const totalReviews = ratedDocs.reduce((s, d) => s + d.reviewCount, 0);
      return totalReviews > 0 ? totalRatings / totalReviews : null;
    })(),
    totalDoctors: leaderboard.length,
    period,
    from,
    to
  };

  // Previous period totals for delta
  const prevTotals = {
    totalAppointments: prevStats.reduce((s, d) => s + (d.totalAppointments || 0), 0),
    totalRevenue:      prevStats.reduce((s, d) => s + (d.clinicRevenue || 0), 0),
  };

  const payload = { leaderboard, clinicTotals, prevTotals, period, from, to };

  // ── Cache result ──
  try {
    const { redisClient } = require('../../services/redisService');
    if (redisClient) {
      await redisClient.setEx(cacheKey, 30, JSON.stringify(payload));
    }
  } catch(e) { /* non-critical */ }

  res.status(200).json(new ApiResponse(200, payload, 'Performance leaderboard fetched'));
});

// ─────────────────────────────────────────────
// GET /api/clinic/performance/:doctorId?period=month
// Individual doctor deep-dive with recent reviews
// ─────────────────────────────────────────────
exports.getDoctorDetail = asyncHandler(async (req, res) => {
  const clinicId = req.user.clinicId;
  const { doctorId } = req.params;
  const period = req.query.period || 'month';

  if (!clinicId) throw new ApiError(404, 'Clinic not found');

  const ObjectId = mongoose.Types.ObjectId;
  const [from, to] = getDateRange(period);
  const [prevFrom, prevTo] = getPreviousRange(period);

  // Doctor user lookup
  const doctorUser = await User.findById(doctorId).select('name photo').lean();
  const doctorProfile = await Doctor.findOne({ userId: doctorId })
    .select('fullName specialization consultationFee createdAt photo').lean();

  // Current period appointments, previous appointments, current revenues and previous revenues
  const [currentAppts, prevAppts, currentRevenues, prevRevenues] = await Promise.all([
    Appointment.find({
      clinicId: new ObjectId(clinicId),
      doctorId: new ObjectId(doctorId),
      dateTime: { $gte: from, $lte: to }
    }).lean(),
    Appointment.find({
      clinicId: new ObjectId(clinicId),
      doctorId: new ObjectId(doctorId),
      dateTime: { $gte: prevFrom, $lte: prevTo }
    }).lean(),
    RevenueEntry.find({
      clinicId: new ObjectId(clinicId),
      doctorUserId: new ObjectId(doctorId),
      occurredAt: { $gte: from, $lte: to }
    }).lean(),
    RevenueEntry.find({
      clinicId: new ObjectId(clinicId),
      doctorUserId: new ObjectId(doctorId),
      occurredAt: { $gte: prevFrom, $lte: prevTo }
    }).lean()
  ]);

  // Aggregate stats from current period
  const completed    = currentAppts.filter(a => a.status === 'completed').length;
  const noShow       = currentAppts.filter(a => a.status === 'no-show').length;
  const cancelDoc    = currentAppts.filter(a => a.status === 'cancelled' && a.cancelledBy === 'doctor').length;
  const cancelPat    = currentAppts.filter(a => a.status === 'cancelled' && a.cancelledBy === 'patient').length;
  const cancelUnk    = currentAppts.filter(a => a.status === 'cancelled' && !a.cancelledBy).length;
  const pending      = currentAppts.filter(a => ['pending','confirmed'].includes(a.status)).length;

  const uniquePatients = new Set(currentAppts.map(a => a.patientId?.toString())).size;

  const totalRevenue = currentRevenues.reduce((s, r) => s + (r.doctorShare || 0), 0);
  const clinicRevenue = currentRevenues.reduce((s, r) => s + (r.clinicShare || 0), 0);
  const avgRevenue   = completed ? (totalRevenue / completed) : 0;

  const rated        = currentAppts.filter(a => a.rating != null);
  const avgRating    = rated.length ? rated.reduce((s, a) => s + a.rating, 0) / rated.length : null;

  const started      = currentAppts.filter(a => a.actualStartTime);
  const onTime       = started.filter(a => (a.actualStartTime - a.dateTime) <= 15 * 60 * 1000).length;
  const onTimeRate   = started.length ? onTime / started.length : null;

  const denominator  = completed + noShow + cancelDoc;
  const completionRate = denominator > 0 ? completed / denominator : null;

  // Follow-ups in period
  const FollowUp = require('../../models/FollowUp');
  const followUpsCount = await FollowUp.countDocuments({
    doctorId: new ObjectId(doctorId),
    createdAt: { $gte: from, $lte: to }
  });

  // Rating distribution (1–5 stars)
  const ratingDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  rated.forEach(a => {
    const s = Math.round(a.rating);
    if (s >= 1 && s <= 5) ratingDist[s]++;
  });

  // Daily revenue from RevenueEntry
  const dailyRevenue = {};
  currentRevenues.forEach(r => {
    const key = new Date(r.occurredAt).toISOString().split('T')[0];
    dailyRevenue[key] = (dailyRevenue[key] || 0) + (r.doctorShare || 0);
  });

  // Recent reviews (last 5 with reviewText)
  const recentReviews = currentAppts
    .filter(a => a.rating != null)
    .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
    .slice(0, 5)
    .map(a => ({
      rating:     a.rating,
      reviewText: a.reviewText || '',
      date:       a.dateTime,
      patientId:  a.patientId
    }));

  // Populate patient names for reviews
  const patientIds = recentReviews.map(r => r.patientId).filter(Boolean);
  const patients   = await User.find({ _id: { $in: patientIds } }).select('name photo').lean();
  const patMap     = Object.fromEntries(patients.map(p => [p._id.toString(), p]));
  const reviewsWithPatient = recentReviews.map(r => ({
    ...r,
    patientName:  patMap[r.patientId?.toString()]?.name || 'Patient',
    patientPhoto: patMap[r.patientId?.toString()]?.photo || null,
  }));

  // Previous period stats for delta
  const prevCompleted  = prevAppts.filter(a => a.status === 'completed').length;
  const prevRevenue    = prevRevenues.reduce((s, r) => s + (r.doctorShare || 0), 0);
  const prevUniqueP    = new Set(prevAppts.map(a => a.patientId?.toString())).size;

  // Signals & composite score
  const maxRevenueMock = totalRevenue; // single doc, use as max
  const A = computeSignalA(completionRate);
  const B = computeSignalB(avgRating, rated.length);
  const C = computeSignalC(onTimeRate);
  const D = computeSignalD(followUpsCount, completed);
  const E = computeSignalE(totalRevenue, totalRevenue || 1); // relative — needs leaderboard for full accuracy; set E=10 if only doctor
  const score = Math.round(A + B + C + D + E);

  // Flags
  const flags = [];
  if (completionRate !== null && completionRate < 0.75) flags.push('low_completion_rate');
  if (avgRating !== null && avgRating < 3.5 && rated.length >= 3) flags.push('low_rating');
  if (completed > 0 && noShow / (completed + noShow) > 0.2) flags.push('high_noshow');
  if (followUpsCount === 0 && completed > 0) flags.push('no_followups');
  if (onTimeRate !== null && onTimeRate < 0.7) flags.push('late_starts');

  const payload = {
    doctor: {
      id:          doctorId,
      name:        doctorProfile?.fullName || doctorUser?.name || 'Doctor',
      photo:       doctorProfile?.photo || doctorUser?.photo || null,
      specialization: doctorProfile?.specialization || '',
      joinDate:    doctorProfile?.createdAt || null,
      consultationFee: doctorProfile?.consultationFee || 0
    },
    period, from, to,
    score, label: getScoreLabel(score),
    signals: { A, B, C, D, E },
    stats: {
      totalAppointments: currentAppts.length,
      completed, noShow, cancelledByDoctor: cancelDoc,
      cancelledByPatient: cancelPat, cancelledUnknown: cancelUnk,
      pending,
      uniquePatients,
      totalRevenue, clinicRevenue, avgRevenue,
      avgRating, reviewCount: rated.length,
      onTimeRate, completionRate,
      followUpsCount,
      ratingDistribution: ratingDist,
      dailyRevenue
    },
    deltas: {
      appointments: currentAppts.length - prevAppts.length,
      revenue:      totalRevenue - prevRevenue,
      uniquePatients: uniquePatients - prevUniqueP,
      completed:    completed - prevCompleted
    },
    recentReviews: reviewsWithPatient,
    flags
  };

  res.status(200).json(new ApiResponse(200, payload, 'Doctor detail fetched'));
});

// ─────────────────────────────────────────────
// GET /api/clinic/performance/export?period=month&format=csv
// ─────────────────────────────────────────────
exports.exportCSV = asyncHandler(async (req, res) => {
  const clinicId = req.user.clinicId;
  if (!clinicId) throw new ApiError(404, 'Clinic not found');

  const period = req.query.period || 'month';
  const [from, to] = getDateRange(period);

  const stats = await runAggregation(clinicId, from, to);
  const leaderboard = await buildLeaderboard(stats);

  const headers = [
    'Rank', 'Doctor Name', 'Specialization',
    'Total Appointments', 'Completed Appointments', 'Average Rating',
    'Total Revenue (PKR)'
  ];

  const rows = leaderboard.map(d => [
    d.rank,
    `"${d.fullName || ''}"`,
    `"${d.specialization || ''}"`,
    d.totalAppointments || 0,
    d.completed || 0,
    d.avgRating !== null ? d.avgRating.toFixed(1) : 'N/A',
    d.totalRevenue || 0
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=performance_${period}_${Date.now()}.csv`);
  res.send('\uFEFF' + csv); // BOM for Excel UTF-8
});

// ─────────────────────────────────────────────
// Auto-Migration: Backfill clinicSnapshot for historical integrity
// ─────────────────────────────────────────────
(async () => {
  try {
    const Clinic = require('../../models/Clinic');
    const missingSnapshots = await Appointment.find({
      clinicId: { $ne: null },
      clinicSnapshot: { $exists: false }
    });

    if (missingSnapshots.length > 0) {
      console.log(`[Migration] Found ${missingSnapshots.length} appointments lacking clinicSnapshot. Backfilling...`);
      let migrated = 0;
      for (const appt of missingSnapshots) {
        const clinic = await Clinic.findById(appt.clinicId).select('name address phone').lean();
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
      console.log(`[Migration] Completed backfilling clinicSnapshot for ${migrated} appointments.`);
    }
  } catch (err) {
    console.error('[Migration] Auto-backfill failed:', err);
  }
})();

