import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, closeTestApp } from './setup';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('User (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let studentToken: string;
  let studentUserId: number;

  beforeAll(async () => {
    app = await createTestApp();

    const dataSource = app.get(DataSource);

    // Create admin
    const adminIntraId = `user_admin_${Date.now()}`;
    const adminPassword = await bcrypt.hash('AdminPass123', 10);
    await dataSource.query(
      `INSERT INTO users (user_intra_id, user_name, user_password, user_role)
       VALUES ($1, $2, $3, $4)`,
      [adminIntraId, 'User Admin', adminPassword, 'admin'],
    );

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ intraId: adminIntraId, password: 'AdminPass123' });
    adminToken = adminLogin.body.access_token;

    // Create student
    const studentIntraId = `user_student_${Date.now()}`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'User Student', intraId: studentIntraId, password: 'StudentPass123' });

    const studentLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ intraId: studentIntraId, password: 'StudentPass123' });
    studentToken = studentLogin.body.access_token;
    studentUserId = studentLogin.body.user.userId;
  }, 30000);

  afterAll(async () => {
    await closeTestApp();
  });

  describe('GET /users', () => {
    it('should return users list for admin', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should fail for student (no permission)', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should fail without auth', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });
  });

  describe('PATCH /users/:id', () => {
    it('should fail for student (no permission)', () => {
      return request(app.getHttpServer())
        .patch(`/users/${studentUserId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ isAvailable: true })
        .expect(403);
    });

    it('should update user status (admin)', async () => {
      // Disable then re-enable to not break subsequent tests
      await request(app.getHttpServer())
        .patch(`/users/${studentUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isAvailable: false })
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/users/${studentUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isAvailable: true })
        .expect(200);
    });
  });

  describe('PATCH /users/:id/role', () => {
    it('should fail for student (no permission)', () => {
      return request(app.getHttpServer())
        .patch(`/users/${studentUserId}/role`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ role: 'admin' })
        .expect(403);
    });

    it('should change user role (admin)', () => {
      return request(app.getHttpServer())
        .patch(`/users/${studentUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'staff' })
        .expect(200)
        .expect((res) => {
          expect(res.body.role).toBe('staff');
        });
    });

    it('should revert role back to student', () => {
      return request(app.getHttpServer())
        .patch(`/users/${studentUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'student' })
        .expect(200);
    });
  });

  describe('PATCH /users/:id/reservation-ban', () => {
    it('should ban user from reservations (admin)', () => {
      return request(app.getHttpServer())
        .patch(`/users/${studentUserId}/reservation-ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isReservationBanned: true })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should unban user (admin)', () => {
      return request(app.getHttpServer())
        .patch(`/users/${studentUserId}/reservation-ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isReservationBanned: false, banUntil: null })
        .expect(200);
    });
  });

  describe('GET /users/stats', () => {
    it('should return own stats', () => {
      return request(app.getHttpServer())
        .get('/users/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('GET /users/reservation-status', () => {
    it('should return reservation status', () => {
      return request(app.getHttpServer())
        .get('/users/reservation-status')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('canReserve');
          expect(res.body).toHaveProperty('isBanned');
        });
    });
  });
});
