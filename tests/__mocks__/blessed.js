'use strict';

// Minimal blessed mock — prevents any terminal I/O while keeping the API shape
// intact enough for production code to run without errors.

function makeWidget() {
  return {
    setContent: jest.fn(),
    setItems: jest.fn(),
    setLabel: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    setFront: jest.fn(),
    scroll: jest.fn(),
    scrollTo: jest.fn(),
    select: jest.fn(),
    append: jest.fn(),
    render: jest.fn(),
    style: { border: { fg: 'white' } },
  };
}

module.exports = {
  screen: jest.fn(() => ({
    ...makeWidget(),
    key: jest.fn(),
    realloc: jest.fn(),
    destroy: jest.fn(),
    width: 80,
  })),
  box: jest.fn(() => makeWidget()),
  list: jest.fn(() => makeWidget()),
  text: jest.fn(() => makeWidget()),
  scrollablebox: jest.fn(() => makeWidget()),
  textarea: jest.fn(() => makeWidget()),
};
