import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { scrypt as _scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async signup(email: string, password: string) {
    const users = await this.usersService.find(email);

    if (users.length) {
      throw new BadRequestException('Email already exist');
    }

    let salt = randomBytes(8).toString('hex');
    let hash = (await scrypt(password, salt, 32)) as Buffer;

    let result = salt + '.' + hash.toString('hex');

    let user = this.usersService.create(email, result);

    return user;
  }

  async signin(email: string, password: string) {
    const [user] = await this.usersService.find(email);

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const [salt, storedHash] = user.password.split('.');

    let hash = (await scrypt(password, salt, 32)) as Buffer;

    if (storedHash !== hash.toString('hex')) {
      throw new NotFoundException('Invalid credentials');
    }

    return user;
  }
}
