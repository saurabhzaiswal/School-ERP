import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export const uuid = z.uuid();
export const dateOnly = z.iso
  .date()
  .transform((value) => new Date(`${value}T00:00:00.000Z`));
export const grade = z.enum([
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
]);
export const section = z.enum(['A', 'B', 'C', 'D']);
export const gender = z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']);
export const contactEmail = z
  .string()
  .trim()
  .email()
  .max(255)
  .transform((value) => value.toLowerCase())
  .nullable()
  .optional();
export const phoneNumber = z
  .string()
  .trim()
  .regex(
    /^\+[1-9]\d{6,14}$/,
    'Use an international phone number such as +919876543210',
  )
  .nullable()
  .optional();
export const pageQuery = z.coerce.number().int().min(1).default(1);
export const limitQuery = z.coerce.number().int().min(1).max(100).default(20);
export const perPageQuery = z.coerce.number().int().min(1).max(100).optional();
export function pageSize(query: { per_page?: number; limit?: number }) {
  return query.per_page ?? query.limit ?? 20;
}

export function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new BadRequestException(
      result.error.issues.map(
        (issue) => `${issue.path.join('.') || 'value'}: ${issue.message}`,
      ),
    );
  return result.data;
}
