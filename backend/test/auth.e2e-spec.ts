import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createTestApp, closeTestApp } from './setup';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let sharedToken: string;

  const testUser = {
    name: '테스트유저',
    intraId: `authtest_${Date.now()}`,
    password: 'TestPass123',
  };

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
  }, 30000);

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
        });
    });

    it('should fail with duplicate intraId', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: '중복유저',
          intraId: testUser.intraId,
          password: 'DupPass123',
        })
        .expect(409);
    });

    it('should fail with weak password', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: '약한비번',
          intraId: `weak_${Date.now()}`,
          password: 'short',
        })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials and store token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ intraId: testUser.intraId, password: testUser.password })
        .expect(200);

      expect(res.body.access_token).toBeDefined();
      expect(res.body.user.intraId).toBe(testUser.intraId);
      sharedToken = res.body.access_token;
    });

    it('should fail with wrong password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ intraId: testUser.intraId, password: 'WrongPass123' })
        .expect(401);
    });

    it('should fail with non-existent user', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ intraId: 'nonexistent_user_xyz', password: 'SomePass123' })
        .expect(401);
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user profile', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${sharedToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.intraId).toBe(testUser.intraId);
        });
    });

    it('should fail without token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });
  });

  describe('PATCH /auth/change-password', () => {
    let changePwToken: string;
    const changePwPassword = 'OldPass123';

    beforeAll(async () => {
      const intraId = `changepw_${Date.now()}`;
      const hashed = await bcrypt.hash(changePwPassword, 10);
      await dataSource.query(
        `INSERT INTO users (user_intra_id, user_name, user_password) VALUES ($1, $2, $3)`,
        [intraId, 'ChangePW User', hashed],
      );
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ intraId, password: changePwPassword });
      changePwToken = res.body.access_token;
    });

    it('should fail with wrong current password', () => {
      return request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${changePwToken}`)
        .send({ currentPassword: 'WrongCurrent1', newPassword: 'NewPass1234' })
        .expect(400);
    });

    it('should change password successfully', () => {
      return request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${changePwToken}`)
        .send({ currentPassword: changePwPassword, newPassword: 'NewPass1234' })
        .expect(200);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout and invalidate token', async () => {
      // Create fresh user via DB to avoid rate limit on register
      const logoutIntraId = `logout_${Date.now()}`;
      const hashed = await bcrypt.hash('LogoutPass123', 10);
      await dataSource.query(
        `INSERT INTO users (user_intra_id, user_name, user_password) VALUES ($1, $2, $3)`,
        [logoutIntraId, 'Logout User', hashed],
      );

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ intraId: logoutIntraId, password: 'LogoutPass123' });

      const token = loginRes.body.access_token;
      expect(token).toBeDefined();

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Token should be blacklisted
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });
  });
});
