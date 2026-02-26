import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

import { FirestoreService } from '../../shared/firestore/firestore.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyTokenDto } from './dto/verify-token.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private firestore: FirestoreService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) { }

  private get usersCollection() {
    return this.firestore.collection('users');
  }

  private get tokensCollection() {
    return this.firestore.collection('verification_tokens');
  }

  async register(registerDto: RegisterDto) {
    const { email, phone, password, firstName, lastName } = registerDto;

    // Check if user already exists
    const emailCheck = await this.usersCollection.where('email', '==', email).limit(1).get();
    let phoneCheck = null;
    if (phone) {
      phoneCheck = await this.usersCollection.where('phone', '==', phone).limit(1).get();
    }

    if (!emailCheck.empty || (phoneCheck && !phoneCheck.empty)) {
      throw new ConflictException('User with this email or phone already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userRef = this.usersCollection.doc();
    const now = new Date();
    const newUser = {
      email,
      phone,
      firstName,
      lastName,
      password: hashedPassword,
      isEmailVerified: false,
      isPhoneVerified: false,
      isActive: true,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    };

    await userRef.set(newUser);

    const user = {
      id: userRef.id,
      email,
      phone,
      firstName,
      lastName,
      isEmailVerified: false,
      isPhoneVerified: false,
      createdAt: now,
    };

    // Generate verification tokens
    await this.generateVerificationToken(user.id, 'EMAIL');
    if (phone) {
      await this.generateVerificationToken(user.id, 'PHONE');
    }

    // Generate JWT tokens
    const tokens = await this.generateTokens(user.id);

    return {
      user,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.usersCollection.doc(user.id).update({
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    });

    const tokens = await this.generateTokens(user.id);

    return {
      user: {
        id: (user as any).id,
        email: (user as any).email,
        phone: (user as any).phone,
        firstName: (user as any).firstName,
        lastName: (user as any).lastName,
        isEmailVerified: (user as any).isEmailVerified,
        isPhoneVerified: (user as any).isPhoneVerified,
      },
      ...tokens,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (user && await bcrypt.compare(password, (user as any).password)) {
      const { password: _, ...result } = user as any;
      return result;
    }
    return null;
  }

  async verifyToken(verifyTokenDto: VerifyTokenDto) {
    const { token } = verifyTokenDto;

    const snapshot = await this.tokensCollection.where('token', '==', token).limit(1).get();

    if (snapshot.empty) {
      throw new BadRequestException('Invalid or expired token');
    }

    const tokenDoc = snapshot.docs[0];
    const tokenData = tokenDoc.data();

    if (tokenData.isUsed || tokenData.expiresAt.toDate() < new Date()) {
      throw new BadRequestException('Invalid or expired token');
    }

    // Mark token as used
    await tokenDoc.ref.update({ isUsed: true, updatedAt: new Date() });

    // Update user verification status
    const updateData: any = { updatedAt: new Date() };
    if (tokenData.type === 'EMAIL') {
      updateData.isEmailVerified = true;
    } else if (tokenData.type === 'PHONE') {
      updateData.isPhoneVerified = true;
    }

    const userRef = this.usersCollection.doc(tokenData.userId);
    await userRef.update(updateData);

    const userDoc = await userRef.get();
    const userData = userDoc.data();

    return {
      user: {
        id: userDoc.id,
        email: userData.email,
        phone: userData.phone,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isEmailVerified: userData.isEmailVerified,
        isPhoneVerified: userData.isPhoneVerified,
      },
      message: 'Verification successful'
    };
  }

  async requestPasswordReset(requestPasswordResetDto: RequestPasswordResetDto) {
    const { email } = requestPasswordResetDto;

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    await this.generateVerificationToken(user.id, 'PASSWORD_RESET');

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    const snapshot = await this.tokensCollection.where('token', '==', token).limit(1).get();

    if (snapshot.empty) {
      throw new BadRequestException('Invalid or expired token');
    }

    const tokenDoc = snapshot.docs[0];
    const tokenData = tokenDoc.data();

    if (tokenData.isUsed || tokenData.expiresAt.toDate() < new Date() || tokenData.type !== 'PASSWORD_RESET') {
      throw new BadRequestException('Invalid or expired token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and mark token as used in a transaction
    await this.firestore.getDb().runTransaction(async (transaction) => {
      const userRef = this.usersCollection.doc(tokenData.userId);
      transaction.update(userRef, {
        password: hashedPassword,
        updatedAt: new Date(),
      });
      transaction.update(tokenDoc.ref, {
        isUsed: true,
        updatedAt: new Date(),
      });
    });

    return { message: 'Password reset successful' };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user.id);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(userId: string) {
    const payload = { sub: userId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async generateVerificationToken(userId: string, type: 'EMAIL' | 'PHONE' | 'PASSWORD_RESET') {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    const tokenRef = this.tokensCollection.doc();
    return tokenRef.set({
      userId,
      token,
      type,
      expiresAt,
      isUsed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}