import { EventEmitter } from 'events';
import { createState, resetState } from '../state.js';

export class JestronautStore extends EventEmitter {
  constructor() {
    super();
    this.state = createState();
  }

  reset() {
    resetState(this.state);
    this.notify();
  }

  notify() {
    this.emit('update', this.state);
  }
}
