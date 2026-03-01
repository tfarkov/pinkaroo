import { parseQueryNum, parseQueryInt } from '../../utils/parse';

describe('parseQueryNum', () => {
  it('returns number for valid string', () => {
    expect(parseQueryNum('44.3894')).toBe(44.3894);
    expect(parseQueryNum('-79.69')).toBe(-79.69);
    expect(parseQueryNum('0')).toBe(0);
    expect(parseQueryNum('100')).toBe(100);
  });

  it('returns undefined for null, undefined, empty', () => {
    expect(parseQueryNum(null)).toBeUndefined();
    expect(parseQueryNum(undefined)).toBeUndefined();
    expect(parseQueryNum('')).toBeUndefined();
  });

  it('uses first element for string[]', () => {
    expect(parseQueryNum(['44', '55'])).toBe(44);
    expect(parseQueryNum(['-79.69'])).toBe(-79.69);
  });

  it('returns undefined for invalid string', () => {
    expect(parseQueryNum('abc')).toBeUndefined();
    expect(parseQueryNum('  ')).toBeUndefined();
  });
});

describe('parseQueryInt', () => {
  it('returns integer for valid string', () => {
    expect(parseQueryInt('0')).toBe(0);
    expect(parseQueryInt('1')).toBe(1);
    expect(parseQueryInt('20')).toBe(20);
    expect(parseQueryInt('-5')).toBe(-5);
  });

  it('returns undefined for null, undefined, empty', () => {
    expect(parseQueryInt(null)).toBeUndefined();
    expect(parseQueryInt(undefined)).toBeUndefined();
    expect(parseQueryInt('')).toBeUndefined();
  });

  it('uses first element for string[]', () => {
    expect(parseQueryInt(['3', '4'])).toBe(3);
  });

  it('returns undefined for invalid string', () => {
    expect(parseQueryInt('1.5')).toBe(1); // parseInt truncates
    expect(parseQueryInt('abc')).toBeUndefined();
  });
});
