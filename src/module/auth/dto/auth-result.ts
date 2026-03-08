import { User } from "src/module/common/entity/User";

export class AuthResultDto {
    success: boolean;
    message: string;
    accessToken: string;
    refreshToken: string;
    user: User;

    errorCreate(message: string) {
        this.success = false;
        this.message = message;
        return this;
    }

    succesLogin(accessToken: string, refreshToken: string, user: User) {
        this.success = true;
        this.message = "Login efetuado com sucesso!";
        this.user = user,
        this.refreshToken = refreshToken,
        this.accessToken = accessToken

        return this;
    }

    errorLogin(message: string) {
        this.success = false;
        this.message = message;
        return this;
    }
}
