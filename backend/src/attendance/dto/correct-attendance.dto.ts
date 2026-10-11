import { IsIn } from 'class-validator';

export class CorrectAttendanceDto {
  @IsIn(['PRESENT', 'ABSENT', 'LATE']) status!: 'PRESENT' | 'ABSENT' | 'LATE';
}
