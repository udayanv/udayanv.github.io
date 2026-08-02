import type { ProgressSnapshot } from '../progress'

export interface ProgressRepository {
  load(): ProgressSnapshot
  save(snapshot: ProgressSnapshot): void
}
