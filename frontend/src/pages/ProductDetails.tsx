import { useEffect, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import Layout from "../components/Layout"
import apiClient from "../services/api"
import type { Product, StockMovementResponse } from "../types"
import { motion, AnimatePresence } from "framer-motion"
import { resolveImageUrl } from "../utils/media"

function stockTotal(product: Product): number {
    return product.stocks?.reduce((sum, s) => sum + s.quantity, 0) ?? 0
}

function EditModal({
    product,
    onClose,
    onSave,
}: {
    product: Product
    onClose: () => void
    onSave: (updated: Product) => void
}) {
    const { t } = useTranslation()
    const [form, setForm] = useState({
        name: product.name,
        barcode: product.barcode,
        category: product.category ?? "",
        description: product.description ?? "",
        image_url: product.image_url || product.imageUrl || "",
        price: product.price ?? 0,
    })
    const [imageFile, setImageFile] = useState<File | undefined>()
    const [preview, setPreview] = useState<string | null>(
        resolveImageUrl(product.image_url || product.imageUrl) ?? null
    )
    const [saving, setSaving] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)

    const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setImageFile(file)
        setPreview(URL.createObjectURL(file))
    }

    const handleSubmit = async () => {
        if (!product.id) return
        setSaving(true)
        try {
            let image_url = form.image_url
            if (imageFile) {
                image_url = await apiClient.uploadProductImage(imageFile)
            }
            const updated = await apiClient.updateProduct(String(product.barcode), {
                ...form,
                image_url,
            })
            onSave(updated)
        } finally {
            setSaving(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
                       bg-black/60 backdrop-blur-sm px-4 pb-4 sm:pb-0"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 60 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full max-w-lg rounded-2xl bg-[#1a1a2e] ring-1 ring-white/15 text-white overflow-hidden"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <h2 className="text-lg font-semibold">{t('products.editTitle')}</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div
                        onClick={() => fileRef.current?.click()}
                        className="relative w-full h-44 rounded-xl overflow-hidden
                                   bg-white/5 ring-1 ring-white/15 cursor-pointer
                                   hover:bg-white/10 transition-colors flex items-center justify-center"
                    >
                        {preview ? (
                            <>
                                <img src={preview} alt="preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100
                                                transition-opacity flex items-center justify-center text-sm font-medium">
                                    📷 {t('products.changePhoto')}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-400 pointer-events-none">
                                <span className="text-4xl">📷</span>
                                <span className="text-sm">{t('products.addPhoto')}</span>
                            </div>
                        )}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

                    <Field label={t('products.name')} value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
                    <Field label={t('products.barcode')} value={form.barcode} onChange={v => setForm(f => ({ ...f, barcode: v }))} mono />
                    <Field label={t('products.category')} value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} />
                    <Field label={t('products.price') + ' (₸)'} value={String(form.price || '')} onChange={v => setForm(f => ({ ...f, price: parseFloat(v) || 0 }))} />
                    <Field label={t('products.description')} value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} multiline />
                </div>

                <div className="flex gap-3 px-6 py-4 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-xl py-3 font-semibold bg-white/10 hover:bg-white/15 transition-colors"
                    >
                        {t('products.cancel')}
                    </button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleSubmit}
                        disabled={saving || !form.name.trim()}
                        className="flex-1 rounded-xl py-3 font-semibold bg-indigo-500
                                   hover:bg-indigo-400 transition-colors disabled:opacity-50"
                    >
                        {saving ? t('products.saving') : t('products.save')}
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    )
}

export default function ProductDetails() {
    const { t } = useTranslation()
    const { id } = useParams()
    const navigate = useNavigate()
    const [product, setProduct] = useState<Product | null>(null)
    const [movements, setMovements] = useState<StockMovementResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [actionType, setActionType] = useState<'incoming' | 'outgoing' | null>(null)
    const [actionQty, setActionQty] = useState('1')
    const [actionSubmitting, setActionSubmitting] = useState(false)

    const reload = async () => {
        if (!id) return
        const [p, allMov] = await Promise.all([
            apiClient.getProductByBarcode(id),
            apiClient.getStockMovements().catch(() => [] as StockMovementResponse[]),
        ])
        if (p) {
            setProduct(p)
            setMovements(allMov.filter(m => m.barcode === p.barcode || m.product_id === p.id))
        }
    }

    useEffect(() => {
        reload().finally(() => setLoading(false))
    }, [id])

    const handleDelete = async () => {
        if (!product) return
        if (confirm(t('products.deleteConfirm'))) {
            setDeleting(true)
            await apiClient.deleteProduct(product.barcode)
            navigate("/products")
        }
    }

    const handleQuickAction = async () => {
        if (!product?.id || !actionType) return
        const qty = parseFloat(actionQty)
        if (!qty || qty <= 0) return

        setActionSubmitting(true)
        try {
            await apiClient.createStockMovement({
                product_id: product.id,
                type: actionType,
                quantity: qty,
            })
            setActionType(null)
            setActionQty('1')
            await reload()
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Error')
        } finally {
            setActionSubmitting(false)
        }
    }

    if (loading) {
        return (
            <Layout title={t('products.detail')} showBack>
                <div className="flex items-center justify-center pt-32 text-white/50">
                    <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-sm tracking-widest uppercase"
                    >
                        {t('products.loading')}
                    </motion.div>
                </div>
            </Layout>
        )
    }

    if (!product) {
        return (
            <Layout title={t('products.detail')} showBack>
                <div className="flex items-center justify-center pt-32 text-white/50 text-sm">
                    {t('products.notFoundSingle')}
                </div>
            </Layout>
        )
    }

    const stock = stockTotal(product)

    return (
        <Layout title={product.name} showBack>
            <div className="relative isolate px-6 pt-8 pb-16 lg:px-8 text-white">

                <GradientTop />

                <div className="mx-auto max-w-xl space-y-5">

                    {resolveImageUrl(product.image_url || product.imageUrl) && (
                        <div className="w-full h-52 rounded-2xl overflow-hidden ring-1 ring-white/15">
                            <img
                                src={resolveImageUrl(product.image_url || product.imageUrl)}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl
                                        bg-indigo-500/20 ring-1 ring-indigo-400/40 text-2xl">
                            📦
                        </div>
                        <div>
                            <h1 className="text-xl font-bold leading-tight">{product.name}</h1>
                            {product.category && (
                                <span className="mt-1 inline-block rounded-full bg-indigo-500/20 px-2.5 py-0.5
                                                 text-xs font-medium text-indigo-300 ring-1 ring-indigo-400/30">
                                    {product.category}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl bg-white/10 p-6 ring-1 ring-white/20 divide-y divide-white/10">
                        <DetailRow icon="🔖" label={t('products.barcodeLabel')} value={product.barcode} mono />
                        {product.category && <DetailRow icon="🗂" label={t('products.categoryLabel')} value={product.category} />}
                        {product.description && <DetailRow icon="📝" label={t('products.descriptionLabel')} value={product.description} />}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-xl bg-white/10 p-5 ring-1 ring-white/20">
                            <div className="text-2xl font-semibold">{stock} {t('products.unit')}</div>
                            <div className="text-sm text-gray-300">{t('products.stock')}</div>
                        </div>
                        <div className="rounded-xl bg-white/10 p-5 ring-1 ring-white/20">
                            <div className="text-2xl font-semibold">{product.price ? `${product.price} ₸` : '—'}</div>
                            <div className="text-sm text-gray-300">{t('products.price')}</div>
                        </div>
                    </div>

                    {/* Quick stock actions */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setActionType(actionType === 'incoming' ? null : 'incoming')}
                            className={`rounded-xl py-3 font-semibold transition-colors ${
                                actionType === 'incoming'
                                    ? 'bg-green-500 hover:bg-green-400'
                                    : 'bg-green-600/30 ring-1 ring-green-500/30 hover:bg-green-600/50'
                            }`}
                        >
                            + {t('products.addStock')}
                        </button>
                        <button
                            onClick={() => setActionType(actionType === 'outgoing' ? null : 'outgoing')}
                            disabled={stock <= 0}
                            className={`rounded-xl py-3 font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                actionType === 'outgoing'
                                    ? 'bg-red-500 hover:bg-red-400'
                                    : 'bg-red-600/30 ring-1 ring-red-500/30 hover:bg-red-600/50'
                            }`}
                        >
                            - {t('products.removeStock')}
                        </button>
                    </div>

                    <AnimatePresence>
                        {actionType && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className={`rounded-xl p-4 ring-1 space-y-3 ${
                                    actionType === 'incoming'
                                        ? 'bg-green-500/10 ring-green-400/30'
                                        : 'bg-red-500/10 ring-red-400/30'
                                }`}>
                                    <input
                                        type="number"
                                        value={actionQty}
                                        onChange={e => setActionQty(e.target.value)}
                                        min="1"
                                        max={actionType === 'outgoing' ? stock : undefined}
                                        step="1"
                                        placeholder={t('products.quantityPlaceholder')}
                                        className="w-full rounded-lg bg-white/10 px-4 py-2.5 ring-1 ring-white/20
                                        focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => { setActionType(null); setActionQty('1') }}
                                            className="flex-1 rounded-lg bg-white/10 py-2.5 font-semibold
                                            hover:bg-white/15 transition"
                                        >
                                            {t('products.cancel')}
                                        </button>
                                        <button
                                            onClick={handleQuickAction}
                                            disabled={actionSubmitting || !actionQty || parseFloat(actionQty) <= 0}
                                            className={`flex-1 rounded-lg py-2.5 font-semibold transition disabled:opacity-50 ${
                                                actionType === 'incoming'
                                                    ? 'bg-green-600 hover:bg-green-500'
                                                    : 'bg-red-600 hover:bg-red-500'
                                            }`}
                                        >
                                            {actionSubmitting ? '...' : t('products.confirm')}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Movement history */}
                    <div className="rounded-xl bg-white/10 p-6 ring-1 ring-white/20 space-y-4">
                        <h2 className="text-lg font-semibold">{t('products.movementHistory')}</h2>
                        {movements.length === 0 ? (
                            <p className="text-sm text-gray-400">{t('products.noMovements')}</p>
                        ) : (
                            <ul className="divide-y divide-white/10">
                                {movements.map(m => (
                                    <li key={m.id} className="flex items-center justify-between py-3 text-sm">
                                        <div>
                                            <p className="text-gray-400 text-xs">
                                                {new Date(m.created_at).toLocaleString()}
                                            </p>
                                            {m.description && (
                                                <p className="text-gray-300 text-xs mt-0.5">{m.description}</p>
                                            )}
                                        </div>
                                        <span className={`shrink-0 ml-4 rounded-full px-3 py-1 text-xs font-semibold ${
                                            m.type === 'incoming'
                                                ? 'bg-green-500/20 text-green-300'
                                                : 'bg-red-500/20 text-red-300'
                                        }`}>
                                            {m.type === 'incoming' ? `+${m.quantity}` : `-${m.quantity}`}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Edit / Delete */}
                    <div className="grid grid-cols-2 gap-4 pb-6">
                        <button
                            onClick={() => setEditOpen(true)}
                            className="rounded-xl bg-indigo-500 py-3.5 font-semibold hover:bg-indigo-400 transition-colors"
                        >
                            {t('products.edit')}
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="rounded-xl bg-rose-500/80 py-3.5 font-semibold hover:bg-rose-500 transition-colors disabled:opacity-50"
                        >
                            {deleting ? t('products.deleting') : t('products.delete')}
                        </button>
                    </div>
                </div>

                <GradientBottom />
            </div>

            <AnimatePresence>
                {editOpen && (
                    <EditModal
                        product={product}
                        onClose={() => setEditOpen(false)}
                        onSave={(updated) => {
                            setProduct(updated)
                            setEditOpen(false)
                        }}
                    />
                )}
            </AnimatePresence>
        </Layout>
    )
}

function GradientTop() {
    return (
        <div aria-hidden className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
            <div
                style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}
                className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30
                bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-288.75"
            />
        </div>
    )
}

function GradientBottom() {
    return (
        <div aria-hidden className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
            <div
                style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}
                className="relative left-[calc(50%+3rem)] aspect-1155/678 w-144.5 -translate-x-1/2
                bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-288.75"
            />
        </div>
    )
}

function Field({
    label, value, onChange, mono, multiline,
}: {
    label: string
    value: string
    onChange: (v: string) => void
    mono?: boolean
    multiline?: boolean
}) {
    const base = `w-full rounded-xl bg-white/5 ring-1 ring-white/15 px-4 py-3 text-sm text-white
                  placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60
                  transition-all ${mono ? "font-mono text-indigo-300" : ""}`
    return (
        <div className="space-y-1.5">
            <label className="text-xs text-gray-400 uppercase tracking-wide">{label}</label>
            {multiline ? (
                <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} className={`${base} resize-none`} />
            ) : (
                <input type="text" value={value} onChange={e => onChange(e.target.value)} className={base} />
            )}
        </div>
    )
}

function DetailRow({ icon, label, value, mono }: { icon: string; label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex items-start gap-3 py-3.5">
            <span className="mt-0.5 text-base">{icon}</span>
            <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
                <span className={`text-sm font-medium ${mono ? "font-mono text-indigo-300" : ""}`}>{value}</span>
            </div>
        </div>
    )
}
