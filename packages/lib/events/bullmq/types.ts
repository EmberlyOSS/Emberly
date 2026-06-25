import type { Job } from 'bullmq'
import type { EventPayload, EventType } from '@/packages/types/events'

export type HandlerFn<T extends EventType = EventType> = (
  payload: EventPayload<T>,
  job: Job
) => Promise<void> | void

export type HandlerMap = {
  [K in EventType]?: ((
    payload: EventPayload<K>,
    job: Job
  ) => Promise<void> | void)[]
}

type AnyHandlerFn = (payload: any, job: Job) => Promise<void> | void

export function mergeHandlerMaps(
  maps: HandlerMap[]
): Map<EventType, AnyHandlerFn[]> {
  const merged = new Map<EventType, AnyHandlerFn[]>()
  for (const map of maps) {
    for (const [type, fns] of Object.entries(map) as [
      EventType,
      AnyHandlerFn[],
    ][]) {
      if (!fns) continue
      const existing = merged.get(type) ?? []
      merged.set(type, [...existing, ...fns])
    }
  }
  return merged
}
