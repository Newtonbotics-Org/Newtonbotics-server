const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  registrationDate: { type: Date, default: Date.now },
  attendanceStatus: { type: String, enum: ['registered', 'attended', 'absent', 'cancelled'], default: 'registered' },
});

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 255, trim: true },
    description: { type: String, required: true, maxlength: 5000, trim: true },
    category: { type: String, maxlength: 100, trim: true },
    type: {
      type: String,
      required: true,
      enum: ['workshop', 'seminar', 'exhibition', 'training', 'networking', 'competition', 'technical', 'educational', 'showcase'],

    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    location: { type: String, maxlength: 255, trim: true },
    maxCapacity: { type: Number, min: 1 },
    currentRegistrations: { type: Number, default: 0, min: 0 },
    registrationDeadline: { type: Date },
    isFeatured: { type: Boolean, default: false },
    imageUrl: { type: String, maxlength: 500, trim: true },
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], default: 'upcoming' },
    requiresRegistration: { type: Boolean, default: false },
    registrationFormLink: { 
      type: String, 
      maxlength: 500, 
      trim: true,
      validate: {
        validator: function(value) {
          // Only validate if requiresRegistration is true and registrationFormLink is provided
          if (this.requiresRegistration && value) {
            // Basic URL validation
            const urlPattern = /^https?:\/\/.+/i;
            return urlPattern.test(value);
          }
          return true;
        },
        message: 'Registration form link must be a valid URL when registration is required'
      }
    },
    featureOptions: {
      showInNav: { type: Boolean, default: false },
      navLabel: { 
        type: String, 
        maxlength: 50, 
        trim: true,
        validate: {
          validator: function(value) {
            // Only validate if showInNav is true and navLabel is provided
            if (this.featureOptions && this.featureOptions.showInNav && value) {
              return value.length >= 2;
            }
            return true;
          },
          message: 'Navigation label must be at least 2 characters when show in navigation is enabled'
        }
      },
      navOrder: { 
        type: Number, 
        min: 0, 
        default: 0,
        validate: {
          validator: Number.isInteger,
          message: 'Navigation order must be an integer'
        }
      }
    },
    registrations: [registrationSchema],
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

// Virtual to check if registration is open
eventSchema.virtual('isRegistrationOpen').get(function() {
  if (!this.requiresRegistration) return false;
  if (this.status !== 'upcoming') return false;
  if (this.registrationDeadline && new Date() > this.registrationDeadline) return false;
  if (this.maxCapacity && this.currentRegistrations >= this.maxCapacity) return false;
  return true;
});

// Virtual to check if event is at capacity
eventSchema.virtual('isAtCapacity').get(function() {
  return this.maxCapacity && this.currentRegistrations >= this.maxCapacity;
});

// Virtual to get available spots
eventSchema.virtual('availableSpots').get(function() {
  if (!this.maxCapacity) return null;
  return Math.max(0, this.maxCapacity - this.currentRegistrations);
});

eventSchema.index({ type: 1, startDate: 1 });
eventSchema.index({ requiresRegistration: 1 });
eventSchema.index({ registrationDeadline: 1 });
eventSchema.index({ 'featureOptions.showInNav': 1 });
eventSchema.index({ 'featureOptions.navOrder': 1 });

module.exports = mongoose.model('Event', eventSchema);


