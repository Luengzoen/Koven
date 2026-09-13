import type { MessageKey } from '@shared/i18n'
import {
  InfinityIcon,
  MessageSquareIcon,
  SlidersHorizontalIcon,
  type LucideIcon
} from 'lucide-react'

export const composerModes = ['agent', 'plan', 'ask'] as const

export type ComposerMode = (typeof composerModes)[number]

export const defaultComposerMode: ComposerMode = 'agent'

export const composerModeLabelKey: Record<ComposerMode, MessageKey> = {
  agent: 'newProject.modeAgent',
  plan: 'newProject.modePlan',
  ask: 'newProject.modeAsk'
}

export const composerModeHintKey: Record<ComposerMode, MessageKey> = {
  agent: 'newProject.modeAgentHint',
  plan: 'newProject.modePlanHint',
  ask: 'newProject.modeAskHint'
}

export const composerModeIcon: Record<ComposerMode, LucideIcon> = {
  agent: InfinityIcon,
  plan: SlidersHorizontalIcon,
  ask: MessageSquareIcon
}
