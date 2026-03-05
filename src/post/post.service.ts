import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { PrismaService } from 'src/lib/prisma.service';

@Injectable()
export class PostService {

  constructor(private readonly prisma: PrismaService) {  }
  
  async create(createPostDto: CreatePostDto) {
    const postCreated = await this.prisma.post.create({
      data: {
        title: createPostDto.title,
        content: createPostDto.content,
      },
    }); 
    return postCreated;
  }
}
