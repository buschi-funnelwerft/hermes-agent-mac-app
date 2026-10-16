import { describe, expect, it } from 'vitest'

import { en, KANBAN_LOCALES, PASSIVE_BOARD_COLUMNS, PASSIVE_BOARD_INTRO } from './i18n'

const EXPECTED: Record<string, string> = {
  archived: 'Archiviert',
  blocked: 'Warten auf',
  done: 'Fertig',
  ready: 'Nächste Aufgabe',
  review: 'Prüfung',
  running: 'In Bearbeitung',
  scheduled: 'Geplant',
  todo: 'Backlog',
  triage: 'Triage – nicht nutzen'
}

describe('Kanban-Spalten für Karstens passives Board', () => {
  it('nutzt die eigenen deutschen Namen für jeden Status', () => {
    for (const [status, label] of Object.entries(EXPECTED)) {
      expect(PASSIVE_BOARD_COLUMNS[status as keyof typeof PASSIVE_BOARD_COLUMNS].label).toBe(label)
      expect(PASSIVE_BOARD_COLUMNS[status as keyof typeof PASSIVE_BOARD_COLUMNS].help).not.toBe('')
    }
  })

  it('gilt in jeder registrierten Sprache, inklusive Hinweistext', () => {
    for (const bundle of Object.values(KANBAN_LOCALES) as (typeof en)[]) {
      expect(bundle.col).toEqual(PASSIVE_BOARD_COLUMNS)
      expect(bundle.introBody).toBe(PASSIVE_BOARD_INTRO)
    }
    expect(en.introBody).not.toMatch(/You don’t run the cards/)
    expect(en.introBody).toMatch(/Triage nicht nutzen/)
  })
})
