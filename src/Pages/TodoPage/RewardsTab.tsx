import { useState } from 'react'
import { Box, Flex, Text, VStack } from '@chakra-ui/react'
import { api } from '../../api/client'
import { colors } from '../../Theme'
import { rewardProgress } from './todoLogic'
import type { Reward } from './types'
import { Button, Card, ConfirmButton, ErrorNote, Loaded, Muted, TextField, success } from './ui'
import { useAction, useLoad } from './useLoad'

const RewardForm = ({ initial, busy, submitLabel, onSave, onCancel }: {
  initial: { name: string; cost: string }
  busy: boolean
  submitLabel: string
  onSave: (reward: { name: string; cost: number }) => void
  onCancel?: () => void
}) => {
  const [name, setName] = useState(initial.name)
  const [cost, setCost] = useState(initial.cost)
  const costNumber = Number(cost)
  const valid = name.trim() !== '' && Number.isInteger(costNumber) && costNumber >= 1
  return (
    <VStack as="form" align="stretch" gap={3} onSubmit={e => { e.preventDefault(); if (valid) onSave({ name, cost: costNumber }) }}>
      <TextField label="Reward" value={name} maxLength={200} onChange={e => setName(e.target.value)} />
      <Flex gap={2} align="center">
        <TextField label="Cost in points" type="number" inputMode="numeric" min={1} step={1} value={cost} onChange={e => setCost(e.target.value)} />
        {onCancel && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button variant="solid" type="submit" disabled={busy || !valid}>{submitLabel}</Button>
      </Flex>
    </VStack>
  )
}

const RewardsTab = ({ balance, onBalance }: { balance: number | null; onBalance: (balance: number) => void }) => {
  const rewards = useLoad<{ rewards: Reward[] }>('/rewards')
  const action = useAction()
  const [editing, setEditing] = useState<string | null>(null)
  const [redeemed, setRedeemed] = useState<string | null>(null)
  // A fresh form after each reward is added.
  const [formKey, setFormKey] = useState(0)

  const change = (request: () => Promise<unknown>) => action.run(async () => {
    await request()
    setEditing(null)
    setFormKey(k => k + 1)
    rewards.reload()
  })

  const redeem = (reward: Reward) => action.run(async () => {
    const result = await api<{ balance: number }>(`/rewards/${reward.id}/redeem`, { method: 'POST' })
    onBalance(result.balance)
    setRedeemed(`Redeemed "${reward.name}" for ${reward.cost} points. Enjoy it.`)
  })

  const list = [...(rewards.data?.rewards ?? [])].sort((a, b) => a.cost - b.cost)

  return (
    <Loaded loading={rewards.loading} error={rewards.error} hasData={!!rewards.data}>
      <VStack align="stretch" gap={4}>
        <ErrorNote>{action.error}</ErrorNote>
        {redeemed && <Text role="status" color={success} fontWeight="700" fontSize="sm">{redeemed}</Text>}
        {list.length === 0 && <Muted>No rewards yet. Add something worth working for, and set what it costs.</Muted>}

        {list.map(reward => {
          const { fraction, toGo } = rewardProgress(balance ?? 0, reward.cost)
          return (
            <Card key={reward.id} as="article" aria-label={reward.name}>
              {editing === reward.id ? (
                <VStack align="stretch" gap={2}>
                  <RewardForm
                    initial={{ name: reward.name, cost: String(reward.cost) }}
                    busy={action.busy}
                    submitLabel="Save"
                    onCancel={() => setEditing(null)}
                    onSave={r => void change(() => api(`/rewards/${reward.id}`, { method: 'PATCH', body: r }))}
                  />
                  <ConfirmButton label="Delete" confirm="Delete reward" disabled={action.busy} onConfirm={() => void change(() => api(`/rewards/${reward.id}`, { method: 'DELETE' }))} />
                </VStack>
              ) : (
                <VStack align="stretch" gap={3}>
                  <Flex align="center" gap={3}>
                    <Box flex="1" minW={0}>
                      <Text color={colors.textPrimary} fontWeight="700" wordBreak="break-word">{reward.name}</Text>
                      <Muted>{reward.cost} pts</Muted>
                    </Box>
                    <Button variant="ghost" aria-label={`Edit ${reward.name}`} onClick={() => setEditing(reward.id)}>Edit</Button>
                  </Flex>
                  {toGo === 0 ? (
                    <ConfirmRedeem cost={reward.cost} disabled={action.busy || balance === null} onConfirm={() => void redeem(reward)} />
                  ) : (
                    <Box>
                      <Box h="6px" borderRadius="full" bg={colors.border} role="progressbar" aria-valuemin={0} aria-valuemax={reward.cost} aria-valuenow={balance ?? 0} aria-label={`Progress to ${reward.name}`}>
                        <Box h="full" w={`${fraction * 100}%`} borderRadius="full" bg={colors.accent} />
                      </Box>
                      <Muted mt={1}>{toGo} pts to go</Muted>
                    </Box>
                  )}
                </VStack>
              )}
            </Card>
          )
        })}

        <Card aria-label="Add a reward" role="region">
          <RewardForm key={formKey} initial={{ name: '', cost: '' }} busy={action.busy} submitLabel="Add" onSave={r => void change(() => api('/rewards', { method: 'POST', body: r }))} />
        </Card>
      </VStack>
    </Loaded>
  )
}

/** Redeem, with a second tap to confirm since it spends points. */
const ConfirmRedeem = ({ cost, disabled, onConfirm }: { cost: number; disabled: boolean; onConfirm: () => void }) => {
  const [asking, setAsking] = useState(false)
  if (!asking) return <Button variant="solid" disabled={disabled} onClick={() => setAsking(true)}>Redeem</Button>
  return (
    <Flex gap={2}>
      <Button variant="solid" disabled={disabled} onClick={() => { setAsking(false); onConfirm() }}>Spend {cost} pts</Button>
      <Button variant="ghost" onClick={() => setAsking(false)}>Cancel</Button>
    </Flex>
  )
}

export default RewardsTab
