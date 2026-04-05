import { jest } from '@jest/globals';

let createdElements = [];

jest.unstable_mockModule('ink', () => ({
  Box: jest.fn(({ children }) => children),
  Text: jest.fn(({ children }) => children),
}));

jest.unstable_mockModule('react', () => ({
  default: {
    createElement: jest.fn((type, props, ...children) => {
      createdElements.push({ type, props: props || {}, children });
      return null;
    }),
  },
}));

const { HelpOverlay } = await import('jestronaut/lib/ui/components/HelpOverlay.js');

function render(fn) {
  createdElements = [];
  fn();
  return createdElements;
}

describe('HelpOverlay', () => {
  it('renders a bordered box with cyan border', () => {
    const els = render(() => HelpOverlay({ rows: 24, columns: 80 }));
    expect(els.some(e => e.props.borderStyle === 'single' && e.props.borderColor === 'cyan')).toBe(true);
  });

  it('contains "Keybindings" title text', () => {
    const els = render(() => HelpOverlay({ rows: 24, columns: 80 }));
    const texts = els.filter(e => typeof e.children[0] === 'string').map(e => e.children[0]);
    expect(texts.some(t => t.includes('Keybindings'))).toBe(true);
  });

  it('includes navigation section keys', () => {
    const els = render(() => HelpOverlay({ rows: 24, columns: 80 }));
    const texts = els.filter(e => typeof e.children[0] === 'string').map(e => e.children[0]);
    const joined = texts.join(' ');
    expect(joined).toContain('Tab');
    expect(joined).toContain('Switch focus');
  });

  it('includes watch mode section with r key', () => {
    const els = render(() => HelpOverlay({ rows: 24, columns: 80 }));
    const texts = els.filter(e => typeof e.children[0] === 'string').map(e => e.children[0]);
    expect(texts.some(t => t.includes('Re-run failed'))).toBe(true);
  });

  it('caps width to 62 columns on wide terminals', () => {
    const els = render(() => HelpOverlay({ rows: 24, columns: 200 }));
    const borderedBoxes = els.filter(e => e.props.borderStyle === 'single');
    expect(borderedBoxes[0].props.width).toBe(62);
  });

  it('shrinks width on narrow terminals', () => {
    const els = render(() => HelpOverlay({ rows: 24, columns: 40 }));
    const borderedBoxes = els.filter(e => e.props.borderStyle === 'single');
    expect(borderedBoxes[0].props.width).toBe(36); // 40 - 4
  });

  it('shows close hint at the bottom', () => {
    const els = render(() => HelpOverlay({ rows: 24, columns: 80 }));
    const texts = els.filter(e => typeof e.children[0] === 'string').map(e => e.children[0]);
    expect(texts.some(t => t.includes('close'))).toBe(true);
  });
});
