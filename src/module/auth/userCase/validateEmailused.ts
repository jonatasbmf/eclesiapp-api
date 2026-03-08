import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "src/lib/prisma.service";

export class ValidateEmailUsed {
    @Inject(PrismaService)
    private readonly prismaService: PrismaService;    

    async execute(email: string) : Promise<boolean> {
        const userExistWithThisEmail = await this.prismaService.user.findFirst({
                where: { email: { equals: email, mode: 'insensitive' } }
        });

        const result = userExistWithThisEmail ? true : false;

        console.log(`Validando se exite um cadastro com esse email - ${email}: `, result);
        return result;
    }
}