import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { Prisma } from '@prisma/client';
import { PaginationResponse } from 'src/common/pagination';
import { CreateBookDto, QueryBookList } from './dto';

@Injectable()
export class BookService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dto: CreateBookDto) {
    try {
      return await this.prismaService.book.create({
        data: dto,
      });
    } catch (error) {
      let errorMessage = error?.message || 'Something went wrong';
      if (error?.code === 'P2002') {
        errorMessage = 'code already exist.';
      }
      throw new BadRequestException(errorMessage);
    }
  }

  async list(query: QueryBookList) {
    try {
      const skip = query?.limit
        ? Number(query.limit) * Number(query.page - 1)
        : undefined;
      const take = query?.limit ? Number(query.limit) : undefined;

      const where: Prisma.BookWhereInput = {};

      const book = await this.prismaService.book.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        where,
        skip,
        take,
      });

      const countBook = await this.prismaService.book.count({
        where,
      });

      return PaginationResponse(book, countBook, query?.page, query?.limit);
    } catch (error) {
      throw new BadRequestException(error?.message || 'Something went wrong');
    }
  }

  async update(dto: CreateBookDto, bookId: number) {
    try {
      return await this.prismaService.book.update({
        where: { id: bookId },
        data: dto,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Book not found.');
      }
      throw new BadRequestException(error?.message || 'Something went wrong');
    }
  }
}
