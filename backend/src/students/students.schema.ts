import { z } from 'zod';

import {
  grade,
  section,
  pageQuery,
  limitQuery,
  perPageQuery,
  gender,
  contactEmail,
  phoneNumber,
} from '../validation.js';

// Base student fields
const studentBaseSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    gender: gender.nullable().optional(),
    email: contactEmail,
    phoneNumber,
    grade,
    section,
    guardianName: z.string().trim().min(2).max(100),
    active: z.boolean(),
    feeStatus: z.enum(['PAID', 'PENDING', 'PARTIALLY_PAID']),
    amountDue: z.coerce
      .number()
      .min(0)
      .max(99999999)
      .refine(
        (v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-8,
        'Use at most two decimal places',
      ),
  })
  .strict();

// Create student validation
export const studentSchema = studentBaseSchema.extend({
  active: z.boolean().default(true),
  feeStatus: z.enum(['PAID', 'PENDING', 'PARTIALLY_PAID']).default('PAID'),
  amountDue: studentBaseSchema.shape.amountDue.default(0),
}).refine(
  (v) => (v.feeStatus === 'PAID' ? v.amountDue === 0 : v.amountDue > 0),
  {
    message:
      'Paid requires zero due; outstanding statuses require a positive due',
    path: ['amountDue'],
  },
);

// Update student validation
export const updateStudentSchema = studentBaseSchema
  .partial()
  .refine(
    (v) => {
      // Validate fee fields together when both supplied
      if (v.feeStatus === undefined || v.amountDue === undefined) {
        return true;
      }

      return v.feeStatus === 'PAID'
        ? v.amountDue === 0
        : v.amountDue > 0;
    },
    {
      message: 'Invalid fee status and amount due combination',
      path: ['amountDue'],
    },
  );

// List validation
export const listSchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    grade: grade.optional(),
    section: section.optional(),
    page: pageQuery,
    per_page: perPageQuery,
    limit: limitQuery.optional(),
  })
  .strict();
