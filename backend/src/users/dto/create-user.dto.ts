import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Matches,
  ValidateNested,
  ArrayMaxSize,
} from 'class-validator';

export class AssignmentDto {
  @IsIn(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'])
  grade!: string;
  @IsIn(['A', 'B', 'C', 'D']) section!: string;
}
export class CreateUserDto {
  @IsString() @Length(2, 100) name!: string;
  @IsEmail() @MaxLength(255) email!: string;
  @IsOptional()
  @IsIn(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'])
  gender?: string | null;
  @IsOptional() @Matches(/^\+[1-9]\d{6,14}$/) phoneNumber?: string | null;
  @IsIn(['ADMIN', 'TEACHER']) role!: 'ADMIN' | 'TEACHER';
  @IsOptional() @IsBoolean() active?: boolean;
  @IsString() @Length(10, 100) password!: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(48)
  @ValidateNested({ each: true })
  @Type(() => AssignmentDto)
  assignments?: AssignmentDto[];
}
