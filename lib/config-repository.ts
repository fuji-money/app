export interface ConfigRepository {
  hasBeenEnabled(): Promise<boolean>
  setEnabled(): Promise<void>
  clear(): Promise<void>
}
