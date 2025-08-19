import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';

describe('AuthService (with global users array)', () => {
  let service: AuthService;

  // Global in-memory "DB"
  let users: User[] = [];

  // Fake UsersService that works against the in-memory array
  const fakeUsersService: Partial<UsersService> = {
    find: (email: string) => {
      const found = users.filter((u) => u.email === email);
      return Promise.resolve(found);
    },
    create: (email: string, password: string) => {
      const user: User = {
        id: Math.floor(Math.random() * 100000),
        email,
        password,
      } as User;
      users.push(user);
      return Promise.resolve(user);
    },
  };

  beforeEach(async () => {
    // reset the "DB" before every test
    users = [];

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: fakeUsersService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const plainPassword = 'asdfasdf';
    const user = await service.signup('tizo@asdf.com', plainPassword);

    expect(user.password).not.toEqual(plainPassword);
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if email in use', async () => {
    // Pre-populate the "DB" with an existing user for this email
    users.push({ id: 1, email: 'taken@ex.com', password: 'x' } as User);

    await expect(service.signup('taken@ex.com', 'newpass')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws if signin is called with unused email', async () => {
    // DB is empty; no such email
    await expect(service.signin('nouser@ex.com', 'whatever')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws if an invalid password is provided', async () => {
    // First sign up (this stores a real salted+hashed password)
    const email = 'user@ex.com';
    const correct = 'correct-pass';
    await service.signup(email, correct);

    // Now try sign in with a wrong password
    await expect(service.signin(email, 'wrong-pass')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('returns a user if email and password are valid', async () => {
    const email = 'good@ex.com';
    const pass = 'supersecret';

    // Create the user via signup so a valid salt.hash is stored
    await service.signup(email, pass);

    // Now sign in with the same credentials
    const user = await service.signin(email, pass);

    expect(user).toBeDefined();
    expect(user.email).toBe(email);
  });
});
