import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class BorrowingService {
  constructor(private readonly prismaService: PrismaService) {}

  async borrowBook(bookId: number, memberId: number) {
    try {
      const borrowedBooksCount = await this.prismaService.borrowing.count({
        where: {
          memberId: memberId,
          returnDate: null, // Count only books that have not been returned
        },
      });

      if (borrowedBooksCount >= 2) {
        throw new BadRequestException(
          'Members may not borrow more than 2 books.',
        );
      }

      // Check whether the book has been borrowed by another member
      const isBookBorrowed = await this.prismaService.borrowing.findFirst({
        where: {
          bookId: bookId,
          returnDate: null,
        },
      });

      if (isBookBorrowed?.memberId === memberId) {
        throw new BadRequestException('You are currently holding this book.');
      }

      if (isBookBorrowed) {
        throw new BadRequestException(
          'This book is currently borrowed by another member.',
        );
      }

      // Check whether the member is currently under a penalty period
      const isPenalized = await this.prismaService.member.findFirst({
        where: {
          id: memberId,
        },
      });

      if (
        isPenalized?.penaltyEndDate ||
        isPenalized?.penaltyEndDate >= new Date()
      ) {
        throw new BadRequestException(
          'Member is currently penalized and cannot borrow books.',
        );
      }

      return await this.prismaService.borrowing.create({
        data: {
          bookId,
          memberId,
        },
      });
    } catch (error) {
      throw new BadRequestException(error?.message || 'Something went wrong');
    }
  }

  async returnBook(bookId: number, memberId: number) {
    try {
      // Check whether the book was borrowed by the member concerned
      const borrowedBook = await this.prismaService.borrowing.findFirst({
        where: {
          bookId: bookId,
          memberId: memberId,
          returnDate: null,
        },
      });

      if (!borrowedBook) {
        throw new BadRequestException('You have not borrowed this book.');
      }

      // Count the number of days since the book was lent
      const borrowDuration = Math.ceil(
        (new Date().getTime() - borrowedBook.borrowDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      const result = await this.prismaService.$transaction(async (prisma) => {
        const updatedBorrowing = await prisma.borrowing.update({
          where: { id: borrowedBook.id },
          data: {
            returnDate: new Date(),
          },
        });

        // If books are returned after more than 7 days, impose a penalty
        if (borrowDuration > 7) {
          const penaltyEndDate = new Date();
          penaltyEndDate.setDate(penaltyEndDate.getDate() + 3); // Add a penalty of 3 days

          await prisma.member.update({
            where: { id: memberId },
            data: {
              penaltyEndDate: penaltyEndDate,
            },
          });
        }

        return updatedBorrowing;
      });

      return result;
    } catch (error) {
      throw new BadRequestException(error?.message || 'Something went wrong');
    }
  }
}
