const mongoose = require('mongoose');

const checkoutSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quantity: { type: Number, required: true, min: 1 },
  checkoutDate: { type: Date, default: Date.now },
  expectedReturnDate: { type: Date, required: true },
  actualReturnDate: { type: Date },
  checkoutNotes: { type: String, maxlength: 1000 },
  returnNotes: { type: String, maxlength: 1000 },
  status: { type: String, enum: ['checked_out', 'returned', 'overdue', 'lost'], default: 'checked_out' },
  // Urgent checkout fields
  isUrgent: { type: Boolean, default: false },
  requestedQuantity: { type: Number, min: 1 },
  fulfilledQuantity: { type: Number, min: 0 },
  overdrawnQuantity: { type: Number, min: 0, default: 0 },
  userNameSnapshot: { type: String, maxlength: 255, trim: true },
});

const equipmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 255, trim: true },
    description: { type: String, maxlength: 2000, trim: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'EquipmentCategory', required: true },
    modelNumber: { type: String, maxlength: 100, trim: true },
    serialNumber: { type: String, maxlength: 100, unique: true, sparse: true, trim: true },
    manufacturer: { type: String, maxlength: 100, trim: true },
    purchaseDate: { type: Date },
    purchasePrice: { type: Number, min: 0 },
    currentQuantity: { type: Number, required: true, default: 0, min: 0 },
    minQuantity: { type: Number, default: 0, min: 0 },
    maxQuantity: { type: Number, min: 0 },
    location: { type: String, maxlength: 255, trim: true },
    status: { type: String, enum: ['available', 'low_stock', 'out_of_stock', 'maintenance', 'retired'], default: 'available' },
    imageUrl: { type: String, maxlength: 500, trim: true },
    specifications: { type: Object },
    maintenanceSchedule: { type: String, maxlength: 1000, trim: true },
    lastMaintenanceDate: { type: Date },
    nextMaintenanceDate: { type: Date },
    checkouts: [checkoutSchema],
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

equipmentSchema.index({ categoryId: 1, status: 1 });

module.exports = mongoose.model('Equipment', equipmentSchema);


