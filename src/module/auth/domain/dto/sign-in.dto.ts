export class SignInRequestDto {
  login!: string; // Accepts email (since no username in User schema)
  password!: string;
}

export class SignInResponseDto {
  accessToken!: string;
  user!: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
}
