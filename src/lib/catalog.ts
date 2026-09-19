export type ProductOverride = {
  hidden?: boolean
  name?: string
  description?: string
  shortDescription?: string
  price?: number
  image?: string
  images?: string[]
}

export type CatalogOverrides = Record<string, ProductOverride>

export async function loadCatalogOverrides(): Promise<CatalogOverrides> {
  try {
    const response = await fetch('/catalog-overrides.json', { cache: 'no-store' })
    return response.ok ? await response.json() : {}
  } catch {
    return {}
  }
}

export function applyOverride<T extends { id: number }>(product: T, overrides: CatalogOverrides): T & ProductOverride {
  return { ...product, ...(overrides[String(product.id)] ?? {}) }
}
