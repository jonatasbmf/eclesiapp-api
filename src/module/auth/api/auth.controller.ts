import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SignUpUseCase } from '../application/useCase/sign-up.usecase';
import { SignInUseCase } from '../application/useCase/sign-in.usecase';
import { SignUpRequestDto } from '../domain/dto/sign-up.dto';
import { SignInRequestDto } from '../domain/dto/sign-in.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly signUpUseCase: SignUpUseCase,
    private readonly signInUseCase: SignInUseCase,
  ) {}

  @Post('signup')
  async signup(@Body() dto: SignUpRequestDto) {
    return await this.signUpUseCase.execute(dto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(@Body() dto: SignInRequestDto) {
    return await this.signInUseCase.execute(dto);
  }
}
