import { describe, expect, it } from 'vitest';
import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from './dto/login.dto.js';

describe('login DTO', () => {
  it('requires a valid email and password', () => {
    expect(
      validateSync(plainToInstance(LoginDto, { email: 'bad', password: '' }))
        .length,
    ).toBe(2);
    expect(
      validateSync(
        plainToInstance(LoginDto, {
          email: 'admin@school.test',
          password: 'secret',
        }),
      ),
    ).toHaveLength(0);
  });
});
