import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/config/database/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { MemberService } from './member.service';

describe('MemberService', () => {
  let service: MemberService;
  let prismaService: PrismaService;

  const memberId = 1;
  const query = {
    page: 1,
    limit: 10,
  };

  const members = [
    {
      id: memberId,
      name: 'John Doe',
      email: 'john.doe@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
      borrowings: [
        {
          id: 1,
          bookId: 1,
          memberId: memberId,
          borrowDate: new Date(),
          returnDate: null,
          book: {
            id: 1,
            code: 'JK-45',
            title: 'Harry Potter',
            author: 'J.K Rowling',
            stock: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberService,
        {
          provide: PrismaService,
          useValue: {
            member: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<MemberService>(MemberService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return a paginated list of members with their borrowed books', async () => {
      jest
        .spyOn(prismaService.member, 'findMany')
        .mockResolvedValueOnce(members as any);
      jest.spyOn(prismaService.member, 'count').mockResolvedValueOnce(1);

      const result = await service.list(query);

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
          id: memberId,
          name: 'John Doe',
          email: 'john.doe@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
          borrowings: [],
        },
      ];

      jest
        .spyOn(prismaService.member, 'findMany')
        .mockResolvedValueOnce(membersWithoutBorrowings as any);
      jest.spyOn(prismaService.member, 'count').mockResolvedValueOnce(1);

      const result = await service.list(query);

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
        .spyOn(prismaService.member, 'findMany')
        .mockRejectedValueOnce(new BadRequestException('Something went wrong'));

      await expect(service.list(query)).rejects.toThrow(
        new BadRequestException('Something went wrong'),
      );
    });
  });
});
