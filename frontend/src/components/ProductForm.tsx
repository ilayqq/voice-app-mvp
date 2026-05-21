import { useState } from "react"
import type { Product } from "../types"

export default function ProductForm({
                                        product,
                                        onSave,
                                        onCancel,
                                    }: {
    product: Product | null
    onSave: (product: Product) => void
    onCancel: () => void
}) {
    const [formData, setFormData] = useState({
        name: product?.name || "",
        barcode: product?.barcode || "",
        category: product?.category || "",
        description: product?.description || "",
    })

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave({ ...formData })
    }

    return (
        <form onSubmit={submit} className="space-y-4">
            <input
                placeholder="Название товара"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-md bg-white/10 px-4 py-2 ring-1 ring-white/20"
            />

            <input
                placeholder="Штрихкод"
                value={formData.barcode}
                onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full rounded-md bg-white/10 px-4 py-2 ring-1 ring-white/20"
            />

            <input
                placeholder="Категория"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-md bg-white/10 px-4 py-2 ring-1 ring-white/20"
            />

            <textarea
                placeholder="Описание"
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-md bg-white/10 px-4 py-2 ring-1 ring-white/20"
            />

            <div className="flex justify-end gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-md bg-gray-500 px-4 py-2"
                >
                    Отмена
                </button>

                <button
                    type="submit"
                    className="rounded-md bg-indigo-500 px-4 py-2"
                >
                    Сохранить
                </button>
            </div>
        </form>
    )
}