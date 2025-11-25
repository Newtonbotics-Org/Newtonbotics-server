const mongoose = require('mongoose');

const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'excused', 'remote', 'on_leave'];

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ATTENDANCE_STATUSES,
      default: 'present',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    checkInTime: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
      validate: {
        validator(value) {
          if (!value || !this.checkInTime) {
            return true;
          }
          return value >= this.checkInTime;
        },
        message: 'Check-out time cannot be earlier than check-in time.',
      },
    },
    location: {
      type: String,
      trim: true,
      maxlength: 255,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userSnapshot: {
      name: { type: String, trim: true, maxlength: 200 },
      email: { type: String, trim: true, maxlength: 255 },
      role: { type: String, trim: true, maxlength: 50 },
      department: { type: String, trim: true, maxlength: 100 },
    },
    markedBySnapshot: {
      name: { type: String, trim: true, maxlength: 200 },
      email: { type: String, trim: true, maxlength: 255 },
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

attendanceSchema.pre('save', function(next) {
  if (this.date instanceof Date && !Number.isNaN(this.date.getTime())) {
    const normalized = new Date(this.date);
    normalized.setUTCHours(0, 0, 0, 0);
    this.date = normalized;
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
module.exports.STATUSES = ATTENDANCE_STATUSES;

