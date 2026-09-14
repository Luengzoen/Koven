import type { CompletionSoundId } from '@shared/capabilities/preferences'
import taskComplete01 from '@renderer/assets/task_complete_01.wav'
import taskComplete02 from '@renderer/assets/task_complete_02.wav'
import taskComplete03 from '@renderer/assets/task_complete_03.wav'
import taskComplete04 from '@renderer/assets/task_complete_04.wav'
import taskComplete05 from '@renderer/assets/task_complete_05.wav'
import taskComplete06 from '@renderer/assets/task_complete_06.wav'

const soundUrls: Record<CompletionSoundId, string> = {
  task_complete_01: taskComplete01,
  task_complete_02: taskComplete02,
  task_complete_03: taskComplete03,
  task_complete_04: taskComplete04,
  task_complete_05: taskComplete05,
  task_complete_06: taskComplete06
}

type SoundListener = (playingId: CompletionSoundId | null) => void

let currentAudio: HTMLAudioElement | null = null
let currentId: CompletionSoundId | null = null
const listeners = new Set<SoundListener>()

function notify(): void {
  for (const listener of listeners) {
    listener(currentId)
  }
}

function stopCurrent(): void {
  if (!currentAudio) return
  currentAudio.onended = null
  currentAudio.onerror = null
  currentAudio.pause()
  currentAudio.src = ''
  currentAudio = null
  currentId = null
  notify()
}

export function subscribeCompletionSoundPlayback(listener: SoundListener): () => void {
  listeners.add(listener)
  listener(currentId)
  return () => {
    listeners.delete(listener)
  }
}

export function getPlayingCompletionSoundId(): CompletionSoundId | null {
  return currentId
}

/** 同一时刻只播一个；再次调用会打断当前 */
export function playCompletionSound(id: CompletionSoundId): void {
  stopCurrent()
  const url = soundUrls[id]
  if (!url) return
  const audio = new Audio(url)
  currentAudio = audio
  currentId = id
  notify()
  audio.onended = () => {
    if (currentAudio === audio) {
      currentAudio = null
      currentId = null
      notify()
    }
  }
  audio.onerror = () => {
    if (currentAudio === audio) {
      currentAudio = null
      currentId = null
      notify()
    }
  }
  void audio.play().catch(() => {
    if (currentAudio === audio) {
      currentAudio = null
      currentId = null
      notify()
    }
  })
}

export function stopCompletionSound(): void {
  stopCurrent()
}
