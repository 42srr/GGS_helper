import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, closeTestApp } from './setup';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('Room (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let studentToken: string;
  let createdRoomId: number;

  beforeAll(async () => {
    app = await createTestApp();

    const dataSource = app.get(DataSource);

    // Create admin user directly in DB
    const adminPassword = await bcrypt.hash('AdminPass123', 10);
    await dataSource.query(
      `INSERT INTO users (user_intra_id, user_name, user_password, user_role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_intra_id) DO UPDATE SET user_password = $3, user_role = $4`,
      [`room_admin_${Date.now()}`, 'Room Admin', adminPassword, 'admin'],
    );
    const adminIntraId = (await dataSource.query(
      `SELECT user_intra_id FROM users WHERE user_role = 'admin' ORDER BY user_createdat DESC LIMIT 1`,
    ))[0].user_intra_id;

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ intraId: adminIntraId, password: 'AdminPass123' });
    adminToken = adminLogin.body.access_token;

    // Create student user
    const studentIntraId = `room_student_${Date.now()}`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Room Student', intraId: studentIntraId, password: 'StudentPass123' });

    const studentLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ intraId: studentIntraId, password: 'StudentPass123' });
    studentToken = studentLogin.body.access_token;
  }, 30000);

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /rooms', () => {
    it('should create a room (admin)', () => {
      return request(app.getHttpServer())
        .post('/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `테스트룸_${Date.now()}`,
          location: '1층 A구역',
          capacity: 6,
          description: '테스트용 회의실',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.roomId).toBeDefined();
          createdRoomId = res.body.roomId;
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/rooms')
        .send({ name: 'NoAuth', location: 'Nowhere', capacity: 4 })
        .expect(401);
    });

    it('should fail with student role', () => {
      return request(app.getHttpServer())
        .post('/rooms')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ name: 'StudentRoom', location: 'Nowhere', capacity: 4 })
        .expect(403);
    });

    it('should fail with invalid data', () => {
      return request(app.getHttpServer())
        .post('/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '', capacity: 0 })
        .expect(400);
    });
  });

  describe('GET /rooms', () => {
    it('should return rooms list', () => {
      return request(app.getHttpServer())
        .get('/rooms')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/rooms')
        .expect(401);
    });
  });

  describe('GET /rooms/:id', () => {
    it('should return a specific room', () => {
      return request(app.getHttpServer())
        .get(`/rooms/${createdRoomId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.roomId).toBe(createdRoomId);
        });
    });
  });

  describe('PATCH /rooms/:id', () => {
    it('should update room (admin)', () => {
      return request(app.getHttpServer())
        .patch(`/rooms/${createdRoomId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: '수정된 설명' })
        .expect(200);
    });

    it('should fail with student role', () => {
      return request(app.getHttpServer())
        .patch(`/rooms/${createdRoomId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ description: '학생 수정' })
        .expect(403);
    });
  });

  describe('DELETE /rooms/:id', () => {
    it('should fail with student role', () => {
      return request(app.getHttpServer())
        .delete(`/rooms/${createdRoomId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should delete room (admin)', () => {
      return request(app.getHttpServer())
        .delete(`/rooms/${createdRoomId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});
