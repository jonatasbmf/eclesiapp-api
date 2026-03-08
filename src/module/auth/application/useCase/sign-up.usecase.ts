import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma.service';
import { SignUpRequestDto, SignUpResponseDto } from '../../domain/dto/sign-up.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SignUpUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: SignUpRequestDto): Promise<SignUpResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (existingUser) {
      throw new ConflictException('Já existe um usuário com este email');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.prisma.$transaction(async (tx: any) => {
      const personId = uuidv4();
      
      const person = await tx.person.create({
        data: {
          id: personId,
          email: dto.email,
          phone: dto.phone,
          individual: {
            create: {
              firstName: dto.firstName,
              lastName: dto.lastName,
              cpf: dto.cpf,
              birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
              gender: dto.gender,
            }
          },
          user: {
            create: {
              email: dto.email,
              passwordHash,
              isActive: true,
            }
          }
        },
        include: {
          individual: true,
          user: {
            include: {
              groups: {
                include: {
                  group: true
                }
              }
            }
          }
        }
      });

      return person;
    });

    const roles = user.user?.groups.map((g: any) => g.group.name) || [];

    return {
      id: user.user!.id,
      email: user.user!.email,
      firstName: user.individual!.firstName,
      lastName: user.individual!.lastName,
      roles,
    };
  }
}
