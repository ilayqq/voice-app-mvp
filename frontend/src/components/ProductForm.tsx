import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { QrCode, X } from "lucide-react"
import type { Product } from "../types"
import BarcodeScanner from "./BarcodeScanner"
import { resolveImageUrl } from "../utils/media"

export default function ProductForm({
    product,
    onSave,
    onCancel,
}: {
    product: Product | null
    onSave: (product: Product, imageFile?: File) => void | Promise<void>
    onCancel: () => void
}) {
    const { t } = useTranslation()
    const fileRef = useRef<HTMLInputElement>(null)
    const [formData, setFormData] = useState({
        name: product?.name || "",
        barcode: product?.barcode || "",
        category: product?.category || "",
        description: product?.description || "",
        price: product?.price ?? 0,
        image_url: product?.image_url || product?.imageUrl || "",
    })
    const [imageFile, setImageFile] = useState<File | undefined>()
    const [preview, setPreview] = useState<string | null>(
        resolveImageUrl(product?.image_url || product?.imageUrl) ?? null
    )
    const [scanning, setScanning] = useState(false)

    const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setImageFile(file)
        setPreview(URL.createObjectURL(file))
    }

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave({ ...formData, image_url: formData.image_url || undefined }, imageFile)
    }

    return (
        <form onSubmit={submit} className="space-y-4">
            <div
                onClick={() => fileRef.current?.click()}
                className="relative w-full h-40 rounded-xl overflow-hidden
                           bg-white/5 ring-1 ring-white/15 cursor-pointer
                           hover:bg-white/10 transition-colors flex items-center justify-center"
            >
                {preview ? (
                    <>
                        <img src={preview} alt="" className="w-full h-full object-cover" />
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

            <input
                placeholder={t('products.name')}
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full rounded-lg bg-white/10 px-4 py-3 ring-1 ring-white/20
                placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />

            <div className="flex gap-2">
                <input
                    placeholder={t('products.barcode')}
                    value={formData.barcode}
                    onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                    required
                    className="min-w-0 flex-1 rounded-lg bg-white/10 px-4 py-3 ring-1 ring-white/20
                    placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono"
                />
                <button
                    type="button"
                    onClick={() => setScanning(true)}
                    aria-label={t('products.scanBarcode')}
                    title={t('products.scanBarcode')}
                    className="inline-flex h-[46px] w-[46px] shrink-0 items-center justify-center
                    rounded-lg bg-indigo-500 text-white ring-1 ring-indigo-400/30
                    hover:bg-indigo-400 active:scale-95 transition"
                >
                    <QrCode size={20} aria-hidden />
                </button>
            </div>

            {scanning && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => setScanning(false)}
                        aria-hidden
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label={t('products.scanBarcode')}
                        className="relative w-full max-w-md rounded-2xl bg-slate-950 ring-1 ring-white/15 shadow-2xl overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <QrCode size={18} className="text-indigo-300" aria-hidden />
                                {t('products.scanBarcode')}
                            </div>
                            <button
                                type="button"
                                onClick={() => setScanning(false)}
                                className="rounded-lg p-2 text-gray-300 hover:text-white hover:bg-white/10 transition"
                                aria-label={t('products.cancel')}
                            >
                                <X size={18} aria-hidden />
                            </button>
                        </div>
                        <div className="p-4">
                            <BarcodeScanner
                                onScan={code => {
                                    setFormData(f => ({ ...f, barcode: code }))
                                    setScanning(false)
                                }}
                                onClose={() => setScanning(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            <input
                placeholder={t('products.category')}
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-lg bg-white/10 px-4 py-3 ring-1 ring-white/20
                placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />

            <input
                type="number"
                placeholder={t('products.price') + ' (₸)'}
                value={formData.price || ''}
                onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
                className="w-full rounded-lg bg-white/10 px-4 py-3 ring-1 ring-white/20
                placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />

            <textarea
                placeholder={t('products.description')}
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg bg-white/10 px-4 py-3 ring-1 ring-white/20
                placeholder-gray-400 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />

            <div className="flex justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg bg-white/10 px-5 py-2.5 font-semibold
                    hover:bg-white/15 transition"
                >
                    {t('products.cancel')}
                </button>
                <button
                    type="submit"
                    className="rounded-lg bg-indigo-500 px-5 py-2.5 font-semibold
                    hover:bg-indigo-400 transition"
                >
                    {t('products.save')}
                </button>
            </div>
        </form>
    )
}
