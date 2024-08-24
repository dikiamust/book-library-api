import { Test, TestingModule } from '@nestjs/testing';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { QueryMemberList } from './dto';
import { BadRequestException } from '@nestjs/common';

describe('MemberController', () => {
  let controller: MemberController;
  let service: MemberService;

  const query: QueryMemberList = {
    page: 1,
    limit: 10,
  };

  const members = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
      borrowings: [
        {
          id: 1,
          bookId: 1,
          memberId: 1,
          borrowDate: new Date(),
          returnDate: null,
          book: {
            id: 1,
            code: 'JK-45',
            title: 'Harry Potter',
            author: 'J.K. Rowling',
            stock: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ],
      borrowedBooksCount: 1,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MemberController],
      providers: [
        {
          provide: MemberService,
          useValue: {
            list: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MemberController>(MemberController);
    service = module.get<MemberService>(MemberService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return a paginated list of members with their borrowed books', async () => {
      jest.spyOn(service, 'list').mockResolvedValueOnce({
        data: [
          {
            id: members[0].id,
            name: members[0].name,
            email: members[0].email,
            createdAt: members[0].createdAt,
            updatedAt: members[0].updatedAt,
            borrowedBooks: members[0].borrowings.map(
              (borrowing) => borrowing.book,
            ),
            borrowedBooksCount: members[0].borrowings.length,
          },
        ],
        totalDatas: 1,
        totalPages: 1,
        page: query.page,
        limit: query.limit,
      } as any);

      const result = await controller.list(query);

      expect(result.data).toEqual([
        {
          id: members[0].id,
          name: members[0].name,
          email: members[0].email,
          createdAt: members[0].createdAt,
          updatedAt: members[0].updatedAt,
          borrowedBooks: members[0].borrowings.map(
            (borrowing) => borrowing.book,
          ),
          borrowedBooksCount: members[0].borrowings.length,
        },
      ]);
      expect(result.totalDatas).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.page).toBe(query.page);
      expect(result.limit).toBe(query.limit);
    });

    it('should return members without borrowed books if none exist', async () => {
      const membersWithoutBorrowings = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john.doe@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
          borrowings: [],
        },
      ];

      jest.spyOn(service, 'list').mockResolvedValueOnce({
        data: [
          {
            id: membersWithoutBorrowings[0].id,
            name: membersWithoutBorrowings[0].name,
            email: membersWithoutBorrowings[0].email,
            createdAt: membersWithoutBorrowings[0].createdAt,
            updatedAt: membersWithoutBorrowings[0].updatedAt,
            borrowedBooks: [],
            borrowedBooksCount: 0,
          },
        ],
        totalDatas: 1,
        totalPages: 1,
        page: query.page,
        limit: query.limit,
      } as any);

      const result = await controller.list(query);

      expect(result.data).toEqual([
        {
          id: membersWithoutBorrowings[0].id,
          name: membersWithoutBorrowings[0].name,
          email: membersWithoutBorrowings[0].email,
          createdAt: membersWithoutBorrowings[0].createdAt,
          updatedAt: membersWithoutBorrowings[0].updatedAt,
          borrowedBooks: [],
          borrowedBooksCount: 0,
        },
      ]);
      expect(result.totalDatas).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.page).toBe(query.page);
      expect(result.limit).toBe(query.limit);
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
});
