import { useState } from 'react'
import { NavLink, useParams } from 'react-router'
import { Box, Flex, Text, VStack } from '@chakra-ui/react'
import { api } from '../../api/client'
import { useAuth } from '../../auth/authContext'
import { colors } from '../../Theme'
import RewardsTab from './RewardsTab'
import RoutinesTab from './RoutinesTab'
import StatsTab from './StatsTab'
import TasksTab from './TasksTab'
import TodayTab from './TodayTab'
import type { Profile } from './types'
import { Button, Card, ErrorNote, Muted } from './ui'
import { selectStyle } from './styles'
import { useAction, useLoad } from './useLoad'

const TABS = [
  { id: 'today', label: 'Today', icon: '☀', to: '/todo' },
  { id: 'tasks', label: 'Tasks', icon: '☰', to: '/todo/tasks' },
  { id: 'rewards', label: 'Rewards', icon: '★', to: '/todo/rewards' },
  { id: 'stats', label: 'Stats', icon: '▦', to: '/todo/stats' },
  { id: 'routines', label: 'Routines', icon: '↻', to: '/todo/routines' },
] as const

type TabId = (typeof TABS)[number]['id']

const timezones = (): string[] => {
  try {
    return (Intl as unknown as { supportedValuesOf(key: 'timeZone'): string[] }).supportedValuesOf('timeZone')
  } catch {
    return ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'UTC']
  }
}

/** The day-boundary setting: which timezone decides when "today" ends. */
const Settings = ({ profile, onSaved }: { profile: Profile; onSaved: () => void }) => {
  const { user, signOut } = useAuth()
  const action = useAction()
  const [timezone, setTimezone] = useState(profile.timezone)
  const zones = timezones()
  return (
    <Card aria-label="Settings" role="region">
      <VStack align="stretch" gap={3}>
        <Muted>Signed in as {user?.name ?? user?.email ?? profile.name ?? profile.email ?? 'you'}</Muted>
        <Box>
          <Muted as="label" {...({ htmlFor: 'todo-timezone' } as object)}>Timezone (decides when your day ends)</Muted>
          <select id="todo-timezone" style={{ ...selectStyle, width: '100%', marginTop: 4 }} value={timezone} onChange={e => setTimezone(e.target.value)}>
            {(zones.includes(timezone) ? zones : [timezone, ...zones]).map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </Box>
        <ErrorNote>{action.error}</ErrorNote>
        <Flex gap={2} justify="space-between">
          <Button variant="ghost" onClick={signOut}>Sign out</Button>
          <Button
            variant="solid"
            disabled={action.busy || timezone === profile.timezone}
            onClick={() => void action.run(async () => { await api('/me', { method: 'PATCH', body: { timezone } }); onSaved() })}
          >
            Save
          </Button>
        </Flex>
      </VStack>
    </Card>
  )
}

/** The signed-in to-do app: a points header, five tabs, and the tab bar. */
const TodoApp = () => {
  const { tab } = useParams()
  const active: TabId = TABS.find(t => t.id === tab)?.id ?? 'today'
  const me = useLoad<Profile>('/me')
  // The balance after the latest completion or redemption on this screen.
  const [balance, setBalance] = useState<number | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  // Bumped when the timezone changes, so the open tab loads again for the new day.
  const [epoch, setEpoch] = useState(0)
  const points = balance ?? me.data?.points ?? null

  return (
    <Box maxW="640px" mx="auto" px={4} pt={4} pb={{ base: '96px', md: 10 }}>
      <Flex align="center" gap={3} mb={3}>
        <Box flex="1">
          <Muted fontSize="xs">Points</Muted>
          <Text aria-label="Points balance" color={colors.accent} fontSize="3xl" fontWeight="800" lineHeight="1">
            {points ?? '–'}
          </Text>
        </Box>
        <Button variant="ghost" aria-label="Settings" aria-expanded={settingsOpen} onClick={() => setSettingsOpen(o => !o)}>⚙</Button>
      </Flex>
      <ErrorNote>{me.error}</ErrorNote>

      {settingsOpen && me.data && (
        <Box mb={4}>
          <Settings profile={me.data} onSaved={() => { setSettingsOpen(false); me.reload(); setEpoch(e => e + 1) }} />
        </Box>
      )}

      <Flex
        as="nav"
        aria-label="To-do sections"
        position={{ base: 'fixed', md: 'static' }}
        bottom={0}
        left={0}
        right={0}
        zIndex={10}
        bg={colors.navBg}
        borderTop={{ base: `1px solid ${colors.border}`, md: 'none' }}
        border={{ md: `1px solid ${colors.border}` }}
        borderRadius={{ md: 'lg' }}
        mb={{ md: 5 }}
        pb={{ base: 'env(safe-area-inset-bottom)', md: 0 }}
      >
        {TABS.map(t => (
          <NavLink
            key={t.id}
            to={t.to}
            end
            aria-current={active === t.id ? 'page' : undefined}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '10px 0',
              textDecoration: 'none',
              fontSize: 12,
              fontWeight: 700,
              color: active === t.id ? colors.accent : colors.textMuted,
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>{t.icon}</span>
            {t.label}
          </NavLink>
        ))}
      </Flex>

      <Box key={`${active}-${epoch}`}>
        {active === 'today' && <TodayTab onBalance={setBalance} />}
        {active === 'tasks' && <TasksTab />}
        {active === 'rewards' && <RewardsTab balance={points} onBalance={setBalance} />}
        {active === 'stats' && <StatsTab />}
        {active === 'routines' && <RoutinesTab />}
      </Box>
    </Box>
  )
}

export default TodoApp
