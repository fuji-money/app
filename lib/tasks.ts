export enum Tasks {
  Borrow = 'borrow',
  Multiply = 'multiply',
  Redeem = 'redeem',
  Topup = 'topup',
}

export const EnabledTasks: Record<string, boolean> = {
  [Tasks.Borrow]: true,
  [Tasks.Multiply]: false,
  [Tasks.Redeem]: true,
  [Tasks.Topup]: false,
}

export const LightningEnabledTasks: Record<string, boolean> = {
  [Tasks.Borrow]: true,
  [Tasks.Multiply]: false,
  [Tasks.Redeem]: false,
  [Tasks.Topup]: false,
}
