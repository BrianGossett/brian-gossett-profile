// Shapes returned by the to-do API (see api/README.md).

export type Size = 'small' | 'medium' | 'large'
export type Feel = 'energized' | 'neutral' | 'drained'
export type Period = 'week' | 'month' | 'year'

export interface Task {
  id: string
  kind: 'task' | 'daily'
  title: string
  size: Size
  why: string | null
  goalId: string | null
  dueDate: string | null
  status: 'open' | 'done'
  completedDate: string | null
}

export interface TodayDaily extends Task {
  doneToday: boolean
  feel: Feel | null
  streak: { current: number; longest: number }
}

export interface TodayTask extends Task {
  feel: Feel | null
}

export interface TodayData {
  date: string
  timezone: string
  balance: number
  earnedToday: number
  dailies: TodayDaily[]
  tasks: TodayTask[]
  oneMore?: { available: boolean }
}

export interface Award {
  reason: 'task' | 'daily' | 'streak-week' | 'streak-month' | 'one-more'
  amount: number
}

export interface CompleteResult {
  id: string
  points: number
  awards: Award[]
  streak: { current: number; longest: number } | null
  balance: number
}

export interface Goal {
  id: string
  name: string
  why: string | null
}

export interface Reward {
  id: string
  name: string
  cost: number
}

export interface Summary {
  period: Period
  from: string
  to: string
  earned: number
  streakBonuses: number
  spent: number
  completions: number
  byGoal: { goalId: string | null; completions: number; points: number }[]
  feelings?: Record<Feel, number>
  draining?: { itemId: string; title: string; count: number }[]
}

export interface HeatmapDay {
  date: string
  completions: number
  points: number
}

export interface Heatmap {
  from: string
  to: string
  days: HeatmapDay[]
}

export interface RoutineItem {
  title: string
  size: Size
}

export interface Routine {
  id: string
  name: string
  items: RoutineItem[]
}

export interface Profile {
  name: string | null
  email: string | null
  points: number
  timezone: string
}
