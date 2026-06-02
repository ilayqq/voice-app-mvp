import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
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
                    className="flex-1 rounded-lg bg-white/10 px-4 py-3 ring-1 ring-white/20
                    placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono"
                />
                <button
                    type="button"
                    onClick={() => setScanning(true)}
                    className="shrink-0 rounded-lg bg-indigo-500 px-4 py-3 font-semibold
                    hover:bg-indigo-400 transition"
                >
                    📷 {t('products.scanBarcode')}
                </button>
            </div>

            {scanning && (
                <BarcodeScanner
                    onScan={code => {
                        setFormData(f => ({ ...f, barcode: code }))
                        setScanning(false)
                    }}
                    onClose={() => setScanning(false)}
                />
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
