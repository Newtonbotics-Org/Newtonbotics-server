const mongoose = require('mongoose');

const inventoryTransferSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ComponentRequest', required: true, unique: true },
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  equipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
  componentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectComponent', required: true },
  componentName: { type: String, required: true, trim: true, maxlength: 255 },
  quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  transferredAt: { type: Date, default: Date.now, required: true },
}, { timestamps: true });

inventoryTransferSchema.index({ projectId: 1, transferredAt: -1 });

module.exports = mongoose.model('InventoryTransfer', inventoryTransferSchema);