import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import products, { type Product, type ProductCategory } from '@/data/products'
import type {
  CatalogAdditions,
  CatalogOverrides,
  CatalogSettings,
  ProductOverride,
} from '@/lib/catalog'

export const Route = createFileRoute('/admin')({ component: AdminPage })

type AdminTab =
  | 'inicio'
  | 'estatisticas'
  | 'novo'
  | 'ativos'
  | 'ocultos'
  | 'estoqueZero'
  | 'excluidos'
  | 'configuracoes'

type AnalyticsStats = {
  visits: number
  productViews: number
  whatsappClicks: number
  instagramClicks: number
  products: Record<
    string,
    { name: string; views: number; whatsappClicks: number }
  >
  days: Record<
    string,
    {
      visits: number
      productViews: number
      whatsappClicks: number
      instagramClicks: number
    }
  >
}

const categories: ProductCategory[] = [
  'Anéis',
  'Brincos',
  'Colares',
  'Pulseiras',
  'Tornozeleiras',
  'Conjuntos',
  'Outros',
]

const defaultSettings: CatalogSettings = {
  instagramUrl: 'https://www.instagram.com/trivellejoias/',
  whatsappNumber: '5519982124939',
  whatsappMessage:
    'Olá! Vim pelo catálogo da Trivelle e gostaria de saber mais sobre as peças.',
  productOrder: [],
}

function AdminPage() {
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [overrides, setOverrides] = useState<CatalogOverrides>({})
  const [additions, setAdditions] = useState<CatalogAdditions>({})
  const [settings, setSettings] =
    useState<CatalogSettings>(defaultSettings)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<number | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')
  const [tab, setTab] = useState<AdminTab>('inicio')
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState('')
  const [draggedProductId, setDraggedProductId] = useState<number | null>(
    null,
  )
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(
    null,
  )

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const session = sessionStorage.getItem('trivelle-admin-auth')

    if (session === 'ok') {
      setAuthorized(true)
    }

    setChecking(false)
  }, [])

  async function loadData() {
    const [catalogResponse, settingsResponse, additionsResponse] =
      await Promise.all([
        fetch('/catalog-data', { cache: 'no-store' }),
        fetch('/catalog-data?type=settings', { cache: 'no-store' }),
        fetch('/catalog-data?type=additions', { cache: 'no-store' }),
      ])

    if (!catalogResponse.ok) {
      throw new Error()
    }

    const catalog = await catalogResponse.json()

    const remoteSettings = settingsResponse.ok
      ? await settingsResponse.json()
      : {}

    const remoteAdditions = additionsResponse.ok
      ? await additionsResponse.json()
      : {}

    setOverrides(catalog ?? {})
    setSettings((prev) => ({
      ...prev,
      ...(remoteSettings ?? {}),
    }))
    setAdditions(remoteAdditions ?? {})
    setLoaded(true)
  }

  useEffect(() => {
    if (!authorized) return

    loadData().catch(() => setLoaded(true))
  }, [authorized])

  async function login() {
    setLoginError('')

    try {
      const response = await fetch('/admin-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        throw new Error()
      }

      sessionStorage.setItem('trivelle-admin-auth', 'ok')
      sessionStorage.setItem('trivelle-admin-password', password)

      setAuthorized(true)
      setPassword('')
    } catch {
      setLoginError('Senha incorreta. Tente novamente.')
    }
  }

  const allProducts = useMemo<Product[]>(() => {
    const base = [...products, ...Object.values(additions)]

    const order = settings.productOrder ?? []

    const rank = new Map(
      order.map((id, index) => [id, index]),
    )

    return base.sort(
      (a, b) =>
        (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER),
    )
  }, [additions, settings.productOrder])

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()

    return allProducts.filter((p) => {
      const o = overrides[String(p.id)] ?? {}
      const stock = o.stock ?? p.stock ?? 0

      const isDeleted = Boolean(o.deleted)
      const isHidden = Boolean(o.hidden) && !isDeleted
      const isStockZero =
        !isDeleted && !isHidden && stock <= 0
      const isActive =
        !isDeleted && !isHidden && stock > 0

      const matchesTab =
        tab === 'excluidos'
          ? isDeleted
          : tab === 'ocultos'
