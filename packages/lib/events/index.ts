export { emit, schedule, eventQueue } from './bullmq/queue'
export * from '@/packages/types/events'

import { emit, schedule } from './bullmq/queue'

export const events = { emit, schedule }
export default events
