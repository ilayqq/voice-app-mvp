import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout.tsx'
import type { Product } from '../types/index.ts'
import apiClient from '../services/api.ts'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import ProductForm from '../components/ProductForm.tsx'
import { useNavigate } from 'react-router-dom'
import ProductThumbnail from '../components/ProductThumbnail.tsx'
import { formatMoney } from '../utils/format.ts'
import {
    ChevronRight,
    Package,
    Plus,
    Search,
    Trash2,
} from 'lucide-react'

const LOW_STOCK_THRESHOLD = 5

function stockTotal(product: Product): number {
    return product.stocks?.reduce((sum, s) => sum + s.quantity, 0) ?? 0
}

export default function Products() {
    const { t } = useTranslation()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const navigate = useNavigate()

    useEffect(() => {
        apiClient
            .getProducts()
            .then(setProducts)
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    const filteredProducts = useMemo(() => {
        const q = searchTerm.trim().toLowerCase()
        if (!q) return products
        return products.filter(
            p =>
                p.name.toLowerCase().includes(q) ||
                p.barcode.toLowerCase().includes(q) ||
                (p.category?.toLowerCase().includes(q) ?? false),
        )
    }, [products, searchTerm])

    const handleDelete = async (product: Product) => {
        if (confirm(t('products.deleteConfirm'))) {
            await apiClient.deleteProduct(product.barcode)
            setProducts(prev => prev.filter(p => p.id !== product.id))
        }
    }

    const openCreateForm = () => {
        setEditingProduct(null)
        setShowForm(true)
    }

    return (
        <Layout title={t('products.title')} showBack>
            <div className="relative isolate px-6 pt-8 pb-16 lg:px-8 text-white">
                <GradientTop />

                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={pageVariants}
                    className="mx-auto max-w-6xl space-y-4"
                >
                    <motion.div
                        variants={itemVariants}
                        className="rounded-xl bg-white/10 p-4 ring-1 ring-white/20 space-y-4"
                    >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="relative flex-1">
                                <Search
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    size={18}
                                    aria-hidden
                                />
                                <input
                                    type="search"
                                    placeholder={t('products.searchPlaceholder')}
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full rounded-lg bg-white/10 py-2.5 pl-10 pr-4
                                    ring-1 ring-white/20 placeholder-gray-400
                                    focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                                />
                            </div>

                            {!showForm && (
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={openCreateForm}
                                    className="inline-flex items-center justify-center gap-2
                                    rounded-lg bg-indigo-500 px-5 py-2.5 font-semibold
                                    hover:bg-indigo-400 transition shrink-0"
                                >
                                    <Plus size={18} aria-hidden />
                                    {t('products.addProduct')}
                                </motion.button>
                            )}
                        </div>

                        {!loading && products.length > 0 && (
                            <p className="text-xs text-gray-400">
                                {searchTerm.trim()
                                    ? t('products.shownCount', {
                                          count: filteredProducts.length,
                                          total: products.length,
                                      })
                                    : t('products.totalCount', { count: products.length })}
                            </p>
                        )}
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {showForm && (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 12 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                className="rounded-xl bg-white/10 p-6 ring-1 ring-white/20"
                            >
                                <ProductForm
                                    product={editingProduct}
                                    onSave={async (product, imageFile) => {
                                        let image_url = product.image_url
                                        if (imageFile) {
                                            image_url = await apiClient.uploadProductImage(imageFile)
                                        }
                                        const payload = { ...product, image_url }
                                        if (editingProduct) {
                                            const updated = await apiClient.updateProduct(
                                                String(editingProduct.barcode),
                                                payload,
                                            )
                                            setProducts(prev =>
                                                prev.map(p => (p.id === updated.id ? updated : p)),
                                            )
                                        } else {
                                            const created = await apiClient.createProduct(payload)
                                            setProducts(prev => [...prev, created])
                                        }
                                        setShowForm(false)
                                        setEditingProduct(null)
                                    }}
                                    onCancel={() => {
                                        setShowForm(false)
                                        setEditingProduct(null)
                                    }}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!showForm && (
                        <motion.div variants={itemVariants} className="rounded-xl bg-white/10 ring-1 ring-white/20 overflow-hidden">
                            {loading ? (
                                <div className="p-8 space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div
                                            key={i}
                                            className="flex gap-4 animate-pulse"
                                        >
                                            <div className="h-16 w-16 rounded-xl bg-white/10" />
                                            <div className="flex-1 space-y-2 py-1">
                                                <div className="h-4 w-2/3 rounded bg-white/10" />
                                                <div className="h-3 w-1/3 rounded bg-white/10" />
                                            </div>
                                        </div>
                                    ))}
                                    <p className="text-center text-sm text-gray-400">{t('products.loading')}</p>
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                                    <div className="rounded-full bg-white/10 p-4 ring-1 ring-white/20">
                                        <Package className="text-gray-400" size={32} aria-hidden />
                                    </div>
                                    <p className="text-gray-300">
                                        {searchTerm.trim()
                                            ? t('products.notFound')
                                            : t('products.noProducts')}
                                    </p>
                                    {!searchTerm.trim() && (
                                        <button
                                            type="button"
                                            onClick={openCreateForm}
                                            className="mt-2 inline-flex items-center gap-2 rounded-lg
                                            bg-indigo-500 px-4 py-2 text-sm font-semibold hover:bg-indigo-400 transition"
                                        >
                                            <Plus size={16} aria-hidden />
                                            {t('products.addProduct')}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <ul className="divide-y divide-white/10">
                                    <AnimatePresence initial={false}>
                                        {filteredProducts.map(product => (
                                            <ProductRow
                                                key={product.id ?? product.barcode}
                                                product={product}
                                                stock={stockTotal(product)}
                                                onOpen={() => navigate(`/products/${product.barcode}`)}
                                                onDelete={() => handleDelete(product)}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </ul>
                            )}
                        </motion.div>
                    )}
                </motion.div>

                <GradientBottom />
            </div>
        </Layout>
    )
}

function ProductRow({
    product,
    stock,
    onOpen,
    onDelete,
}: {
    product: Product
    stock: number
    onOpen: () => void
    onDelete: () => void
}) {
    const { t } = useTranslation()
    const stockStatus =
        stock === 0 ? 'out' : stock <= LOW_STOCK_THRESHOLD ? 'low' : 'ok'

    const stockClasses = {
        out: 'bg-gray-500/15 text-gray-400 ring-gray-500/30',
        low: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
        ok: 'bg-green-500/15 text-green-300 ring-green-500/30',
    }

    return (
        <motion.li
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="group"
        >
            <div
                role="button"
                tabIndex={0}
                onClick={onOpen}
                onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onOpen()
                    }
                }}
                className="flex w-full cursor-pointer items-center gap-4 px-4 py-4
                text-left transition hover:bg-white/5 sm:px-5"
            >
                <ProductThumbnail product={product} size="sm" />

                <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="font-semibold truncate">{product.name}</p>
                    <p className="font-mono text-xs text-gray-400 truncate">{product.barcode}</p>
                    <div className="flex flex-wrap items-center gap-2">
                        {product.category && (
                            <span className="inline-block rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs text-indigo-300 ring-1 ring-indigo-400/30">
                                {product.category}
                            </span>
                        )}
                        {(product.price ?? 0) > 0 && (
                            <span className="text-xs text-gray-400">{formatMoney(product.price!)}</span>
                        )}
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <div className="text-right">
                        <span
                            className={`inline-flex min-w-[3rem] justify-center rounded-full px-2.5 py-1 text-sm font-semibold ring-1 ${stockClasses[stockStatus]}`}
                        >
                            {stock} {t('products.unit')}
                        </span>
                        {stockStatus === 'low' && (
                            <p className="mt-1 text-[10px] uppercase tracking-wide text-amber-400/90 text-right">
                                {t('dashboard.lowStock')}
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={e => {
                            e.stopPropagation()
                            onDelete()
                        }}
                        className="rounded-lg p-2 text-gray-500 opacity-0 transition
                        hover:bg-red-500/10 hover:text-red-400
                        group-hover:opacity-100 focus:opacity-100 focus:outline-none
                        focus-visible:ring-2 focus-visible:ring-red-400/50"
                        aria-label={t('products.delete')}
                    >
                        <Trash2 size={18} />
                    </button>

                    <ChevronRight
                        className="text-gray-500 group-hover:text-indigo-300 transition shrink-0"
                        size={20}
                        aria-hidden
                    />
                </div>
            </div>
        </motion.li>
    )
}

const pageVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
}

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, ease: 'easeOut' },
    },
}

function GradientTop() {
    return (
        <div
            aria-hidden="true"
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        >
            <div
                style={{
                    clipPath:
                        'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                }}
                className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5
                -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30
                sm:left-[calc(50%-30rem)] sm:w-288.75"
            />
        </div>
    )
}

function GradientBottom() {
    return (
        <div
            aria-hidden="true"
            className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
        >
            <div
                style={{
                    clipPath:
                        'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                }}
                className="relative left-[calc(50%+3rem)] aspect-1155/678 w-144.5
                -translate-x-1/2 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30
                sm:left-[calc(50%+36rem)] sm:w-288.75"
            />
        </div>
    )
}
