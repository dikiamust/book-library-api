import { Controller, Param, Post, Put, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/decorators';
import { IUserData } from 'src/guards/strategy/interface/user-data.interface';
import { BorrowingService } from './borrowing.service';
import { createBorrowing, createReturnBorrowing } from './example-response';

@ApiTags('Borrowing')
@ApiBearerAuth('authorization')
@UseGuards(AuthGuard('jwt'))
@Controller('borrowing')
export class BorrowingController {
  constructor(private readonly borrowingService: BorrowingService) {}

  @ApiOperation({
    description: `Endpoint for borrowing a Book.`,
  })
  @ApiOkResponse({
    description: 'Success Response',
    content: {
      'application/json': {
        example: createBorrowing,
      },
    },
  })
  @Post(':bookId')
  borrowBook(@Param('bookId') bookId: number, @User() user: IUserData) {
    return this.borrowingService.borrowBook(bookId, user.userId);
  }

  @ApiOperation({
    description: `Endpoint for returning a Book.`,
  })
  @ApiOkResponse({
    description: 'Success Response',
    content: {
      'application/json': {
        example: createReturnBorrowing,
      },
    },
  })
  @Put(':bookId')
  returnBook(@Param('bookId') bookId: number, @User() user: IUserData) {
    return this.borrowingService.returnBook(bookId, user.userId);
  }
}
