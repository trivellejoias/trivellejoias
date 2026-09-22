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
  let published: CatalogOverrides = {}
  try {
    const response = await fetch('/catalog-overrides.json', { cache: 'no-store' })
    published = response.ok ? await response.json() : {}
  } catch {
    published = {}
  }

  // Mantém as alterações salvas no dispositivo do administrador como complemento.
  // Isso permite testar as edições imediatamente sem precisar publicar no GitHub.
  try {
    const local = localStorage.getItem('trivelle-catalog-overrides')
    if (!local) return published
    const localOverrides: CatalogOverrides = JSON.parse(local)
    const merged: CatalogOverrides = { ...published }
    for (const [id, override] of Object.entries(localOverrides)) {
      merged[id] = { ...(merged[id] ?? {}), ...override }
    }
    return merged
  } catch {
    return published
  }
}

export function applyOverride<T extends { id: number }>(product: T, overrides: CatalogOverrides): T & ProductOverride {
  return { ...product, ...(overrides[String(product.id)] ?? {}) }
}
