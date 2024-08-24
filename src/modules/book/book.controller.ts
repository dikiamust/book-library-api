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
import { BookService } from './book.service';
import { CreateBookDto, QueryBookList } from './dto';
import { bookList, createBook } from './example-response';

@ApiTags('Book')
@Controller()
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
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard('jwt'))
  @Post('book')
  create(@Body() dto: CreateBookDto) {
    return this.bookService.create(dto);
  }

  @ApiOperation({
    description: `Endpoint to retrieve a list of all Books including the quantities. Books that are being borrowed are not counted.`,
  })
  @ApiOkResponse({
    description: 'Success Response',
    content: {
      'application/json': {
        example: bookList,
      },
    },
  })
  @Get('public/book')
  list(@Query() query: QueryBookList) {
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
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard('jwt'))
  @Put('book/:bookId')
  update(@Param('bookId') bookId: number, @Body() dto: CreateBookDto) {
    return this.bookService.update(dto, bookId);
  }
}
