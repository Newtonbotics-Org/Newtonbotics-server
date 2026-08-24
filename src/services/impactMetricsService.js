const Project = require('../models/Project');
const News = require('../models/News');
const User = require('../models/User');
const Workshop = require('../models/Workshop');
const Event = require('../models/Event');
const ResearchArea = require('../models/ResearchArea');
const ImpactMetricsSettings = require('../models/ImpactMetricsSettings');
const { getRedisClient } = require('../config/redis');

const IMPACT_METRICS_CACHE_KEY = 'public:impact-metrics:v3';

const isRedisEnabled = () => process.env.REDIS_ENABLED === 'true';

function countsToLabels(counts) {
  return {
    projects: `${counts.projects}+`,
    publications: `${counts.publications}+`,
    labMembers: `${counts.labMembers}+`,
    industryPartners: `${counts.industryPartners}+`,
    awardsWon: `${counts.awardsWon}+`,
    workshopsConducted: `${counts.workshopsConducted}+`,
  };
}

function normalizeCounts(input = {}) {
  return {
    projects: Math.max(0, Number(input.projects) || 0),
    publications: Math.max(0, Number(input.publications) || 0),
    labMembers: Math.max(0, Number(input.labMembers) || 0),
    industryPartners: Math.max(0, Number(input.industryPartners) || 0),
    awardsWon: Math.max(0, Number(input.awardsWon) || 0),
    workshopsConducted: Math.max(0, Number(input.workshopsConducted) || 0),
  };
}

async function computeLiveImpactCounts() {
  const [
    projects,
    publications,
    labMembers,
    industryPartners,
    awardsWon,
    workshopsConducted,
  ] = await Promise.all([
    Project.countDocuments({ isPublic: true }),

    Promise.all([
      News.countDocuments({
        isPublished: true,
        $or: [
          { tags: { $in: ['publication', 'paper', 'research', 'journal'] } },
          { tags: /publication|paper|research|journal/i },
        ],
      }),
      ResearchArea.aggregate([
        { $group: { _id: null, totalPublications: { $sum: '$publicationCount' } } },
      ]),
    ]).then(([newsPublications, researchAreaPublications]) => {
      const researchAreaCount = researchAreaPublications[0]?.totalPublications || 0;
      return newsPublications + researchAreaCount;
    }),

    User.countDocuments({
      isActive: true,
      role: { $in: ['team_member', 'mentor', 'researcher'] },
    }),

    User.countDocuments({
      isActive: true,
      $or: [
        {
          subroles: {
            $in: [
              'industry_liaison',
              'partnership_coordinator',
              'business_developer',
              'startup_mentor',
              'patent_officer',
              'technology_transfer',
            ],
          },
        },
        {
          'achievements.type': 'patent',
          achievements: { $exists: true, $ne: [] },
        },
      ],
    }),

    Promise.all([
      User.aggregate([
        {
          $match: {
            'achievements.type': 'award',
            achievements: { $exists: true, $ne: [] },
          },
        },
        { $unwind: '$achievements' },
        { $match: { 'achievements.type': 'award' } },
        { $count: 'totalAwards' },
      ]),
      Project.aggregate([
        { $match: { achievements: { $exists: true, $ne: [] } } },
        { $unwind: '$achievements' },
        { $count: 'totalAwards' },
      ]),
    ]).then(([userAwards, projectAwards]) => {
      const userAwardCount = userAwards[0]?.totalAwards || 0;
      const projectAwardCount = projectAwards[0]?.totalAwards || 0;
      return userAwardCount + projectAwardCount;
    }),

    Promise.all([
      Workshop.countDocuments({ status: 'completed' }),
      Event.countDocuments({ type: 'workshop', status: 'completed' }),
    ])
      .then(([workshopCount, eventWorkshopCount]) => workshopCount + eventWorkshopCount)
      .catch(() => Workshop.countDocuments({ status: 'completed' })),
  ]);

  return normalizeCounts({
    projects,
    publications,
    labMembers,
    industryPartners,
    awardsWon,
    workshopsConducted,
  });
}

function buildPublicMetricsPayload(counts, settings, source) {
  return {
    success: true,
    data: {
      impactCounts: counts,
      labels: countsToLabels(counts),
      sectionTitle: settings.sectionTitle,
      sectionSubtitle: settings.sectionSubtitle,
      source,
      useManualValues: settings.useManualValues,
      lastUpdated: new Date().toISOString(),
    },
  };
}

async function clearImpactMetricsCache() {
  if (!isRedisEnabled()) return;
  try {
    const redis = getRedisClient();
    await redis.del(IMPACT_METRICS_CACHE_KEY);
  } catch (_) {
    /* ignore cache errors */
  }
}

async function getPublicImpactMetrics({ skipCache = false } = {}) {
  if (!skipCache && isRedisEnabled()) {
    try {
      const redis = getRedisClient();
      const cached = await redis.get(IMPACT_METRICS_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (_) {
      /* ignore cache errors */
    }
  }

  const settings = await ImpactMetricsSettings.getSettings();
  const liveCounts = await computeLiveImpactCounts();
  const counts = settings.useManualValues
    ? normalizeCounts(settings.manualValues)
    : liveCounts;

  const payload = buildPublicMetricsPayload(
    counts,
    settings,
    settings.useManualValues ? 'manual' : 'live'
  );

  if (isRedisEnabled()) {
    try {
      const redis = getRedisClient();
      await redis.setEx(IMPACT_METRICS_CACHE_KEY, 300, JSON.stringify(payload));
    } catch (_) {
      /* ignore cache errors */
    }
  }

  return payload;
}

async function getAdminImpactMetrics() {
  const settings = await ImpactMetricsSettings.getSettings();
  const liveCounts = await computeLiveImpactCounts();

  const displayedCounts = settings.useManualValues
    ? normalizeCounts(settings.manualValues)
    : liveCounts;

  return {
    success: true,
    data: {
      settings: {
        useManualValues: settings.useManualValues,
        sectionTitle: settings.sectionTitle,
        sectionSubtitle: settings.sectionSubtitle,
        manualValues: normalizeCounts(settings.manualValues),
        liveValues: liveCounts,
        liveValuesUpdatedAt: settings.liveValuesUpdatedAt,
        updatedAt: settings.updatedAt,
      },
      displayed: {
        impactCounts: displayedCounts,
        labels: countsToLabels(displayedCounts),
        source: settings.useManualValues ? 'manual' : 'live',
      },
    },
  };
}

async function updateImpactMetricsSettings(updates, userId) {
  const settings = await ImpactMetricsSettings.getSettings();

  if (typeof updates.useManualValues === 'boolean') {
    settings.useManualValues = updates.useManualValues;
  }
  if (typeof updates.sectionTitle === 'string') {
    settings.sectionTitle = updates.sectionTitle.trim();
  }
  if (typeof updates.sectionSubtitle === 'string') {
    settings.sectionSubtitle = updates.sectionSubtitle.trim();
  }
  if (updates.manualValues) {
    settings.manualValues = normalizeCounts(updates.manualValues);
  }
  if (userId) {
    settings.lastUpdatedBy = userId;
  }

  await settings.save();
  await clearImpactMetricsCache();

  return getAdminImpactMetrics();
}

async function autoloadLiveImpactMetrics({ applyLive = false, userId } = {}) {
  const settings = await ImpactMetricsSettings.getSettings();
  const liveCounts = await computeLiveImpactCounts();

  settings.liveValues = liveCounts;
  settings.liveValuesUpdatedAt = new Date();
  if (applyLive) {
    settings.useManualValues = false;
  }
  if (userId) {
    settings.lastUpdatedBy = userId;
  }

  await settings.save();
  await clearImpactMetricsCache();

  return {
    success: true,
    message: applyLive
      ? 'Live metrics loaded and applied to the public website'
      : 'Live metrics loaded from database',
    data: {
      liveValues: liveCounts,
      labels: countsToLabels(liveCounts),
      useManualValues: settings.useManualValues,
    },
  };
}

module.exports = {
  IMPACT_METRICS_CACHE_KEY,
  computeLiveImpactCounts,
  countsToLabels,
  normalizeCounts,
  buildPublicMetricsPayload,
  clearImpactMetricsCache,
  getPublicImpactMetrics,
  getAdminImpactMetrics,
  updateImpactMetricsSettings,
  autoloadLiveImpactMetrics,
};
