export interface ConfigRepository {
  isEnabled(): Promise<boolean>
  setEnabled(): Promise<void>
  clear(): Promise<void>
}
