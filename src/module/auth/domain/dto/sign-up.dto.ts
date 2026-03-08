import { Gender } from 'generated/prisma/client';

export class SignUpRequestDto {
  email!: string;
  password!: string;
  firstName!: string;
  lastName!: string;
  phone?: string;
  cpf?: string;
  birthDate?: Date;
  gender?: Gender;
}

export class SignUpResponseDto {
  id!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  roles!: string[];
}
