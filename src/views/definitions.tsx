import { useMemo, useRef, useState, type ChangeEvent } from "react"
import {
  DownloadIcon,
  FileJsonIcon,
  TriangleAlertIcon,
  UploadIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"
import { PageHeader } from "@/components/page-header"
import { SectionFrame } from "@/components/detail"
import {
  RegionEmpty,
  RegionError,
  RegionSkeleton,
} from "@/components/region-states"
import {
  buildDefinitions,
  parseDefinitions,
  summarizeDefinitions,
  type BrokerDefinitions,
} from "@/lib/definitions"
import { IS_DEMO } from "@/lib/env"
import { fetchDefinitions } from "@/lib/rabbit-api"
import { useCluster } from "@/store/cluster"
import { useAuth } from "@/store/auth"

interface SelectedFile {
  name: string
  definitions: BrokerDefinitions
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`
}

function FileNameField({
  value,
  placeholder,
  disabled,
  onChange,
}: {
  value: string
  placeholder: string
  disabled: boolean
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label
        htmlFor="definitions-file-name"
        className="text-xs text-muted-foreground"
      >
        File name
      </Label>
      <Input
        id="definitions-file-name"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

function CountStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="data-cell text-sm font-medium">{value}</span>
    </div>
  )
}

function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function DefinitionsView() {
  const { data, status, error, actions } = useCluster()
  const { user } = useAuth()
  const [excluded, setExcluded] = useState<string[]>([])
  const [file, setFile] = useState<SelectedFile | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [overwrite, setOverwrite] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [fileName, setFileName] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const defaultFileName = `${data.cluster.name}-definitions.json`
  const trimmedFileName = fileName.trim()
  const exportFileName = trimmedFileName
    ? /\.json$/i.test(trimmedFileName)
      ? trimmedFileName
      : `${trimmedFileName}.json`
    : defaultFileName

  const selected = useMemo(
    () =>
      data.vhosts
        .filter((vhost) => !excluded.includes(vhost.name))
        .map((vhost) => vhost.name),
    [data.vhosts, excluded]
  )
  const selectedSet = useMemo(() => new Set(selected), [selected])
  const allSelected =
    data.vhosts.length > 0 && selected.length === data.vhosts.length

  const counts = useMemo(
    () => ({
      queues: data.queues.filter((queue) => selectedSet.has(queue.vhost))
        .length,
      exchanges: data.exchanges.filter(
        (exchange) => exchange.name !== "" && selectedSet.has(exchange.vhost)
      ).length,
      bindings: data.bindings.filter((binding) =>
        selectedSet.has(binding.vhost)
      ).length,
      policies: data.policies.filter((policy) => selectedSet.has(policy.vhost))
        .length,
    }),
    [data.queues, data.exchanges, data.bindings, data.policies, selectedSet]
  )

  const vhostUsage = useMemo(() => {
    const usage = new Map<string, { queues: number; exchanges: number }>()
    for (const vhost of data.vhosts)
      usage.set(vhost.name, { queues: 0, exchanges: 0 })
    for (const queue of data.queues) {
      const entry = usage.get(queue.vhost)
      if (entry) entry.queues += 1
    }
    for (const exchange of data.exchanges) {
      if (exchange.name === "") continue
      const entry = usage.get(exchange.vhost)
      if (entry) entry.exchanges += 1
    }
    return usage
  }, [data.vhosts, data.queues, data.exchanges])

  const toggleVhost = (name: string) =>
    setExcluded((current) =>
      current.includes(name)
        ? current.filter((entry) => entry !== name)
        : [...current, name]
    )

  const handleExport = async () => {
    const filename = exportFileName

    if (!IS_DEMO) {
      const token = user?.token
      if (!token) {
        toast.error("Could not export definitions", {
          description: "Your session has expired. Sign in again.",
        })
        return
      }
      setExporting(true)
      try {
        const definitions = await fetchDefinitions(token)
        downloadJson(filename, definitions)
        toast.success("Definitions exported", {
          description: "Downloaded from the management API.",
        })
      } catch (cause) {
        toast.error("Could not export definitions", {
          description:
            cause instanceof Error
              ? cause.message
              : "The management API did not respond.",
        })
      } finally {
        setExporting(false)
      }
      return
    }

    const definitions = buildDefinitions(data, selected)
    downloadJson(filename, definitions)
    toast.success("Definitions exported", {
      description: `${counts.queues + counts.exchanges + counts.bindings + counts.policies + data.users.length} objects across ${plural(selected.length, "virtual host")}.`,
    })
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    const next = input.files?.[0]
    if (!next) return
    setParseError(null)
    try {
      const text = await next.text()
      const definitions = parseDefinitions(text)
      setFile({ name: next.name, definitions })
    } catch (cause) {
      setFile(null)
      setParseError(
        cause instanceof Error ? cause.message : "Could not read that file."
      )
    } finally {
      input.value = ""
    }
  }

  const handleImport = () => {
    if (!file) return
    const summary = summarizeDefinitions(file.definitions)
    actions.importDefinitions(file.definitions, overwrite)
    toast.success("Definitions imported", {
      description: `${plural(summary.total, "object")} from ${file.name}${overwrite ? " with overwrite" : ""}.`,
    })
    setFile(null)
    setParseError(null)
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title="Import / export definitions"
        eyebrow={
          <Badge variant="outline">
            RabbitMQ {data.cluster.version} · definitions v2
          </Badge>
        }
        description="Move users, virtual hosts, topology and policies between brokers as a JSON document."
      />

      {error ? <RegionError message={error} onRetry={actions.retry} /> : null}

      <div className="grid min-w-0 gap-4 xl:grid-cols-2 xl:items-start">
        <SectionFrame
          title="Export definitions"
          description={
            IS_DEMO
              ? "Choose the virtual hosts to include in the snapshot."
              : "Download the broker's definitions from the management API."
          }
          actions={
            IS_DEMO ? (
              <Badge variant="outline">{selected.length} selected</Badge>
            ) : (
              <Badge variant="outline">Full snapshot</Badge>
            )
          }
        >
          {status === "loading" ? (
            <RegionSkeleton rows={6} />
          ) : !IS_DEMO ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                The exported JSON contains all virtual hosts, users,
                permissions, policies and topology as reported by the broker.
              </p>
              <FileNameField
                value={fileName}
                placeholder={defaultFileName}
                disabled={exporting}
                onChange={setFileName}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">
                  Fetched live from the broker, not from this console's state.
                </span>
                <Button
                  type="button"
                  onClick={handleExport}
                  disabled={exporting}
                >
                  {exporting ? (
                    <Spinner aria-hidden="true" />
                  ) : (
                    <DownloadIcon data-icon="inline-start" aria-hidden="true" />
                  )}
                  {exporting ? "Exporting…" : "Export definitions"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) =>
                    setExcluded(
                      checked ? [] : data.vhosts.map((vhost) => vhost.name)
                    )
                  }
                />
                All virtual hosts
              </Label>

              <div className="flex flex-col divide-y divide-border border-y border-border">
                {data.vhosts.map((vhost) => {
                  const usage = vhostUsage.get(vhost.name)
                  return (
                    <Label
                      key={vhost.name}
                      className="flex items-center gap-2 py-2 first:pt-0 last:pb-0"
                    >
                      <Checkbox
                        checked={!excluded.includes(vhost.name)}
                        onCheckedChange={() => toggleVhost(vhost.name)}
                      />
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {vhost.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {plural(usage?.queues ?? 0, "queue")} ·{" "}
                        {plural(usage?.exchanges ?? 0, "exchange")}
                      </span>
                    </Label>
                  )
                })}
              </div>

              <dl className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                <CountStat label="Queues" value={counts.queues} />
                <CountStat label="Exchanges" value={counts.exchanges} />
                <CountStat label="Bindings" value={counts.bindings} />
                <CountStat label="Policies" value={counts.policies} />
                <CountStat label="Users" value={data.users.length} />
              </dl>

              <FileNameField
                value={fileName}
                placeholder={defaultFileName}
                disabled={exporting}
                onChange={setFileName}
              />

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">
                  Exports the selected virtual hosts. Users are always included.
                </span>
                <Button
                  type="button"
                  onClick={handleExport}
                  disabled={selected.length === 0}
                >
                  <DownloadIcon data-icon="inline-start" aria-hidden="true" />
                  Export definitions
                </Button>
              </div>
            </div>
          )}
        </SectionFrame>

        <SectionFrame
          title="Import definitions"
          description="Upload a definitions file exported from another broker."
          actions={
            file ? (
              <Badge variant="success-light">Ready to import</Badge>
            ) : (
              <Badge variant="outline">No file</Badge>
            )
          }
        >
          <div className="flex flex-col gap-3">
            <input
              ref={inputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileChange}
            />

            {file ? (
              <div className="flex flex-col gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Badge variant="outline" className="shrink-0">
                    <FileJsonIcon aria-hidden="true" />
                    JSON
                  </Badge>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">
                      {file.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      RabbitMQ {file.definitions.rabbit_version}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => inputRef.current?.click()}
                  >
                    Replace
                  </Button>
                </div>
                <dl className="grid grid-cols-3 gap-3" role="status">
                  <CountStat
                    label="Vhosts"
                    value={file.definitions.vhosts.length}
                  />
                  <CountStat
                    label="Queues"
                    value={file.definitions.queues.length}
                  />
                  <CountStat
                    label="Exchanges"
                    value={file.definitions.exchanges.length}
                  />
                  <CountStat
                    label="Bindings"
                    value={file.definitions.bindings.length}
                  />
                  <CountStat
                    label="Users"
                    value={file.definitions.users.length}
                  />
                  <CountStat
                    label="Policies"
                    value={file.definitions.policies.length}
                  />
                </dl>
              </div>
            ) : (
              <RegionEmpty
                title="No definitions file"
                description="Choose a JSON file exported from a RabbitMQ broker to preview and import it."
                icon={<FileJsonIcon />}
                action={
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => inputRef.current?.click()}
                  >
                    <UploadIcon data-icon="inline-start" aria-hidden="true" />
                    Choose file
                  </Button>
                }
              />
            )}

            {parseError ? (
              <Alert variant="destructive">
                <TriangleAlertIcon aria-hidden="true" />
                <AlertTitle>Could not read definitions</AlertTitle>
                <AlertDescription>{parseError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex items-start justify-between gap-4 border-t border-border pt-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium">
                  Overwrite existing definitions
                </span>
                <span className="text-xs text-muted-foreground">
                  Imported queues, exchanges, users and policies replace
                  conflicting entries.
                </span>
              </div>
              <Switch
                checked={overwrite}
                onCheckedChange={setOverwrite}
                aria-label="Overwrite existing definitions"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {file
                  ? `${summarizeDefinitions(file.definitions).total} definitions parsed.`
                  : "Nothing will change until you import a file."}
              </span>
              <Button
                type="button"
                onClick={handleImport}
                disabled={!file || status === "loading"}
              >
                <UploadIcon data-icon="inline-start" aria-hidden="true" />
                Import definitions
              </Button>
            </div>
          </div>
        </SectionFrame>
      </div>
    </div>
  )
}
