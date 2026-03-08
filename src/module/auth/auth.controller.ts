import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupCreateDto } from './dto/signup-create';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() signupCreateDto: SignupCreateDto) {
    
    const result = await this.authService.signup(signupCreateDto);

    return result;
  }
}
