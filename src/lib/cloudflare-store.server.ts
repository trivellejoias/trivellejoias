import { env } from 'cloudflare:workers'

export type CatalogKV = {
  get<T = unknown>(key: string, type: 'json'): Promise<T | null>
  put(key: string, value: string, options?: { expirationTtl?: number; metadata?: unknown }): Promise<void>
}

export function getCatalogKV(): CatalogKV {
  const kv = (env as unknown as { CATALOG_KV?: CatalogKV }).CATALOG_KV
  if (!kv) throw new Error('storage_not_configured')
  return kv
}

export function getAdminPassword(): string {
  return String((env as unknown as { ADMIN_PASSWORD?: string }).ADMIN_PASSWORD ?? '')
}
