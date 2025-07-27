import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

// Temporary interface until entities are properly resolved
interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  organizationId?: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    // Replace this with actual user retrieval logic
    const userStub = {
      id: 'user-id',
      email: 'user@example.com',
      passwordHash: await bcrypt.hash('securepassword', 10), // This should be fetched from the database
    };

    const isPasswordMatching = await bcrypt.compare(password, userStub.passwordHash);
    if (isPasswordMatching) {
      return userStub;
    }
    return null;
  }

  async login(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' }); // Consider different secret for refreshToken
    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string): Promise<string | null> {
    try {
      const decoded = this.jwtService.verify(refreshToken);
      const newAccessToken = this.jwtService.sign({ sub: decoded.sub, email: decoded.email });
      return newAccessToken;
    } catch (e) {
      return null;
    }
  }
}

