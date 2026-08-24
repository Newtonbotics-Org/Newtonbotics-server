const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const {
  getAdminImpactMetrics,
  updateImpactMetricsSettings,
  autoloadLiveImpactMetrics,
} = require('../services/impactMetricsService');

router.use(verifyToken, requireAdmin);

// GET /api/impact-metrics/admin
router.get(
  '/admin',
  asyncHandler(async (req, res) => {
    const result = await getAdminImpactMetrics();
    res.json(result);
  })
);

// PUT /api/impact-metrics/admin
router.put(
  '/admin',
  asyncHandler(async (req, res) => {
    const result = await updateImpactMetricsSettings(req.body, req.user.id);
    res.json({
      success: true,
      message: 'Impact metrics saved',
      ...result,
    });
  })
);

// POST /api/impact-metrics/admin/autoload
// Body: { applyLive?: boolean } — applyLive=true publishes live counts on the website
router.post(
  '/admin/autoload',
  asyncHandler(async (req, res) => {
    const applyLive = Boolean(req.body?.applyLive);
    const result = await autoloadLiveImpactMetrics({
      applyLive,
      userId: req.user.id,
    });
    res.json(result);
  })
);

module.exports = router;
