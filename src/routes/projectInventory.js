const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { verifyToken, requireStudent, requireProjectTeamMember, requireAdmin } = require('../middleware/auth');
const { asyncHandler, validationErrorHandler, notFoundErrorHandler } = require('../middleware/errorHandler');
const Project = require('../models/Project');
const ProjectComponent = require('../models/ProjectComponent');
const componentRequestRoutes = require('./componentRequests');

const router = express.Router();

const loadProjectForAdmin = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) throw notFoundErrorHandler('Project');
  req.project = project;
  next();
});

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next(validationErrorHandler(errors));
  return next();
}

function auditContext(req) {
  return {
    performedBy: req.user.id,
    performedAt: new Date(),
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
  };
}

const projectIdParam = param('projectId').isMongoId();

router.get(
  '/projects/:projectId/components',
  verifyToken,
  requireStudent,
  projectIdParam,
  validateRequest,
  requireProjectTeamMember,
  [
    query('q').optional().isString().trim().isLength({ max: 100 }),
    query('category').optional().isString().trim().isLength({ max: 100 }),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('skip').optional().isInt({ min: 0 }).toInt(),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { q, category, limit = 100, skip = 0 } = req.query;
    const filter = { projectId: req.project._id, isDeleted: false };
    if (category) filter.category = category;
    if (q) filter.name = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    const [items, total] = await Promise.all([
      ProjectComponent.find(filter).sort({ category: 1, name: 1 }).skip(skip).limit(limit),
      ProjectComponent.countDocuments(filter),
    ]);
    res.json({ success: true, data: { items, pagination: { total, limit, skip, hasMore: total > skip + items.length } } });
  })
);

router.post(
  '/projects/:projectId/components',
  verifyToken,
  requireAdmin,
  projectIdParam,
  body('name').isString().trim().isLength({ min: 2, max: 255 }),
  body('category').isString().trim().isLength({ min: 1, max: 100 }),
  body('quantity').isInt({ min: 0 }).toInt(),
  body('minimumQuantity').optional().isInt({ min: 0 }).toInt(),
  body('location').optional({ nullable: true }).isString().trim().isLength({ max: 255 }),
  body('description').optional({ nullable: true }).isString().trim().isLength({ max: 2000 }),
  validateRequest,
  loadProjectForAdmin,
  asyncHandler(async (req, res) => {
    const { name, category, quantity, minimumQuantity = 0, location, description } = req.body;
    const item = await ProjectComponent.create({
      projectId: req.project._id,
      name,
      category,
      quantity,
      minimumQuantity,
      location,
      description,
      auditTrail: [{ action: 'created', ...auditContext(req) }],
    });
    res.status(201).json({ success: true, message: 'Project component created', data: { item } });
  })
);

router.put(
  '/projects/:projectId/components/:componentId',
  verifyToken,
  requireAdmin,
  projectIdParam,
  param('componentId').isMongoId(),
  body('name').optional().isString().trim().isLength({ min: 2, max: 255 }),
  body('category').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('quantity').optional().isInt({ min: 0 }).toInt(),
  body('minimumQuantity').optional().isInt({ min: 0 }).toInt(),
  body('location').optional({ nullable: true }).isString().trim().isLength({ max: 255 }),
  body('description').optional({ nullable: true }).isString().trim().isLength({ max: 2000 }),
  validateRequest,
  loadProjectForAdmin,
  asyncHandler(async (req, res) => {
    const allowed = ['name', 'category', 'quantity', 'minimumQuantity', 'location', 'description'];
    const changes = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if (!Object.keys(changes).length) {
      return res.status(400).json({ success: false, message: 'At least one component field is required' });
    }
    const item = await ProjectComponent.findOneAndUpdate(
      { _id: req.params.componentId, projectId: req.project._id, isDeleted: false },
      { $set: changes, $push: { auditTrail: { action: 'updated', changes, ...auditContext(req) } } },
      { new: true, runValidators: true }
    );
    if (!item) throw notFoundErrorHandler('Project component');
    res.json({ success: true, message: 'Project component updated', data: { item } });
  })
);

router.delete(
  '/projects/:projectId/components/:componentId',
  verifyToken,
  requireAdmin,
  projectIdParam,
  param('componentId').isMongoId(),
  validateRequest,
  loadProjectForAdmin,
  asyncHandler(async (req, res) => {
    const item = await ProjectComponent.findOneAndUpdate(
      { _id: req.params.componentId, projectId: req.project._id, isDeleted: false },
      { $set: { isDeleted: true }, $push: { auditTrail: { action: 'deleted', ...auditContext(req) } } },
      { new: true }
    );
    if (!item) throw notFoundErrorHandler('Project component');
    res.json({ success: true, message: 'Project component deleted' });
  })
);

router.use('/requests', componentRequestRoutes);

module.exports = router;