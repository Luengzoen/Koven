import type { FsBrowserEntryDetail, FsBrowserListEntry } from '@shared/capabilities/fs-browser'
import { displayEntryName } from '@renderer/components/fs-browser/display-name'
import { EntryIcon } from '@renderer/components/fs-browser/entry-icon'
import { formatByteSize, formatDateTime } from '@renderer/components/fs-browser/format-meta'
import { cn } from '@renderer/lib/cn'
import { usePreferencesStore } from '@renderer/shell/preferences-store'
import { useT } from '@renderer/shell/use-t'

type DetailPaneProps = {
  detail: FsBrowserEntryDetail | null
  width: number
  loading: boolean
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-all text-sm text-foreground">{value}</dd>
    </div>
  )
}

export function DetailPane({ detail, width, loading }: DetailPaneProps) {
  const t = useT()
  const locale = usePreferencesStore((s) => s.locale)

  const detailAsEntry: FsBrowserListEntry | null = detail
    ? {
        path: detail.path,
        name: detail.name,
        kind: detail.kind,
        extension: detail.extension,
        isHidden: detail.isHidden,
        isSystem: detail.isSystem,
        rootId: detail.rootId
      }
    : null

  return (
    <aside
      className="flex shrink-0 flex-col overflow-y-auto border-l border-border bg-muted/30 p-4"
      style={{ width }}
      aria-live="polite"
    >
      {!detail && !loading ? (
        <div className="flex flex-1 items-center justify-center px-2">
          <p className="text-center text-sm text-muted-foreground">
            {t('fsBrowser.detailEmpty')}
          </p>
        </div>
      ) : null}

      {loading && !detail ? (
        <div className="flex flex-1 items-center justify-center px-2">
          <p className="text-center text-sm text-muted-foreground">{t('fsBrowser.loading')}</p>
        </div>
      ) : null}

      {detail && detailAsEntry ? (
        <div className={cn('flex flex-col gap-4', detail.isHidden && 'opacity-45')}>
          <div className="flex flex-col items-center gap-2 text-center">
            <EntryIcon
              entry={detailAsEntry}
              open={detail.kind !== 'file'}
              className="size-10 text-muted-foreground"
            />
            <p className="w-full break-all text-sm font-medium text-foreground">
              {displayEntryName(detailAsEntry)}
            </p>
            <p className="text-xs text-muted-foreground">
              {detail.kind === 'this-pc'
                ? t('fsBrowser.kindThisPc')
                : detail.kind === 'volume'
                  ? t('fsBrowser.kindVolume')
                  : detail.kind === 'directory'
                    ? t('fsBrowser.kindDirectory')
                    : t('fsBrowser.kindFile')}
            </p>
          </div>

          <dl className="flex flex-col gap-3">
            <MetaRow label={t('fsBrowser.metaPath')} value={detail.path} />
            {detail.kind === 'file' ? (
              <MetaRow
                label={t('fsBrowser.metaSize')}
                value={formatByteSize(detail.sizeBytes)}
              />
            ) : null}
            {detail.kind === 'directory' && detail.childCount !== null ? (
              <MetaRow
                label={t('fsBrowser.metaChildCount')}
                value={String(detail.childCount)}
              />
            ) : null}
            {detail.kind === 'volume' ? (
              <>
                <MetaRow
                  label={t('fsBrowser.metaFree')}
                  value={formatByteSize(detail.freeBytes)}
                />
                <MetaRow
                  label={t('fsBrowser.metaTotal')}
                  value={formatByteSize(detail.totalBytes)}
                />
              </>
            ) : null}
            {detail.modifiedAt !== null ? (
              <MetaRow
                label={t('fsBrowser.metaModified')}
                value={formatDateTime(detail.modifiedAt, locale)}
              />
            ) : null}
            {detail.createdAt !== null ? (
              <MetaRow
                label={t('fsBrowser.metaCreated')}
                value={formatDateTime(detail.createdAt, locale)}
              />
            ) : null}
          </dl>
        </div>
      ) : null}
    </aside>
  )
}
