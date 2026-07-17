const mongoose = require('mongoose');

const RESOURCE_TYPES = ['link', 'image', 'video', 'document'];
const RESOURCE_CATEGORIES = [
  'drones',
  'motors',
  'robotics',
  'electronics',
  'programming',
  'tools',
  'other',
];

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 255, trim: true },
    description: { type: String, maxlength: 2000, trim: true },
    resourceType: { type: String, required: true, enum: RESOURCE_TYPES },
    category: { type: String, required: true, enum: RESOURCE_CATEGORIES, default: 'other' },
    externalUrl: { type: String, maxlength: 1000, trim: true },
    fileUrl: { type: String, maxlength: 1000, trim: true },
    thumbnailUrl: { type: String, maxlength: 1000, trim: true },
    tags: [{ type: String, maxlength: 100, trim: true }],
    isPublished: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

resourceSchema.index({ category: 1, resourceType: 1, createdAt: -1 });
resourceSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Resource', resourceSchema);
module.exports.RESOURCE_TYPES = RESOURCE_TYPES;
module.exports.RESOURCE_CATEGORIES = RESOURCE_CATEGORIES;
