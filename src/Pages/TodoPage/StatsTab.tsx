import { useState } from 'react'
import { Box, Flex, Grid, Text, VStack } from '@chakra-ui/react'
import { colors } from '../../Theme'
import { FEELS, formatShortDay, heatLevel, heatmapWeeks } from './todoLogic'
import type { Goal, Heatmap, Period, Summary } from './types'
import { Card, Loaded, Muted, SectionTitle } from './ui'
import { useLoad } from './useLoad'

const PERIODS: { value: Period; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
]

// Shades of the accent color, from "nothing done" to "a lot done".
const HEAT = [colors.border, '#00b4d840', '#00b4d880', '#00b4d8c0', colors.accent]

const Stat = ({ label, value }: { label: string; value: number }) => (
  <Card p={3}>
    <Muted fontSize="xs">{label}</Muted>
    <Text color={colors.textPrimary} fontSize="2xl" fontWeight="800">{value}</Text>
  </Card>
)

const StatsTab = () => {
  const [period, setPeriod] = useState<Period>('week')
  const summary = useLoad<Summary>('/summary', { period })
  const heatmap = useLoad<Heatmap>('/heatmap')
  const goals = useLoad<{ goals: Goal[] }>('/goals')

  const goalName = (id: string | null) => goals.data?.goals.find(g => g.id === id)?.name ?? 'No goal'
  const s = summary.data
  const felt = s?.feelings ? FEELS.map(f => ({ ...f, count: s.feelings![f.value] })) : []
  const feltTotal = felt.reduce((sum, f) => sum + f.count, 0)
  const weeks = heatmap.data ? heatmapWeeks(heatmap.data.from, heatmap.data.to, heatmap.data.days) : []
  const mostPoints = Math.max(1, ...(s?.byGoal.map(g => g.points) ?? []))

  return (
    <VStack align="stretch" gap={4}>
      <Flex role="tablist" aria-label="Period" gap={1} bg={colors.surface} border={`1px solid ${colors.border}`} borderRadius="lg" p={1}>
        {PERIODS.map(p => (
          <Box
            as="button"
            key={p.value}
            role="tab"
            aria-selected={period === p.value}
            onClick={() => setPeriod(p.value)}
            flex="1"
            minH="36px"
            borderRadius="md"
            border="none"
            fontWeight="700"
            fontSize="sm"
            cursor="pointer"
            bg={period === p.value ? colors.accent : 'transparent'}
            color={period === p.value ? colors.pageBg : colors.textMuted}
            {...({ type: 'button' } as object)}
          >
            {p.label}
          </Box>
        ))}
      </Flex>

      <Loaded loading={summary.loading} error={summary.error} hasData={!!s}>
        {s && (
          <>
            <Muted>{formatShortDay(s.from)} to {formatShortDay(s.to)}</Muted>
            <Grid templateColumns="repeat(2, 1fr)" gap={3}>
              <Stat label="Earned" value={s.earned} />
              <Stat label="Spent" value={s.spent} />
              <Stat label="Completed" value={s.completions} />
              <Stat label="Streak bonus" value={s.streakBonuses} />
            </Grid>

            <SectionTitle>By goal</SectionTitle>
            <Card>
              {s.byGoal.length === 0 && <Muted>Nothing completed in this period yet.</Muted>}
              <VStack align="stretch" gap={3}>
                {[...s.byGoal].sort((a, b) => b.points - a.points).map(row => (
                  <Box key={row.goalId ?? 'none'}>
                    <Flex justify="space-between" gap={3}>
                      <Text color={colors.textPrimary} fontSize="sm" truncate>{goalName(row.goalId)}</Text>
                      <Muted flexShrink={0}>{row.points} pts · {row.completions} done</Muted>
                    </Flex>
                    <Box h="6px" mt={1} borderRadius="full" bg={colors.border}>
                      <Box h="full" w={`${(row.points / mostPoints) * 100}%`} borderRadius="full" bg={colors.accent} />
                    </Box>
                  </Box>
                ))}
              </VStack>
            </Card>

            {s.feelings && (
              <>
                <SectionTitle>How it felt</SectionTitle>
                <Card>
                  {feltTotal === 0 ? (
                    <Muted>After you tick something off, say how it felt. The pattern shows up here.</Muted>
                  ) : (
                    <VStack align="stretch" gap={3}>
                      <Flex gap={4} wrap="wrap">
                        {felt.map(f => (
                          <Text key={f.value} color={colors.textPrimary} fontSize="sm">{f.icon} {f.label} <b>{f.count}</b></Text>
                        ))}
                      </Flex>
                      {(s.draining?.length ?? 0) > 0 && (
                        <Box>
                          <Muted>Most often draining</Muted>
                          {s.draining!.map(d => (
                            <Flex key={d.itemId} justify="space-between" gap={3}>
                              <Text color={colors.textPrimary} fontSize="sm" truncate>{d.title}</Text>
                              <Muted flexShrink={0}>{d.count}×</Muted>
                            </Flex>
                          ))}
                        </Box>
                      )}
                    </VStack>
                  )}
                </Card>
              </>
            )}
          </>
        )}
      </Loaded>

      <SectionTitle>Last 12 months</SectionTitle>
      <Loaded loading={heatmap.loading} error={heatmap.error} hasData={!!heatmap.data}>
        <Card p={3}>
          <Grid
            role="img"
            aria-label={`Activity over the last 12 months: something done on ${heatmap.data?.days.length ?? 0} days`}
            templateRows="repeat(7, 1fr)"
            autoFlow="column"
            autoColumns="1fr"
            gap="1px"
          >
            {weeks.flatMap((week, w) => week.map((cell, d) => (
              <Box
                key={`${w}-${d}`}
                aspectRatio="1"
                borderRadius="1px"
                bg={cell ? HEAT[heatLevel(cell.completions)] : 'transparent'}
                title={cell ? `${formatShortDay(cell.date)}: ${cell.completions} done` : undefined}
              />
            )))}
          </Grid>
          <Flex align="center" gap={1} mt={2} justify="flex-end">
            <Muted fontSize="xs">Less</Muted>
            {HEAT.map(c => <Box key={c} w="10px" h="10px" borderRadius="2px" bg={c} />)}
            <Muted fontSize="xs">More</Muted>
          </Flex>
        </Card>
      </Loaded>
    </VStack>
  )
}

export default StatsTab
