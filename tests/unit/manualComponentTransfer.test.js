const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { errorHandler } = require('../../src/middleware/errorHandler');
const Equipment = require('../../src/models/Equipment');
const Project = require('../../src/models/Project');
const ProjectComponent = require('../../src/models/ProjectComponent');

jest.mock('../../src/middleware/auth', () => {
  const passThrough = (req, res, next) => {
    req.user = { id: '507f1f77bcf86cd799439012', role: 'admin' };
    next();
  };
  return { verifyToken: passThrough, requireAdmin: jest.fn(passThrough) };
});

jest.mock('../../src/models/Equipment', () => ({ findById: jest.fn(), findOneAndUpdate: jest.fn() }));
jest.mock('../../src/models/Project', () => ({ findById: jest.fn() }));
jest.mock('../../src/models/ProjectComponent', () => ({ findOneAndUpdate: jest.fn() }));
jest.mock('../../src/models/ComponentRequest', () => ({}));
jest.mock('../../src/models/InventoryTransfer', () => ({}));

const { requireAdmin } = require('../../src/middleware/auth');
const router = require('../../src/routes/componentRequests');
const equipmentId = '507f1f77bcf86cd799439011';
const projectId = '507f1f77bcf86cd799439013';
const adminId = '507f1f77bcf86cd799439012';
let stock;
let componentQuantity;
let transactionSession;

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(router);
  app.use(errorHandler);
  return app;
}

function makeSource() {
  return {
    _id: equipmentId,
    name: 'Servo Motor',
    categoryId: { name: 'Motors' },
    currentQuantity: stock,
    location: 'Lab shelf',
    description: 'Metal gear servo',
    modelNumber: 'SG-90',
    specifications: { voltage: 5 },
  };
}

function configureSession({ rollback = false } = {}) {
  transactionSession = {
    withTransaction: jest.fn(async (callback) => {
      const previousStock = stock;
      const previousComponentQuantity = componentQuantity;
      try {
        await callback();
      } catch (error) {
        if (rollback) {
          stock = previousStock;
          componentQuantity = previousComponentQuantity;
        }
        throw error;
      }
    }),
    endSession: jest.fn(),
  };
  jest.spyOn(mongoose, 'startSession').mockResolvedValue(transactionSession);
}

function configureModels() {
  Project.findById.mockReturnValue({ session: jest.fn().mockResolvedValue({ _id: projectId }) });
  Equipment.findById.mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    session: jest.fn().mockResolvedValue(makeSource()),
  });
  Equipment.findOneAndUpdate.mockImplementation((filter, update) => {
    if (stock < filter.currentQuantity.$gte) return Promise.resolve(null);
    stock += update.$inc.currentQuantity;
    return Promise.resolve({ ...makeSource(), currentQuantity: stock });
  });
  ProjectComponent.findOneAndUpdate.mockImplementation((filter, update) => {
    componentQuantity = (componentQuantity || 0) + update.$inc.quantity;
    return Promise.resolve({ _id: '507f1f77bcf86cd799439014', ...filter, ...update.$setOnInsert, quantity: componentQuantity });
  });
}

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  stock = 10;
  componentQuantity = 2;
  configureSession();
  configureModels();
  requireAdmin.mockImplementation((req, res, next) => {
    req.user = { id: adminId, role: 'admin' };
    next();
  });
});

afterEach(() => jest.restoreAllMocks());

describe('manual General Lab component transfers', () => {
  const payload = { equipmentId, projectId, quantity: 3 };

  it('transfers stock and records the admin audit details without creating a request', async () => {
    const response = await request(createApp()).post('/manual-transfer').send(payload);

    expect(response.status).toBe(200);
    expect(stock).toBe(7);
    expect(componentQuantity).toBe(5);
    expect(Equipment.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: equipmentId, currentQuantity: { $gte: 3 } },
      { $inc: { currentQuantity: -3 } },
      expect.objectContaining({ session: transactionSession, new: true })
    );
    const [filter, update, options] = ProjectComponent.findOneAndUpdate.mock.calls[0];
    expect(filter).toEqual({ projectId, nameKey: 'servo motor', isDeleted: false });
    expect(update.$inc).toEqual({ quantity: 3 });
    expect(update.$setOnInsert).toEqual(expect.objectContaining({ category: 'Motors', modelNumber: 'SG-90', location: 'Lab shelf' }));
    expect(update.$push.auditTrail).toEqual(expect.objectContaining({
      performedBy: adminId,
      changes: expect.objectContaining({ source: 'manual_admin_transfer', equipmentId, projectId, quantityAdded: 3 }),
    }));
    expect(options.session).toBe(transactionSession);
    expect(response.body.data.quantity).toBe(3);
    expect(transactionSession.endSession).toHaveBeenCalled();
  });

  it('returns conflict without adding project stock when General Lab stock is insufficient', async () => {
    stock = 2;
    const response = await request(createApp()).post('/manual-transfer').send(payload);

    expect(response.status).toBe(409);
    expect(ProjectComponent.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it.each([
    [{ ...payload, equipmentId: 'invalid' }],
    [{ ...payload, projectId: 'invalid' }],
    [{ ...payload, quantity: 0 }],
    [{ ...payload, quantity: -1 }],
    [{ ...payload, quantity: 1.5 }],
  ])('rejects invalid IDs or quantities before starting a transaction', async (invalidPayload) => {
    const response = await request(createApp()).post('/manual-transfer').send(invalidPayload);

    expect(response.status).toBe(400);
    expect(mongoose.startSession).not.toHaveBeenCalled();
  });

  it('merges into the existing project component using normalized component identity', async () => {
    await request(createApp()).post('/manual-transfer').send(payload).expect(200);

    expect(ProjectComponent.findOneAndUpdate).toHaveBeenCalledWith(
      { projectId, nameKey: 'servo motor', isDeleted: false },
      expect.objectContaining({ $inc: { quantity: 3 } }),
      expect.objectContaining({ upsert: true, session: transactionSession })
    );
    expect(componentQuantity).toBe(5);
  });

  it('prevents concurrent transfers from oversubtracting stock', async () => {
    stock = 5;
    const app = createApp();
    const [first, second] = await Promise.all([
      request(app).post('/manual-transfer').send({ ...payload, quantity: 4 }),
      request(app).post('/manual-transfer').send({ ...payload, quantity: 4 }),
    ]);

    expect([first.status, second.status].sort()).toEqual([200, 409]);
    expect(stock).toBe(1);
    expect(componentQuantity).toBe(6);
  });

  it('rolls back the stock decrement if the project update fails', async () => {
    configureSession({ rollback: true });
    ProjectComponent.findOneAndUpdate.mockRejectedValue(new Error('Project write failed'));

    const response = await request(createApp()).post('/manual-transfer').send(payload);

    expect(response.status).toBe(500);
    expect(stock).toBe(10);
    expect(transactionSession.endSession).toHaveBeenCalled();
  });

  it('rejects unauthorized users before accessing inventory', async () => {
    requireAdmin.mockImplementationOnce((req, res) => res.status(403).json({ message: 'Forbidden' }));

    const response = await request(createApp()).post('/manual-transfer').send(payload);

    expect(response.status).toBe(403);
    expect(mongoose.startSession).not.toHaveBeenCalled();
    expect(Equipment.findById).not.toHaveBeenCalled();
  });
});