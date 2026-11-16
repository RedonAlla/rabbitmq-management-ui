import type { Queue } from "@/data/types";

export type Kind = "purge" | "delete";

export type ConfirmState = {
  kind: Kind;
  queue: Queue
} | null;
