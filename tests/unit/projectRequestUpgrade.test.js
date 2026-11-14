const express = require('express');
const request = require('supertest');
const { errorHandler } = require('../../src/middleware/errorHandler');
const ProjectRequest = require('../../src/models/ProjectRequest');
const Project = require('../../src/models/Project');
const User = require('../../src/models/User');

jest.mock('../../src/middleware/auth', () => {
  const verifyToken = (req, res, next) => {
    if (!req.headers.authorization) return res.status(401).json({ success: false });
    req.user = { id: '507f1f77bcf86cd799439012', role: req.headers['x-test-role'] || 'team_member' };
    next();
  };
  const requireMentor = (req, res, next) => {
    if (!['mentor', 'researcher', 'admin'].includes(req.user?.role)) return res.status(403).json({ success: false });
    next();
  };
  return { optionalAuth: (_req, _res, next) => next(), verifyToken, requireTeamMember: verifyToken, requireMentor, requireAdmin: requireMentor };
});

jest.mock('../../src/models/ProjectRequest', () => ({
  create: jest.fn(),
  findById: jest.fn(),
  startSession: jest.fn(),
}));

jest.mock('../../src/models/Project', () => {
  const Project = jest.fn(function project(data) {
    Object.assign(this, data);
    this._id = '507f1f77bcf86cd799439099';
    this.save = jest.fn().mockResolvedValue(this);
  });
  Project.findById = jest.fn();
  Project.findOne = jest.fn();
  return Project;
});

jest.mock('../../src/models/User', () => ({ findById: jest.fn() }));
jest.mock('../../src/services/emailService', () => ({ sendProjectRequestStatusEmail: jest.fn() }));
jest.mock('../../src/utils/upload', () => ({ uploadProjectDocument: (_req, _res, next) => next() }));

const projectRequestsRouter = require('../../src/routes/projectRequests');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/project-requests', projectRequestsRouter);
  app.use(errorHandler);
  return app;
}

function makeRequest(status = 'pending') {
  return {
    _id: '507f1f77bcf86cd799439088',
    title: 'Robotics arm project',
    description: 'Build and test a small robotic arm for laboratory tasks.',
    submittedBy: '507f1f77bcf86cd799439012',
    teamLeaderId: '507f1f77bcf86cd799439012',
    teamMembers: [],
    status,
    addAuditEntry: jest.fn(),
    save: jest.fn().mockResolvedValue(undefined),
  };
}

describe('project request upgrade API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires authentication and stores project details without requester visibility flags', async () => {
    const savedRequest = makeRequest();
    ProjectRequest.create.mockResolvedValue(savedRequest);

    const app = createApp();
    const unauthorized = await request(app).post('/project-requests').send({});
    expect(unauthorized.status).toBe(401);

    const invalid = await request(app)
      .post('/project-requests')
      .set('Authorization', 'Bearer test-token')
      .send({ title: 'short' });
    expect(invalid.status).toBe(400);
    expect(ProjectRequest.create).not.toHaveBeenCalled();

    const response = await request(app)
      .post('/project-requests')
      .set('Authorization', 'Bearer test-token')
      .send({
        title: 'Robotics arm project',
        description: 'Build and test a small robotic arm for laboratory tasks.',
        teamSize: 1,
        estimatedDurationMonths: 3,
        category: 'Robotics',
        projectStatus: 'upcoming',
        priority: 'high',
        difficulty: 'intermediate',
        budget: 1200,
        estimatedHours: 80,
        teamLeaderId: '507f1f77bcf86cd799439012',
        githubUrl: 'https://github.com/newtonbotics/robot-arm',
        achievements: ['Regional finalist'],
        tags: ['robotics'],
        isPublic: false,
        isFeatured: true,
      });

    expect(response.status).toBe(201);
    expect(ProjectRequest.create).toHaveBeenCalledWith(expect.objectContaining({
      category: 'Robotics',
      projectStatus: 'upcoming',
      budget: 1200,
      estimatedHours: 80,
      status: 'pending',
    }));
    expect(ProjectRequest.create.mock.calls[0][0]).not.toHaveProperty('isPublic');
    expect(ProjectRequest.create.mock.calls[0][0]).not.toHaveProperty('isFeatured');
  });

  it('assigns the authenticated requester as leader and stores selected registered members', async () => {
    const savedRequest = makeRequest();
    const memberId = '507f1f77bcf86cd799439013';
    const selectedMember = { userId: memberId, proposedRole: 'Builder', skills: ['CAD'] };
    ProjectRequest.create.mockResolvedValue(savedRequest);
    User.findById.mockResolvedValue({ isActive: true, role: 'team_member' });

    const response = await request(createApp())
      .post('/project-requests')
      .set('Authorization', 'Bearer test-token')
      .send({
        title: 'Robotics arm project',
        description: 'Build and test a small robotic arm for laboratory tasks.',
        teamSize: 2,
        estimatedDurationMonths: 3,
        teamLeaderId: '507f1f77bcf86cd799439099',
        teamMembers: [selectedMember],
      });

    expect(response.status).toBe(201);
    expect(ProjectRequest.create).toHaveBeenCalledWith(expect.objectContaining({
      teamLeaderId: '507f1f77bcf86cd799439012',
      submittedBy: '507f1f77bcf86cd799439012',
      teamMembers: [selectedMember],
    }));
  });

  it('rejects duplicate or requester IDs in selected team members', async () => {
    const selectedMember = { userId: '507f1f77bcf86cd799439013', proposedRole: 'Builder' };
    const app = createApp();
    const basePayload = {
      title: 'Robotics arm project',
      description: 'Build and test a small robotic arm for laboratory tasks.',
      teamSize: 2,
      estimatedDurationMonths: 3,
    };

    const duplicateResponse = await request(app)
      .post('/project-requests')
      .set('Authorization', 'Bearer test-token')
      .send({ ...basePayload, teamMembers: [selectedMember, selectedMember] });
    const requesterResponse = await request(app)
      .post('/project-requests')
      .set('Authorization', 'Bearer test-token')
      .send({ ...basePayload, teamMembers: [{ ...selectedMember, userId: '507f1f77bcf86cd799439012' }] });
    User.findById.mockResolvedValue(null);
    const unknownUserResponse = await request(app)
      .post('/project-requests')
      .set('Authorization', 'Bearer test-token')
      .send({ ...basePayload, teamMembers: [selectedMember] });

    expect(duplicateResponse.status).toBe(400);
    expect(requesterResponse.status).toBe(400);
    expect(unknownUserResponse.status).toBe(400);
    expect(ProjectRequest.create).not.toHaveBeenCalled();
  });

  it('restricts approval to mentor and admin roles', async () => {
    const response = await request(createApp())
      .post('/project-requests/507f1f77bcf86cd799439088/approve')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(403);
    expect(ProjectRequest.startSession).not.toHaveBeenCalled();
  });

  it('prevents request owners from approving through the generic update endpoint', async () => {
    const projectRequest = makeRequest();
    ProjectRequest.findById.mockResolvedValue(projectRequest);

    const response = await request(createApp())
      .put('/project-requests/507f1f77bcf86cd799439088')
      .set('Authorization', 'Bearer test-token')
      .send({ status: 'approved' });

    expect(response.status).toBe(400);
    expect(projectRequest.status).toBe('pending');
    expect(projectRequest.save).not.toHaveBeenCalled();
  });

  it('does not allow request updates to change the requester-assigned leader', async () => {
    const projectRequest = makeRequest();
    projectRequest.teamLeaderId = '507f1f77bcf86cd799439099';
    ProjectRequest.findById.mockResolvedValue(projectRequest);

    const response = await request(createApp())
      .put('/project-requests/507f1f77bcf86cd799439088')
      .set('Authorization', 'Bearer test-token')
      .send({ teamLeaderId: 'not-a-user-id', submittedBy: '507f1f77bcf86cd799439014' });

    expect(response.status).toBe(200);
    expect(projectRequest.submittedBy).toBe('507f1f77bcf86cd799439012');
    expect(projectRequest.teamLeaderId).toBe(projectRequest.submittedBy);
  });

  it('ignores public and featured flags on request updates', async () => {
    const projectRequest = makeRequest();
    ProjectRequest.findById.mockResolvedValue(projectRequest);

    const response = await request(createApp())
      .put('/project-requests/507f1f77bcf86cd799439088')
      .set('Authorization', 'Bearer test-token')
      .send({ isPublic: false, isFeatured: true });

    expect(response.status).toBe(200);
    expect(projectRequest).not.toHaveProperty('isPublic');
    expect(projectRequest).not.toHaveProperty('isFeatured');
  });

  it('creates and links one project when a request is approved', async () => {
    const projectRequest = makeRequest();
    projectRequest.submittedBy = '507f1f77bcf86cd799439014';
    delete projectRequest.teamLeaderId;
    const teamMemberId = '507f1f77bcf86cd799439013';
    projectRequest.teamMembers = [{
      userId: teamMemberId,
      proposedRole: 'Builder',
      skills: ['CAD'],
      responsibilities: ['Assembly'],
      contribution: 'Designed the chassis',
      availabilityHoursPerWeek: 6,
    }];
    User.findById.mockImplementation((id) => id.toString() === teamMemberId
      ? { session: jest.fn().mockResolvedValue({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.test' }) }
      : Promise.resolve(null));
    const session = { withTransaction: jest.fn(callback => callback()), endSession: jest.fn() };
    ProjectRequest.startSession.mockResolvedValue(session);
    ProjectRequest.findById.mockReturnValue({ session: jest.fn().mockResolvedValue(projectRequest) });

    const response = await request(createApp())
      .post('/project-requests/507f1f77bcf86cd799439088/approve')
      .set('Authorization', 'Bearer test-token')
      .set('x-test-role', 'admin');

    expect(response.status).toBe(200);
    expect(Project).toHaveBeenCalledWith(expect.objectContaining({
      sourceProjectRequestId: projectRequest._id,
      title: projectRequest.title,
      status: 'upcoming',
      teamLeaderId: projectRequest.submittedBy,
    }));
    expect(Project.mock.instances[0]).not.toHaveProperty('isPublic');
    expect(Project.mock.instances[0]).not.toHaveProperty('isFeatured');
    expect(Project.mock.instances[0].teamMembers[0]).toEqual(expect.objectContaining({
      userName: 'Ada Lovelace',
      role: 'Builder',
      responsibilities: ['Assembly'],
      contribution: 'Designed the chassis',
      timeCommitment: { hoursPerWeek: 6 },
    }));
    expect(Project.mock.instances[0].allTeamMembers[0]).toEqual(expect.objectContaining({
      userId: teamMemberId,
      name: 'Ada Lovelace',
      contribution: 'Designed the chassis',
    }));
    expect(projectRequest.status).toBe('approved');
    expect(projectRequest.projectId).toBe('507f1f77bcf86cd799439099');
    expect(projectRequest.save).toHaveBeenCalledWith({ session });
    expect(session.endSession).toHaveBeenCalled();
    expect(response.body.data.project._id).toBe('507f1f77bcf86cd799439099');
  });

  it('returns the linked project without creating another on repeated approval', async () => {
    const existingProject = { _id: '507f1f77bcf86cd799439099' };
    const projectRequest = { ...makeRequest('approved'), projectId: existingProject._id };
    const session = { withTransaction: jest.fn(callback => callback()), endSession: jest.fn() };
    ProjectRequest.startSession.mockResolvedValue(session);
    ProjectRequest.findById.mockReturnValue({ session: jest.fn().mockResolvedValue(projectRequest) });
    Project.findById.mockReturnValue({ session: jest.fn().mockResolvedValue(existingProject) });

    const response = await request(createApp())
      .post('/project-requests/507f1f77bcf86cd799439088/approve')
      .set('Authorization', 'Bearer test-token')
      .set('x-test-role', 'admin');

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/already approved/i);
    expect(Project).not.toHaveBeenCalled();
  });

  it('does not mark a request approved when project creation fails', async () => {
    const projectRequest = makeRequest();
    const session = { withTransaction: jest.fn(callback => callback()), endSession: jest.fn() };
    ProjectRequest.startSession.mockResolvedValue(session);
    ProjectRequest.findById.mockReturnValue({ session: jest.fn().mockResolvedValue(projectRequest) });
    Project.mockImplementationOnce(function failingProject(data) {
      Object.assign(this, data);
      this.save = jest.fn().mockRejectedValue(new Error('Project validation failed'));
    });

    const response = await request(createApp())
      .post('/project-requests/507f1f77bcf86cd799439088/approve')
      .set('Authorization', 'Bearer test-token')
      .set('x-test-role', 'admin');

    expect(response.status).toBe(500);
    expect(projectRequest.status).toBe('pending');
    expect(projectRequest.save).not.toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalled();
  });
});