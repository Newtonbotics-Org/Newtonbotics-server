const express = require('express');
const request = require('supertest');
const { errorHandler } = require('../../src/middleware/errorHandler');

jest.mock('../../src/middleware/auth', () => {
  const setUser = (req, res, next) => {
    req.user = { id: '507f1f77bcf86cd799439012', role: req.headers['x-test-role'] || 'team_member' };
    next();
  };
  return {
    optionalAuth: (req, res, next) => {
      if (req.headers.authorization) return setUser(req, res, next);
      next();
    },
    verifyToken: (req, res, next) => req.headers.authorization ? setUser(req, res, next) : res.status(401).json({ success: false }),
    requireProjectLeaderAccess: setUser,
    requireProjectTeamMember: setUser,
    requireProjectLeaderOrOwner: setUser,
    requireTeamMember: setUser,
    requireMentor: setUser,
    requireAdmin: setUser,
  };
});

jest.mock('../../src/models/Project', () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));
jest.mock('../../src/models/User', () => ({ findById: jest.fn() }));
jest.mock('../../src/services/emailService', () => ({
  sendProjectCreatedNotification: jest.fn(),
  sendProjectStatusChangedEmail: jest.fn(),
}));

const Project = require('../../src/models/Project');
const projectsRouter = require('../../src/routes/projects');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/projects', projectsRouter);
  app.use(errorHandler);
  return app;
}

function createFindQuery(items) {
  const query = {
    populate: jest.fn(() => query),
    limit: jest.fn(() => query),
    skip: jest.fn(() => query),
    sort: jest.fn(() => Promise.resolve(items)),
  };
  return query;
}

describe('Projects API visibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Project.find.mockImplementation(() => createFindQuery([{ _id: 'public-project', isPublic: true }]));
    Project.countDocuments.mockResolvedValue(1);
  });

  it('limits public featured queries to public featured projects', async () => {
    const response = await request(createApp()).get('/projects?isFeatured=true');

    expect(response.status).toBe(200);
    expect(Project.find).toHaveBeenCalledWith({ isPublic: true, isFeatured: true });
    expect(Project.countDocuments).toHaveBeenCalledWith({ isPublic: true, isFeatured: true });
  });

  it('allows admins to list private projects while applying featured filters', async () => {
    const response = await request(createApp())
      .get('/projects?isFeatured=false')
      .set('Authorization', 'Bearer admin-token')
      .set('x-test-role', 'admin');

    expect(response.status).toBe(200);
    expect(Project.find).toHaveBeenCalledWith({ isFeatured: false });
  });

  it('returns private project details only to admins', async () => {
    Project.findOneAndUpdate.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      then(resolve) { resolve(null); },
    });

    const response = await request(createApp()).get('/projects/507f1f77bcf86cd799439011');

    expect(response.status).toBe(404);
    expect(Project.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: expect.anything(), isPublic: true },
      { $inc: { viewCount: 1 } },
      { new: true }
    );
  });

  it('prevents project leaders from changing admin-controlled visibility flags', async () => {
    Project.findById.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      teamLeaderId: '507f1f77bcf86cd799439012',
      mentorId: null,
      status: 'upcoming',
    });

    const response = await request(createApp())
      .put('/projects/507f1f77bcf86cd799439011')
      .set('Authorization', 'Bearer team-member-token')
      .send({ isPublic: false });

    expect(response.status).toBe(403);
  });

  it('allows admins to set Public and Featured on an existing project', async () => {
    Project.findById.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      teamLeaderId: '507f1f77bcf86cd799439012',
      mentorId: null,
      status: 'upcoming',
      toObject() { return this; },
    });
    const updatedProject = { _id: '507f1f77bcf86cd799439011', isPublic: false, isFeatured: true };
    const updateQuery = {
      populate: jest.fn(() => updateQuery),
      then(resolve) { resolve(updatedProject); },
    };
    Project.findByIdAndUpdate.mockReturnValue(updateQuery);

    const response = await request(createApp())
      .put('/projects/507f1f77bcf86cd799439011')
      .set('Authorization', 'Bearer admin-token')
      .set('x-test-role', 'admin')
      .send({ isPublic: false, isFeatured: true });

    expect(response.status).toBe(200);
    expect(Project.findByIdAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ isPublic: false, isFeatured: true }),
      { new: true }
    );
  });
});