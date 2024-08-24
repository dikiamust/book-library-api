import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { TokenAuthService } from './token-auth.service';
import { PrismaService } from 'src/config/database/prisma.service';
import { SigninDto, SignupDto } from '../dto';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let tokenAuthService: TokenAuthService;

  const signinDto: SigninDto = {
    email: 'john.doe@example.com',
    password: 'K*P&sD21',
    confirmPassword: 'K*P&sD21',
  };

  const signupDto: SignupDto = {
    name: 'John Doe',
    ...signinDto,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            member: {
              create: jest.fn(),
              count: jest.fn(),
              findFirst: jest.fn(),
            },
          },
        },
        {
          provide: TokenAuthService,
          useValue: {
            signToken: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    tokenAuthService = module.get<TokenAuthService>(TokenAuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should register a new user successfully', async () => {
      const bcryptGenSalt = jest.fn().mockResolvedValue('mockSalt');
      (bcrypt.genSalt as jest.Mock) = bcryptGenSalt;
      const bcryptHash = jest.fn().mockResolvedValue('mockHash');
      (bcrypt.hash as jest.Mock) = bcryptHash;

      jest.spyOn(prismaService.member, 'count').mockResolvedValueOnce(0);
      jest.spyOn(prismaService.member, 'create').mockResolvedValueOnce({
        id: 1,
        name: signupDto.name,
        email: signupDto.email,
      } as any);
      jest
        .spyOn(tokenAuthService, 'signToken')
        .mockResolvedValueOnce('mockToken');

      const result = await service.signup(signupDto);

      expect(bcrypt.genSalt).toHaveBeenCalledTimes(1);
      expect(bcrypt.hash).toHaveBeenCalledWith(signupDto.password, 'mockSalt');

      expect(prismaService.member.count).toHaveBeenCalledTimes(1);
      expect(prismaService.member.create).toHaveBeenCalledWith({
        data: {
          name: signupDto.name,
          code: 'M001',
          email: signupDto.email,
          password: 'mockHash',
          salt: 'mockSalt',
        },
      });
      expect(tokenAuthService.signToken).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        message: 'Registration successful.',
        token: 'mockToken',
      });

      (bcrypt.genSalt as jest.Mock).mockRestore();
      (bcrypt.hash as jest.Mock).mockRestore();
    });

    it('should throw an error if passwords do not match', async () => {
      const signupDtoWithMismatch = {
        ...signupDto,
        confirmPassword: 'differentPassword',
      };

      await expect(service.signup(signupDtoWithMismatch)).rejects.toThrow(
        new BadRequestException(
          'The password and confirmation password do not match.',
        ),
      );
    });

    it('should throw an error if email already exists', async () => {
      jest.spyOn(prismaService.member, 'count').mockResolvedValueOnce(1);
      jest.spyOn(prismaService.member, 'create').mockRejectedValueOnce({
        code: 'P2002',
      });

      await expect(service.signup(signupDto)).rejects.toThrow(
        new BadRequestException('email already exist.'),
      );
    });

    it('should throw a generic error if something goes wrong', async () => {
      jest.spyOn(prismaService.member, 'count').mockResolvedValueOnce(1);
      jest
        .spyOn(prismaService.member, 'create')
        .mockRejectedValueOnce(new BadRequestException('Something went wrong'));

      await expect(service.signup(signupDto)).rejects.toThrow(
        new BadRequestException('Something went wrong'),
      );
    });
  });

  describe('signin', () => {
    it('should sign in successfully', async () => {
      const mockUser = {
        id: 1,
        email: signinDto.email,
        password: 'hashedPassword',
      };

      jest
        .spyOn(prismaService.member, 'findFirst')
        .mockResolvedValueOnce(mockUser as any);

      const bcryptCompare = jest.fn().mockResolvedValue(true);
      (bcrypt.compare as jest.Mock) = bcryptCompare;

      jest
        .spyOn(tokenAuthService, 'signToken')
        .mockResolvedValueOnce('mockToken');

      const result = await service.signin(signinDto);

      expect(prismaService.member.findFirst).toHaveBeenCalledWith({
        where: { email: signinDto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        signinDto.password,
        mockUser.password,
      );
      expect(tokenAuthService.signToken).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        message: 'Login successful.',
        token: 'mockToken',
      });

      (bcrypt.compare as jest.Mock).mockRestore();
    });

    it('should throw an error if passwords do not match', async () => {
      const signinDtoWithMismatch = {
        ...signinDto,
        confirmPassword: 'differentPassword',
      };

      await expect(service.signin(signinDtoWithMismatch)).rejects.toThrow(
        new BadRequestException(
          'The password and confirmation password do not match.',
        ),
      );
    });

    it('should throw a ForbiddenException if user is not found', async () => {
      jest.spyOn(prismaService.member, 'findFirst').mockResolvedValueOnce(null);

      await expect(service.signin(signinDto)).rejects.toThrow(
        new ForbiddenException(
          'The email or password you provided is incorrect.',
        ),
      );
    });

    it('should throw a ForbiddenException if password does not match', async () => {
      const mockUser = {
        id: 1,
        email: signinDto.email,
        password: 'hashedPassword',
      };

      jest
        .spyOn(prismaService.member, 'findFirst')
        .mockResolvedValueOnce(mockUser as any);
      const bcryptCompare = jest.fn().mockResolvedValue(false);
      (bcrypt.compare as jest.Mock) = bcryptCompare;

      await expect(service.signin(signinDto)).rejects.toThrow(
        new ForbiddenException(
          'The email or password you provided is incorrect.',
        ),
      );

      (bcrypt.compare as jest.Mock).mockRestore();
    });

    it('should throw a BadRequestException if an error occurs', async () => {
      jest
        .spyOn(prismaService.member, 'findFirst')
        .mockRejectedValueOnce(new BadRequestException('Something went wrong'));

      await expect(service.signin(signinDto)).rejects.toThrow(
        new BadRequestException('Something went wrong'),
      );
    });
  });
});
