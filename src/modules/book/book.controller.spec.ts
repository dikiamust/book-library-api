import { Test, TestingModule } from '@nestjs/testing';
import { BookController } from './book.controller';
import { BookService } from './book.service';
import { CreateBookDto, QueryBookList } from './dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('BookController', () => {
  let controller: BookController;
  let service: BookService;

  const dto: CreateBookDto = {
    code: 'JK-45',
    title: 'Harry Potter',
    author: 'J.K Rowling',
    stock: 1,
  };
  const bookId = 1;
  const book = {
    id: bookId,
    ...dto,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const query: QueryBookList = {
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookController],
      providers: [
        {
          provide: BookService,
          useValue: {
            create: jest.fn(),
            list: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BookController>(BookController);
    service = module.get<BookService>(BookService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a book', async () => {
      jest.spyOn(service, 'create').mockResolvedValueOnce(book);

      const result = await controller.create(dto);

      expect(result).toEqual(book);
      expect(service.create).toHaveBeenCalledWith(dto);
    });

    it('should throw a BadRequestException if code already exists', async () => {
      jest.spyOn(service, 'create').mockImplementationOnce(() => {
        throw new BadRequestException('code already exist.');
      });

      try {
        await controller.create(dto);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe('code already exist.');
      }
    });
  });

  describe('list', () => {
    it('should return a paginated list of books', async () => {
      jest.spyOn(service, 'list').mockResolvedValueOnce({
        data: books,
        totalDatas: 2,
        totalPages: 1,
        page: query.page,
        limit: query.limit,
      });

      const result = await controller.list(query);

      expect(result.data).toEqual(books);
      expect(result.totalDatas).toBe(2);
      expect(result.totalPages).toBe(1);
      expect(result.page).toBe(query.page);
      expect(result.limit).toBe(query.limit);
      expect(service.list).toHaveBeenCalledWith(query);
    });

    it('should throw a BadRequestException if something goes wrong', async () => {
      jest
        .spyOn(service, 'list')
        .mockRejectedValueOnce(new BadRequestException('Something went wrong'));

      await expect(controller.list(query)).rejects.toThrow(
        new BadRequestException('Something went wrong'),
      );
    });
  });

  describe('update', () => {
    it('should successfully update a book', async () => {
      const updateDto = {
        id: bookId,
        code: 'JK-45',
        title: 'Harry Potter Update',
        author: 'J.K Rowling',
        stock: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(service, 'update').mockResolvedValueOnce(updateDto as any);

      const result = await controller.update(bookId, updateDto);

      expect(result).toEqual(updateDto);
      expect(service.update).toHaveBeenCalledWith(updateDto, bookId);
    });

    it('should throw a NotFoundException if the book does not exist', async () => {
      jest
        .spyOn(service, 'update')
        .mockRejectedValueOnce(new NotFoundException('Book not found.'));

      await expect(controller.update(bookId, dto)).rejects.toThrow(
        new NotFoundException('Book not found.'),
      );
    });

    it('should throw a BadRequestException if update fails with another error', async () => {
      jest
        .spyOn(service, 'update')
        .mockRejectedValueOnce(new BadRequestException('Update failed'));

      await expect(controller.update(bookId, dto)).rejects.toThrow(
        new BadRequestException('Update failed'),
      );
    });
  });
});
