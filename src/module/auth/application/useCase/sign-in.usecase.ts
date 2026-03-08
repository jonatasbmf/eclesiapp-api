import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma.service';
import { SignInRequestDto, SignInResponseDto } from '../../domain/dto/sign-in.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class SignInUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async execute(dto: SignInRequestDto): Promise<SignInResponseDto> {
    // login is actually email
    const user = await this.prisma.user.findFirst({
      where: {
        email: { equals: dto.login, mode: 'insensitive' }
      },
      include: {
        groups: {
          include: {
            group: true
          }
        },
        person: {
          include: {
            individual: true
          }
        }
      }
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const roles = user.groups.map(g => g.group.name);

    const payload = { sub: user.id, roles };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.person?.individual?.firstName || '',
        lastName: user.person?.individual?.lastName || '',
        roles,
      }
    };
  }
}
