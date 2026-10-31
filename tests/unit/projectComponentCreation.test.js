const express = require('express');
const request = require('supertest');
const { errorHandler } = require('../../src/middleware/errorHandler');
const Project = require('../../src/models/Project');
const ProjectComponent = require('../../src/models/ProjectComponent');

jest.mock('../../src/middleware/auth', () => {
  const passThrough = (req, res, next) => {
    req.user = { id: '507f1f77bcf86cd799439012' };
    next();
  };
  return {
    verifyToken: passThrough,
    requireAdmin: passThrough,
    requireStudent: passThrough,
    requireProjectTeamMember: passThrough,
    optionalAuth: passThrough,
  };
});

jest.mock('../../src/models/Project', () => ({ findById: jest.fn() }));
jest.mock('../../src/models/ProjectComponent', () => ({ create: jest.fn(), findOneAndUpdate: jest.fn() }));

const projectInventoryRouter = require('../../src/routes/projectInventory');

const projectId = '507f1f77bcf86cd799439011';
const componentPayload = { name: '  Servo Motor  ', category: 'Motors', quantity: 2 };

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(projectInventoryRouter);
  app.use(errorHandler);
  return app;
}

describe('project component creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Project.findById.mockResolvedValue({ _id: projectId });
    ProjectComponent.create.mockImplementation(async (component) => ({
      _id: '507f1f77bcf86cd799439013',
      ...component,
    }));
    ProjectComponent.findOneAndUpdate.mockImplementation(async (filter, update) => ({
      _id: '507f1f77bcf86cd799439013',
      ...filter,
      ...update.$set,
    }));
  });

  it('creates a component with a normalized nameKey', async () => {
    const response = await request(createApp())
      .post(`/projects/${projectId}/components`)
      .send(componentPayload);

    expect(response.status).toBe(201);
    expect(ProjectComponent.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Servo Motor',
      nameKey: 'servo motor',
      projectId,
      quantity: 2,
    }));
    expect(response.body.data.item.nameKey).toBe('servo motor');
  });

  it('rejects missing required fields without creating a component', async () => {
    const response = await request(createApp())
      .post(`/projects/${projectId}/components`)
      .send({ category: 'Motors', quantity: 2 });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toMatch(/Invalid value/i);
    expect(ProjectComponent.create).not.toHaveBeenCalled();
  });

  it('returns a conflict when the normalized project component name already exists', async () => {
    ProjectComponent.create.mockRejectedValue({
      code: 11000,
      keyValue: { nameKey: 'servo motor' },
      message: 'Duplicate project component',
    });

    const response = await request(createApp())
      .post(`/projects/${projectId}/components`)
      .send(componentPayload);

    expect(response.status).toBe(409);
    expect(response.body.error.message).toMatch(/Duplicate field value/);
  });

  it('keeps nameKey synchronized when a component is renamed', async () => {
    const response = await request(createApp())
      .put(`/projects/${projectId}/components/507f1f77bcf86cd799439013`)
      .send({ name: '  Gear Motor  ' });

    expect(response.status).toBe(200);
    expect(ProjectComponent.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ projectId }),
      expect.objectContaining({ $set: { name: 'Gear Motor', nameKey: 'gear motor' } }),
      expect.any(Object)
    );
  });
});
