import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/config/database/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BookService } from './book.service';

describe('BookService', () => {
  let service: BookService;
  let prismaService: PrismaService;

  const bookId = 1;
  const dto = {
    code: 'JK-45',
    title: 'Harry Potter',
    author: 'J.K Rowling',
    stock: 1,
  };

  const book = {
    id: bookId,
    ...dto,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookService,
        {
          provide: PrismaService,
          useValue: {
            book: {
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<BookService>(BookService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a book', async () => {
      jest
        .spyOn(prismaService.book, 'create')
        .mockResolvedValueOnce(book as any);

      const result = await service.create(dto);
      expect(result).toEqual(book);
    });

    it('should throw error if code already exist', async () => {
      jest.spyOn(prismaService.book, 'create').mockRejectedValueOnce({
        code: 'P2002',
      });

      await expect(service.create(dto)).rejects.toThrow(
        new BadRequestException('code already exist.'),
      );
    });
  });

  describe('list', () => {
    const query = {
      page: 1,
      limit: 10,
    };

    const books = [
      book,
      {
        id: 2,
        code: 'LOTR-11',
        title: 'Lord of the Rings',
        author: 'J.R.R. Tolkien',
        stock: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return a paginated list of books', async () => {
      jest
        .spyOn(prismaService.book, 'findMany')
        .mockResolvedValueOnce(books as any);
      jest.spyOn(prismaService.book, 'count').mockResolvedValueOnce(2);

      const result = await service.list(query);

      expect(result.data).toEqual(books);
      expect(result.totalDatas).toBe(2);
      expect(result.totalPages).toBe(1);
      expect(result.page).toBe(query.page);
      expect(result.limit).toBe(query.limit);
    });

    it('should throw a BadRequestException if something goes wrong', async () => {
      jest
        .spyOn(prismaService.book, 'findMany')
        .mockRejectedValueOnce(new BadRequestException('Something went wrong'));

      await expect(service.list(query)).rejects.toThrow(
        new BadRequestException('Something went wrong'),
      );
    });
  });

  describe('update', () => {
    it('should successfully update a book', async () => {
      jest
        .spyOn(prismaService.book, 'update')
        .mockResolvedValueOnce(book as any);

      const result = await service.update(dto, bookId);
      expect(result).toEqual(book);
    });

    it('should throw error if Book is not exist', async () => {
      jest.spyOn(prismaService.book, 'update').mockRejectedValueOnce({
        code: 'P2025',
      });

      await expect(service.update(dto, bookId)).rejects.toThrow(
        new NotFoundException('Book not found.'),
      );
    });
  });
});
