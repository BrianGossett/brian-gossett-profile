import type { Route } from '../router'
import { deckRoutes } from './decks'
import { goalRoutes } from './goals'
import { importRoutes } from './import'
import { meRoutes } from './me'
import { progressRoutes } from './progress'
import { rewardRoutes } from './rewards'
import { scheduleRoutes } from './schedules'
import { statsRoutes } from './stats'
import { taskRoutes } from './tasks'

export const routes: Route[] = [
  ...meRoutes,
  ...goalRoutes,
  ...taskRoutes,
  ...rewardRoutes,
  ...statsRoutes,
  ...scheduleRoutes,
  ...deckRoutes,
  ...progressRoutes,
  ...importRoutes,
]
