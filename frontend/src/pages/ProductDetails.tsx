import { useEffect, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import Layout from "../components/Layout"
import apiClient from "../services/api"
import type { Product } from "../types"
import { motion, AnimatePresence, type Variants } from "framer-motion"

/* ─────────────────────────────────────────────
   EDIT MODAL
───────────────────────────────────────────── */
function EditModal({
                       product,
                       onClose,
                       onSave,
                   }: {
    product: Product
    onClose: () => void
    onSave: (updated: Product) => void
}) {
    const [form, setForm] = useState({
        name: product.name,
        barcode: product.barcode,
        category: product.category ?? "",
        description: product.description ?? "",
        imageUrl: product.imageUrl ?? "",
    })
    const [preview, setPreview] = useState<string | null>(product.imageUrl ?? null)
    const [saving, setSaving] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)

    const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const url = URL.createObjectURL(file)
        setPreview(url)
        // В реальном проекте — загрузить файл на сервер и сохранить полученный URL
        setForm(f => ({ ...f, imageUrl: url }))
    }

    const handleSubmit = async () => {
        if (!product.id) return
        setSaving(true)
        try {
            const updated = await apiClient.updateProduct(String(product.barcode), form)
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
                {/* HEADER */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <h2 className="text-lg font-semibold">Редактировать товар</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* BODY */}
                <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

                    {/* IMAGE UPLOAD */}
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
                                    📷 Изменить фото
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-400 pointer-events-none">
                                <span className="text-4xl">📷</span>
                                <span className="text-sm">Нажмите, чтобы добавить фото</span>
                            </div>
                        )}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

                    <Field label="Название" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
                    <Field label="Штрихкод" value={form.barcode} onChange={v => setForm(f => ({ ...f, barcode: v }))} mono />
                    <Field label="Категория" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} />
                    <Field label="Описание" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} multiline />
                </div>

                {/* FOOTER */}
                <div className="flex gap-3 px-6 py-4 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-xl py-3 font-semibold bg-white/10 hover:bg-white/15 transition-colors"
                    >
                        Отмена
                    </button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleSubmit}
                        disabled={saving || !form.name.trim()}
                        className="flex-1 rounded-xl py-3 font-semibold bg-indigo-500
                                   hover:bg-indigo-400 transition-colors disabled:opacity-50"
                    >
                        {saving ? "Сохранение..." : "✓ Сохранить"}
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    )
}

/* ─────────────────────────────────────────────
   PRODUCT DETAILS PAGE
───────────────────────────────────────────── */
export default function ProductDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState(false)
    const [editOpen, setEditOpen] = useState(false)

    useEffect(() => {
        if (!id) return
        apiClient.getProductByBarcode(id)
            .then(setProduct)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [id])

    const handleDelete = async () => {
        if (!product) return
        if (confirm("Удалить товар?")) {
            setDeleting(true)
            await apiClient.deleteProduct(product.barcode)
            navigate("/products")
        }
    }

    if (loading) {
        return (
            <Layout title="Товар" showBack>
                <div className="flex items-center justify-center pt-32 text-white/50">
                    <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-sm tracking-widest uppercase"
                    >
                        Загрузка...
                    </motion.div>
                </div>
            </Layout>
        )
    }

    if (!product) {
        return (
            <Layout title="Товар" showBack>
                <div className="flex items-center justify-center pt-32 text-white/50 text-sm">
                    Товар не найден
                </div>
            </Layout>
        )
    }

    return (
        <Layout title={product.name} showBack>
            <div className="relative isolate px-6 pt-10 lg:px-8 text-white">

                {/* TOP GRADIENT BLUR */}
                <div aria-hidden="true" className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
                    <div
                        style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}
                        className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-288.75"
                    />
                </div>

                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={pageVariants}
                    className="mx-auto max-w-xl space-y-5"
                >
                    {/* PRODUCT IMAGE */}
                    {product.imageUrl && (
                        <motion.div variants={itemVariants} className="w-full h-52 rounded-2xl overflow-hidden ring-1 ring-white/15">
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        </motion.div>
                    )}

                    {/* HEADER */}
                    <motion.div variants={itemVariants} className="flex items-center gap-4">
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
                    </motion.div>

                    {/* DETAILS CARD */}
                    <motion.div variants={itemVariants} className="rounded-xl bg-white/10 p-6 ring-1 ring-white/20 divide-y divide-white/10">
                        <DetailRow icon="🔖" label="Штрихкод" value={product.barcode} mono />
                        {product.category && <DetailRow icon="🗂" label="Категория" value={product.category} />}
                        {product.description && <DetailRow icon="📝" label="Описание" value={product.description} />}
                    </motion.div>

                    {/* STATS */}
                    <motion.div variants={staggerVariants} className="grid grid-cols-2 gap-4">
                        <StatCard label="Остаток" value="—" />
                        <StatCard label="Цена" value="—" />
                    </motion.div>

                    {/* ACTIONS */}
                    <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 pb-10">
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setEditOpen(true)}
                            className="rounded-xl bg-indigo-500 py-3.5 font-semibold hover:bg-indigo-400 transition-colors"
                        >
                            ✏️ Редактировать
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleDelete}
                            disabled={deleting}
                            className="rounded-xl bg-rose-500/80 py-3.5 font-semibold hover:bg-rose-500 transition-colors disabled:opacity-50"
                        >
                            {deleting ? "Удаление..." : "🗑 Удалить"}
                        </motion.button>
                    </motion.div>
                </motion.div>

                {/* BOTTOM GRADIENT BLUR */}
                <div aria-hidden="true" className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
                    <div
                        style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}
                        className="relative left-[calc(50%+3rem)] aspect-1155/678 w-144.5 -translate-x-1/2 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-288.75"
                    />
                </div>
            </div>

            {/* EDIT MODAL */}
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

/* ---------- animations ---------- */

const pageVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}
const staggerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
}
const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
}

/* ---------- UI helpers ---------- */

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

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.03 }}
            className="rounded-xl bg-white/10 p-5 ring-1 ring-white/20"
        >
            <div className="text-2xl font-semibold">{value}</div>
            <div className="text-sm text-gray-300">{label}</div>
        </motion.div>
    )
}