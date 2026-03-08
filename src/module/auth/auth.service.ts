import { Injectable } from '@nestjs/common';
import { SignupCreateDto } from './dto/signup-create';
import { PrismaService } from 'src/lib/prisma.service';
import { ValidateEmailUsed } from './userCase/validateEmailused';
import { CreateUser } from './userCase/createUser';
import { CreateNewPerson } from './userCase/createPerson';
import { throwError } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async signup(signupCreateDto: SignupCreateDto) : Promise<boolean> {
    const validateEmailUsed = new ValidateEmailUsed();    
    const emailUsed = await validateEmailUsed.execute(signupCreateDto.email);
    if (emailUsed) {
      throw new UserAlreadyExistsError('Já existe o cadastro com esse email.'); 
    }

    const personCreateUserCase = new CreateNewPerson();
    const personCreated = personCreateUserCase.execute(signupCreateDto);

    const userCreateUserCase = new CreateUser();
    const userCreate = await userCreateUserCase.execute(signupCreateDto, 'string');

    return true;
  }  
}

// Define a custom business error class (optional, but good practice)
export class UserAlreadyExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserAlreadyExistsError';
  }
}