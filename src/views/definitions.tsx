import { useRef, useState, type ChangeEvent } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { PageHeader } from "@/components/page-header"
import { SectionFrame } from "@/components/detail"
import {
  RegionEmpty,
  RegionError,
  RegionSkeleton,
} from "@/components/region-states"
import {
  parseDefinitions,
  summarizeDefinitions,
  type BrokerDefinitions,
} from "@/lib/definitions"
import { fetchDefinitions, uploadDefinitions } from "@/lib/rabbit-api"
import { useCluster } from "@/store/cluster"
import { useAuth } from "@/store/auth"
import { ConditionalRender } from "@/components/conditional-render"

interface SelectedFile {
  name: string
  raw: File
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
  const [file, setFile] = useState<SelectedFile | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [fileName, setFileName] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const defaultFileName = `${data.cluster.name}-definitions.json`
  const trimmedFileName = fileName.trim()
  const exportFileName = trimmedFileName
    ? /\.json$/i.test(trimmedFileName)
      ? trimmedFileName
      : `${trimmedFileName}.json`
    : defaultFileName

  const handleExport = async () => {
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
      downloadJson(exportFileName, definitions)
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
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    const next = input.files?.[0]
    if (!next) return
    setParseError(null)
    try {
      const text = await next.text()
      const definitions = parseDefinitions(text)
      setFile({ name: next.name, raw: next, definitions })
    } catch (cause) {
      setFile(null)
      setParseError(
        cause instanceof Error ? cause.message : "Could not read that file."
      )
    } finally {
      input.value = ""
    }
  }

  const handleImport = async () => {
    if (!file) return
    const summary = summarizeDefinitions(file.definitions)
    const token = user?.token
    if (!token) {
      toast.error("Could not import definitions", {
        description: "Your session has expired. Sign in again.",
      })
      return
    }
    setImporting(true)
    try {
      await uploadDefinitions(token, file.raw)
      toast.success("Definitions imported", {
        description: `${plural(summary.total, "object")} from ${file.name}.`,
      })
      setFile(null)
      setParseError(null)
      actions.refresh()
    } catch (cause) {
      toast.error("Could not import definitions", {
        description:
          cause instanceof Error
            ? cause.message
            : "The management API did not respond.",
      })
    } finally {
      setImporting(false)
    }
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

      <ConditionalRender condition={error !== null}>
        <RegionError message={error!} onRetry={actions.retry} /> 
      </ConditionalRender>

      <div className="grid min-w-0 gap-4 xl:grid-cols-2 xl:items-start">
        <SectionFrame
          title="Export definitions"
          description="Download the broker's definitions from the management API."
          actions={<Badge variant="outline">Full snapshot</Badge>}
        >
          <ConditionalRender
            condition={status !== "loading" }
            default={<RegionSkeleton rows={3} />}
          >
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
                  <ConditionalRender
                    condition={exporting}
                    default={<DownloadIcon data-icon="inline-start" aria-hidden="true" />}
                  >
                    <Spinner aria-hidden="true" />
                  </ConditionalRender>
                  {exporting ? "Exporting…" : "Export definitions"}
                </Button>
              </div>
            </div>
          </ConditionalRender>
        </SectionFrame>

        <SectionFrame
          title="Import definitions"
          description="Upload a definitions file exported from another broker."
          actions={
            importing ? (
              <Badge variant="outline">Importing…</Badge>
            ) : file ? (
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

            <ConditionalRender
              condition={file !== null}
              default={
                <RegionEmpty
                  title="No definitions file"
                  description="Choose a JSON file exported from a RabbitMQ broker to preview and import it."
                  icon={<FileJsonIcon />}
                  action={
                    <Button
                      type="button"
                      variant="outline"
                      disabled={importing}
                      onClick={() => inputRef.current?.click()}
                    >
                      <UploadIcon data-icon="inline-start" aria-hidden="true" />
                      Choose file
                    </Button>
                  }
                />
              }
            >
              <div className="flex flex-col gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Badge variant="outline" className="shrink-0">
                    <FileJsonIcon aria-hidden="true" />
                    JSON
                  </Badge>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">
                      {file?.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      RabbitMQ {file?.definitions?.rabbit_version}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={importing}
                    onClick={() => inputRef.current?.click()}
                  >
                    Replace
                  </Button>
                </div>
                <dl className="grid grid-cols-3 gap-3" role="status">
                  <CountStat
                    label="Vhosts"
                    value={file?.definitions?.vhosts?.length!}
                  />
                  <CountStat
                    label="Queues"
                    value={file?.definitions?.queues?.length!}
                  />
                  <CountStat
                    label="Exchanges"
                    value={file?.definitions?.exchanges?.length!}
                  />
                  <CountStat
                    label="Bindings"
                    value={file?.definitions?.bindings?.length!}
                  />
                  <CountStat
                    label="Users"
                    value={file?.definitions?.users?.length!}
                  />
                  <CountStat
                    label="Policies"
                    value={file?.definitions?.policies?.length!}
                  />
                </dl>
              </div>
            </ConditionalRender>

            <ConditionalRender condition={parseError !== null}>
              <Alert variant="destructive">
                <TriangleAlertIcon aria-hidden="true" />
                <AlertTitle>Could not read definitions</AlertTitle>
                <AlertDescription>{parseError}</AlertDescription>
              </Alert>
            </ConditionalRender>

            <p className="border-t border-border pt-3 text-xs text-muted-foreground">
              Existing users, virtual hosts, queues, exchanges and policies with
              matching names are replaced.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {file
                  ? `${summarizeDefinitions(file.definitions).total} definitions parsed.`
                  : "Nothing will change until you import a file."}
              </span>
              <Button
                type="button"
                onClick={handleImport}
                disabled={!file || status === "loading" || importing}
              >
                <ConditionalRender
                  condition={importing}
                  default={<UploadIcon data-icon="inline-start" aria-hidden="true" />}
                >
                  <Spinner aria-hidden="true" />
                </ConditionalRender>
                {importing ? "Importing…" : "Import definitions"}
              </Button>
            </div>
          </div>
        </SectionFrame>
      </div>
    </div>
  )
}
