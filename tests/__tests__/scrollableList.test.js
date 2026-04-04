import { jest } from '@jest/globals';

jest.unstable_mockModule('ink', () => ({
  Box: jest.fn(),
  Text: jest.fn(),
}));

jest.unstable_mockModule('react', () => ({
  default: { createElement: jest.fn(() => null) },
}));

const { computeScrollOffset } = await import('jestronaut/lib/ui/components/ScrollableList.js');

// computeScrollOffset(selectedIndex, visibleHeight, totalItems) → scrollOffset
// Keeps the selected item centered in the visible window where possible.

describe('computeScrollOffset', () => {
  it('returns 0 when total items fit within visible height', () => {
    expect(computeScrollOffset(3, 10, 5)).toBe(0);
  });

  it('returns 0 when selectedIndex is near the top', () => {
    expect(computeScrollOffset(0, 10, 20)).toBe(0);
    expect(computeScrollOffset(4, 10, 20)).toBe(0);
  });

  it('centers the selection when in the middle of a long list', () => {
    // selectedIndex=10, visibleHeight=10, floor(10/2)=5 → offset = max(0, 10-5) = 5
    expect(computeScrollOffset(10, 10, 30)).toBe(5);
  });

  it('caps offset so last item is still reachable', () => {
    // totalItems=15, visibleHeight=10, maxOffset=5
    // selectedIndex=14 → ideal offset = 14-5=9, capped to 5
    expect(computeScrollOffset(14, 10, 15)).toBe(5);
  });

  it('returns 0 for empty list', () => {
    expect(computeScrollOffset(0, 10, 0)).toBe(0);
  });

  it('returns 0 when visibleHeight is 0', () => {
    expect(computeScrollOffset(5, 0, 20)).toBe(0);
  });

  it('returns 0 when selectedIndex is -1 (no selection)', () => {
    // -1 - floor(10/2) = -6, max(0, -6) = 0
    expect(computeScrollOffset(-1, 10, 20)).toBe(0);
  });

  it('never returns a negative offset', () => {
    expect(computeScrollOffset(0, 10, 100)).toBeGreaterThanOrEqual(0);
    expect(computeScrollOffset(-5, 10, 100)).toBeGreaterThanOrEqual(0);
  });

  it('scroll offset increases as selection moves deeper into list', () => {
    const off1 = computeScrollOffset(10, 10, 50);
    const off2 = computeScrollOffset(20, 10, 50);
    const off3 = computeScrollOffset(30, 10, 50);
    expect(off1).toBeLessThan(off2);
    expect(off2).toBeLessThan(off3);
  });

  it('visible window covers the selected item', () => {
    for (const sel of [0, 5, 15, 25, 39]) {
      const offset = computeScrollOffset(sel, 10, 40);
      expect(sel).toBeGreaterThanOrEqual(offset);
      expect(sel).toBeLessThan(offset + 10);
    }
  });
});
