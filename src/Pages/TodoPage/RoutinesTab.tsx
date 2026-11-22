import { useState } from 'react'
import { Box, Flex, Text, VStack } from '@chakra-ui/react'
import { api } from '../../api/client'
import { colors } from '../../Theme'
import type { Routine, RoutineItem } from './types'
import { Button, Card, ConfirmButton, ErrorNote, Loaded, Muted, SectionTitle, SizeChip, SizePicker, TextField, success } from './ui'
import { useAction, useLoad } from './useLoad'

const blank = (): RoutineItem => ({ title: '', size: 'small' })

const RoutineForm = ({ initial, busy, submitLabel, onSave, onCancel }: {
  initial: { name: string; items: RoutineItem[] }
  busy: boolean
  submitLabel: string
  onSave: (routine: { name: string; items: RoutineItem[] }) => void
  onCancel: () => void
}) => {
  const [name, setName] = useState(initial.name)
  const [items, setItems] = useState(initial.items.length ? initial.items : [blank()])
  const setItem = (i: number, change: Partial<RoutineItem>) => setItems(list => list.map((item, n) => (n === i ? { ...item, ...change } : item)))
  const filled = items.filter(item => item.title.trim() !== '')
  const valid = name.trim() !== '' && filled.length > 0
  return (
    <VStack as="form" align="stretch" gap={3} onSubmit={e => { e.preventDefault(); if (valid) onSave({ name, items: filled }) }}>
      <TextField label="Routine name" value={name} maxLength={200} onChange={e => setName(e.target.value)} />
      {items.map((item, i) => (
        <Flex key={i} gap={2} align="center" wrap="wrap">
          <Box flex="1" minW="160px">
            <TextField label={`Daily ${i + 1}`} value={item.title} maxLength={200} onChange={e => setItem(i, { title: e.target.value })} />
          </Box>
          <SizePicker value={item.size} onChange={size => setItem(i, { size })} />
          <Button variant="ghost" aria-label={`Remove daily ${i + 1}`} disabled={items.length === 1} onClick={() => setItems(list => list.filter((_, n) => n !== i))}>✕</Button>
        </Flex>
      ))}
      <Flex gap={2} wrap="wrap">
        <Button variant="ghost" disabled={items.length >= 30} onClick={() => setItems(list => [...list, blank()])}>+ Add a daily</Button>
        <Box flex="1" />
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="solid" type="submit" disabled={busy || !valid}>{submitLabel}</Button>
      </Flex>
    </VStack>
  )
}

const ItemList = ({ items }: { items: RoutineItem[] }) => (
  <Box as="ul" m={0} p={0}>
    {items.map((item, i) => (
      <Flex as="li" key={i} listStyleType="none" align="center" gap={2} py={1}>
        <SizeChip size={item.size} />
        <Text color={colors.textMuted} fontSize="sm" wordBreak="break-word">{item.title}</Text>
      </Flex>
    ))}
  </Box>
)

const RoutinesTab = () => {
  const routines = useLoad<{ schedules: Routine[]; templates: Routine[] }>('/schedules')
  const action = useAction()
  const [editing, setEditing] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  const change = (request: () => Promise<unknown>, done?: string) => action.run(async () => {
    setNote(null)
    await request()
    setEditing(null)
    if (done) setNote(done)
    routines.reload()
  })

  const data = routines.data
  return (
    <Loaded loading={routines.loading} error={routines.error} hasData={!!data}>
      {data && (
        <VStack align="stretch" gap={4}>
          <Muted>A routine is a saved list of dailies. Adding one puts its dailies on your Today screen.</Muted>
          <ErrorNote>{action.error}</ErrorNote>
          {note && <Text role="status" color={success} fontWeight="700" fontSize="sm">{note}</Text>}

          <SectionTitle>My routines</SectionTitle>
          {data.schedules.length === 0 && editing !== 'new' && <Muted>None yet. Save one of the examples below, or make your own.</Muted>}
          {data.schedules.map(routine => (
            <Card key={routine.id} as="article" aria-label={routine.name}>
              {editing === routine.id ? (
                <VStack align="stretch" gap={2}>
                  <RoutineForm
                    initial={routine}
                    busy={action.busy}
                    submitLabel="Save"
                    onCancel={() => setEditing(null)}
                    onSave={r => void change(() => api(`/schedules/${routine.id}`, { method: 'PUT', body: r }))}
                  />
                  <ConfirmButton
                    label="Delete routine"
                    confirm="Delete routine (its dailies are kept)"
                    disabled={action.busy}
                    onConfirm={() => void change(() => api(`/schedules/${routine.id}`, { method: 'DELETE' }))}
                  />
                </VStack>
              ) : (
                <VStack align="stretch" gap={2}>
                  <Flex align="center" gap={2}>
                    <Text flex="1" color={colors.textPrimary} fontWeight="700" wordBreak="break-word">{routine.name}</Text>
                    <Button variant="ghost" aria-label={`Edit ${routine.name}`} onClick={() => setEditing(routine.id)}>Edit</Button>
                  </Flex>
                  <ItemList items={routine.items} />
                  <Button
                    disabled={action.busy}
                    aria-label={`Add the dailies from ${routine.name}`}
                    onClick={() => void change(
                      () => api(`/schedules/${routine.id}/apply`, { method: 'POST' }),
                      `Added ${routine.items.length} ${routine.items.length === 1 ? 'daily' : 'dailies'} from "${routine.name}" to Today.`,
                    )}
                  >
                    Add its dailies
                  </Button>
                </VStack>
              )}
            </Card>
          ))}

          {editing === 'new' ? (
            <Card aria-label="New routine" role="region">
              <RoutineForm
                initial={{ name: '', items: [] }}
                busy={action.busy}
                submitLabel="Save routine"
                onCancel={() => setEditing(null)}
                onSave={r => void change(() => api('/schedules', { method: 'POST', body: r }))}
              />
            </Card>
          ) : (
            <Button onClick={() => setEditing('new')}>+ New routine</Button>
          )}

          <SectionTitle>Examples</SectionTitle>
          {data.templates.map(template => (
            <Card key={template.id} as="article" aria-label={`Example: ${template.name}`}>
              <VStack align="stretch" gap={2}>
                <Text color={colors.textPrimary} fontWeight="700">{template.name}</Text>
                <ItemList items={template.items} />
                <Button
                  disabled={action.busy}
                  aria-label={`Save ${template.name} to my routines`}
                  onClick={() => void change(() => api('/schedules', { method: 'POST', body: { templateId: template.id } }), `Saved "${template.name}" to your routines. Edit it, then add its dailies.`)}
                >
                  Save to my routines
                </Button>
              </VStack>
            </Card>
          ))}
        </VStack>
      )}
    </Loaded>
  )
}

export default RoutinesTab
