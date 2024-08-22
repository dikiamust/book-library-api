import { IsNotEmpty, IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookDto {
  @ApiProperty({ example: 'JK-45', description: 'Unique code for the book' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Harry Potter', description: 'Title of the book' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'J.K Rowling', description: 'Author of the book' })
  @IsString()
  @IsNotEmpty()
  author: string;

  @ApiProperty({ example: 10, description: 'Stock quantity of the book' })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  stock: number;
}
