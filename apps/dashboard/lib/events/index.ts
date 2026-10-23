export { emit, schedule, getEventQueue } from './bullmq/queue'
export * from '@/types/events'

import { emit, schedule } from './bullmq/queue'

export const events = { emit, schedule }
export default events
