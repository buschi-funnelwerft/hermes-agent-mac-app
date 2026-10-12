import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/i18n'
import type { SessionDotState } from '@/store/session-dot-state'

const { stateById } = vi.hoisted(() => ({ stateById: { current: {} as Record<string, SessionDotState> } }))

vi.mock('@/lib/use-session-slice', () => ({
  useStoreSelector: <T, S>(_store: T, select: (value: Record<string, SessionDotState>) => S) => select(stateById.current)
}))

import { SESSION_DOT_EMOJI_CLASS, sessionDotEmoji, SessionStatusDot } from './session-status-dot'

const EXPECTED_EMOJI: Record<SessionDotState, string> = {
  background: '⚙️',
  draft: '✍️',
  idle: '💤',
  'needs-input': '🙋',
  stalled: '⏳',
  unread: '📬',
  working: '🛠️'
}

function renderDot(state: SessionDotState, storedSessionId = 'session-1') {
  stateById.current = { [storedSessionId]: state }

  return render(
    <I18nProvider configClient={null}>
      <SessionStatusDot branchStem="└─ " storedSessionId={storedSessionId} />
    </I18nProvider>
  )
}

describe('SessionStatusDot emoji mapping', () => {
  afterEach(() => {
    cleanup()
    stateById.current = {}
  })

  it('exposes the exact shared emoji for every session dot state', () => {
    expect(Object.fromEntries((Object.keys(EXPECTED_EMOJI) as SessionDotState[]).map(state => [state, sessionDotEmoji(state)]))).toEqual(
      EXPECTED_EMOJI
    )
  })

  it.each(Object.entries(EXPECTED_EMOJI) as Array<[SessionDotState, string]>)('renders %s as %s', (state, emoji) => {
    const view = renderDot(state)

    expect(view.container.textContent).toContain('└─ ')
    expect(view.container.textContent).toContain(emoji)
    expect(view.container.querySelector(`.${SESSION_DOT_EMOJI_CLASS.split(' ')[0]}`)?.textContent).toBe(emoji)
  })

  it('keeps idle hidden from assistive technology while preserving the dot sizing contract', () => {
    const view = renderDot('idle')
    const idleDot = view.container.querySelector(`.${SESSION_DOT_EMOJI_CLASS.split(' ')[0]}`)

    expect(idleDot?.getAttribute('aria-hidden')).toBe('true')
    expect(idleDot?.className).toBe(SESSION_DOT_EMOJI_CLASS)
    expect(idleDot?.textContent).toBe('💤')
  })

  it('keeps the existing status role and accessible label for live states', () => {
    renderDot('working')

    expect(screen.getByRole('status', { name: 'Session running' }).textContent).toBe('🛠️')
  })

  it('renders a draft emoji for a new chat without a stored session id', () => {
    stateById.current = { 'session-1': 'working' }

    const view = render(
      <I18nProvider configClient={null}>
        <SessionStatusDot storedSessionId={null} />
      </I18nProvider>
    )

    expect(view.container.textContent).toBe('✍️')
  })
})
