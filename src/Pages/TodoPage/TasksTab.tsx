import { useState } from 'react'
import { Box, Flex, Text, VStack } from '@chakra-ui/react'
import { api } from '../../api/client'
import { colors } from '../../Theme'
import { groupByGoal } from './todoLogic'
import type { Goal, Size, Task } from './types'
import { Button, Card, ConfirmButton, ErrorNote, Loaded, Muted, SectionTitle, SizeChip, SizePicker, TextField } from './ui'
import { selectStyle } from './styles'
import { useAction, useLoad } from './useLoad'

interface TaskDraft {
  title: string
  size: Size
  repeat: boolean
  goalId: string
  why: string
  dueDate: string
}

const emptyDraft: TaskDraft = { title: '', size: 'small', repeat: false, goalId: '', why: '', dueDate: '' }

/** The fields of a task or daily. `existing` hides the once/every-day choice, which can't change later. */
const TaskForm = ({ initial, existing, goals, busy, submitLabel, onSave, onCancel }: {
  initial: TaskDraft
  existing?: boolean
  goals: Goal[]
  busy: boolean
  submitLabel: string
  onSave: (draft: TaskDraft) => void
  onCancel?: () => void
}) => {
  const [draft, setDraft] = useState(initial)
  const set = (change: Partial<TaskDraft>) => setDraft(d => ({ ...d, ...change }))
  return (
    <VStack as="form" align="stretch" gap={3} onSubmit={e => { e.preventDefault(); if (draft.title.trim()) onSave(draft) }}>
      <TextField label="Title" value={draft.title} maxLength={200} onChange={e => set({ title: e.target.value })} />
      <Flex gap={2} align="center" wrap="wrap">
        <SizePicker value={draft.size} onChange={size => set({ size })} />
        {!existing && (
          <Button variant={draft.repeat ? 'outline' : 'ghost'} aria-pressed={draft.repeat} onClick={() => set({ repeat: !draft.repeat })}>
            {draft.repeat ? '↻ Every day' : '↻ Once'}
          </Button>
        )}
      </Flex>
      <select aria-label="Goal" style={selectStyle} value={draft.goalId} onChange={e => set({ goalId: e.target.value })}>
        <option value="">No goal</option>
        {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
      </select>
      <TextField label="Why it matters (optional)" value={draft.why} maxLength={200} onChange={e => set({ why: e.target.value })} />
      {!draft.repeat && (
        <Flex align="center" gap={2}>
          <Muted as="label" {...({ htmlFor: 'task-due' } as object)}>Due</Muted>
          <input id="task-due" type="date" style={selectStyle} value={draft.dueDate} onChange={e => set({ dueDate: e.target.value })} />
        </Flex>
      )}
      <Flex gap={2} justify="flex-end">
        {onCancel && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button variant="solid" type="submit" disabled={busy || !draft.title.trim()}>{submitLabel}</Button>
      </Flex>
    </VStack>
  )
}

const GoalForm = ({ initial, busy, submitLabel, onSave, onCancel }: {
  initial: { name: string; why: string }
  busy: boolean
  submitLabel: string
  onSave: (goal: { name: string; why: string }) => void
  onCancel: () => void
}) => {
  const [name, setName] = useState(initial.name)
  const [why, setWhy] = useState(initial.why)
  return (
    <VStack as="form" align="stretch" gap={3} onSubmit={e => { e.preventDefault(); if (name.trim()) onSave({ name, why }) }}>
      <TextField label="Goal name" value={name} maxLength={200} onChange={e => setName(e.target.value)} />
      <TextField label="Why it matters (optional)" value={why} maxLength={200} onChange={e => setWhy(e.target.value)} />
      <Flex gap={2} justify="flex-end">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="solid" type="submit" disabled={busy || !name.trim()}>{submitLabel}</Button>
      </Flex>
    </VStack>
  )
}

const toBody = (draft: TaskDraft) => ({
  title: draft.title,
  size: draft.size,
  goalId: draft.goalId || null,
  why: draft.why || null,
  dueDate: draft.repeat ? null : draft.dueDate || null,
})

const TasksTab = () => {
  const tasks = useLoad<{ tasks: Task[]; dailies: Task[] }>('/tasks')
  const goals = useLoad<{ goals: Goal[] }>('/goals')
  const action = useAction()
  // 'new-task', 'new-goal', a task ID or `goal:<id>`: the one form that is open.
  const [editing, setEditing] = useState<string | null>(null)
  const [showFinished, setShowFinished] = useState(false)

  const change = (request: () => Promise<unknown>, reloadGoals = false) => action.run(async () => {
    await request()
    setEditing(null)
    tasks.reload()
    if (reloadGoals) goals.reload()
  })

  const goalList = goals.data?.goals ?? []
  const all = tasks.data ? [...tasks.data.dailies, ...tasks.data.tasks] : []
  const finished = all.filter(t => t.status === 'done')
  const shown = all.filter(t => showFinished || t.status !== 'done')

  return (
    <Loaded loading={tasks.loading || goals.loading} error={tasks.error ?? goals.error} hasData={!!tasks.data && !!goals.data}>
      <VStack align="stretch" gap={4}>
        <Flex gap={2} wrap="wrap">
          <Button variant="solid" onClick={() => setEditing('new-task')}>+ Task</Button>
          <Button onClick={() => setEditing('new-goal')}>+ Goal</Button>
        </Flex>
        <ErrorNote>{action.error}</ErrorNote>

        {editing === 'new-task' && (
          <Card aria-label="New task" role="region">
            <TaskForm
              initial={emptyDraft}
              goals={goalList}
              busy={action.busy}
              submitLabel="Add task"
              onCancel={() => setEditing(null)}
              onSave={d => void change(() => api('/tasks', { method: 'POST', body: { ...toBody(d), repeat: d.repeat ? 'daily' : 'none' } }))}
            />
          </Card>
        )}
        {editing === 'new-goal' && (
          <Card aria-label="New goal" role="region">
            <GoalForm
              initial={{ name: '', why: '' }}
              busy={action.busy}
              submitLabel="Add goal"
              onCancel={() => setEditing(null)}
              onSave={g => void change(() => api('/goals', { method: 'POST', body: { name: g.name, why: g.why || null } }), true)}
            />
          </Card>
        )}

        {groupByGoal(shown, goalList).map(({ goal, items }) => {
          if (!goal && items.length === 0 && goalList.length > 0) return null
          const goalKey = goal ? `goal:${goal.id}` : ''
          return (
            <Box key={goal?.id ?? 'none'} as="section" aria-label={goal?.name ?? 'No goal'}>
              <Flex align="center" gap={2}>
                <Box flex="1" minW={0}>
                  <SectionTitle>{goal?.name ?? 'No goal'}</SectionTitle>
                  {goal?.why && <Muted>Why: {goal.why}</Muted>}
                </Box>
                {goal && editing !== goalKey && <Button variant="ghost" aria-label={`Edit goal ${goal.name}`} onClick={() => setEditing(goalKey)}>Edit</Button>}
              </Flex>
              <Card py={2} mt={2}>
                {goal && editing === goalKey && (
                  <VStack align="stretch" gap={2} py={2}>
                    <GoalForm
                      initial={{ name: goal.name, why: goal.why ?? '' }}
                      busy={action.busy}
                      submitLabel="Save"
                      onCancel={() => setEditing(null)}
                      onSave={g => void change(() => api(`/goals/${goal.id}`, { method: 'PATCH', body: { name: g.name, why: g.why || null } }), true)}
                    />
                    <ConfirmButton
                      label="Delete goal"
                      confirm="Delete goal (its tasks are kept)"
                      disabled={action.busy}
                      onConfirm={() => void change(() => api(`/goals/${goal.id}`, { method: 'DELETE' }), true)}
                    />
                  </VStack>
                )}
                {items.length === 0 && <Muted py={2}>Nothing here yet.</Muted>}
                <Box as="ul" m={0} p={0}>
                  {items.map(item => (
                    <Box as="li" key={item.id} listStyleType="none" py={2} borderBottom={`1px solid ${colors.border}`} _last={{ borderBottom: 'none' }}>
                      {editing === item.id ? (
                        <VStack align="stretch" gap={2}>
                          <TaskForm
                            existing
                            initial={{ title: item.title, size: item.size, repeat: item.kind === 'daily', goalId: item.goalId ?? '', why: item.why ?? '', dueDate: item.dueDate ?? '' }}
                            goals={goalList}
                            busy={action.busy}
                            submitLabel="Save"
                            onCancel={() => setEditing(null)}
                            onSave={d => void change(() => api(`/tasks/${item.id}`, { method: 'PATCH', body: toBody(d) }))}
                          />
                          <ConfirmButton
                            label="Delete"
                            confirm={item.kind === 'daily' ? 'Delete daily and its streak' : 'Delete task'}
                            disabled={action.busy}
                            onConfirm={() => void change(() => api(`/tasks/${item.id}`, { method: 'DELETE' }))}
                          />
                        </VStack>
                      ) : (
                        <Flex align="center" gap={3}>
                          <Box flex="1" minW={0}>
                            <Text color={item.status === 'done' ? colors.textMuted : colors.textPrimary} textDecoration={item.status === 'done' ? 'line-through' : 'none'} wordBreak="break-word">
                              {item.title}
                            </Text>
                            <Muted fontSize="xs">
                              {item.kind === 'daily' ? '↻ Every day' : item.status === 'done' ? 'Finished' : 'Once'}
                              {item.why && ` · ${item.why}`}
                            </Muted>
                          </Box>
                          <SizeChip size={item.size} />
                          <Button variant="ghost" aria-label={`Edit ${item.title}`} onClick={() => setEditing(item.id)}>Edit</Button>
                        </Flex>
                      )}
                    </Box>
                  ))}
                </Box>
              </Card>
            </Box>
          )
        })}

        {finished.length > 0 && (
          <Button variant="ghost" onClick={() => setShowFinished(s => !s)}>
            {showFinished ? 'Hide finished tasks' : `Show finished tasks (${finished.length})`}
          </Button>
        )}
      </VStack>
    </Loaded>
  )
}

export default TasksTab
