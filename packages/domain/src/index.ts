export interface CounterState {
  readonly value: number;
}

export function incrementCounter(state: CounterState, amount: number): CounterState {
  return { value: state.value + amount };
}
