/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../src/models/User');
const Project = require('../src/models/Project');
const Workshop = require('../src/models/Workshop');
const Event = require('../src/models/Event');
const EquipmentCategory = require('../src/models/EquipmentCategory');
const Equipment = require('../src/models/Equipment');
const NewsCategory = require('../src/models/NewsCategory');
const News = require('../src/models/News');
const MediaCategory = require('../src/models/MediaCategory');
const Media = require('../src/models/Media');
const MediaCollection = require('../src/models/MediaCollection');
const ContactSubmission = require('../src/models/ContactSubmission');
const InternalMessage = require('../src/models/InternalMessage');
const ProjectRequest = require('../src/models/ProjectRequest');
const RoleApproval = require('../src/models/RoleApproval');
const NewsApplication = require('../src/models/NewsApplication');
const ResearchArea = require('../src/models/ResearchArea');

async function connect() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/newtonbotics';
  await mongoose.connect(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  });
  console.log('Connected to MongoDB');
}

async function ensureUser({ 
  email, 
  password, 
  role, 
  firstName, 
  lastName, 
  department, 
  yearOfStudy, 
  phone, 
  emailVerified = true,
  subroles = [],
  specialization = '',
  experienceYears = 0,
  bio = '',
  skills = [],
  achievements = [],
  socialLinks = {},
  profileImageUrl = ''
}) {
  let user = await User.findOne({ email });
  if (!user) {
    user = new User({
      email,
      passwordHash: password,
      role,
      firstName,
      lastName,
      department,
      yearOfStudy,
      phone,
      emailVerified,
      isActive: true,
      subroles,
      specialization,
      experienceYears,
      bio,
      skills,
      achievements,
      socialLinks,
      profileImageUrl
    });
  } else {
    user.role = role;
    user.firstName = firstName;
    user.lastName = lastName;
    user.department = department;
    user.yearOfStudy = yearOfStudy;
    user.phone = phone;
    user.emailVerified = emailVerified;
    user.isActive = true;
    user.subroles = subroles;
    user.specialization = specialization;
    user.experienceYears = experienceYears;
    user.bio = bio;
    user.skills = skills;
    user.achievements = achievements;
    user.socialLinks = socialLinks;
    user.profileImageUrl = profileImageUrl;
    // set new password (pre-save will hash)
    user.passwordHash = password;
  }
  await user.save();
  console.log(`Seeded user: ${email} (${role}) with subroles: [${subroles.join(', ')}]`);
  return user;
}

async function seedProjects({ mentor, teamLeader, members }) {
  const existing = await Project.find({ title: { $in: ['Autonomous Rover', 'Robotic Arm', 'AI Vision System'] } });
  if (existing.length > 0) {
    console.log('Projects already exist, skipping project seeding');
    return existing;
  }

  const projects = [];

  const chassisDue = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
  const sensorsDue = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

  projects.push(new Project({
    title: 'Autonomous Rover',
    description: 'Design and build an autonomous rover capable of navigating obstacle courses using SLAM.',
    category: 'Robotics',
    status: 'ongoing',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    budget: 5000,
    mentorId: mentor._id,
    teamLeaderId: teamLeader._id,
    achievements: ['Won campus demo day'],
    tags: ['ros', 'slam', 'lidar'],
    imageUrls: [
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop'
    ],
    milestones: [
      { title: 'Chassis Assembly', description: 'Assemble rover body', dueDate: chassisDue, status: 'completed', completedAt: chassisDue },
      { title: 'Sensor Integration', description: 'Integrate LIDAR and IMU', dueDate: sensorsDue, status: 'completed', completedAt: sensorsDue },
      { title: 'SLAM Tuning', description: 'Tune SLAM parameters', dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), status: 'in_progress' },
    ],
    teamMembers: [
      { userId: members[0]._id, role: 'Developer', skills: ['C++', 'ROS2'] },
      { userId: members[1]._id, role: 'Hardware', skills: ['Electronics'] },
    ],
  }));

  projects.push(new Project({
    title: 'Robotic Arm',
    description: 'Develop a 6-DOF robotic arm with inverse kinematics and vision-based pick-and-place.',
    category: 'Automation',
    status: 'upcoming',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    budget: 3000,
    mentorId: mentor._id,
    teamLeaderId: teamLeader._id,
    imageUrls: [
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop'
    ],
    milestones: [
      { title: 'CAD Design', description: 'Design arm in CAD', dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
    ],
    teamMembers: [
      { userId: members[0]._id, role: 'Designer' },
    ],
  }));

  const modelSelDue = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
  const edgeOptDue = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  projects.push(new Project({
    title: 'AI Vision System',
    description: 'Real-time object detection pipeline optimized for edge devices.',
    category: 'AI/ML',
    status: 'completed',
    startDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    budget: 2000,
    mentorId: mentor._id,
    teamLeaderId: teamLeader._id,
    achievements: ['Published internal whitepaper'],
    imageUrls: [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop'
    ],
    milestones: [
      { title: 'Model Selection', dueDate: modelSelDue, status: 'completed', completedAt: modelSelDue },
      { title: 'Edge Optimization', dueDate: edgeOptDue, status: 'completed', completedAt: edgeOptDue },
    ],
    teamMembers: [
      { userId: members[1]._id, role: 'ML Engineer', skills: ['Python', 'TensorRT'] },
    ],
  }));

  // Add more diverse projects
  projects.push(new Project({
    title: 'Smart Home Automation',
    description: 'IoT-based home automation system with voice control and mobile app integration.',
    category: 'IoT',
    status: 'ongoing',
    startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    budget: 4000,
    mentorId: mentor._id,
    teamLeaderId: teamLeader._id,
    imageUrls: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'
    ],
    tags: ['iot', 'automation', 'voice-control', 'mobile-app'],
    milestones: [
      { title: 'Hardware Setup', description: 'Install sensors and actuators', dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), status: 'in_progress' },
      { title: 'App Development', description: 'Develop mobile control app', dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), status: 'pending' },
    ],
    teamMembers: [
      { userId: members[0]._id, role: 'IoT Developer', skills: ['Arduino', 'ESP32'] },
      { userId: members[1]._id, role: 'App Developer', skills: ['React Native', 'Firebase'] },
    ],
  }));

  projects.push(new Project({
    title: 'Drone Surveillance System',
    description: 'Autonomous drone with computer vision for surveillance and monitoring applications.',
    category: 'Computer Vision',
    status: 'upcoming',
    startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    budget: 8000,
    mentorId: mentor._id,
    teamLeaderId: teamLeader._id,
    imageUrls: [
      'https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop'
    ],
    tags: ['drone', 'surveillance', 'computer-vision', 'autonomous'],
    milestones: [
      { title: 'Drone Assembly', description: 'Build and test drone frame', dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), status: 'pending' },
      { title: 'Vision System', description: 'Implement object detection', dueDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000), status: 'pending' },
    ],
    teamMembers: [
      { userId: members[0]._id, role: 'Drone Engineer', skills: ['Flight Control', 'PID Tuning'] },
      { userId: members[1]._id, role: 'Computer Vision Engineer', skills: ['OpenCV', 'YOLO'] },
    ],
  }));

  projects.push(new Project({
    title: 'Gesture Control Interface',
    description: 'Hand gesture recognition system for controlling devices without physical contact.',
    category: 'Human-Computer Interaction',
    status: 'completed',
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    budget: 1500,
    mentorId: mentor._id,
    teamLeaderId: teamLeader._id,
    achievements: ['Demo at university open house', 'Featured in local tech blog'],
    imageUrls: [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop'
    ],
    tags: ['gesture-recognition', 'computer-vision', 'interface', 'contactless'],
    milestones: [
      { title: 'Algorithm Development', dueDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), status: 'completed', completedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
      { title: 'Hardware Integration', dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), status: 'completed', completedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    ],
    teamMembers: [
      { userId: members[0]._id, role: 'Algorithm Developer', skills: ['Python', 'OpenCV'] },
      { userId: members[1]._id, role: 'Hardware Engineer', skills: ['Arduino', 'Sensors'] },
    ],
  }));

  const saved = await Project.insertMany(projects);
  console.log(`Seeded ${saved.length} projects`);
  return saved;
}

async function ensureRoleApproval({ email, allowedRoles, note }) {
  const normalizedEmail = email.toLowerCase();
  const update = {
    email: normalizedEmail,
    allowedRoles: Array.from(new Set(allowedRoles)),
    note,
    isActive: true,
  };
  const approval = await RoleApproval.findOneAndUpdate(
    { email: normalizedEmail },
    { $set: update },
    { upsert: true, new: true }
  );
  console.log(`Seeded role approval: ${normalizedEmail} -> [${approval.allowedRoles.join(', ')}]`);
  return approval;
}

async function seedWorkshops({ instructor, attendees }) {
  const exists = await Workshop.findOne({ title: 'Intro to ROS2' });
  if (exists) {
    console.log('Workshops already exist, skipping workshop seeding');
    return;
  }

  const ws = new Workshop({
    title: 'Intro to ROS2',
    description: 'Basics of ROS2, nodes, topics, and navigation stack.',
    instructorId: instructor._id,
    category: 'Robotics',
    level: 'beginner',
    maxParticipants: 30,
    currentParticipants: 2,
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
    location: 'Lab 101',
    status: 'upcoming',
    registrations: attendees.map((u) => ({ userId: u._id })),
  });
  await ws.save();
  console.log('Seeded 1 workshop');
}

async function seedEvents({ organizer, attendees }) {
  // Clear existing events to ensure fresh data
  await Event.deleteMany({});
  console.log('Cleared existing events');
  const baseDate = new Date();
  const events = [
    {
      title: 'Robotics Showcase',
      description: 'Expo featuring student and mentor projects.',
      category: 'showcase',
      type: 'showcase',
      startDate: new Date(baseDate.getTime() + 15 * 24 * 60 * 60 * 1000),
      endDate: new Date(baseDate.getTime() + 15 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
      location: 'Main Auditorium',
      maxCapacity: 200,
      currentRegistrations: attendees.length,
      organizerId: organizer._id,
      status: 'upcoming',
      registrations: attendees.map((u) => ({ userId: u._id })),
    },
    {
      title: 'Weekly Tech Talk',
      description: 'Members share ongoing research and learnings.',
      category: 'technical',
      type: 'technical',
      startDate: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      location: 'Seminar Hall 2',
      maxCapacity: 50,
      currentRegistrations: 20,
      organizerId: organizer._id,
      status: 'completed',
    },
    {
      title: 'Hackathon Night',
      description: 'Overnight buildathon for rapid prototyping.',
      category: 'competition',
      type: 'competition',
      startDate: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
      location: 'Innovation Lab',
      maxCapacity: 80,
      currentRegistrations: 10,
      organizerId: organizer._id,
      status: 'upcoming',
      isFeatured: true,
    },
    {
      title: 'Community Networking',
      description: 'Meet alumni and partners for collaboration opportunities.',
      category: 'networking',
      type: 'networking',
      startDate: new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      location: 'Cafe Terrace',
      maxCapacity: 120,
      currentRegistrations: 0,
      organizerId: organizer._id,
      status: 'upcoming',
    },
    {
      title: 'AI Ethics Workshop & Discussion',
      description: 'Interactive workshop on ethical considerations in AI and robotics development.',
      category: 'workshop',
      type: 'workshop',
      startDate: new Date(baseDate.getTime() + 8 * 24 * 60 * 60 * 1000),
      endDate: new Date(baseDate.getTime() + 8 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      location: 'Conference Room A',
      maxCapacity: 60,
      currentRegistrations: 15,
      organizerId: organizer._id,
      status: 'upcoming',
      isFeatured: true,
    },
    {
      title: 'Robotics Career Fair',
      description: 'Connect with industry professionals and explore career opportunities in robotics.',
      category: 'career',
      type: 'networking',
      startDate: new Date(baseDate.getTime() + 25 * 24 * 60 * 60 * 1000),
      endDate: new Date(baseDate.getTime() + 25 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      location: 'Grand Hall',
      maxCapacity: 300,
      currentRegistrations: 45,
      organizerId: organizer._id,
      status: 'upcoming',
      isFeatured: true,
    },
    {
      title: 'Open Source Robotics Meetup',
      description: 'Monthly meetup for open source robotics enthusiasts and contributors.',
      category: 'meetup',
      type: 'networking',
      startDate: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      location: 'Innovation Hub',
      maxCapacity: 80,
      currentRegistrations: 25,
      organizerId: organizer._id,
      status: 'upcoming',
    },
    {
      title: 'Robotics in Healthcare Symposium',
      description: 'Exploring the intersection of robotics and healthcare applications.',
      category: 'symposium',
      type: 'seminar',
      startDate: new Date(baseDate.getTime() + 40 * 24 * 60 * 60 * 1000),
      endDate: new Date(baseDate.getTime() + 40 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
      location: 'Medical Center Auditorium',
      maxCapacity: 150,
      currentRegistrations: 8,
      organizerId: organizer._id,
      status: 'upcoming',
      isFeatured: true,
    },
    {
      title: 'Student Project Demo Day',
      description: 'Students showcase their robotics projects and receive feedback.',
      category: 'showcase',
      type: 'showcase',
      startDate: new Date(baseDate.getTime() + 12 * 24 * 60 * 60 * 1000),
      endDate: new Date(baseDate.getTime() + 12 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      location: 'Engineering Building',
      maxCapacity: 200,
      currentRegistrations: 35,
      organizerId: organizer._id,
      status: 'upcoming',
    },
    {
      title: 'Robotics Research Colloquium',
      description: 'Events featuring faculty and graduate students present cutting-edge robotics research.',
      category: 'academic',
      type: 'seminar',
      startDate: new Date(baseDate.getTime() + 18 * 24 * 60 * 60 * 1000),
      endDate: new Date(baseDate.getTime() + 18 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      location: 'Research Hall',
      maxCapacity: 100,
      currentRegistrations: 22,
      organizerId: organizer._id,
      status: 'upcoming',
    },
    {
      title: 'Industry Partnership Summit',
      description: 'Strategic discussions with industry partners for collaborative research.',
      category: 'partnership',
      type: 'networking',
      startDate: new Date(baseDate.getTime() + 45 * 24 * 60 * 60 * 1000),
      endDate: new Date(baseDate.getTime() + 45 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000),
      location: 'Executive Conference Center',
      maxCapacity: 80,
      currentRegistrations: 12,
      organizerId: organizer._id,
      status: 'upcoming',
      isFeatured: true,
    },
    {
      title: 'Robotics Safety Training',
      description: 'Essential safety protocols and best practices for robotics development.',
      category: 'training',
      type: 'training',
      startDate: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      location: 'Safety Training Lab',
      maxCapacity: 40,
      currentRegistrations: 18,
      organizerId: organizer._id,
      status: 'upcoming',
    },
    {
      title: 'International Robotics Conference',
      description: 'Annual conference featuring global robotics research and innovations.',
      category: 'conference',
      type: 'exhibition',
      startDate: new Date(baseDate.getTime() + 60 * 24 * 60 * 60 * 1000),
      endDate: new Date(baseDate.getTime() + 60 * 24 * 60 * 60 * 1000 + 3 * 24 * 60 * 60 * 1000),
      location: 'Convention Center',
      maxCapacity: 500,
      currentRegistrations: 89,
      organizerId: organizer._id,
      status: 'upcoming',
      isFeatured: true,
    },
  ];
  await Event.insertMany(events);
  console.log(`Seeded ${events.length} events`);
}

async function seedInventory() {
  const exists = await Equipment.findOne({ name: 'NVIDIA Jetson Nano' });
  if (exists) {
    console.log('Inventory already exists, skipping inventory seeding');
    return;
  }

  const catBoards = await EquipmentCategory.create({ name: 'Development Boards', description: 'MCUs and SBCs' });
  const catSensors = await EquipmentCategory.create({ name: 'Sensors', description: 'LIDAR, Cameras, IMU' });

  await Equipment.create([
    {
      name: 'NVIDIA Jetson Nano',
      description: 'Edge AI development board',
      categoryId: catBoards._id,
      manufacturer: 'NVIDIA',
      purchaseDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
      purchasePrice: 99,
      currentQuantity: 5,
      minQuantity: 2,
      location: 'Shelf A1',
      status: 'available',
      specifications: { ram: '4GB', storage: 'microSD' },
    },
    {
      name: 'Realsense D435 Camera',
      description: 'Depth camera for vision tasks',
      categoryId: catSensors._id,
      manufacturer: 'Intel',
      purchaseDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      purchasePrice: 179,
      currentQuantity: 3,
      minQuantity: 1,
      location: 'Shelf B2',
      status: 'available',
      specifications: { fps: 30, resolution: '1280x720' },
    },
  ]);

  console.log('Seeded inventory items and categories');
}

async function seedNews({ author }) {
  // Ensure baseline categories
  const categoriesByName = {};
  for (const c of [
    { name: 'Updates', description: 'Club updates', color: '#0070f3' },
    { name: 'Research', description: 'Research outcomes', color: '#22c55e' },
    { name: 'Workshops', description: 'Training & tutorials', color: '#2563eb' },
    { name: 'Events', description: 'Talks & gatherings', color: '#059669' },
    { name: 'Competitions', description: 'Hackathons & contests', color: '#dc2626' },
  ]) {
    let doc = await NewsCategory.findOne({ name: c.name });
    if (!doc) doc = await NewsCategory.create(c);
    categoriesByName[c.name] = doc;
  }

  // Ensure baseline published news without application
  const baselineNews = [
    {
      title: 'Welcome to the Semester',
      content: 'Kickoff meeting next week!',
      excerpt: 'Kickoff meeting next week!',
      categoryId: categoriesByName['Updates']._id,
      authorId: author._id,
      isPublished: true,
      publishedAt: new Date(),
      tags: ['welcome', 'kickoff'],
    },
    {
      title: 'New Paper Accepted',
      content: 'Our AI vision paper accepted at XYZ.',
      categoryId: categoriesByName['Research']._id,
      authorId: author._id,
      isPublished: true,
      isFeatured: true,
      publishedAt: new Date(),
      tags: ['ai', 'paper'],
    },
  ];
  for (const n of baselineNews) {
    const exists = await News.findOne({ title: n.title });
    if (!exists) await News.create(n);
  }

  // Seed news with application forms
  const appNewsItems = [
    {
      title: 'Robotics Workshop 101',
      content: 'Intro workshop details... Learn ROS2 basics and build a mini bot.',
      excerpt: 'Intro workshop — apply now',
      categoryId: categoriesByName['Workshops']._id,
      authorId: author._id,
      isPublished: true,
      isFeatured: true,
      featureOptions: { showInNav: true, navLabel: 'Workshop', navOrder: 1 },
      publishedAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      tags: ['workshop', 'education'],
      application: {
        isEnabled: true,
        type: 'workshop',
        requireLogin: false,
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        maxApplicants: 50,
        formFields: [
          { name: 'school', label: 'School', type: 'text', required: true },
          { name: 'experience', label: 'Experience Level', type: 'select', required: true, options: ['Beginner','Intermediate','Advanced'] },
          { name: 'portfolio', label: 'Portfolio URL', type: 'url', required: false },
        ],
        targetType: 'Workshop',
      },
    },
    {
      title: 'Robotics Showcase Registration',
      content: 'Register to attend the upcoming Robotics Showcase event.',
      excerpt: 'Showcase registration — apply now',
      categoryId: categoriesByName['Events']._id,
      authorId: author._id,
      isPublished: true,
      featureOptions: { showInNav: true, navLabel: 'Showcase', navOrder: 2 },
      publishedAt: new Date(),
      tags: ['event', 'showcase'],
      application: {
        isEnabled: true,
        type: 'event',
        requireLogin: true,
        maxApplicants: 200,
        formFields: [
          { name: 'attendance', label: 'Will you attend in person?', type: 'radio', required: true, options: ['Yes','No'] },
          { name: 'dietary', label: 'Dietary Restrictions', type: 'text', required: false },
        ],
        targetType: 'Event',
      },
    },
    {
      title: 'Hackathon Night Registration',
      content: 'Overnight buildathon — submit your team details to participate.',
      excerpt: 'Hackathon registration — apply now',
      categoryId: categoriesByName['Competitions']._id,
      authorId: author._id,
      isPublished: true,
      publishedAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      tags: ['competition', 'hackathon'],
      application: {
        isEnabled: true,
        type: 'competition',
        requireLogin: false,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        formFields: [
          { name: 'teamName', label: 'Team Name', type: 'text', required: true },
          { name: 'members', label: 'Team Members', type: 'textarea', required: false },
        ],
        targetType: 'Competition',
      },
    },
    {
      title: 'Summer Research Internship Program',
      content: 'Join our summer research program working on cutting-edge robotics projects.',
      excerpt: 'Summer internship applications open',
      categoryId: categoriesByName['Research']._id,
      authorId: author._id,
      isPublished: true,
      isFeatured: true,
      featureOptions: { showInNav: true, navLabel: 'Internship', navOrder: 3 },
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      tags: ['internship', 'research', 'summer'],
      application: {
        isEnabled: true,
        type: 'other',
        requireLogin: true,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        maxApplicants: 25,
        formFields: [
          { name: 'university', label: 'University', type: 'text', required: true },
          { name: 'major', label: 'Major/Field of Study', type: 'text', required: true },
          { name: 'year', label: 'Year of Study', type: 'select', required: true, options: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate'] },
          { name: 'researchInterest', label: 'Research Interest Area', type: 'select', required: true, options: ['Robotics', 'AI/ML', 'Computer Vision', 'Control Systems', 'Biomechanics'] },
          { name: 'motivation', label: 'Why do you want to join?', type: 'textarea', required: true },
          { name: 'skills', label: 'Technical Skills', type: 'textarea', required: false },
        ],
        targetType: 'Other',
      },
    },
    {
      title: 'Robotics Competition Team Tryouts',
      content: 'Tryouts for the national robotics competition team. Show your skills!',
      excerpt: 'Team tryouts — apply now',
      categoryId: categoriesByName['Competitions']._id,
      authorId: author._id,
      isPublished: true,
      publishedAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      tags: ['competition', 'team', 'tryouts'],
      application: {
        isEnabled: true,
        type: 'competition',
        requireLogin: true,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        maxApplicants: 40,
        formFields: [
          { name: 'experience', label: 'Robotics Experience', type: 'select', required: true, options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
          { name: 'competitions', label: 'Previous Competitions', type: 'textarea', required: false },
          { name: 'strengths', label: 'Your Strengths', type: 'textarea', required: true },
          { name: 'availability', label: 'Weekly Availability (hours)', type: 'number', required: true },
        ],
        targetType: 'Competition',
      },
    },
    {
      title: 'Advanced ROS2 Workshop Series',
      content: 'Deep dive into ROS2 advanced features for experienced developers.',
      excerpt: 'Advanced ROS2 workshop series',
      categoryId: categoriesByName['Workshops']._id,
      authorId: author._id,
      isPublished: true,
      publishedAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      tags: ['workshop', 'ros2', 'advanced'],
      application: {
        isEnabled: true,
        type: 'workshop',
        requireLogin: false,
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        maxApplicants: 30,
        formFields: [
          { name: 'rosExperience', label: 'ROS Experience Level', type: 'select', required: true, options: ['Beginner', 'Intermediate', 'Advanced'] },
          { name: 'projects', label: 'Previous ROS Projects', type: 'textarea', required: false },
          { name: 'goals', label: 'What do you want to learn?', type: 'textarea', required: true },
        ],
        targetType: 'Workshop',
      },
    },
  ];
  for (const n of appNewsItems) {
    const exists = await News.findOne({ title: n.title });
    if (!exists) await News.create(n);
  }

  console.log('Seeded news, categories, and application-enabled items');
}

async function seedNewsApplications({ users }) {
  // Map news by title for linking
  const titles = [
    'Robotics Workshop 101',
    'Robotics Showcase Registration',
    'Hackathon Night Registration',
    'Summer Research Internship Program',
    'Robotics Competition Team Tryouts',
    'Advanced ROS2 Workshop Series',
  ];
  const newsDocs = await News.find({ title: { $in: titles } });
  const byTitle = Object.fromEntries(newsDocs.map((n) => [n.title, n]));

  // Early exit if we already created applications
  const existingAny = await NewsApplication.countDocuments({ newsId: { $in: newsDocs.map(n => n._id) } });
  if (existingAny > 0) {
    console.log('News applications already exist, skipping application seeding');
    return;
  }

  const [leader, member1, member2] = users;

  const toCreate = [
    // Workshop applications (one logged-in, one public)
    {
      newsId: byTitle['Robotics Workshop 101']?._id,
      type: 'workshop',
      applicant: { userId: member1?._id, fullName: `${member1?.firstName || 'Neha'} ${member1?.lastName || 'Sharma'}`.trim(), email: member1?.email, phone: member1?.phone },
      responses: [
        { fieldName: 'school', value: 'Newton High' },
        { fieldName: 'experience', value: 'Beginner' },
        { fieldName: 'portfolio', value: 'https://example.com/portfolio/neha' },
      ],
      status: 'submitted',
    },
    {
      newsId: byTitle['Robotics Workshop 101']?._id,
      type: 'workshop',
      applicant: { fullName: 'Alex Doe', email: 'alex@example.com', phone: '+1-555-0100' },
      responses: [
        { fieldName: 'school', value: 'City Public School' },
        { fieldName: 'experience', value: 'Intermediate' },
      ],
      status: 'submitted',
    },
    // Event application (login required)
    {
      newsId: byTitle['Robotics Showcase Registration']?._id,
      type: 'event',
      applicant: { userId: leader?._id, fullName: `${leader?.firstName || 'Arjun'} ${leader?.lastName || 'Verma'}`.trim(), email: leader?.email, phone: leader?.phone },
      responses: [
        { fieldName: 'attendance', value: 'Yes' },
        { fieldName: 'dietary', value: 'Vegetarian' },
      ],
      status: 'submitted',
    },
    // Competition application
    {
      newsId: byTitle['Hackathon Night Registration']?._id,
      type: 'competition',
      applicant: { userId: member2?._id, fullName: `${member2?.firstName || 'Ravi'} ${member2?.lastName || 'Patel'}`.trim(), email: member2?.email, phone: member2?.phone },
      responses: [
        { fieldName: 'teamName', value: 'Edge Ninjas' },
        { fieldName: 'members', value: 'Ravi, Arjun, Neha' },
      ],
      status: 'submitted',
    },
    // Internship application
    {
      newsId: byTitle['Summer Research Internship Program']?._id,
      type: 'other',
      applicant: { userId: member1?._id, fullName: `${member1?.firstName || 'Neha'} ${member1?.lastName || 'Sharma'}`.trim(), email: member1?.email, phone: member1?.phone },
      responses: [
        { fieldName: 'university', value: 'Newton University' },
        { fieldName: 'major', value: 'Computer Science' },
        { fieldName: 'year', value: '3rd Year' },
        { fieldName: 'researchInterest', value: 'AI/ML' },
        { fieldName: 'motivation', value: 'I want to work on cutting-edge robotics research and contribute to autonomous systems.' },
        { fieldName: 'skills', value: 'Python, Machine Learning, Computer Vision' },
      ],
      status: 'submitted',
    },
    // Team tryouts application
    {
      newsId: byTitle['Robotics Competition Team Tryouts']?._id,
      type: 'competition',
      applicant: { userId: leader?._id, fullName: `${leader?.firstName || 'Arjun'} ${leader?.lastName || 'Verma'}`.trim(), email: leader?.email, phone: leader?.phone },
      responses: [
        { fieldName: 'experience', value: 'Advanced' },
        { fieldName: 'competitions', value: 'National Robotics Championship 2024, Campus Bot Wars' },
        { fieldName: 'strengths', value: 'Team leadership, hardware integration, control systems' },
        { fieldName: 'availability', value: 15 },
      ],
      status: 'submitted',
    },
    // Advanced workshop application
    {
      newsId: byTitle['Advanced ROS2 Workshop Series']?._id,
      type: 'workshop',
      applicant: { fullName: 'Sarah Chen', email: 'sarah.chen@example.com', phone: '+1-555-0200' },
      responses: [
        { fieldName: 'rosExperience', value: 'Intermediate' },
        { fieldName: 'projects', value: 'Built a simple mobile robot with ROS1, working on ROS2 migration' },
        { fieldName: 'goals', value: 'Learn advanced ROS2 features for industrial robotics applications' },
      ],
      status: 'submitted',
    },
  ].filter((x) => x.newsId);

  if (toCreate.length > 0) {
    await NewsApplication.insertMany(toCreate);
    console.log(`Seeded ${toCreate.length} news applications`);
  } else {
    console.log('No application-enabled news found to seed applications');
  }
}

async function seedMedia({ uploader }) {
  // Clear existing media data for fresh seeding
  await Media.deleteMany({});
  await MediaCategory.deleteMany({});
  await MediaCollection.deleteMany({});
  
  console.log('Seeding comprehensive media data...');

  // Create media categories
  const categories = await MediaCategory.create([
    { name: 'Team Photos', description: 'Photos of team members, group activities, and team building events' },
    { name: 'Competition Videos', description: 'Videos from robotics competitions, challenges, and tournaments' },
    { name: 'Project Documentation', description: 'Documentation, diagrams, and technical drawings of projects' },
    { name: 'Workshop Materials', description: 'Presentation slides, handouts, and workshop recordings' },
    { name: 'Research Presentations', description: 'Conference presentations, research posters, and academic materials' },
    { name: 'Lab Equipment', description: 'Photos and videos of lab equipment, tools, and facilities' },
    { name: 'Event Coverage', description: 'Photos and videos from events, seminars, and outreach programs' },
    { name: 'Tutorial Videos', description: 'Educational content, how-to guides, and tutorial videos' }
  ]);

  console.log(`Created ${categories.length} media categories`);

  // Create comprehensive media files
  const mediaFiles = await Media.create([
    // Team Photos
    {
      title: 'Team Photo 2024',
      description: 'Annual team photo from robotics competition season',
      fileUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop',
      fileType: 'image',
      fileSize: 2048576,
      dimensions: '1920x1080',
      categoryId: categories[0]._id,
      uploadedBy: uploader._id,
      tags: ['team', 'competition', '2024', 'group'],
      isFeatured: true,
      viewCount: 156
    },
    {
      title: 'Lab Working Session',
      description: 'Team members collaborating on autonomous rover project',
      fileUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop',
      fileType: 'image',
      fileSize: 1856320,
      dimensions: '1920x1080',
      categoryId: categories[0]._id,
      uploadedBy: uploader._id,
      tags: ['lab', 'collaboration', 'project', 'working'],
      isFeatured: false,
      viewCount: 89
    },
    {
      title: 'Competition Celebration',
      description: 'Team celebrating after winning first place in regional competition',
      fileUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
      fileType: 'image',
      fileSize: 2150400,
      dimensions: '1920x1080',
      categoryId: categories[0]._id,
      uploadedBy: uploader._id,
      tags: ['celebration', 'victory', 'competition', 'success'],
      isFeatured: true,
      viewCount: 234
    },

    // Competition Videos
    {
      title: 'Final Round Competition',
      description: 'Complete video of the final round from robotics championship',
      fileUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
      fileType: 'video',
      fileSize: 52428800,
      dimensions: '1280x720',
      duration: 180,
      categoryId: categories[1]._id,
      uploadedBy: uploader._id,
      tags: ['competition', 'final', 'championship', 'robotics'],
      isFeatured: true,
      viewCount: 567
    },
    {
      title: 'Robot Testing Session',
      description: 'Testing autonomous navigation algorithms in controlled environment',
      fileUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_640x360_1mb.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop',
      fileType: 'video',
      fileSize: 20971520,
      dimensions: '640x360',
      duration: 120,
      categoryId: categories[1]._id,
      uploadedBy: uploader._id,
      tags: ['testing', 'autonomous', 'navigation', 'algorithm'],
      isFeatured: false,
      viewCount: 123
    },

    // Project Documentation
    {
      title: 'Autonomous Rover Schematic',
      description: 'Technical schematic and wiring diagram for autonomous rover project',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
      fileType: 'document',
      fileSize: 1048576,
      categoryId: categories[2]._id,
      uploadedBy: uploader._id,
      tags: ['schematic', 'rover', 'technical', 'diagram'],
      isFeatured: true,
      viewCount: 78
    },
    {
      title: 'Robotic Arm CAD Model',
      description: '3D CAD model and technical specifications for robotic arm project',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      thumbnailUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop',
      fileType: 'document',
      fileSize: 2097152,
      categoryId: categories[2]._id,
      uploadedBy: uploader._id,
      tags: ['CAD', 'robotic-arm', '3D-model', 'specifications'],
      isFeatured: false,
      viewCount: 45
    },

    // Workshop Materials
    {
      title: 'Introduction to Robotics Workshop',
      description: 'Complete presentation slides from beginner robotics workshop',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop',
      fileType: 'document',
      fileSize: 1572864,
      categoryId: categories[3]._id,
      uploadedBy: uploader._id,
      tags: ['workshop', 'robotics', 'beginner', 'presentation'],
      isFeatured: true,
      viewCount: 189
    },
    {
      title: 'Arduino Programming Tutorial',
      description: 'Step-by-step tutorial video for Arduino programming basics',
      fileUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop',
      fileType: 'video',
      fileSize: 41943040,
      dimensions: '1280x720',
      duration: 600,
      categoryId: categories[3]._id,
      uploadedBy: uploader._id,
      tags: ['tutorial', 'arduino', 'programming', 'basics'],
      isFeatured: true,
      viewCount: 312
    },

    // Research Presentations
    {
      title: 'SLAM Algorithm Research',
      description: 'Research presentation on Simultaneous Localization and Mapping algorithms',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
      fileType: 'document',
      fileSize: 3145728,
      categoryId: categories[4]._id,
      uploadedBy: uploader._id,
      tags: ['research', 'SLAM', 'algorithm', 'presentation'],
      isFeatured: true,
      viewCount: 67
    },
    {
      title: 'Computer Vision Applications',
      description: 'Research poster on computer vision applications in robotics',
      fileUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
      fileType: 'image',
      fileSize: 2621440,
      dimensions: '1920x1080',
      categoryId: categories[4]._id,
      uploadedBy: uploader._id,
      tags: ['research', 'computer-vision', 'robotics', 'poster'],
      isFeatured: false,
      viewCount: 34
    },

    // Lab Equipment
    {
      title: '3D Printer Setup',
      description: 'Complete setup and calibration guide for lab 3D printer',
      fileUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop',
      fileType: 'image',
      fileSize: 1966080,
      dimensions: '1920x1080',
      categoryId: categories[5]._id,
      uploadedBy: uploader._id,
      tags: ['3D-printer', 'equipment', 'setup', 'calibration'],
      isFeatured: false,
      viewCount: 56
    },
    {
      title: 'Robot Testing Arena',
      description: 'Overview of the robot testing arena and obstacle course',
      fileUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop',
      fileType: 'image',
      fileSize: 1835008,
      dimensions: '1920x1080',
      categoryId: categories[5]._id,
      uploadedBy: uploader._id,
      tags: ['arena', 'testing', 'obstacles', 'course'],
      isFeatured: true,
      viewCount: 98
    },

    // Event Coverage
    {
      title: 'Tech Expo 2024',
      description: 'Highlights from the annual technology expo showcasing student projects',
      fileUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
      fileType: 'video',
      fileSize: 36700160,
      dimensions: '1280x720',
      duration: 300,
      categoryId: categories[6]._id,
      uploadedBy: uploader._id,
      tags: ['expo', 'tech', 'showcase', '2024'],
      isFeatured: true,
      viewCount: 445
    },
    {
      title: 'Community Outreach Event',
      description: 'Photos from robotics demonstration at local school',
      fileUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop',
      fileType: 'image',
      fileSize: 2097152,
      dimensions: '1920x1080',
      categoryId: categories[6]._id,
      uploadedBy: uploader._id,
      tags: ['outreach', 'community', 'school', 'demonstration'],
      isFeatured: false,
      viewCount: 78
    },

    // Tutorial Videos
    {
      title: 'ROS Basics Tutorial',
      description: 'Introduction to Robot Operating System (ROS) fundamentals',
      fileUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
      fileType: 'video',
      fileSize: 52428800,
      dimensions: '1280x720',
      duration: 900,
      categoryId: categories[7]._id,
      uploadedBy: uploader._id,
      tags: ['tutorial', 'ROS', 'basics', 'fundamentals'],
      isFeatured: true,
      viewCount: 234
    },
    {
      title: 'PCB Design Guide',
      description: 'Complete guide to designing printed circuit boards for robotics projects',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      thumbnailUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop',
      fileType: 'document',
      fileSize: 4194304,
      categoryId: categories[7]._id,
      uploadedBy: uploader._id,
      tags: ['PCB', 'design', 'guide', 'electronics'],
      isFeatured: false,
      viewCount: 89
    }
  ]);

  console.log(`Created ${mediaFiles.length} media files`);

  // Create media collections
  const collections = await MediaCollection.create([
    {
      name: 'Competition Highlights 2024',
      description: 'Best moments and highlights from the 2024 robotics competition season',
      coverMediaId: mediaFiles[3]._id, // Final Round Competition video
      isPublic: true,
      createdBy: uploader._id,
      mediaItems: [
        { mediaId: mediaFiles[3]._id, position: 1 },
        { mediaId: mediaFiles[4]._id, position: 2 },
        { mediaId: mediaFiles[0]._id, position: 3 }, // Team Photo
        { mediaId: mediaFiles[2]._id, position: 4 }  // Celebration
      ]
    },
    {
      name: 'Educational Resources',
      description: 'Comprehensive collection of tutorials, workshops, and learning materials',
      coverMediaId: mediaFiles[8]._id, // Arduino Tutorial
      isPublic: true,
      createdBy: uploader._id,
      mediaItems: [
        { mediaId: mediaFiles[8]._id, position: 1 },
        { mediaId: mediaFiles[7]._id, position: 2 }, // Workshop slides
        { mediaId: mediaFiles[18]._id, position: 3 }, // ROS Tutorial
        { mediaId: mediaFiles[19]._id, position: 4 }  // PCB Guide
      ]
    },
    {
      name: 'Research & Development',
      description: 'Research presentations, technical documentation, and project schematics',
      coverMediaId: mediaFiles[10]._id, // SLAM Research
      isPublic: true,
      createdBy: uploader._id,
      mediaItems: [
        { mediaId: mediaFiles[10]._id, position: 1 },
        { mediaId: mediaFiles[11]._id, position: 2 }, // Computer Vision
        { mediaId: mediaFiles[5]._id, position: 3 },  // Rover Schematic
        { mediaId: mediaFiles[6]._id, position: 4 }   // Robotic Arm CAD
      ]
    },
    {
      name: 'Lab Infrastructure',
      description: 'Photos and documentation of lab equipment, facilities, and setup',
      coverMediaId: mediaFiles[15]._id, // Robot Testing Arena
      isPublic: true,
      createdBy: uploader._id,
      mediaItems: [
        { mediaId: mediaFiles[15]._id, position: 1 },
        { mediaId: mediaFiles[14]._id, position: 2 }, // 3D Printer
        { mediaId: mediaFiles[1]._id, position: 3 },  // Lab Working Session
        { mediaId: mediaFiles[0]._id, position: 4 }   // Team Photo
      ]
    },
    {
      name: 'Community Events',
      description: 'Coverage of outreach events, expos, and community engagement activities',
      coverMediaId: mediaFiles[16]._id, // Tech Expo
      isPublic: true,
      createdBy: uploader._id,
      mediaItems: [
        { mediaId: mediaFiles[16]._id, position: 1 },
        { mediaId: mediaFiles[17]._id, position: 2 }, // Outreach Event
        { mediaId: mediaFiles[0]._id, position: 3 },  // Team Photo
        { mediaId: mediaFiles[2]._id, position: 4 }   // Celebration
      ]
    }
  ]);

  console.log(`Created ${collections.length} media collections`);
  console.log('✅ Comprehensive media seeding completed successfully!');
}

async function seedContactsAndMessages({ admin, users }) {
  const csCount = await ContactSubmission.countDocuments();
  if (csCount === 0) {
    await ContactSubmission.create([
      { name: 'Prospective Student', email: 'student@example.com', subject: 'Join Club', message: 'How to join?', department: 'CSE', priority: 'low' },
      { name: 'Vendor', email: 'vendor@example.com', subject: 'Sponsorship', message: 'Interested in sponsoring', department: 'Admin', priority: 'high' },
    ]);
    console.log('Seeded contact submissions');
  }
  const imCount = await InternalMessage.countDocuments();
  if (imCount === 0) {
    await InternalMessage.create([
      { senderId: admin._id, recipientId: users[0]._id, subject: 'Welcome', message: 'Glad to have you on board!' },
      { senderId: users[0]._id, recipientId: admin._id, subject: 'Re: Welcome', message: 'Thank you!' },
    ]);
    console.log('Seeded internal messages');
  }
}

async function seedProjectRequests({ submitter, mentor, team }) {
  const prCount = await ProjectRequest.countDocuments();
  if (prCount > 0) {
    console.log('Project requests already exist, skipping');
    return;
  }
  await ProjectRequest.create([
    {
      title: 'Autonomous Drone Research',
      description: 'Investigate SLAM on micro drones.',
      objectives: ['Prototype drone', 'Implement SLAM'],
      expectedOutcomes: ['Workshop talk', 'Demo video'],
      teamSize: 4,
      estimatedDurationMonths: 6,
      budgetEstimate: 8000,
      requiredResources: ['Jetson', 'Camera'],
      mentorId: mentor._id,
      status: 'under_review',
      submittedBy: submitter._id,
      teamMembers: team.map((u) => ({ userId: u._id, proposedRole: 'Developer', availabilityHoursPerWeek: 8 })),
      resources: [{ resourceType: 'equipment', description: 'NVIDIA Jetson', estimatedCost: 400, priority: 'high' }],
    },
    {
      title: 'Humanoid Locomotion',
      description: 'Study bipedal balancing algorithms.',
      objectives: ['Simulation', 'Hardware prototype'],
      expectedOutcomes: ['Conference submission'],
      teamSize: 3,
      estimatedDurationMonths: 12,
      budgetEstimate: 15000,
      requiredResources: ['Lab Space'],
      mentorId: mentor._id,
      status: 'pending',
      submittedBy: submitter._id,
    },
    {
      title: 'IoT Lab Monitoring',
      description: 'Deploy sensors for environment monitoring.',
      objectives: ['Deploy sensors', 'Dashboard'],
      expectedOutcomes: ['Operational dashboard'],
      teamSize: 5,
      estimatedDurationMonths: 4,
      budgetEstimate: 5000,
      requiredResources: ['Sensors', 'Cloud'],
      status: 'approved',
      submittedBy: submitter._id,
      approvalDate: new Date(),
      startDate: new Date(),
    },
  ]);
  console.log('Seeded project requests');
}

async function seedResearchAreas({ createdBy }) {
  // Clear existing research areas to ensure fresh data
  await ResearchArea.deleteMany({});
  console.log('Cleared existing research areas');
  const areas = [
    {
      name: 'Autonomous Systems',
      description: 'Research on autonomy, planning, and control for mobile robots and drones.',
      category: 'Robotics',
      keywords: ['SLAM', 'Path Planning', 'Control'],
      color: '#0ea5e9',
      order: 1,
      isFeatured: true,
      focusAreas: ['Motion Planning', 'Mapping', 'Navigation'],
      requiredSkills: ['C++', 'ROS2', 'Linear Systems'],
      requiredEquipment: ['LIDAR', 'IMU', 'Wheeled Robot'],
      collaborationOpportunities: 'Joint projects with Mech and ECE departments.',
      fundingInfo: 'Eligible for Robotics Innovation Fund.',
      createdBy,
    },
    {
      name: 'Computer Vision & Perception',
      description: 'Visual perception, object detection, and scene understanding on edge devices.',
      category: 'AI/ML',
      keywords: ['CV', 'Object Detection', 'Edge AI'],
      color: '#22c55e',
      order: 2,
      isFeatured: true,
      focusAreas: ['Object Detection', 'Semantic Segmentation'],
      requiredSkills: ['Python', 'PyTorch', 'TensorRT'],
      requiredEquipment: ['Depth Camera', 'Jetson Nano'],
      collaborationOpportunities: 'Industry collaboration on perception platforms.',
      fundingInfo: 'Vision Research Grant 2025.',
      createdBy,
    },
    {
      name: 'Humanoid Locomotion',
      description: 'Balancing and gait generation for legged robots in real-world environments.',
      category: 'Mechanics',
      keywords: ['Biped', 'Control', 'Dynamics'],
      color: '#f97316',
      order: 3,
      focusAreas: ['Gait Generation', 'Balance Control'],
      requiredSkills: ['Dynamics', 'Control Theory'],
      requiredEquipment: ['IMU', 'Force Sensors'],
      collaborationOpportunities: 'Collab with biomechanics lab.',
      fundingInfo: 'Human-Centered Robotics Fund.',
      createdBy,
    },
    {
      name: 'Swarm Robotics',
      description: 'Coordinated multi-robot systems for distributed tasks and emergent behaviors.',
      category: 'Robotics',
      keywords: ['Multi-Agent', 'Coordination', 'Emergence'],
      color: '#8b5cf6',
      order: 4,
      isFeatured: true,
      focusAreas: ['Formation Control', 'Task Allocation', 'Communication'],
      requiredSkills: ['Distributed Systems', 'Graph Theory', 'Python'],
      requiredEquipment: ['Multiple Robots', 'Communication Hardware'],
      collaborationOpportunities: 'Partnership with drone companies.',
      fundingInfo: 'Swarm Intelligence Initiative Grant.',
      createdBy,
    },
    {
      name: 'Soft Robotics',
      description: 'Flexible, compliant robots inspired by biological systems.',
      category: 'Biomechanics',
      keywords: ['Flexible', 'Compliant', 'Bio-inspired'],
      color: '#ec4899',
      order: 5,
      isFeatured: false,
      focusAreas: ['Material Science', 'Actuation', 'Control'],
      requiredSkills: ['Material Science', '3D Printing', 'Control Theory'],
      requiredEquipment: ['3D Printer', 'Silicone Materials', 'Sensors'],
      collaborationOpportunities: 'Medical device companies.',
      fundingInfo: 'Biomedical Robotics Grant.',
      createdBy,
    },
    {
      name: 'Edge AI & IoT',
      description: 'Intelligent edge devices for real-time processing and decision making.',
      category: 'AI/ML',
      keywords: ['Edge Computing', 'IoT', 'Real-time'],
      color: '#06b6d4',
      order: 6,
      isFeatured: false,
      focusAreas: ['Model Optimization', 'Hardware Acceleration', 'Sensor Fusion'],
      requiredSkills: ['Embedded Systems', 'TensorFlow Lite', 'C++'],
      requiredEquipment: ['Edge Devices', 'Sensors', 'Development Kits'],
      collaborationOpportunities: 'IoT platform companies.',
      fundingInfo: 'Smart Cities Initiative.',
      createdBy,
    },
    {
      name: 'Robotic Manipulation',
      description: 'Advanced grasping, manipulation, and assembly using robotic arms.',
      category: 'Robotics',
      keywords: ['Grasping', 'Manipulation', 'Assembly'],
      color: '#f59e0b',
      order: 7,
      isFeatured: true,
      focusAreas: ['Grasp Planning', 'Force Control', 'Task Planning'],
      requiredSkills: ['Robotics', 'Computer Vision', 'Control Theory'],
      requiredEquipment: ['Robotic Arm', 'Grippers', 'Vision System'],
      collaborationOpportunities: 'Manufacturing companies.',
      fundingInfo: 'Advanced Manufacturing Grant.',
      createdBy,
    },
    {
      name: 'Bio-inspired Robotics',
      description: 'Robots designed based on biological principles and animal locomotion.',
      category: 'Biomechanics',
      keywords: ['Bio-inspired', 'Locomotion', 'Adaptation'],
      color: '#10b981',
      order: 8,
      isFeatured: false,
      focusAreas: ['Animal Studies', 'Biomechanics', 'Adaptive Control'],
      requiredSkills: ['Biology', 'Mechanics', 'Control Systems'],
      requiredEquipment: ['Motion Capture', 'Biomechanical Models'],
      collaborationOpportunities: 'Biology department collaboration.',
      fundingInfo: 'Bio-inspired Engineering Fund.',
      createdBy,
    },
  ];
  await ResearchArea.insertMany(areas);
  console.log(`Seeded ${areas.length} research areas`);
}

async function main() {
  try {
    await connect();

    // Admin user per request
    const admin = await ensureUser({
      email: 'monu2feb2004@gmail.com',
      password: 'Monu@2004',
      role: 'admin',
      firstName: 'Monu',
      lastName: 'Kumar',
      department: 'Administration',
      phone: '+911234567890',
      subroles: ['lab_coordinator', 'finance_manager', 'poc', 'key_contact'],
      specialization: 'System Administration & Lab Management',
      experienceYears: 5,
      bio: 'Experienced administrator with expertise in managing research lab operations, project coordination, and financial oversight.',
      skills: ['Project Management', 'Financial Planning', 'System Administration', 'Team Leadership'],
      achievements: [
        { title: 'Best Lab Manager Award', description: 'Recognized for outstanding lab management', date: new Date('2024-06-15'), type: 'award' },
        { title: 'PMP Certification', description: 'Project Management Professional', date: new Date('2023-03-20'), type: 'certification' }
      ],
      socialLinks: {
        linkedin: 'https://linkedin.com/in/monukumar',
        github: 'https://github.com/monukumar'
      },
      profileImageUrl: 'https://via.placeholder.com/400x400/007bff/ffffff?text=MK'
    });

    // Mentor, Team leader, and members
    const mentor = await ensureUser({
      email: 'mentor@example.com',
      password: 'Mentor@2024',
      role: 'mentor',
      firstName: 'Priya',
      lastName: 'Singh',
      department: 'Mechanical',
      phone: '+911112223334',
      subroles: ['research_lead', 'mentor_coordinator', 'workshop_coordinator'],
      specialization: 'Robotics & Autonomous Systems',
      experienceYears: 8,
      bio: 'Senior research mentor specializing in robotics, autonomous navigation, and SLAM algorithms. Passionate about guiding students in cutting-edge research.',
      skills: ['ROS2', 'SLAM', 'Computer Vision', 'Machine Learning', 'Robotics Control'],
      achievements: [
        { title: 'Outstanding Mentor Award', description: 'University recognition for exceptional student guidance', date: new Date('2024-05-10'), type: 'award' },
        { title: 'IEEE Senior Member', description: 'Senior member of IEEE Robotics and Automation Society', date: new Date('2023-11-15'), type: 'certification' },
        { title: 'Autonomous Navigation Research', description: 'Published 15+ papers on SLAM and navigation', date: new Date('2023-08-20'), type: 'publication' }
      ],
      socialLinks: {
        linkedin: 'https://linkedin.com/in/priyasingh',
        github: 'https://github.com/priyasingh',
        researchGate: 'https://researchgate.net/profile/priyasingh'
      },
      profileImageUrl: 'https://via.placeholder.com/400x400/28a745/ffffff?text=PS'
    });

    const leader = await ensureUser({
      email: 'leader@example.com',
      password: 'Leader@2024',
      role: 'team_member',
      firstName: 'Arjun',
      lastName: 'Verma',
      department: 'Electronics',
      yearOfStudy: 3,
      phone: '+919998887776',
      subroles: ['project_manager', 'team_lead', 'poc'],
      specialization: 'Embedded Systems & IoT',
      experienceYears: 2,
      bio: 'Team leader with strong background in embedded systems, IoT development, and project coordination. Leading the autonomous rover project.',
      skills: ['C++', 'Python', 'Arduino', 'Raspberry Pi', 'IoT', 'Project Management'],
      achievements: [
        { title: 'Best Project Leader', description: 'Campus recognition for autonomous rover project', date: new Date('2024-07-15'), type: 'award' },
        { title: 'IoT Developer Certification', description: 'Microsoft IoT Developer certification', date: new Date('2024-01-10'), type: 'certification' }
      ],
      socialLinks: {
        linkedin: 'https://linkedin.com/in/arjunverma',
        github: 'https://github.com/arjunverma',
        portfolio: 'https://arjunverma.dev'
      },
      profileImageUrl: 'https://via.placeholder.com/400x400/dc3545/ffffff?text=AV'
    });

    const member1 = await ensureUser({
      email: 'dev1@example.com',
      password: 'Dev1@2024',
      role: 'team_member',
      firstName: 'Neha',
      lastName: 'Sharma',
      department: 'CSE',
      yearOfStudy: 2,
      phone: '+919911223344',
      subroles: ['software_developer', 'web_developer', 'data_scientist'],
      specialization: 'Software Development & Data Science',
      experienceYears: 1,
      bio: 'Software developer with expertise in web development, data analysis, and machine learning. Contributing to AI vision system project.',
      skills: ['JavaScript', 'Python', 'React', 'Node.js', 'Machine Learning', 'Data Analysis'],
      achievements: [
        { title: 'Hackathon Winner', description: 'First place in university hackathon for AI project', date: new Date('2024-06-20'), type: 'award' },
        { title: 'Data Science Certification', description: 'Coursera Data Science specialization', date: new Date('2024-02-15'), type: 'certification' }
      ],
      socialLinks: {
        linkedin: 'https://linkedin.com/in/nehasharma',
        github: 'https://github.com/nehasharma',
        portfolio: 'https://nehasharma.dev'
      },
      profileImageUrl: 'https://via.placeholder.com/400x400/ffc107/000000?text=NS'
    });

    const member2 = await ensureUser({
      email: 'dev2@example.com',
      password: 'Dev2@2024',
      role: 'team_member',
      firstName: 'Ravi',
      lastName: 'Patel',
      department: 'ECE',
      yearOfStudy: 4,
      phone: '+919922334455',
      subroles: ['hardware_engineer', 'equipment_specialist', 'safety_officer'],
      specialization: 'Hardware Design & Electronics',
      experienceYears: 3,
      bio: 'Hardware specialist with expertise in circuit design, PCB development, and safety protocols. Managing lab equipment and safety standards.',
      skills: ['PCB Design', 'Circuit Design', 'Arduino', 'Safety Protocols', 'Equipment Maintenance'],
      achievements: [
        { title: 'Hardware Design Award', description: 'Best hardware design in final year project', date: new Date('2024-05-25'), type: 'award' },
        { title: 'Safety Officer Certification', description: 'Lab safety officer certification', date: new Date('2024-03-10'), type: 'certification' }
      ],
      socialLinks: {
        linkedin: 'https://linkedin.com/in/ravipatel',
        github: 'https://github.com/ravipatel'
      },
      profileImageUrl: 'https://via.placeholder.com/400x400/6f42c1/ffffff?text=RP'
    });

    // Add more diverse team members with different specializations
    const researcher1 = await ensureUser({
      email: 'researcher1@example.com',
      password: 'Researcher@2024',
      role: 'researcher',
      firstName: 'Dr. Amit',
      lastName: 'Kumar',
      department: 'Computer Science',
      phone: '+919933445566',
      subroles: ['research_lead', 'publication_coordinator', 'technical_lead', 'ai_researcher'],
      specialization: 'Artificial Intelligence & Computer Vision',
      experienceYears: 12,
      bio: 'Senior researcher with extensive experience in AI, computer vision, and deep learning. Leading multiple research projects and mentoring graduate students.',
      skills: ['Deep Learning', 'Computer Vision', 'TensorFlow', 'PyTorch', 'Research Methodology'],
      achievements: [
        { title: 'PhD in Computer Science', description: 'Stanford University', date: new Date('2018-06-15'), type: 'certification' },
        { title: 'Best Paper Award', description: 'CVPR 2023 for computer vision research', date: new Date('2023-06-20'), type: 'award' },
        { title: 'Research Grant', description: 'NSF grant for AI research', date: new Date('2023-01-15'), type: 'award' }
      ],
      socialLinks: {
        linkedin: 'https://linkedin.com/in/amitkumar',
        github: 'https://github.com/amitkumar',
        researchGate: 'https://researchgate.net/profile/amitkumar'
      },
      profileImageUrl: 'https://via.placeholder.com/400x400/17a2b8/ffffff?text=AK'
    });

    const financeManager = await ensureUser({
      email: 'finance@example.com',
      password: 'Finance@2024',
      role: 'team_member',
      firstName: 'Sneha',
      lastName: 'Gupta',
      department: 'Finance',
      phone: '+919944556677',
      subroles: ['finance_manager', 'budget_coordinator', 'grant_writer'],
      specialization: 'Financial Planning & Budget Management',
      experienceYears: 6,
      bio: 'Finance specialist managing lab budgets, grant applications, and financial reporting. Ensuring efficient resource allocation for research projects.',
      skills: ['Financial Planning', 'Budget Management', 'Grant Writing', 'Excel', 'QuickBooks'],
      achievements: [
        { title: 'CFA Level 1', description: 'Chartered Financial Analyst Level 1', date: new Date('2023-12-10'), type: 'certification' },
        { title: 'Grant Success Rate', description: '95% success rate in grant applications', date: new Date('2024-06-15'), type: 'award' }
      ],
      socialLinks: {
        linkedin: 'https://linkedin.com/in/snehagupta'
      },
      profileImageUrl: 'https://via.placeholder.com/400x400/fd7e14/ffffff?text=SG'
    });

    const inventoryManager = await ensureUser({
      email: 'inventory@example.com',
      password: 'Inventory@2024',
      role: 'team_member',
      firstName: 'Karan',
      lastName: 'Singh',
      department: 'Mechanical',
      phone: '+919955667788',
      subroles: ['inventory_manager', 'equipment_specialist', 'maintenance_coordinator'],
      specialization: 'Inventory Management & Equipment Maintenance',
      experienceYears: 4,
      bio: 'Inventory specialist responsible for tracking lab equipment, managing supplies, and coordinating maintenance schedules. Ensuring optimal resource utilization.',
      skills: ['Inventory Management', 'Equipment Maintenance', 'Supply Chain', 'Database Management', 'Quality Control'],
      achievements: [
        { title: 'Best Inventory Manager', description: 'University recognition for efficient inventory management', date: new Date('2024-05-15'), type: 'award' },
        { title: 'Equipment Management Certification', description: 'Professional certification in lab equipment management', date: new Date('2023-09-20'), type: 'certification' }
      ],
      socialLinks: {
        linkedin: 'https://linkedin.com/in/karansingh'
      },
      profileImageUrl: 'https://via.placeholder.com/400x400/20c997/ffffff?text=KS'
    });

    const socialMediaManager = await ensureUser({
      email: 'social@example.com',
      password: 'Social@2024',
      role: 'team_member',
      firstName: 'Anjali',
      lastName: 'Verma',
      department: 'Communications',
      phone: '+919966778899',
      subroles: ['social_media_manager', 'communications_officer', 'content_creator', 'marketing_coordinator'],
      specialization: 'Digital Marketing & Social Media Management',
      experienceYears: 3,
      bio: 'Social media expert managing lab\'s online presence, creating engaging content, and building community engagement. Promoting research achievements and events.',
      skills: ['Social Media Marketing', 'Content Creation', 'Digital Marketing', 'Graphic Design', 'Analytics'],
      achievements: [
        { title: 'Social Media Excellence', description: 'Best social media presence award', date: new Date('2024-06-10'), type: 'award' },
        { title: 'Digital Marketing Certification', description: 'Google Digital Marketing certification', date: new Date('2024-01-25'), type: 'certification' }
      ],
      socialLinks: {
        linkedin: 'https://linkedin.com/in/anjaliverma',
        portfolio: 'https://anjaliverma.com'
      },
      profileImageUrl: 'https://via.placeholder.com/400x400/e83e8c/ffffff?text=AV'
    });

    const workshopCoordinator = await ensureUser({
      email: 'workshop@example.com',
      password: 'Workshop@2024',
      role: 'mentor',
      firstName: 'Rajesh',
      lastName: 'Malhotra',
      department: 'Mechanical',
      phone: '+919977889900',
      subroles: ['workshop_coordinator', 'event_organizer', 'outreach_coordinator', 'training_coordinator'],
      specialization: 'Workshop Development & Community Outreach',
      experienceYears: 7,
      bio: 'Workshop coordinator passionate about creating engaging learning experiences and building community partnerships. Organizing robotics workshops and outreach programs.',
      skills: ['Workshop Design', 'Event Planning', 'Community Outreach', 'Public Speaking', 'Curriculum Development'],
      achievements: [
        { title: 'Best Workshop Award', description: 'University recognition for innovative workshop design', date: new Date('2024-04-20'), type: 'award' },
        { title: 'Community Impact Award', description: 'For outstanding community outreach programs', date: new Date('2023-11-30'), type: 'award' }
      ],
      socialLinks: {
        linkedin: 'https://linkedin.com/in/rajeshmalhotra',
        portfolio: 'https://rajeshworkshops.com'
      },
      profileImageUrl: 'https://via.placeholder.com/400x400/6c757d/ffffff?text=RM'
    });

    // Seed role approvals so future registrations for these emails can get elevated roles
    await ensureRoleApproval({ email: 'mentor@example.com', allowedRoles: ['mentor', 'team_member'], note: 'Core mentor' });
    await ensureRoleApproval({ email: 'leader@example.com', allowedRoles: ['team_member'], note: 'Team leader' });
    await ensureRoleApproval({ email: 'dev1@example.com', allowedRoles: ['team_member'], note: 'Approved team member' });
    await ensureRoleApproval({ email: 'dev2@example.com', allowedRoles: ['team_member'], note: 'Approved team member' });
    await ensureRoleApproval({ email: 'researcher1@example.com', allowedRoles: ['researcher', 'mentor'], note: 'Senior researcher' });
    await ensureRoleApproval({ email: 'finance@example.com', allowedRoles: ['team_member'], note: 'Finance manager' });
    await ensureRoleApproval({ email: 'inventory@example.com', allowedRoles: ['team_member'], note: 'Inventory manager' });
    await ensureRoleApproval({ email: 'social@example.com', allowedRoles: ['team_member'], note: 'Social media manager' });
    await ensureRoleApproval({ email: 'workshop@example.com', allowedRoles: ['mentor'], note: 'Workshop coordinator' });

    await seedProjects({ mentor, teamLeader: leader, members: [member1, member2] });
    await seedWorkshops({ instructor: mentor, attendees: [leader, member1] });
    await seedEvents({ organizer: admin, attendees: [leader, member1, member2] });
    await seedInventory();
    await seedNews({ author: admin });
    await seedNewsApplications({ users: [leader, member1, member2] });
    await seedMedia({ uploader: admin });
    await seedContactsAndMessages({ admin, users: [leader, member1, member2] });
    await seedProjectRequests({ submitter: leader, mentor, team: [member1, member2] });
    await seedResearchAreas({ createdBy: admin._id });

    console.log('Seeding complete.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    try { await mongoose.disconnect(); } catch (_) {}
    process.exit(1);
  }
}

main();


