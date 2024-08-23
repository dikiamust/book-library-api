import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { Prisma } from '@prisma/client';
import { PaginationResponse } from 'src/common/pagination';
import { QueryMemberList } from './dto';

@Injectable()
export class MemberService {
  constructor(private readonly prismaService: PrismaService) {}

  async list(query: QueryMemberList) {
    try {
      const skip = query?.limit
        ? Number(query.limit) * Number(query.page - 1)
        : undefined;
      const take = query?.limit ? Number(query.limit) : undefined;

      const where: Prisma.MemberWhereInput = {};

      const members = await this.prismaService.member.findMany({
        include: {
          borrowings: {
            where: {
              returnDate: null,
            },
            include: {
              book: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        where,
        skip,
        take,
      });

      const result = members.map((member) => {
        const { password, salt, borrowings, ...memberData } = member;

        if (borrowings.length > 0) {
          return {
            ...memberData,
            borrowedBooks: borrowings.map((borrowing) => borrowing.book),
            borrowedBooksCount: borrowings.length,
          };
        } else {
          return {
            ...memberData,
            borrowedBooks: [],
            borrowedBooksCount: 0,
          };
        }
      });

      const countMember = await this.prismaService.member.count({
        where,
      });

      return PaginationResponse(result, countMember, query?.page, query?.limit);
    } catch (error) {
      throw new BadRequestException(error?.message || 'Something went wrong');
    }
  }
}
