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
    const published: CatalogOverrides = response.ok ? await response.json() : {}
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('trivelle-catalog-overrides')
      if (local) return { ...published, ...JSON.parse(local) }
    }
    return published
  } catch {
    try {
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem('trivelle-catalog-overrides')
        return local ? JSON.parse(local) : {}
      }
    } catch {}
    return {}
  }
}

export function applyOverride<T extends { id: number }>(product: T, overrides: CatalogOverrides): T & ProductOverride {
  return { ...product, ...(overrides[String(product.id)] ?? {}) }
}
