import request from 'supertest';
import app from '../app';
import prisma from '../config/database';
import * as hashUtil from '../utils/hash.util';
import * as jwtUtil from '../utils/jwt.util';

// Mock Prisma
jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    owner: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('Auth API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    const validRegisterData = {
      email: 'test@example.com',
      password: 'Test123!@#',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+33612345678'
    };

    it('should successfully register a new user', async () => {
      // Mock: email doesn't exist
      (prisma.owner.findUnique as jest.Mock).mockResolvedValue(null);

      // Mock: create user
      const mockOwner = {
        id: '123',
        email: validRegisterData.email,
        firstName: validRegisterData.firstName,
        lastName: validRegisterData.lastName,
        phone: validRegisterData.phone,
        createdAt: new Date(),
        salons: []
      };
      (prisma.owner.create as jest.Mock).mockResolvedValue(mockOwner);

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegisterData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Inscription réussie');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(validRegisterData.email);
    });

    it('should reject registration with existing email', async () => {
      // Mock: email already exists
      (prisma.owner.findUnique as jest.Mock).mockResolvedValue({
        id: '123',
        email: validRegisterData.email
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegisterData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('déjà utilisé');
    });

    it('should reject registration with invalid email', async () => {
      const invalidData = {
        ...validRegisterData,
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject registration with weak password', async () => {
      const weakPasswordData = {
        ...validRegisterData,
        password: 'weak'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject registration without required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com'
          // Missing password, firstName, lastName
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'Test123!@#'
    };

    it('should successfully login with valid credentials', async () => {
      // Mock: user exists
      const mockOwner = {
        id: '123',
        email: validLoginData.email,
        password: 'hashed_password',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+33612345678',
        salons: []
      };
      (prisma.owner.findUnique as jest.Mock).mockResolvedValue(mockOwner);

      // Mock password comparison (valid)
      jest.spyOn(hashUtil, 'comparePassword').mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Connexion réussie');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(validLoginData.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should reject login with non-existent email', async () => {
      // Mock: user doesn't exist
      (prisma.owner.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('incorrect');
    });

    it('should reject login with incorrect password', async () => {
      // Mock: user exists
      const mockOwner = {
        id: '123',
        email: validLoginData.email,
        password: 'hashed_password',
        firstName: 'John',
        lastName: 'Doe',
        salons: []
      };
      (prisma.owner.findUnique as jest.Mock).mockResolvedValue(mockOwner);

      // Mock password comparison (invalid)
      jest.spyOn(hashUtil, 'comparePassword').mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('incorrect');
    });

    it('should reject login with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Test123!@#'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject login without password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
          // Missing password
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile with valid token', async () => {
      const mockOwner = {
        id: '123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+33612345678',
        createdAt: new Date(),
        salons: []
      };
      (prisma.owner.findUnique as jest.Mock).mockResolvedValue(mockOwner);

      // Generate a valid token
      const token = jwtUtil.generateToken({
        userId: '123',
        email: 'test@example.com'
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject request with expired token', async () => {
      // Create an expired token (you might need to adjust jwt.util.ts to support this for testing)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjIzOTAyMn0.invalid';

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('JWT Token Validation', () => {
    it('should generate valid JWT token', () => {
      const payload = {
        userId: '123',
        email: 'test@example.com'
      };

      const token = jwtUtil.generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should verify valid JWT token', () => {
      const payload = {
        userId: '123',
        email: 'test@example.com'
      };

      const token = jwtUtil.generateToken(payload);
      const decoded = jwtUtil.verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it('should reject invalid JWT token', () => {
      expect(() => {
        jwtUtil.verifyToken('invalid_token');
      }).toThrow();
    });
  });
});
