import { Inject } from "@nestjs/common";
import { PrismaService } from "src/lib/prisma.service";
import { v4 as uuidv4 } from 'uuid';
import { SignupCreateDto } from "../dto/signup-create";
import { PersonModel, UserModel } from "generated/prisma/models";

export class CreateNewPerson{
    @Inject(PrismaService)
    private readonly prismaService: PrismaService; 

    async execute(signupCreateDto: SignupCreateDto): Promise<PersonModel>{
        const dataCreated = new Date();

        const data : PersonModel = {
            id: uuidv4(),
            email: signupCreateDto.email,
            phone: signupCreateDto.phone,
            updatedAt:dataCreated,
            createdAt:dataCreated,
            addressId: null, 
            photoUrl: null
        }

        const person = this.prismaService.person.create({data});

        return person;
    }
}