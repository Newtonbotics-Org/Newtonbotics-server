const express = require('express');
const mongoose = require('mongoose');
const { body, param, query, validationResult } = require('express-validator');
const { optionalAuth, verifyToken, requireAdmin } = require('../middleware/auth');
const { asyncHandler, validationErrorHandler, notFoundErrorHandler } = require('../middleware/errorHandler');
const Project = require('../models/Project');
const ProjectComponent = require('../models/ProjectComponent');

const router = express.Router();
const objectId = (value) => mongoose.Types.ObjectId.isValid(value);
const projectParam = param('projectId').custom(objectId).withMessage('Invalid project ID');
const componentParam = param('componentId').custom(objectId).withMessage('Invalid component ID');
const checkValidation = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw validationErrorHandler(errors);
};

async function loadProject(projectId) {
  if (!objectId(projectId)) throw validationErrorHandler({ array: () => [{ msg: 'Invalid project ID' }] });
  const project = await Project.findById(projectId);
  if (!project) throw notFoundErrorHandler('Project');
  return project;
}

router.get('/:projectId/components', optionalAuth, [projectParam, query('q').optional().isString().isLength({ max: 100 }), query('category').optional().isString().isLength({ max: 100 }), query('limit').optional().isInt({ min: 1, max: 100 }).toInt(), query('skip').optional().isInt({ min: 0 }).toInt()], asyncHandler(async (req, res) => {
  checkValidation(req);
  await loadProject(req.params.projectId);
  const { q, category, limit = 100, skip = 0 } = req.query;
  const filter = { projectId: req.params.projectId, isDeleted: false };
  if (category) filter.category = category;
  if (q) filter.name = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  const [items, total] = await Promise.all([
    ProjectComponent.find(filter).sort({ name: 1 }).limit(limit).skip(skip),
    ProjectComponent.countDocuments(filter),
  ]);
  res.json({ success: true, data: { items, pagination: { total, limit, skip, hasMore: total > skip + items.length } } });
}));

router.post('/:projectId/components', verifyToken, requireAdmin, [projectParam, body('name').isString().trim().isLength({ min: 2, max: 255 }), body('category').isString().trim().isLength({ min: 1, max: 100 }), body('quantity').isInt({ min: 0 }).toInt(), body('minimumQuantity').optional().isInt({ min: 0 }).toInt(), body('location').optional({ nullable: true }).isString().isLength({ max: 255 }), body('description').optional({ nullable: true }).isString().isLength({ max: 2000 })], asyncHandler(async (req, res) => {
  checkValidation(req);
  await loadProject(req.params.projectId);
  const name = req.body.name.trim();
  const component = await ProjectComponent.create({
    projectId: req.params.projectId,
    ...req.body,
    name,
    nameKey: name.toLowerCase(),
    minimumQuantity: req.body.minimumQuantity ?? 0,
    auditTrail: [{ action: 'created', performedBy: req.user.id, changes: req.body, ipAddress: req.ip, userAgent: req.get('User-Agent') }],
  });
  res.status(201).json({ success: true, message: 'Project component created', data: { item: component } });
}));

router.get('/:projectId/components/:componentId', optionalAuth, [projectParam, componentParam], asyncHandler(async (req, res) => {
  checkValidation(req);
  await loadProject(req.params.projectId);
  const item = await ProjectComponent.findOne({ _id: req.params.componentId, projectId: req.params.projectId, isDeleted: false });
  if (!item) throw notFoundErrorHandler('Project component');
  res.json({ success: true, data: { item } });
}));

router.put('/:projectId/components/:componentId', verifyToken, requireAdmin, [projectParam, componentParam, body('name').optional().isString().trim().isLength({ min: 2, max: 255 }), body('category').optional().isString().trim().isLength({ min: 1, max: 100 }), body('quantity').optional().isInt({ min: 0 }).toInt(), body('minimumQuantity').optional().isInt({ min: 0 }).toInt(), body('location').optional({ nullable: true }).isString().isLength({ max: 255 }), body('description').optional({ nullable: true }).isString().isLength({ max: 2000 })], asyncHandler(async (req, res) => {
  checkValidation(req);
  await loadProject(req.params.projectId);
  const item = await ProjectComponent.findOne({ _id: req.params.componentId, projectId: req.params.projectId, isDeleted: false });
  if (!item) throw notFoundErrorHandler('Project component');
  const changes = {};
  for (const field of ['name', 'category', 'quantity', 'minimumQuantity', 'location', 'description']) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) changes[field] = req.body[field];
  }
  if (!Object.keys(changes).length) throw validationErrorHandler({ array: () => [{ msg: 'At least one component field is required' }] });
  const previous = Object.fromEntries(Object.keys(changes).map((field) => [field, item[field]]));
  Object.assign(item, changes);
  if (changes.name) item.nameKey = changes.name.trim().toLowerCase();
  item.auditTrail.push({ action: 'updated', performedBy: req.user.id, changes: { before: previous, after: changes }, ipAddress: req.ip, userAgent: req.get('User-Agent') });
  await item.save();
  res.json({ success: true, message: 'Project component updated', data: { item } });
}));

router.delete('/:projectId/components/:componentId', verifyToken, requireAdmin, [projectParam, componentParam], asyncHandler(async (req, res) => {
  checkValidation(req);
  await loadProject(req.params.projectId);
  const item = await ProjectComponent.findOne({ _id: req.params.componentId, projectId: req.params.projectId, isDeleted: false });
  if (!item) throw notFoundErrorHandler('Project component');
  item.isDeleted = true;
  item.auditTrail.push({ action: 'deleted', performedBy: req.user.id, changes: { name: item.name, quantity: item.quantity }, ipAddress: req.ip, userAgent: req.get('User-Agent') });
  await item.save();
  res.json({ success: true, message: 'Project component deleted' });
}));

module.exports = router;