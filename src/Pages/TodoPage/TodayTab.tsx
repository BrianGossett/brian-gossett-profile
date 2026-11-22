import { useState } from 'react'
import { Box, Flex, Text, VStack } from '@chakra-ui/react'
import { api } from '../../api/client'
import { colors } from '../../Theme'
import { FEELS, awardMessage, formatDay, formatShortDay } from './todoLogic'
import type { CompleteResult, Feel, Size, TodayDaily, TodayData, TodayTask } from './types'
import { Button, Card, ErrorNote, Loaded, Muted, SectionTitle, SizeChip, SizePicker, TextField, flame, success } from './ui'
import { useAction, useLoad } from './useLoad'

interface RowProps {
  item: TodayDaily | TodayTask
  done: boolean
  feel: Feel | null
  earned?: string
  open: boolean
  busy: boolean
  onToggle: () => void
  onComplete: () => void
  onFeel: (feel: Feel | null) => void
}

const Row = ({ item, done, feel, earned, open, busy, onToggle, onComplete, onFeel }: RowProps) => {
  const streak = 'streak' in item ? item.streak.current : 0
  const feelIcon = FEELS.find(f => f.value === feel)?.icon
  return (
    <Box as="li" listStyleType="none" borderBottom={`1px solid ${colors.border}`} _last={{ borderBottom: 'none' }} py={2}>
      <Flex align="center" gap={3}>
        <Box
          as="button"
          role="checkbox"
          aria-checked={done}
          aria-label={`Complete ${item.title}`}
          onClick={done || busy ? undefined : onComplete}
          w="28px"
          h="28px"
          flexShrink={0}
          borderRadius="full"
          border={`2px solid ${done ? success : colors.accent}`}
          bg={done ? success : 'transparent'}
          color={colors.pageBg}
          fontWeight="800"
          fontSize="sm"
          cursor={done ? 'default' : 'pointer'}
          {...({ type: 'button' } as object)}
        >
          {done ? '✓' : ''}
        </Box>
        <Box
          as="button"
          onClick={onToggle}
          aria-expanded={open}
          flex="1"
          minW={0}
          textAlign="left"
          bg="none"
          border="none"
          cursor="pointer"
          py={1}
          {...({ type: 'button' } as object)}
        >
          <Text color={done ? colors.textMuted : colors.textPrimary} textDecoration={done ? 'line-through' : 'none'} wordBreak="break-word">
            {item.title}
          </Text>
          {item.dueDate && !done && <Muted fontSize="xs">Due {formatShortDay(item.dueDate)}</Muted>}
        </Box>
        {feelIcon && <Text as="span" fontSize="sm" title={`Felt ${feel}`}>{feelIcon}</Text>}
        {streak > 0 && (
          <Text as="span" fontSize="sm" fontWeight="700" color={flame} flexShrink={0} title={`${streak}-day streak`}>
            🔥 {streak}
          </Text>
        )}
        <SizeChip size={item.size} />
      </Flex>

      {open && (
        <VStack align="stretch" gap={2} pl="40px" pt={2}>
          {earned && <Text role="status" color={success} fontSize="sm" fontWeight="700">{earned}</Text>}
          {item.why && <Muted>Why: {item.why}</Muted>}
          {done ? (
            <Flex align="center" gap={2} wrap="wrap" role="group" aria-label="How did that feel?">
              <Muted>How did that feel?</Muted>
              {FEELS.map(f => (
                <Box
                  as="button"
                  key={f.value}
                  aria-pressed={feel === f.value}
                  onClick={() => onFeel(feel === f.value ? null : f.value)}
                  px={2}
                  minH="36px"
                  borderRadius="md"
                  fontSize="sm"
                  border={`1px solid ${feel === f.value ? colors.accent : colors.border}`}
                  bg={feel === f.value ? colors.accentDim : 'transparent'}
                  color={feel === f.value ? colors.accent : colors.textMuted}
                  cursor="pointer"
                  {...({ type: 'button' } as object)}
                >
                  {f.icon} {f.label}
                </Box>
              ))}
            </Flex>
          ) : (
            !item.why && <Muted>No "why" yet. Add one on the Tasks tab.</Muted>
          )}
        </VStack>
      )}
    </Box>
  )
}

const TodayTab = ({ onBalance }: { onBalance: (balance: number) => void }) => {
  const today = useLoad<TodayData>('/today')
  const action = useAction()
  const [openId, setOpenId] = useState<string | null>(null)
  // What this screen changed, shown at once while the list reloads behind it.
  const [earned, setEarned] = useState<Record<string, string>>({})
  const [feels, setFeels] = useState<Record<string, Feel | null>>({})
  const [title, setTitle] = useState('')
  const [size, setSize] = useState<Size>('small')
  const [repeat, setRepeat] = useState(false)

  const complete = (id: string) => action.run(async () => {
    const result = await api<CompleteResult>(`/tasks/${id}/complete`, { method: 'POST' })
    setEarned(prev => ({ ...prev, [id]: awardMessage(result) }))
    setOpenId(id)
    onBalance(result.balance)
    today.reload()
  })

  const saveFeel = (id: string, feel: Feel | null) => action.run(async () => {
    setFeels(prev => ({ ...prev, [id]: feel }))
    await api(`/tasks/${id}/feel`, { method: 'POST', body: { feel } })
  })

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    void action.run(async () => {
      await api('/tasks', { method: 'POST', body: { title, size, repeat: repeat ? 'daily' : 'none' } })
      setTitle('')
      today.reload()
    })
  }

  const data = today.data
  const isDone = (item: TodayDaily | TodayTask) => item.id in earned || ('doneToday' in item ? item.doneToday : item.status === 'done')
  const rowProps = (item: TodayDaily | TodayTask) => ({
    item,
    done: isDone(item),
    feel: item.id in feels ? feels[item.id] : item.feel ?? null,
    earned: earned[item.id],
    open: openId === item.id,
    busy: action.busy,
    onToggle: () => setOpenId(openId === item.id ? null : item.id),
    onComplete: () => void complete(item.id),
    onFeel: (feel: Feel | null) => void saveFeel(item.id, feel),
  })

  return (
    <Loaded loading={today.loading} error={today.error} hasData={!!data}>
      {data && (
        <VStack align="stretch" gap={4}>
          <Box>
            <Text as="h1" fontSize="xl" fontWeight="800" color={colors.textPrimary}>{formatDay(data.date)}</Text>
            <Muted>
              +{data.earnedToday} today
              {data.dailies.length > 0 && ` · ${data.dailies.filter(isDone).length} of ${data.dailies.length} dailies done`}
            </Muted>
          </Box>

          <ErrorNote>{action.error}</ErrorNote>

          {data.oneMore?.available && (
            <Card borderColor={colors.accent} role="note">
              <Text color={colors.textPrimary} fontWeight="700">All dailies done. One more?</Text>
              <Muted>The next task you finish today counts double.</Muted>
            </Card>
          )}

          <SectionTitle>Dailies</SectionTitle>
          <Card py={2}>
            {data.dailies.length === 0
              ? <Muted py={2}>No dailies yet. Add one below, or start from a routine on the Routines tab.</Muted>
              : <Box as="ul" aria-label="Dailies" m={0} p={0}>{data.dailies.map(d => <Row key={d.id} {...rowProps(d)} />)}</Box>}
          </Card>

          <SectionTitle>Tasks</SectionTitle>
          <Card py={2}>
            {data.tasks.length === 0
              ? <Muted py={2}>No open tasks.</Muted>
              : <Box as="ul" aria-label="Tasks" m={0} p={0}>{data.tasks.map(t => <Row key={t.id} {...rowProps(t)} />)}</Box>}
          </Card>

          <Card as="form" onSubmit={add} aria-label="Quick add">
            <VStack align="stretch" gap={3}>
              <TextField label="Add a task" value={title} maxLength={200} onChange={e => setTitle(e.target.value)} />
              <Flex gap={2} align="center" wrap="wrap">
                <SizePicker value={size} onChange={setSize} />
                <Button variant={repeat ? 'outline' : 'ghost'} aria-pressed={repeat} onClick={() => setRepeat(r => !r)}>
                  {repeat ? '↻ Every day' : '↻ Once'}
                </Button>
                <Box flex="1" />
                <Button variant="solid" type="submit" disabled={action.busy || !title.trim()}>Add</Button>
              </Flex>
            </VStack>
          </Card>
        </VStack>
      )}
    </Loaded>
  )
}

export default TodayTab
