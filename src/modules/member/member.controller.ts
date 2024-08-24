import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MemberService } from './member.service';
import { QueryMemberList } from './dto';
import { memberList } from './example-response';

@ApiTags('Member')
@Controller()
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @ApiOperation({
    description: `Endpoint to retrieve a list of all members along with the number of books currently being borrowed by each member.`,
  })
  @ApiOkResponse({
    description: 'Success Response',
    content: {
      'application/json': {
        example: memberList,
      },
    },
  })
  @Get('public/member')
  list(@Query() query: QueryMemberList) {
    return this.memberService.list(query);
  }
}
