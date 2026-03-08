import { PrismaService } from "src/lib/prisma.service";
import { SignupCreateDto } from "../dto/signup-create";
import { Inject } from "@nestjs/common";
import { Prisma } from "generated/prisma/client";
import { v4 as uuidv4 } from 'uuid';
import {  UserModel } from "generated/prisma/models";

export class CreateUser{
    @Inject(PrismaService)
    private readonly prismaService: PrismaService;  

    async execute(signupCreateDto: SignupCreateDto, personId: string): Promise<UserModel>{
        const createdAt = new Date();

        const data: Prisma.UserModel = {
            id: uuidv4(),
            isActive: true,
            passwordHash: 'hash',
            email: signupCreateDto.email,
            createdAt: createdAt,
            updatedAt: createdAt,
            personId: personId
        };

        const user = await this.prismaService.user.create({data}); 

        return user;
    }
}