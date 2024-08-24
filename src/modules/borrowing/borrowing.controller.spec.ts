import { Test, TestingModule } from '@nestjs/testing';
import { BorrowingController } from './borrowing.controller';
import { BorrowingService } from './borrowing.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('BorrowingController', () => {
  let borrowingController: BorrowingController;
  let borrowingService: BorrowingService;

  const bookId = 1;
  const userId = 1;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BorrowingController],
      providers: [
        {
          provide: BorrowingService,
          useValue: {
            borrowBook: jest.fn(),
            returnBook: jest.fn(),
          },
        },
      ],
    }).compile();

    borrowingController = module.get<BorrowingController>(BorrowingController);
    borrowingService = module.get<BorrowingService>(BorrowingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('borrowBook', () => {
    it('should successfully borrow a book', async () => {
      jest
        .spyOn(borrowingService, 'borrowBook')
        .mockResolvedValueOnce({ bookId, userId } as any);

      const result = await borrowingController.borrowBook(bookId, {
        userId,
      } as any);
      expect(result).toEqual({ bookId, userId });
      expect(borrowingService.borrowBook).toHaveBeenCalledWith(bookId, userId);
    });

    it('should throw an error if the member has already borrowed 2 books', async () => {
      jest
        .spyOn(borrowingService, 'borrowBook')
        .mockRejectedValueOnce(
          new BadRequestException('Members may not borrow more than 2 books.'),
        );

      await expect(
        borrowingController.borrowBook(bookId, { userId } as any),
      ).rejects.toThrow(BadRequestException);
      expect(borrowingService.borrowBook).toHaveBeenCalledWith(bookId, userId);
    });

    it('should throw an error if the book is currently borrowed by the same member', async () => {
      jest
        .spyOn(borrowingService, 'borrowBook')
        .mockRejectedValueOnce(
          new BadRequestException('You are currently holding this book.'),
        );

      await expect(
        borrowingController.borrowBook(bookId, { userId } as any),
      ).rejects.toThrow(BadRequestException);
      expect(borrowingService.borrowBook).toHaveBeenCalledWith(bookId, userId);
    });

    it('should throw an error if the book is currently borrowed by another member', async () => {
      jest
        .spyOn(borrowingService, 'borrowBook')
        .mockRejectedValueOnce(
          new BadRequestException(
            'This book is currently borrowed by another member.',
          ),
        );

      await expect(
        borrowingController.borrowBook(bookId, { userId } as any),
      ).rejects.toThrow(BadRequestException);
      expect(borrowingService.borrowBook).toHaveBeenCalledWith(bookId, userId);
    });

    it('should throw an error if the member is currently penalized', async () => {
      jest
        .spyOn(borrowingService, 'borrowBook')
        .mockRejectedValueOnce(
          new BadRequestException(
            'Member is currently penalized and cannot borrow books.',
          ),
        );

      await expect(
        borrowingController.borrowBook(bookId, { userId } as any),
      ).rejects.toThrow(BadRequestException);
      expect(borrowingService.borrowBook).toHaveBeenCalledWith(bookId, userId);
    });

    it('should throw an error if the book is not found', async () => {
      jest
        .spyOn(borrowingService, 'borrowBook')
        .mockRejectedValueOnce(new NotFoundException('Book not found.'));

      await expect(
        borrowingController.borrowBook(bookId, { userId } as any),
      ).rejects.toThrow(NotFoundException);
      expect(borrowingService.borrowBook).toHaveBeenCalledWith(bookId, userId);
    });

    it(`should successfully borrow a book if the member's penalty has expired`, async () => {
      jest
        .spyOn(borrowingService, 'borrowBook')
        .mockResolvedValueOnce({ bookId, userId } as any);

      const result = await borrowingController.borrowBook(bookId, {
        userId,
      } as any);
      expect(result).toEqual({ bookId, userId });
      expect(borrowingService.borrowBook).toHaveBeenCalledWith(bookId, userId);
    });
  });

  describe('returnBook', () => {
    it('should successfully return a book if returned within 7 days', async () => {
      const mockReturnData = { bookId, userId, returnDate: new Date() };
      jest
        .spyOn(borrowingService, 'returnBook')
        .mockResolvedValueOnce(mockReturnData as any);

      const result = await borrowingController.returnBook(bookId, {
        userId,
      } as any);
      expect(result).toEqual(mockReturnData);
      expect(borrowingService.returnBook).toHaveBeenCalledWith(bookId, userId);
    });

    it('should throw an error if the book is not found', async () => {
      jest
        .spyOn(borrowingService, 'returnBook')
        .mockRejectedValueOnce(new NotFoundException('Book not found.'));

      await expect(
        borrowingController.returnBook(bookId, { userId } as any),
      ).rejects.toThrow(NotFoundException);
      expect(borrowingService.returnBook).toHaveBeenCalledWith(bookId, userId);
    });

    it('should throw an error if the member did not borrow this book', async () => {
      jest
        .spyOn(borrowingService, 'returnBook')
        .mockRejectedValueOnce(
          new BadRequestException('You have not borrowed this book.'),
        );

      await expect(
        borrowingController.returnBook(bookId, { userId } as any),
      ).rejects.toThrow(BadRequestException);
      expect(borrowingService.returnBook).toHaveBeenCalledWith(bookId, userId);
    });
    it('should impose a penalty if the book is returned after more than 7 days', async () => {
      const borrowDate = new Date(
        new Date().getTime() - 8 * 24 * 60 * 60 * 1000,
      ); // 8 days ago
      const borrowedBook = {
        id: 1,
        bookId,
        memberId: userId,
        borrowDate,
        returnDate: null,
      };

      const updatedBorrowing = {
        ...borrowedBook,
        returnDate: new Date(),
      };

      jest
        .spyOn(borrowingService, 'returnBook')
        .mockResolvedValueOnce(updatedBorrowing as any);

      const result = await borrowingController.returnBook(bookId, {
        userId,
      } as any);

      expect(result.returnDate).toBeDefined();
      expect(result.returnDate).toEqual(updatedBorrowing.returnDate);
      expect(borrowingService.returnBook).toHaveBeenCalledWith(bookId, userId);
    });
  });
});
