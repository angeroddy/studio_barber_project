import request from 'supertest';
import app from '../app';
import prisma from '../config/database';
import { generateToken } from '../utils/jwt.util';

// Mock Prisma
jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    salon: {
      findUnique: jest.fn(),
    },
    staff: {
      findUnique: jest.fn(),
    },
    service: {
      findUnique: jest.fn(),
    },
    client: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    booking: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    bookingService: {
      findFirst: jest.fn(),
    },
  },
}));

describe('Booking API Tests', () => {
  let authToken: string;
  const mockUserId = 'owner-123';

  beforeEach(() => {
    jest.clearAllMocks();
    // Generate auth token for protected routes
    authToken = generateToken({
      userId: mockUserId,
      email: 'owner@example.com'
    });
  });

  describe('POST /api/bookings', () => {
    const validBookingData = {
      salonId: 'salon-123',
      staffId: 'staff-123',
      serviceId: 'service-123',
      clientName: 'John Doe',
      clientEmail: 'john@example.com',
      clientPhone: '+33612345678',
      startTime: new Date('2026-02-01T10:00:00Z'),
      endTime: new Date('2026-02-01T11:00:00Z'),
      status: 'CONFIRMED',
      notes: 'First visit'
    };

    const mockSalon = {
      id: 'salon-123',
      name: 'Test Salon',
      ownerId: mockUserId,
      bufferBefore: 0,
      bufferAfter: 0,
      processingTime: 0
    };

    const mockStaff = {
      id: 'staff-123',
      firstName: 'Jane',
      lastName: 'Smith',
      salonId: 'salon-123'
    };

    const mockService = {
      id: 'service-123',
      name: 'Haircut',
      duration: 60,
      price: 50,
      salonId: 'salon-123'
    };

    const mockClient = {
      id: 'client-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+33612345678',
      salonId: 'salon-123'
    };

    it('should successfully create a new booking', async () => {
      // Mock all the checks
      (prisma.salon.findUnique as jest.Mock).mockResolvedValue(mockSalon);
      (prisma.staff.findUnique as jest.Mock).mockResolvedValue(mockStaff);
      (prisma.service.findUnique as jest.Mock).mockResolvedValue(mockService);
      (prisma.client.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.client.create as jest.Mock).mockResolvedValue(mockClient);

      // No conflicting bookings
      (prisma.booking.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.bookingService.findFirst as jest.Mock).mockResolvedValue(null);

      // Mock booking creation
      const mockBooking = {
        id: 'booking-123',
        ...validBookingData,
        duration: mockService.duration,
        price: mockService.price,
        client: mockClient,
        staff: mockStaff,
        service: mockService
      };
      (prisma.booking.create as jest.Mock).mockResolvedValue(mockBooking);

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validBookingData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Réservation créée avec succès');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.client.email).toBe(validBookingData.clientEmail);
    });

    it('should reject booking for non-existent salon', async () => {
      (prisma.salon.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validBookingData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Salon introuvable');
    });

    it('should reject booking for non-existent staff', async () => {
      (prisma.salon.findUnique as jest.Mock).mockResolvedValue(mockSalon);
      (prisma.staff.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validBookingData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('personnel introuvable');
    });

    it('should reject booking for non-existent service', async () => {
      (prisma.salon.findUnique as jest.Mock).mockResolvedValue(mockSalon);
      (prisma.staff.findUnique as jest.Mock).mockResolvedValue(mockStaff);
      (prisma.service.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validBookingData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Service introuvable');
    });

    it('should reject booking when staff is already booked', async () => {
      (prisma.salon.findUnique as jest.Mock).mockResolvedValue(mockSalon);
      (prisma.staff.findUnique as jest.Mock).mockResolvedValue(mockStaff);
      (prisma.service.findUnique as jest.Mock).mockResolvedValue(mockService);
      (prisma.client.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.client.create as jest.Mock).mockResolvedValue(mockClient);

      // Mock conflicting staff booking
      const conflictingBooking = {
        id: 'existing-booking',
        staffId: 'staff-123',
        startTime: new Date('2026-02-01T10:00:00Z'),
        endTime: new Date('2026-02-01T11:00:00Z')
      };
      (prisma.booking.findFirst as jest.Mock)
        .mockResolvedValueOnce(conflictingBooking); // First call checks staff availability
      (prisma.bookingService.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validBookingData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('déjà un rendez-vous');
    });

    it('should create client if it does not exist', async () => {
      (prisma.salon.findUnique as jest.Mock).mockResolvedValue(mockSalon);
      (prisma.staff.findUnique as jest.Mock).mockResolvedValue(mockStaff);
      (prisma.service.findUnique as jest.Mock).mockResolvedValue(mockService);
      (prisma.client.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.client.create as jest.Mock).mockResolvedValue(mockClient);
      (prisma.booking.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.bookingService.findFirst as jest.Mock).mockResolvedValue(null);

      const mockBooking = {
        id: 'booking-123',
        ...validBookingData,
        duration: mockService.duration,
        price: mockService.price,
        client: mockClient,
        staff: mockStaff,
        service: mockService
      };
      (prisma.booking.create as jest.Mock).mockResolvedValue(mockBooking);

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validBookingData);

      expect(response.status).toBe(201);
      expect(prisma.client.create).toHaveBeenCalled();
    });

    it('should use existing client if email matches', async () => {
      (prisma.salon.findUnique as jest.Mock).mockResolvedValue(mockSalon);
      (prisma.staff.findUnique as jest.Mock).mockResolvedValue(mockStaff);
      (prisma.service.findUnique as jest.Mock).mockResolvedValue(mockService);
      (prisma.client.findUnique as jest.Mock).mockResolvedValue(mockClient);
      (prisma.booking.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.bookingService.findFirst as jest.Mock).mockResolvedValue(null);

      const mockBooking = {
        id: 'booking-123',
        ...validBookingData,
        duration: mockService.duration,
        price: mockService.price,
        client: mockClient,
        staff: mockStaff,
        service: mockService
      };
      (prisma.booking.create as jest.Mock).mockResolvedValue(mockBooking);

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validBookingData);

      expect(response.status).toBe(201);
      expect(prisma.client.create).not.toHaveBeenCalled();
      expect(prisma.client.findUnique).toHaveBeenCalled();
    });
  });

  describe('GET /api/bookings/:id', () => {
    it('should retrieve a booking by ID', async () => {
      const mockBooking = {
        id: 'booking-123',
        salonId: 'salon-123',
        clientId: 'client-123',
        staffId: 'staff-123',
        serviceId: 'service-123',
        startTime: new Date('2026-02-01T10:00:00Z'),
        endTime: new Date('2026-02-01T11:00:00Z'),
        status: 'CONFIRMED',
        client: {
          id: 'client-123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        },
        staff: {
          id: 'staff-123',
          firstName: 'Jane',
          lastName: 'Smith'
        },
        service: {
          id: 'service-123',
          name: 'Haircut',
          duration: 60,
          price: 50
        }
      };

      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);

      const response = await request(app)
        .get('/api/bookings/booking-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('booking-123');
    });

    it('should return 404 for non-existent booking', async () => {
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/bookings/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/bookings/:id', () => {
    it('should update booking status', async () => {
      const existingBooking = {
        id: 'booking-123',
        staffId: 'staff-123',
        serviceId: 'service-123',
        salonId: 'salon-123',
        startTime: new Date('2026-02-03T10:00:00Z'),
        endTime: new Date('2026-02-03T11:00:00Z'),
        status: 'CONFIRMED'
      };

      const mockBooking = {
        ...existingBooking,
        status: 'COMPLETED'
      };

      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(existingBooking);
      (prisma.booking.update as jest.Mock).mockResolvedValue(mockBooking);

      const response = await request(app)
        .put('/api/bookings/booking-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'COMPLETED' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('COMPLETED');
    });
  });

  describe('DELETE /api/bookings/:id', () => {
    it('should delete a booking', async () => {
      const existingBooking = {
        id: 'booking-123',
        staffId: 'staff-123',
        salonId: 'salon-123'
      };

      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(existingBooking);
      (prisma.booking.delete as jest.Mock).mockResolvedValue({
        id: 'booking-123'
      });

      const response = await request(app)
        .delete('/api/bookings/booking-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
