import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Auth system', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('handles signup request', async () => {
    const email = 'fdgf@vjhvjhv.com';

    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password: 'gfgjhfgfj' })
      .expect(201);

    const { id, email: returnedEmail } = res.body;
    expect(id).toBeDefined();
    expect(returnedEmail).toBe(email);
  });

  it('signs up and then returns the signed-in user via whoami', async () => {
  const email = 'asdf@asdfg.com';

  // NOTE: endpoint is /auth/signup
  const res = await request(app.getHttpServer())
    .post('/auth/signup')
    .send({ email, password: 'asfsdf' })
    .expect(201);

  // Get the Set-Cookie header
  const cookies = res.get('Set-Cookie');

  // Guard against undefined (runtime + fixes TS union type)
  expect(cookies).toBeDefined();
  expect(Array.isArray(cookies)).toBe(true);

  // You can pass the whole array to supertest:
  await request(app.getHttpServer())
    .get('/auth/whoami')
    .set('Cookie', cookies as string[]) // cast now that we've checked
    .expect(200)
    .expect(({ body }) => {
      expect(body.email).toBe(email);
      expect(body.id).toBeDefined();
    });
});
});
