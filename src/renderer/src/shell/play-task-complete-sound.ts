import { playCompletionSound } from '@renderer/shell/completion-sound'
import { useNavigationStore } from '@renderer/shell/navigation-store'
import { usePreferencesStore } from '@renderer/shell/preferences-store'
import { toTaskPageId } from '@shared/capabilities/projects'

/** 与侧栏 finished badge 同机：非当前任务页才播 */
export function playTaskCompleteSoundIfBadgeWouldShow(taskId: string): void {
  const pageId = toTaskPageId(taskId)
  const activeId = useNavigationStore.getState().activeId
  if (activeId === pageId) return
  const soundId = usePreferencesStore.getState().general.completionSound
  playCompletionSound(soundId)
}
