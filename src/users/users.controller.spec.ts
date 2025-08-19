import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthService } from './auth.service';
import { UpdateUserDto } from './dtos/update-user.dto';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };

  const mockAuthService = {
    signup: jest.fn(),
    signin: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('POST /auth/signup -> createUser', () => {
    it('sets session.userId and returns the created user', async () => {
      const dto = { email: 'a@b.com', password: 'pw' };
      const user = { id: 123, email: dto.email };
      const session: any = {};

      mockAuthService.signup.mockResolvedValue(user);

      const result = await controller.createUser(dto as any, session);

      expect(mockAuthService.signup).toHaveBeenCalledWith(
        dto.email,
        dto.password,
      );
      expect(session.userId).toBe(123);
      expect(result).toEqual(user);
    });
  });

  describe('POST /auth/signin -> signin', () => {
    it('sets session.userId and returns the user', async () => {
      const dto = { email: 'a@b.com', password: 'pw' };
      const user = { id: 7, email: dto.email };
      const session: any = {};

      mockAuthService.signin.mockResolvedValue(user);

      const result = await controller.signin(dto as any, session);

      expect(mockAuthService.signin).toHaveBeenCalledWith(
        dto.email,
        dto.password,
      );
      expect(session.userId).toBe(7);
      expect(result).toEqual(user);
    });
  });

  describe('GET /auth/whoami -> whoAmI', () => {
    it('returns the current user (guard/decorator tested elsewhere)', () => {
      const current = { id: 55, email: 'me@site.com' } as any;
      expect(controller.whoAmI(current)).toBe(current);
    });
  });

  describe('POST /auth/signout -> signOut', () => {
    it('nulls the session.userId', () => {
      const session: any = { userId: 99 };
      controller.signOut(session);
      expect(session.userId).toBeNull();
    });
  });

  describe('GET /auth/:id -> findUser', () => {
    it('returns a user when found', async () => {
      const user = { id: 42, email: 'x@y.com' };
      mockUsersService.findOne.mockResolvedValue(user);

      const result = await controller.findUser('42');

      expect(mockUsersService.findOne).toHaveBeenCalledWith(42);
      expect(result).toEqual(user);
    });

    it('throws NotFoundException when user is missing', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(controller.findUser('1234')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(mockUsersService.findOne).toHaveBeenCalledWith(1234);
    });
  });

  describe('GET /auth?email= -> findAllUsers', () => {
    it('delegates to UsersService.find with email', () => {
      const list = [{ id: 1, email: 'a@b.com' }];
      mockUsersService.find.mockReturnValue(list);

      const result = controller.findAllUsers('a@b.com');

      expect(mockUsersService.find).toHaveBeenCalledWith('a@b.com');
      expect(result).toBe(list);
    });
  });

  describe('DELETE /auth/:id -> removeUser', () => {
    it('calls UsersService.remove with numeric id', () => {
      const removed = { id: 9 };
      mockUsersService.remove.mockReturnValue(removed);

      const result = controller.removeUSer('9');

      expect(mockUsersService.remove).toHaveBeenCalledWith(9);
      expect(result).toBe(removed);
    });
  });

  describe('PATCH /auth/:id -> UpdateUser', () => {
    it('calls UsersService.update with id and body', () => {
      const body: UpdateUserDto = { email: 'new@e.com' } as any;
      const updated = { id: 3, email: 'new@e.com' };
      mockUsersService.update.mockReturnValue(updated);

      const result = controller.UpdateUser('3', body);

      expect(mockUsersService.update).toHaveBeenCalledWith(3, body);
      expect(result).toBe(updated);
    });
  });
});
