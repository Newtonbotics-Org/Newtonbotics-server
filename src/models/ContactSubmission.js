const mongoose = require('mongoose');

const contactSubmissionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 255 },
    email: { type: String, required: true, maxlength: 255 },
    subject: { type: String, required: true, maxlength: 255 },
    message: { type: String, required: true, maxlength: 5000 },
    phone: { type: String, maxlength: 20 },
    category: { type: String, maxlength: 100, default: 'General' },
    department: { type: String, maxlength: 100 },
    status: { type: String, enum: ['new', 'in_progress', 'resolved', 'closed'], default: 'new' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    response: { type: String, maxlength: 5000 },
    respondedAt: { type: Date },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

module.exports = mongoose.model('ContactSubmission', contactSubmissionSchema);


