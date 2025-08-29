const express = require('express');
const router = express.Router();
const ContactSubmission = require('../models/ContactSubmission');
const { sendContactAcknowledgement, sendContactNotificationToAdmin } = require('../services/emailService');
const logger = require('../utils/logger');

// POST /api/contact/submit - Submit contact form
router.post('/submit', async (req, res) => {
  try {
    const { name, email, subject, message, phone, category } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, subject, and message are required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Message length validation
    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message too long. Maximum 1000 characters allowed.'
      });
    }

    // Create contact submission
    const contactSubmission = new ContactSubmission({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      phone: phone ? phone.trim() : undefined,
      department: category || 'General',
      status: 'new',
      priority: 'medium'
    });

    // Save to database
    await contactSubmission.save();

    // Send acknowledgement email to user
    try {
      await sendContactAcknowledgement({ name, email });
      logger.info(`Contact acknowledgement sent to ${email}`);
    } catch (emailError) {
      logger.error('Failed to send contact acknowledgement:', emailError);
      // Don't fail the request if email fails
    }

    // Send notification to robotics club email
    try {
      await sendContactNotificationToAdmin({ 
        subject, 
        name, 
        email, 
        message,
        phone: phone || 'Not provided',
        category: category || 'General'
      });
      logger.info(`Contact notification sent to admin for submission from ${email}`);
    } catch (emailError) {
      logger.error('Failed to send contact notification to admin:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Contact message submitted successfully. We will get back to you within 24-48 hours.',
      data: {
        id: contactSubmission._id,
        submittedAt: contactSubmission.createdAt
      }
    });

  } catch (error) {
    logger.error('Contact submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit contact message. Please try again later.'
    });
  }
});

// GET /api/contact/submissions - List contact submissions (admin only)
router.get('/submissions', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, department } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (department) filter.department = department;

    const submissions = await ContactSubmission.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('assignedTo', 'fullName email')
      .populate('respondedBy', 'fullName email');

    const total = await ContactSubmission.countDocuments(filter);

    res.json({
      success: true,
      data: {
        submissions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching contact submissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contact submissions'
    });
  }
});

// GET /api/contact/submissions/:id - Get contact submission details
router.get('/submissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const submission = await ContactSubmission.findById(id)
      .populate('assignedTo', 'fullName email')
      .populate('respondedBy', 'fullName email');

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Contact submission not found'
      });
    }

    res.json({
      success: true,
      data: submission
    });

  } catch (error) {
    logger.error('Error fetching contact submission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contact submission'
    });
  }
});

// PUT /api/contact/submissions/:id - Update contact submission status
router.put('/submissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedTo, response } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (response) {
      updateData.response = response;
      updateData.respondedAt = new Date();
      updateData.respondedBy = req.user?._id; // TODO: Get from auth middleware
    }

    const submission = await ContactSubmission.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'fullName email')
     .populate('respondedBy', 'fullName email');

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Contact submission not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact submission updated successfully',
      data: submission
    });

  } catch (error) {
    logger.error('Error updating contact submission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update contact submission'
    });
  }
});

// DELETE /api/contact/submissions/:id - Delete contact submission
router.delete('/submissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const submission = await ContactSubmission.findByIdAndDelete(id);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Contact submission not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact submission deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting contact submission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete contact submission'
    });
  }
});

// GET /api/contact/stats - Get contact submission statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await ContactSubmission.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          new: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } }
        }
      }
    ]);

    const departmentStats = await ContactSubmission.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || { total: 0, new: 0, inProgress: 0, resolved: 0, closed: 0 },
        byDepartment: departmentStats
      }
    });

  } catch (error) {
    logger.error('Error fetching contact stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contact statistics'
    });
  }
});

module.exports = router;
