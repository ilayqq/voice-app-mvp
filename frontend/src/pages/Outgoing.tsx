import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, type Variants } from 'framer-motion'
import Layout from '../components/Layout.tsx'
import BarcodeScanner from '../components/BarcodeScanner.tsx'
import apiClient from '../services/api.ts'
import type { Product } from '../types/index.ts'

function productKey(product: Product): string {
    return String(product.id ?? product.barcode)
}

function stockFromProduct(product: Product): number {
    return product.stocks?.reduce((sum, s) => sum + s.quantity, 0) ?? 0
}

export default function Outgoing() {
    const { t } = useTranslation()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [scanning, setScanning] = useState(false)
    const [search, setSearch] = useState('')
    const [selectedProductId, setSelectedProductId] = useState('')
    const [quantity, setQuantity] = useState('1')
    const [notes, setNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        apiClient
            .getProducts()
            .then(setProducts)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const filteredProducts = useMemo(() => {
        const withStock = products.filter(p => stockFromProduct(p) > 0)
        const q = search.trim().toLowerCase()
        if (!q) return withStock
        return withStock.filter(
            p =>
                p.name.toLowerCase().includes(q) ||
                p.barcode.toLowerCase().includes(q)
        )
    }, [products, search])

    const selectedProduct = products.find(p => productKey(p) === selectedProductId)

    const currentStock = selectedProduct ? stockFromProduct(selectedProduct) : 0

    const handleScan = async (code: string) => {
        setScanning(false)
        setSearch(code)

        const local = products.find(p => p.barcode === code)
        if (local) {
            if (stockFromProduct(local) <= 0) {
                alert(t('outgoing.noStock'))
                return
            }
            setSelectedProductId(productKey(local))
            return
        }

        try {
            const product = await apiClient.getProductByBarcode(code)
            if (product) {
                setProducts(prev => {
                    const exists = prev.some(p => p.barcode === product.barcode)
                    return exists ? prev : [...prev, product]
                })
                if (stockFromProduct(product) <= 0) {
                    alert(t('outgoing.noStock'))
                    return
                }
                setSelectedProductId(productKey(product))
            }
        } catch {
            setSelectedProductId('')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedProduct || !selectedProduct.id) return

        const qty = parseFloat(quantity)
        if (!qty || qty <= 0) {
            alert(t('outgoing.fillFields'))
            return
        }

        if (qty > currentStock) {
            alert(t('outgoing.insufficientStock'))
            return
        }

        setSubmitting(true)
        try {
            await apiClient.createStockMovement({
                product_id: selectedProduct.id,
                type: 'outgoing',
                quantity: qty,
                description: notes.trim() || undefined,
            })

            const refreshed = await apiClient.getProducts()
            setProducts(refreshed)

            setSelectedProductId('')
            setQuantity('1')
            setNotes('')
            setSearch('')
            alert(t('outgoing.success'))
        } catch (err) {
            const msg = err instanceof Error ? err.message : ''
            if (msg.includes('insufficient')) {
                alert(t('outgoing.insufficientStock'))
            } else {
                alert(msg || t('outgoing.fillFields'))
            }
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Layout title={t('outgoing.title')} showBack>
            <div className="relative isolate px-6 pt-12 pb-16 lg:px-8 text-white">
                <GradientTop />

                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={pageVariants}
                    className="mx-auto max-w-2xl space-y-6"
                >
                    <motion.button
                        type="button"
                        variants={itemVariants}
                        onClick={() => setScanning(true)}
                        className="w-full rounded-lg bg-indigo-500 px-6 py-3 font-semibold
                        hover:bg-indigo-400 transition shadow-lg shadow-indigo-500/20"
                    >
                        📷 {t('outgoing.scan')}
                    </motion.button>

                    {scanning && (
                        <motion.div variants={itemVariants}>
                            <BarcodeScanner
                                onScan={handleScan}
                                onClose={() => setScanning(false)}
                            />
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <motion.div variants={itemVariants} className="space-y-2">
                            <label className="text-sm text-gray-300">
                                {t('outgoing.search')}
                            </label>
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder={t('outgoing.searchPlaceholder')}
                                className="w-full rounded-lg bg-white/10 px-4 py-2
                                ring-1 ring-white/20 placeholder-gray-400
                                focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-2">
                            <label className="text-sm text-gray-300">
                                {t('outgoing.product')} *
                            </label>
                            {loading ? (
                                <p className="text-gray-400 text-sm">{t('outgoing.loading')}</p>
                            ) : filteredProducts.length === 0 ? (
                                <p className="text-gray-400 text-sm">{t('outgoing.noProducts')}</p>
                            ) : (
                                <select
                                    value={selectedProductId}
                                    onChange={e => setSelectedProductId(e.target.value)}
                                    required
                                    className="w-full rounded-lg bg-white/10 px-4 py-2
                                    ring-1 ring-white/20 focus:outline-none
                                    focus:ring-2 focus:ring-indigo-400"
                                >
                                    <option value="">{t('outgoing.selectProduct')}</option>
                                    {filteredProducts.map(product => {
                                        const stock = stockFromProduct(product)
                                        return (
                                            <option
                                                key={productKey(product)}
                                                value={productKey(product)}
                                            >
                                                {product.name} ({product.barcode}) —{' '}
                                                {t('outgoing.stockLabel', { count: stock })}
                                            </option>
                                        )
                                    })}
                                </select>
                            )}
                        </motion.div>

                        {selectedProduct && (
                            <motion.div
                                variants={itemVariants}
                                className="rounded-lg bg-amber-500/10 px-4 py-3
                                ring-1 ring-amber-400/30 text-sm"
                            >
                                {t('outgoing.availableStock')}:{' '}
                                <span className="font-semibold text-white">
                                    {currentStock} {t('outgoing.unit')}
                                </span>
                            </motion.div>
                        )}

                        <motion.div variants={itemVariants} className="space-y-2">
                            <label className="text-sm text-gray-300">
                                {t('outgoing.quantity')} *
                            </label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                                required
                                min="0.01"
                                max={currentStock > 0 ? currentStock : undefined}
                                step="0.01"
                                placeholder="0"
                                className="w-full rounded-lg bg-white/10 px-4 py-2
                                ring-1 ring-white/20 focus:outline-none
                                focus:ring-2 focus:ring-indigo-400"
                            />
                            <p className="text-xs text-gray-400">{t('outgoing.unitHint')}</p>
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-2">
                            <label className="text-sm text-gray-300">
                                {t('outgoing.notes')}
                            </label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder={t('outgoing.notesPlaceholder')}
                                rows={3}
                                className="w-full rounded-lg bg-white/10 px-4 py-2
                                ring-1 ring-white/20 placeholder-gray-400 resize-y
                                focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                        </motion.div>

                        <motion.button
                            variants={itemVariants}
                            type="submit"
                            disabled={submitting || !selectedProductId || currentStock <= 0}
                            className="w-full rounded-lg bg-red-600 py-3 font-semibold
                            hover:bg-red-500 transition disabled:opacity-50
                            disabled:cursor-not-allowed"
                        >
                            {submitting ? t('outgoing.submitting') : t('outgoing.submit')}
                        </motion.button>
                    </form>
                </motion.div>

                <GradientBottom />
            </div>
        </Layout>
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
            aria-hidden
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl"
        >
            <div
                className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36rem]
                -translate-x-1/2 rotate-[30deg]
                bg-gradient-to-tr from-pink-400 to-indigo-500 opacity-30"
            />
        </div>
    )
}

function GradientBottom() {
    return (
        <div
            aria-hidden
            className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl"
        >
            <div
                className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36rem]
                -translate-x-1/2 bg-gradient-to-tr from-pink-400 to-indigo-500 opacity-30"
            />
        </div>
    )
}
