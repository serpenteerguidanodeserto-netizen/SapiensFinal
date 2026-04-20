// /lib/ai/transposition.ts

export interface TTEntry {
  depth: number
  value: number
}

const table = new Map<bigint, TTEntry>()

export function store(hash: bigint, depth: number, value: number) {
  table.set(hash, { depth, value })
}

export function lookup(hash: bigint, depth: number): number | null {
  const entry = table.get(hash)
  if (!entry) return null
  if (entry.depth >= depth) return entry.value
  return null
}

export function clearTable() {
  table.clear()
}