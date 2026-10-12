import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import type { DesktopUpdateStatus } from '@/global'
import { I18nProvider } from '@/i18n/context'
import { $desktopVersion, $updateOverlayOpen, $updateOverlayTarget, $updateStatus, resetUpdateApplyState } from '@/store/updates'

import { UpdatesOverlay } from './updates-overlay'

const WARNING_TEXT = 'Stop! Um ein Update anzuspielen, gehe in eine neue Session und rufe den Skill hermes-desktop-mac-update auf.'

const updateReadyStatus: DesktopUpdateStatus = {
  behind: 1,
  commits: [{ at: 1, author: 'Nous', sha: 'abc123', summary: 'Update payload' }],
  currentSha: 'current',
  targetSha: 'target',
  fetchedAt: Date.now(),
  mechanism: 'posix-handoff',
  supported: true,
  updateAvailable: true
}

afterEach((): void => {
  cleanup()
  $desktopVersion.set(null)
  $updateOverlayOpen.set(false)
  $updateOverlayTarget.set('client')
  $updateStatus.set(null)
  resetUpdateApplyState()
  Reflect.deleteProperty(window, 'hermesDesktop')
  vi.restoreAllMocks()
})

async function renderUpdateOverlay(apply = vi.fn(async () => ({ ok: true, handedOff: true }))): Promise<typeof apply> {
  window.hermesDesktop = {
    updates: {
      apply,
      check: vi.fn(async () => updateReadyStatus),
      onProgress: vi.fn()
    }
  } as unknown as Window['hermesDesktop']

  $desktopVersion.set({
    appVersion: '0.21.6',
    electronVersion: '37',
    hermesRoot: '/h',
    nodeVersion: '22',
    platform: 'darwin'
  })
  $updateStatus.set(updateReadyStatus)
  $updateOverlayTarget.set('client')
  $updateOverlayOpen.set(true)

  await act(async (): Promise<void> => {
    render(
      <I18nProvider configClient={null} initialLocale="en">
        <UpdatesOverlay />
      </I18nProvider>
    )
  })

  return apply
}

it('warns before an update starts and only continues after explicit confirmation', async (): Promise<void> => {
  const apply = await renderUpdateOverlay()

  fireEvent.click(screen.getByRole('button', { name: 'Update now' }))

  const dialog = await screen.findByRole('alertdialog', { name: 'Update warning' })
  expect(dialog.textContent).toContain(WARNING_TEXT)
  const cancel = screen.getByRole('button', { name: 'Abbrechen' })
  expect(cancel.ownerDocument.activeElement).toBe(cancel)

  fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' }))
  expect(screen.queryByRole('alertdialog', { name: 'Update warning' })).toBeNull()
  expect(apply).not.toHaveBeenCalled()

  fireEvent.click(screen.getByRole('button', { name: 'Update now' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Trotzdem aktualisieren' }))

  await waitFor(() => expect(apply).toHaveBeenCalledTimes(1))
})
