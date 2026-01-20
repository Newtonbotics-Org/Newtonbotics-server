const mongoose = require('mongoose');

const subroleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subrole name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Subrole name cannot exceed 100 characters'],
    lowercase: true,
    match: [/^[a-z_]+$/, 'Subrole name can only contain lowercase letters and underscores']
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
    maxlength: [100, 'Display name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: [
        'management_leadership',
        'financial_administrative', 
        'technical_specializations',
        'lab_operations',
        'communication_outreach',
        'event_workshop_management',
        'research_publication',
        'industry_partnerships',
        'student_support',
        'special_designations'
      ],
      message: 'Invalid category'
    }
  },
  permissions: [{
    type: String,
    enum: {
      values: [
        'read:projects', 'write:projects', 'delete:projects', 'manage:projects',
        'read:workshops', 'write:workshops', 'delete:workshops',
        'read:events', 'write:events', 'delete:events',
        'read:inventory', 'write:inventory', 'delete:inventory', 'manage:inventory',
        'read:requests', 'write:requests', 'approve:requests',
        'read:news', 'write:news', 'delete:news',
        'read:media', 'write:media', 'delete:media',
        'read:users', 'write:users', 'delete:users',
        'manage:finance',
        'manage:system', 'system:admin'
      ],
      message: 'Invalid permission value'
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 0,
    min: [0, 'Priority cannot be negative']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for category display name
subroleSchema.virtual('categoryDisplayName').get(function() {
  const categoryMap = {
    'management_leadership': 'Management & Leadership',
    'financial_administrative': 'Financial & Administrative',
    'technical_specializations': 'Technical Specializations',
    'lab_operations': 'Lab Operations',
    'communication_outreach': 'Communication & Outreach',
    'event_workshop_management': 'Event & Workshop Management',
    'research_publication': 'Research & Publication',
    'industry_partnerships': 'Industry & Partnerships',
    'student_support': 'Student Support',
    'special_designations': 'Special Designations'
  };
  return categoryMap[this.category] || this.category;
});

// Indexes for performance
subroleSchema.index({ name: 1 });
subroleSchema.index({ category: 1 });
subroleSchema.index({ isActive: 1 });
subroleSchema.index({ priority: -1 });

// Pre-save middleware to update lastModifiedBy
subroleSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastModifiedBy = this.createdBy; // This should be set by the route handler
  }
  next();
});

// Static method to get active subroles
subroleSchema.statics.getActiveSubroles = function() {
  return this.find({ isActive: true }).sort({ category: 1, priority: -1, displayName: 1 });
};

// Static method to get subroles by category
subroleSchema.statics.getByCategory = function(category) {
  return this.find({ category, isActive: true }).sort({ priority: -1, displayName: 1 });
};

// Static method to get subrole names array (for User model validation)
subroleSchema.statics.getSubroleNames = async function() {
  const subroles = await this.find({ isActive: true }).select('name');
  return subroles.map(subrole => subrole.name);
};

// Static method to seed default subroles
subroleSchema.statics.seedDefaultSubroles = async function(adminUserId) {
  const defaultSubroles = [
    // Management & Leadership
    { name: 'project_manager', displayName: 'Project Manager', category: 'management_leadership', description: 'Manages and oversees project execution' },
    { name: 'team_lead', displayName: 'Team Lead', category: 'management_leadership', description: 'Leads a team of members' },
    { name: 'research_lead', displayName: 'Research Lead', category: 'management_leadership', description: 'Leads research initiatives' },
    { name: 'technical_lead', displayName: 'Technical Lead', category: 'management_leadership', description: 'Provides technical leadership' },
    { name: 'mentor_coordinator', displayName: 'Mentor Coordinator', category: 'management_leadership', description: 'Coordinates mentoring activities' },
    { name: 'lab_coordinator', displayName: 'Lab Coordinator', category: 'management_leadership', description: 'Coordinates lab activities' },
    { name: 'department_head', displayName: 'Department Head', category: 'management_leadership', description: 'Heads a department' },
    
    // Financial & Administrative
    { name: 'finance_manager', displayName: 'Finance Manager', category: 'financial_administrative', description: 'Manages financial operations' },
    { name: 'budget_coordinator', displayName: 'Budget Coordinator', category: 'financial_administrative', description: 'Coordinates budget planning' },
    { name: 'grant_writer', displayName: 'Grant Writer', category: 'financial_administrative', description: 'Writes grant proposals' },
    { name: 'procurement_officer', displayName: 'Procurement Officer', category: 'financial_administrative', description: 'Handles procurement processes' },
    { name: 'hr_coordinator', displayName: 'HR Coordinator', category: 'financial_administrative', description: 'Coordinates human resources' },
    { name: 'compliance_officer', displayName: 'Compliance Officer', category: 'financial_administrative', description: 'Ensures compliance with regulations' },
    { name: 'legal_advisor', displayName: 'Legal Advisor', category: 'financial_administrative', description: 'Provides legal guidance' },
    
    // Technical Specializations
    { name: 'software_developer', displayName: 'Software Developer', category: 'technical_specializations', description: 'Develops software applications' },
    { name: 'hardware_engineer', displayName: 'Hardware Engineer', category: 'technical_specializations', description: 'Designs and develops hardware' },
    { name: 'data_scientist', displayName: 'Data Scientist', category: 'technical_specializations', description: 'Analyzes and interprets data' },
    { name: 'ai_researcher', displayName: 'AI Researcher', category: 'technical_specializations', description: 'Conducts AI research' },
    { name: 'robotics_specialist', displayName: 'Robotics Specialist', category: 'technical_specializations', description: 'Specializes in robotics' },
    { name: 'electronics_expert', displayName: 'Electronics Expert', category: 'technical_specializations', description: 'Expert in electronics' },
    { name: 'mechanical_engineer', displayName: 'Mechanical Engineer', category: 'technical_specializations', description: 'Designs mechanical systems' },
    { name: 'web_developer', displayName: 'Web Developer', category: 'technical_specializations', description: 'Develops web applications' },
    { name: 'mobile_developer', displayName: 'Mobile Developer', category: 'technical_specializations', description: 'Develops mobile applications' },
    { name: 'devops_engineer', displayName: 'DevOps Engineer', category: 'technical_specializations', description: 'Manages development operations' },
    
    // Lab Operations
    { name: 'inventory_manager', displayName: 'Inventory Manager', category: 'lab_operations', description: 'Manages lab inventory' },
    { name: 'equipment_specialist', displayName: 'Equipment Specialist', category: 'lab_operations', description: 'Specializes in equipment management' },
    { name: 'safety_officer', displayName: 'Safety Officer', category: 'lab_operations', description: 'Ensures lab safety' },
    { name: 'quality_assurance', displayName: 'Quality Assurance', category: 'lab_operations', description: 'Ensures quality standards' },
    { name: 'maintenance_coordinator', displayName: 'Maintenance Coordinator', category: 'lab_operations', description: 'Coordinates maintenance activities' },
    { name: 'calibration_specialist', displayName: 'Calibration Specialist', category: 'lab_operations', description: 'Specializes in equipment calibration' },
    { name: 'lab_supervisor', displayName: 'Lab Supervisor', category: 'lab_operations', description: 'Supervises lab operations' },
    
    // Communication & Outreach
    { name: 'social_media_manager', displayName: 'Social Media Manager', category: 'communication_outreach', description: 'Manages social media presence' },
    { name: 'communications_officer', displayName: 'Communications Officer', category: 'communication_outreach', description: 'Handles communications' },
    { name: 'public_relations', displayName: 'Public Relations', category: 'communication_outreach', description: 'Manages public relations' },
    { name: 'marketing_coordinator', displayName: 'Marketing Coordinator', category: 'communication_outreach', description: 'Coordinates marketing activities' },
    { name: 'outreach_coordinator', displayName: 'Outreach Coordinator', category: 'communication_outreach', description: 'Coordinates outreach programs' },
    { name: 'community_manager', displayName: 'Community Manager', category: 'communication_outreach', description: 'Manages community engagement' },
    { name: 'content_creator', displayName: 'Content Creator', category: 'communication_outreach', description: 'Creates content for various platforms' },
    
    // Event & Workshop Management
    { name: 'workshop_coordinator', displayName: 'Workshop Coordinator', category: 'event_workshop_management', description: 'Coordinates workshops' },
    { name: 'event_organizer', displayName: 'Event Organizer', category: 'event_workshop_management', description: 'Organizes events' },
    { name: 'conference_manager', displayName: 'Conference Manager', category: 'event_workshop_management', description: 'Manages conferences' },
    { name: 'seminar_coordinator', displayName: 'Seminar Coordinator', category: 'event_workshop_management', description: 'Coordinates seminars' },
    { name: 'training_coordinator', displayName: 'Training Coordinator', category: 'event_workshop_management', description: 'Coordinates training programs' },
    { name: 'competition_organizer', displayName: 'Competition Organizer', category: 'event_workshop_management', description: 'Organizes competitions' },
    
    // Research & Publication
    { name: 'publication_coordinator', displayName: 'Publication Coordinator', category: 'research_publication', description: 'Coordinates publications' },
    { name: 'research_coordinator', displayName: 'Research Coordinator', category: 'research_publication', description: 'Coordinates research activities' },
    { name: 'data_curator', displayName: 'Data Curator', category: 'research_publication', description: 'Curates research data' },
    { name: 'literature_reviewer', displayName: 'Literature Reviewer', category: 'research_publication', description: 'Reviews literature' },
    { name: 'peer_reviewer', displayName: 'Peer Reviewer', category: 'research_publication', description: 'Conducts peer reviews' },
    { name: 'research_assistant', displayName: 'Research Assistant', category: 'research_publication', description: 'Assists with research' },
    { name: 'lab_technician', displayName: 'Lab Technician', category: 'research_publication', description: 'Provides technical support' },
    
    // Industry & Partnerships
    { name: 'industry_liaison', displayName: 'Industry Liaison', category: 'industry_partnerships', description: 'Liaises with industry partners' },
    { name: 'partnership_coordinator', displayName: 'Partnership Coordinator', category: 'industry_partnerships', description: 'Coordinates partnerships' },
    { name: 'business_developer', displayName: 'Business Developer', category: 'industry_partnerships', description: 'Develops business opportunities' },
    { name: 'startup_mentor', displayName: 'Startup Mentor', category: 'industry_partnerships', description: 'Mentors startups' },
    { name: 'patent_officer', displayName: 'Patent Officer', category: 'industry_partnerships', description: 'Handles patent matters' },
    { name: 'technology_transfer', displayName: 'Technology Transfer', category: 'industry_partnerships', description: 'Facilitates technology transfer' },
    
    // Student Support
    { name: 'student_advisor', displayName: 'Student Advisor', category: 'student_support', description: 'Advises students' },
    { name: 'career_counselor', displayName: 'Career Counselor', category: 'student_support', description: 'Provides career counseling' },
    { name: 'academic_coordinator', displayName: 'Academic Coordinator', category: 'student_support', description: 'Coordinates academic activities' },
    { name: 'tutoring_coordinator', displayName: 'Tutoring Coordinator', category: 'student_support', description: 'Coordinates tutoring services' },
    { name: 'peer_mentor', displayName: 'Peer Mentor', category: 'student_support', description: 'Provides peer mentoring' },
    { name: 'study_group_leader', displayName: 'Study Group Leader', category: 'student_support', description: 'Leads study groups' },
    
    // Special Designations
    { name: 'poc', displayName: 'Point of Contact', category: 'special_designations', description: 'Primary point of contact' },
    { name: 'key_contact', displayName: 'Key Contact', category: 'special_designations', description: 'Key contact person' },
    { name: 'emergency_contact', displayName: 'Emergency Contact', category: 'special_designations', description: 'Emergency contact person' },
    { name: 'first_responder', displayName: 'First Responder', category: 'special_designations', description: 'First responder for emergencies' },
    { name: 'crisis_manager', displayName: 'Crisis Manager', category: 'special_designations', description: 'Manages crisis situations' },
    { name: 'incident_coordinator', displayName: 'Incident Coordinator', category: 'special_designations', description: 'Coordinates incident response' }
  ];

  const existingSubroles = await this.find({}).select('name');
  const existingNames = existingSubroles.map(sr => sr.name);
  
  const newSubroles = defaultSubroles.filter(sr => !existingNames.includes(sr.name));
  
  if (newSubroles.length > 0) {
    const subrolesWithCreator = newSubroles.map(sr => ({
      ...sr,
      createdBy: adminUserId,
      lastModifiedBy: adminUserId
    }));
    
    await this.insertMany(subrolesWithCreator);
  }
  
  return newSubroles.length;
};

module.exports = mongoose.model('Subrole', subroleSchema);
