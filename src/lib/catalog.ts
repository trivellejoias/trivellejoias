export type ProductOverride = {
  hidden?: boolean
  name?: string
  description?: string
  shortDescription?: string
  price?: number
  stock?: number
  image?: string
  images?: string[]
}

export type CatalogOverrides = Record<string, ProductOverride>

export async function loadCatalogOverrides(): Promise<CatalogOverrides> {
  try {
    const response = await fetch('/.netlify/functions/catalog-data', { cache: 'no-store' })
    if (!response.ok) return {}
    const data = await response.json()
    return data && typeof data === 'object' ? (data as CatalogOverrides) : {}
  } catch {
    return {}
  }
}

export function applyOverride<T extends { id: number }>(product: T, overrides: CatalogOverrides): T & ProductOverride {
  return { ...product, ...(overrides[String(product.id)] ?? {}) }
}
