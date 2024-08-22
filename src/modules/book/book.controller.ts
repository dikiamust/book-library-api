import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/decorators';
import { IUserData } from 'src/guards/strategy/interface/user-data.interface';
import { BookService } from './book.service';
import { CreateBookDto, QueryBookList } from './dto';
import { bookList, createBook } from './example-response';

@ApiTags('Book')
@ApiBearerAuth('authorization')
@UseGuards(AuthGuard('jwt'))
@Controller('book')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @ApiOperation({
    description: `Endpoint for creating a new Book.`,
  })
  @ApiOkResponse({
    description: 'Success Response',
    content: {
      'application/json': {
        example: createBook,
      },
    },
  })
  @Post()
  create(@Body() dto: CreateBookDto) {
    return this.bookService.create(dto);
  }

  @ApiOperation({
    description: `Endpoint to retrieve a list of all Books.`,
  })
  @ApiOkResponse({
    description: 'Success Response',
    content: {
      'application/json': {
        example: bookList,
      },
    },
  })
  @Get()
  list(@User() user: IUserData, @Query() query: QueryBookList) {
    return this.bookService.list(query);
  }

  @ApiOperation({
    description: `Endpoint for updating a Book.`,
  })
  @ApiOkResponse({
    description: 'Success Response',
    content: {
      'application/json': {
        example: createBook,
      },
    },
  })
  @Put(':bookId')
  update(
    @Param('bookId') bookId: number,
    @Body() dto: CreateBookDto,
    @User() user: IUserData,
  ) {
    return this.bookService.update(dto, bookId);
  }
}
