import { type Translations, useI18n } from '@/i18n'
import { useStoreSelector } from '@/lib/use-session-slice'
import { cn } from '@/lib/utils'
import { $sessionDotStateById, type SessionDotState } from '@/store/session-dot-state'
import type { SessionInfo } from '@/types/hermes'

// A pure lookup table: each state maps to its emoji, aria-label, and title.
// No priority resolution here — $sessionDotStateById already picked one.
// Label/title resolve from sidebar.row translations, keyed by name.
type DotVariant = {
  ariaHidden?: true
  ariaLabel?: (r: Translations['sidebar']['row']) => string
  emoji: string
  role?: 'status'
  title?: (r: Translations['sidebar']['row']) => string
}

export const SESSION_DOT_EMOJI_CLASS =
  'inline-flex h-4 w-4 shrink-0 items-center justify-center text-[0.8125rem] leading-none'

const DOT_VARIANTS: Record<SessionDotState, DotVariant> = {
  'needs-input': {
    ariaLabel: r => r.needsInput,
    emoji: '🙋',
    role: 'status',
    title: r => r.waitingForAnswer
  },
  working: {
    ariaLabel: r => r.sessionRunning,
    emoji: '🛠️',
    role: 'status'
  },
  stalled: {
    ariaLabel: r => r.sessionRunning,
    emoji: '⏳',
    role: 'status',
    title: r => r.sessionRunning
  },
  background: {
    ariaLabel: r => r.backgroundRunning,
    emoji: '⚙️',
    role: 'status',
    title: r => r.backgroundRunning
  },
  unread: {
    ariaLabel: r => r.finishedUnread,
    emoji: '📬',
    role: 'status',
    title: r => r.finishedUnread
  },
  draft: {
    ariaLabel: r => r.draftSession,
    emoji: '✍️',
    title: r => r.draftSession
  },
  idle: {
    ariaHidden: true,
    emoji: '💤'
  }
}

/** The emoji a state paints, for surfaces that describe a status rather than
 *  render a session — the sidebar's status filter and profile switcher, say. */
export const sessionDotEmoji = (state: SessionDotState): string => DOT_VARIANTS[state].emoji

export interface SessionStatusDotProps {
  /** The STORED session id — the key every live-state atom (working /
   *  attention / stalled / unread / background) is keyed by, on BOTH surfaces:
   *  the sidebar row's `session.id` and a pane tile's `storedSessionId` are the
   *  same stored id (`$workingSessionIds` et al. map `storedSessionId`).
   *
   *  Null on a new chat that has yet to reach the backend — no id to key by,
   *  and no turn behind it, which is the draft state by definition. */
  storedSessionId: null | string
  /** The session row is still accepted for call-site stability; status emoji
   *  resolution is keyed by `storedSessionId`. */
  session?: null | SessionInfo
  /** TUI-style tree stem for a branched session (`└─ ` / `├─ `). */
  branchStem?: string
  /** Applied to the OUTER wrapper (stem + dot) — e.g. hover-fade on the
   *  reorder handle. */
  className?: string
}

/**
 * SESSION STATUS DOT — the ONE primitive the sidebar row, the pane tabs, and
 * the session switcher render, so a session's status can never disagree
 * between surfaces. It resolves everything itself from the stored session id:
 * the live state (via `$sessionDotStateById`, already reduced to one mutually
 * exclusive answer).
 * An idle session shows the idle emoji; active states keep their semantic
 * accessible names so the emoji is never the only status cue.
 */
export function SessionStatusDot({ storedSessionId, branchStem, className }: SessionStatusDotProps) {
  const { t } = useI18n()
  const r = t.sidebar.row

  // Selector, not a plain useStore: the map is rebuilt whenever any session's
  // status changes, but a given dot only repaints when ITS OWN state flips.
  const dotState = useStoreSelector($sessionDotStateById, states =>
    storedSessionId ? (states[storedSessionId] ?? 'idle') : 'draft'
  )

  const variant = DOT_VARIANTS[dotState]

  return (
    <span className={cn('flex items-center gap-0.5', className)}>
      {branchStem ? (
        <span aria-hidden className="shrink-0 font-mono text-[0.625rem] leading-none text-(--ui-text-quaternary)">
          {branchStem}
        </span>
      ) : null}
      <span
        aria-hidden={variant.ariaHidden}
        aria-label={variant.ariaLabel?.(r)}
        className={SESSION_DOT_EMOJI_CLASS}
        role={variant.role}
        title={variant.title?.(r)}
      >
        {variant.emoji}
      </span>
    </span>
  )
}
