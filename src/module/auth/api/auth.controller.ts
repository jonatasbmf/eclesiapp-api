import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Request } from '@nestjs/common';
import { SignUpUseCase } from '../application/useCase/sign-up.usecase';
import { SignInUseCase } from '../application/useCase/sign-in.usecase';
import { SignUpRequestDto } from '../domain/dto/sign-up.dto';
import { SignInRequestDto } from '../domain/dto/sign-in.dto';
import { JwtAuthGuard } from '../infrastructure/guards/jwt.guard';
import { Public } from '../infrastructure/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly signUpUseCase: SignUpUseCase,
    private readonly signInUseCase: SignInUseCase,
  ) { }

  @Public()
  @Post('signup')
  async signup(@Body() dto: SignUpRequestDto) {
    return await this.signUpUseCase.execute(dto);
  }

  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(@Body() dto: SignInRequestDto) {
    return await this.signInUseCase.execute(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: any) {
    return {
      message: 'Rota protegida acessada com sucesso',
      user: req.user,
    };
  }
}
