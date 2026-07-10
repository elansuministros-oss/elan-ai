import { createDispatchContext } from './contextFactory.js';

export class Dispatcher {
  dispatch(input) {
    return createDispatchContext(input);
  }
}

export const dispatcher = new Dispatcher();
