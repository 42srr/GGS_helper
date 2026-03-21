import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, closeTestApp } from './setup';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('Reservation (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let studentToken: string;
  let studentUserId: number;
  let roomId: number;
  let reservationId: number;

  beforeAll(async () => {
    app = await createTestApp();

    const dataSource = app.get(DataSource);

    // Create admin
    const adminIntraId = `res_admin_${Date.now()}`;
    const adminPassword = await bcrypt.hash('AdminPass123', 10);
    await dataSource.query(
      `INSERT INTO users (user_intra_id, user_name, user_password, user_role)
       VALUES ($1, $2, $3, $4)`,
      [adminIntraId, 'Res Admin', adminPassword, 'admin'],
    );

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ intraId: adminIntraId, password: 'AdminPass123' });
    adminToken = adminLogin.body.access_token;

    // Create student
    const studentIntraId = `res_student_${Date.now()}`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Res Student', intraId: studentIntraId, password: 'StudentPass123' });

    const studentLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ intraId: studentIntraId, password: 'StudentPass123' });
    studentToken = studentLogin.body.access_token;
    studentUserId = studentLogin.body.user.userId;

    // Create room for reservations
    const roomRes = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `예약테스트룸_${Date.now()}`, location: '2층', capacity: 8 });
    roomId = roomRes.body.roomId;
  }, 30000);

  afterAll(async () => {
    await closeTestApp();
  });

  describe('GET /reservations (Public)', () => {
    it('should return reservations without auth', () => {
      return request(app.getHttpServer())
        .get('/reservations')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('POST /reservations', () => {
    it('should create a reservation', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(11, 0, 0, 0);

      return request(app.getHttpServer())
        .post('/reservations')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          roomId,
          title: '통합테스트 예약',
          startTime: tomorrow.toISOString(),
          endTime: endTime.toISOString(),
          attendees: 4,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.reservationId).toBeDefined();
          reservationId = res.body.reservationId;
        });
    });

    it('should fail without auth', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(15, 0, 0, 0);

      return request(app.getHttpServer())
        .post('/reservations')
        .send({
          roomId,
          title: 'No Auth',
          startTime: tomorrow.toISOString(),
          endTime: endTime.toISOString(),
        })
        .expect(401);
    });

    it('should fail with missing fields', () => {
      return request(app.getHttpServer())
        .post('/reservations')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'Missing Fields' })
        .expect(400);
    });
  });

  describe('POST /reservations/check-conflict', () => {
    it('should detect conflict', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(11, 0, 0, 0);

      return request(app.getHttpServer())
        .post('/reservations/check-conflict')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          roomId,
          startDatetime: tomorrow.toISOString(),
          endDatetime: endTime.toISOString(),
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.hasConflict).toBe(true);
        });
    });

    it('should not detect conflict for free slot', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(18, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(19, 0, 0, 0);

      return request(app.getHttpServer())
        .post('/reservations/check-conflict')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          roomId,
          startDatetime: tomorrow.toISOString(),
          endDatetime: endTime.toISOString(),
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.hasConflict).toBe(false);
        });
    });
  });

  describe('GET /reservations/my', () => {
    it('should return my reservations', () => {
      return request(app.getHttpServer())
        .get('/reservations/my')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('GET /reservations/:id', () => {
    it('should return specific reservation', () => {
      return request(app.getHttpServer())
        .get(`/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.reservationId).toBe(reservationId);
        });
    });
  });

  describe('PATCH /reservations/:id/cancel', () => {
    it('should cancel own reservation', () => {
      return request(app.getHttpServer())
        .patch(`/reservations/${reservationId}/cancel`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
    });
  });

  describe('Admin reservation endpoints', () => {
    it('GET /reservations/admin/all should work for admin', () => {
      return request(app.getHttpServer())
        .get('/reservations/admin/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /reservations/admin/all should fail for student', () => {
      return request(app.getHttpServer())
        .get('/reservations/admin/all')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  describe('POST /reservations/:id/no-show', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post(`/reservations/${reservationId}/no-show`)
        .expect(401);
    });
  });
});
