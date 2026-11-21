import type { Route } from '../router'
import { goalRoutes } from './goals'
import { meRoutes } from './me'
import { rewardRoutes } from './rewards'
import { scheduleRoutes } from './schedules'
import { statsRoutes } from './stats'
import { taskRoutes } from './tasks'

// Ticket 6 adds the flashcard routes here.
export const routes: Route[] = [
  ...meRoutes,
  ...goalRoutes,
  ...taskRoutes,
  ...rewardRoutes,
  ...statsRoutes,
  ...scheduleRoutes,
]
