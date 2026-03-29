import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { confirmCompany } from '../../src/utils/confirm-company.js';
import * as readline from 'node:readline';

vi.mock('node:readline');

describe('confirmCompany', () => {
  let rlMock: { question: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    rlMock = { question: vi.fn(), close: vi.fn() };
    vi.mocked(readline.createInterface).mockReturnValue(rlMock as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('--yes フラグが true の場合は確認なしで true を返す', async () => {
    const result = await confirmCompany('株式会社テスト', 123, true);
    expect(result).toBe(true);
    expect(rlMock.question).not.toHaveBeenCalled();
  });

  it('ユーザーが y を入力した場合は true を返す', async () => {
    rlMock.question.mockImplementation((_: string, cb: (ans: string) => void) => cb('y'));
    const result = await confirmCompany('株式会社テスト', 123, false);
    expect(result).toBe(true);
  });

  it('ユーザーが Y を入力した場合も true を返す', async () => {
    rlMock.question.mockImplementation((_: string, cb: (ans: string) => void) => cb('Y'));
    const result = await confirmCompany('株式会社テスト', 123, false);
    expect(result).toBe(true);
  });

  it('ユーザーが n を入力した場合は false を返す', async () => {
    rlMock.question.mockImplementation((_: string, cb: (ans: string) => void) => cb('n'));
    const result = await confirmCompany('株式会社テスト', 123, false);
    expect(result).toBe(false);
  });

  it('空エンターの場合は false を返す（デフォルト No）', async () => {
    rlMock.question.mockImplementation((_: string, cb: (ans: string) => void) => cb(''));
    const result = await confirmCompany('株式会社テスト', 123, false);
    expect(result).toBe(false);
  });
});
