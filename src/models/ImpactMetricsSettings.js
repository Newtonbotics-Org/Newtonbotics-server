const mongoose = require('mongoose');

const metricValueFields = {
  projects: { type: Number, default: 0, min: 0 },
  publications: { type: Number, default: 0, min: 0 },
  labMembers: { type: Number, default: 0, min: 0 },
  industryPartners: { type: Number, default: 0, min: 0 },
  awardsWon: { type: Number, default: 0, min: 0 },
  workshopsConducted: { type: Number, default: 0, min: 0 },
};

const impactMetricsSettingsSchema = new mongoose.Schema(
  {
    singletonKey: { type: String, default: 'default', unique: true, index: true },
    useManualValues: { type: Boolean, default: false },
    sectionTitle: {
      type: String,
      default: 'Our Impact',
      maxlength: 120,
      trim: true,
    },
    sectionSubtitle: {
      type: String,
      default:
        'Numbers that speak for our commitment to excellence in robotics research and innovation',
      maxlength: 500,
      trim: true,
    },
    manualValues: metricValueFields,
    liveValues: metricValueFields,
    liveValuesUpdatedAt: { type: Date },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

impactMetricsSettingsSchema.statics.getSettings = async function getSettings() {
  let doc = await this.findOne({ singletonKey: 'default' });
  if (!doc) {
    doc = await this.create({ singletonKey: 'default' });
  }
  return doc;
};

module.exports = mongoose.model('ImpactMetricsSettings', impactMetricsSettingsSchema);
