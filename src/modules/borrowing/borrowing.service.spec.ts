import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/config/database/prisma.service';
import { BorrowingService } from './borrowing.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('BorrowingService', () => {
  let service: BorrowingService;
  let prismaService: PrismaService;

  const bookId = 1;
  const memberId = 1;
  const book = {
    id: bookId,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BorrowingService,
        {
          provide: PrismaService,
          useValue: {
            borrowing: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            member: {
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            book: {
              findFirstOrThrow: jest.fn(),
            },
            $transaction: jest
              .fn()
              .mockImplementation((fn) => fn(prismaService)),
          },
        },
      ],
    }).compile();

    service = module.get<BorrowingService>(BorrowingService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('borrowBook', () => {
    it('should successfully borrow a book', async () => {
      jest.spyOn(prismaService.borrowing, 'count').mockResolvedValueOnce(1);
      jest
        .spyOn(prismaService.borrowing, 'findFirst')
        .mockResolvedValueOnce(null);
      jest.spyOn(prismaService.member, 'findFirst').mockResolvedValueOnce({
        id: memberId,
        penaltyEndDate: null,
      } as any);
      jest.spyOn(prismaService.borrowing, 'create').mockResolvedValueOnce({
        bookId,
        memberId,
      } as any);

      const result = await service.borrowBook(bookId, memberId);
      expect(result).toEqual({ bookId, memberId });
    });

    it(`should successfully borrow a book if the member's penalty has expired`, async () => {
      jest.spyOn(prismaService.borrowing, 'count').mockResolvedValueOnce(1);
      jest
        .spyOn(prismaService.borrowing, 'findFirst')
        .mockResolvedValueOnce(null);
      jest.spyOn(prismaService.member, 'findFirst').mockResolvedValueOnce({
        id: memberId,
        penaltyEndDate: new Date(new Date().getTime() - 24 * 60 * 60 * 1000), // (yesterday) penalty expired,
      } as any);
      jest.spyOn(prismaService.borrowing, 'create').mockResolvedValueOnce({
        bookId,
        memberId,
      } as any);

      const result = await service.borrowBook(bookId, memberId);
      expect(result).toEqual({ bookId, memberId });
    });

    it(`should throw an error if the book not found.`, async () => {
      jest.spyOn(prismaService.borrowing, 'count').mockResolvedValueOnce(1);
      jest
        .spyOn(prismaService.borrowing, 'findFirst')
        .mockResolvedValueOnce(null);
      jest.spyOn(prismaService.member, 'findFirst').mockResolvedValueOnce({
        id: memberId,
        penaltyEndDate: null,
      } as any);
      jest.spyOn(prismaService.borrowing, 'create').mockRejectedValueOnce({
        code: 'P2003',
      });

      await expect(service.borrowBook(bookId, memberId)).rejects.toThrow(
        new NotFoundException('Book not found.'),
      );
    });

    it('should throw an error if member has already borrowed 2 books', async () => {
      jest.spyOn(prismaService.borrowing, 'count').mockResolvedValueOnce(2);

      await expect(service.borrowBook(bookId, memberId)).rejects.toThrow(
        new BadRequestException('Members may not borrow more than 2 books.'),
      );
    });

    it('should throw an error if the book is currently borrowed by the same member', async () => {
      jest.spyOn(prismaService.borrowing, 'count').mockResolvedValueOnce(1);
      jest.spyOn(prismaService.borrowing, 'findFirst').mockResolvedValueOnce({
        bookId,
        memberId,
        returnDate: null,
      } as any);

      await expect(service.borrowBook(bookId, memberId)).rejects.toThrow(
        new BadRequestException('You are currently holding this book.'),
      );
    });

    it('should throw an error if the book is currently borrowed by another member', async () => {
      jest.spyOn(prismaService.borrowing, 'count').mockResolvedValueOnce(1);
      jest.spyOn(prismaService.borrowing, 'findFirst').mockResolvedValueOnce({
        bookId,
        memberId: 2,
        returnDate: null,
      } as any);

      await expect(service.borrowBook(bookId, memberId)).rejects.toThrow(
        new BadRequestException(
          'This book is currently borrowed by another member.',
        ),
      );
    });

    it('should throw an error if the member is currently penalized', async () => {
      jest.spyOn(prismaService.borrowing, 'count').mockResolvedValueOnce(1);
      jest
        .spyOn(prismaService.borrowing, 'findFirst')
        .mockResolvedValueOnce(null);
      jest.spyOn(prismaService.member, 'findFirst').mockResolvedValueOnce({
        id: memberId,
        penaltyEndDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // penalty active
      } as any);

      await expect(service.borrowBook(bookId, memberId)).rejects.toThrow(
        new BadRequestException(
          'Member is currently penalized and cannot borrow books.',
        ),
      );
    });
  });

  describe('returnBook', () => {
    it('should successfully return a book if returned within 7 days', async () => {
      const borrowDate = new Date(
        new Date().getTime() - 6 * 24 * 60 * 60 * 1000,
      ); // 6 days ago

      const borrowedBook = {
        id: 1,
        bookId,
        memberId,
        borrowDate,
        returnDate: null,
      };

      jest
        .spyOn(prismaService.book, 'findFirstOrThrow')
        .mockResolvedValueOnce(book as any);
      jest
        .spyOn(prismaService.borrowing, 'findFirst')
        .mockResolvedValueOnce(borrowedBook as any);
      jest.spyOn(prismaService.borrowing, 'update').mockResolvedValueOnce({
        ...(borrowedBook as any),
        returnDate: new Date(),
      });

      const result = await service.returnBook(bookId, memberId);
      expect(result.returnDate).toBeDefined();
    });

    it('should throw an error if the book not found.', async () => {
      jest.spyOn(prismaService.book, 'findFirstOrThrow').mockRejectedValueOnce({
        code: 'P2025',
      });

      await expect(service.returnBook(100, memberId)).rejects.toThrow(
        new NotFoundException('Book not found.'),
      );
    });

    it('should throw an error if the member did not borrow this book', async () => {
      jest
        .spyOn(prismaService.book, 'findFirstOrThrow')
        .mockResolvedValueOnce(book as any);
      jest
        .spyOn(prismaService.borrowing, 'findFirst')
        .mockResolvedValueOnce(null);

      await expect(service.returnBook(bookId, memberId)).rejects.toThrow(
        new BadRequestException('You have not borrowed this book.'),
      );
    });

    it('should impose a penalty if the book is returned after more than 7 days', async () => {
      const borrowDate = new Date(
        new Date().getTime() - 8 * 24 * 60 * 60 * 1000,
      ); // 8 days ago
      const borrowedBook = {
        id: 1,
        bookId,
        memberId,
        borrowDate,
        returnDate: null,
      };

      jest
        .spyOn(prismaService.book, 'findFirstOrThrow')
        .mockResolvedValueOnce(book as any);
      jest
        .spyOn(prismaService.borrowing, 'findFirst')
        .mockResolvedValueOnce(borrowedBook as any);
      jest.spyOn(prismaService.borrowing, 'update').mockResolvedValueOnce({
        ...(borrowedBook as any),
        returnDate: new Date(),
      });
      jest.spyOn(prismaService.member, 'update').mockResolvedValueOnce({
        id: memberId,
        penaltyEndDate: new Date(
          new Date().getTime() + 3 * 24 * 60 * 60 * 1000,
        ), // 3 days penalty
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await service.returnBook(bookId, memberId);
      expect(result.returnDate).toBeDefined();
      expect(prismaService.member.update).toHaveBeenCalledWith({
        where: { id: memberId },
        data: {
          penaltyEndDate: expect.any(Date),
        },
      });
    });
  });
});
