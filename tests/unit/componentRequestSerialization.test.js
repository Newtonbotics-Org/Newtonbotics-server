const express = require('express');
const request = require('supertest');
const { errorHandler } = require('../../src/middleware/errorHandler');
const Project = require('../../src/models/Project');
const User = require('../../src/models/User');
const ComponentRequest = require('../../src/models/ComponentRequest');

jest.mock('../../src/middleware/auth', () => ({
  verifyToken(req, res, next) {
    req.user = { id: '507f1f77bcf86cd799439010', role: 'admin', permissions: [] };
    next();
  },
}));

jest.mock('../../src/models/ComponentRequest', () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
}));

const componentRequestRouter = require('../../src/routes/componentRequests');

function createApp() {
  const app = express();
  app.use('/api/inventory/requests', componentRequestRouter);
  app.use(errorHandler);
  return app;
}

describe('component request list serialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('serializes requests with projected populated legacy project and user documents', async () => {
    const requester = User.hydrate({
      _id: '507f1f77bcf86cd799439012',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.test',
    }, { firstName: 1, lastName: 1, email: 1 });
    const reviewer = User.hydrate({
      _id: '507f1f77bcf86cd799439013',
      firstName: 'Grace',
      lastName: 'Hopper',
      email: 'grace@example.test',
    }, { firstName: 1, lastName: 1, email: 1 });
    const populatedRequest = {
      _id: '507f1f77bcf86cd799439014',
      requesterId: requester,
      projectId: Project.hydrate({
        _id: '507f1f77bcf86cd799439015',
        title: 'Legacy project',
      }, { title: 1 }),
      reviewerId: reviewer,
      componentName: 'Servo motor',
      quantity: 1,
      purpose: 'Prototype assembly',
      status: 'pending',
      auditTrail: [{ performedBy: requester }],
    };
    const query = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      then: (resolve, reject) => Promise.resolve([populatedRequest]).then(resolve, reject),
    };
    ComponentRequest.find.mockReturnValue(query);
    ComponentRequest.countDocuments.mockResolvedValue(1);

    const response = await request(createApp()).get('/api/inventory/requests');

    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].projectId.title).toBe('Legacy project');
    expect(response.body.data.items[0].requesterId.email).toBe('ada@example.test');
  });
});