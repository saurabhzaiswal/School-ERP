import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsEmail,
  Matches,
  MaxLength,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateStudentDto {
  @IsString() @Length(2, 100) name!: string;
  @IsOptional()
  @IsIn(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'])
  gender?: string | null;
  @IsOptional() @IsEmail() @MaxLength(255) email?: string | null;
  @IsOptional() @Matches(/^\+[1-9]\d{6,14}$/) phoneNumber?: string | null;
  @IsIn(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'])
  grade!: string;
  @IsIn(['A', 'B', 'C', 'D']) section!: string;
  @IsString() @Length(2, 100) guardianName!: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsIn(['PAID', 'PENDING', 'PARTIALLY_PAID']) feeStatus?: string;
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999999)
  amountDue?: number;
}
