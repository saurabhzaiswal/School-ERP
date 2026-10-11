import { IsDateString, IsIn, IsUUID } from 'class-validator';

export class RecordAttendanceDto {
  @IsUUID() studentId!: string;
  @IsDateString() date!: string;
  @IsIn(['PRESENT', 'ABSENT', 'LATE']) status!: 'PRESENT' | 'ABSENT' | 'LATE';
}
