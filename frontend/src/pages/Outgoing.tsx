import { useState } from 'react'
import Layout from '../components/Layout'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { Product, InventoryItem, Operation } from '../types'
import './Operation.css'

export default function Outgoing() {
    const [products] = useLocalStorage<Product[]>('products', [])
    const [inventory, setInventory] = useLocalStorage<InventoryItem[]>('inventory', [])
    const [operations, setOperations] = useLocalStorage<Operation[]>('operations', [])
    const [selectedProductId, setSelectedProductId] = useState('')
    const [quantity, setQuantity] = useState('')
    const [notes, setNotes] = useState('')

    const availableProducts = products.filter(() => {
        return 0
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedProductId || !quantity || parseFloat(quantity) <= 0) {
            alert('Заполните все поля')
            return
        }

        const qty = parseFloat(quantity)
        const inv = inventory.find(i => i.productId === selectedProductId)
        
        if (!inv || inv.quantity < qty) {
            alert('Недостаточно товара на складе')
            return
        }

        const operation: Operation = {
            id: Date.now().toString(),
            type: 'outgoing',
            productId: selectedProductId,
            quantity: qty,
            date: new Date().toISOString(),
            notes: notes || undefined
        }

        setOperations([...operations, operation])
        setInventory(inventory.map(i =>
            i.productId === selectedProductId
                ? { ...i, quantity: i.quantity - qty }
                : i
        ))

        setSelectedProductId('')
        setQuantity('')
        setNotes('')
        alert('Расход оформлен')
    }

    return (
        <Layout title="Расход товара" showBack>
            <form onSubmit={handleSubmit} className="operation-form">
                <label>
                    <div className="label-text">Товар *</div>
                    <select
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        required
                        className="form-select"
                    >
                        <option value="">Выберите товар</option>
                        {availableProducts.map(product => {
                            // const inv = inventory.find(i => i.productId === product.id)
                            return (
                                <option key={product.id} value={product.id}>
                                    {product.name} ({product.barcode}) - Остаток: {0}
                                </option>
                            )
                        })}
                    </select>
                </label>

                {selectedProductId && (() => {
                    return (
                        <div className="current-stock">
                            {/*Доступно: {inv?.quantity || 0} {product?.unit || 'шт'}*/}
                        </div>
                    )
                })()}

                <label>
                    <div className="label-text">Количество *</div>
                    <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                        min="0.01"
                        step="0.01"
                        placeholder="0"
                        className="form-input"
                    />
                    {/*{selectedProductId && (() => {*/}
                    {/*    const product = products.find(p => p.id === selectedProductId)*/}
                    {/*    return <div className="input-hint">Единица: {product?.unit || 'шт'}</div>*/}
                    {/*})()}*/}
                </label>

                <label>
                    <div className="label-text">Примечание</div>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Дополнительная информация..."
                        rows={3}
                        className="form-textarea"
                    />
                </label>

                <button type="submit" className="primary">
                    Оформить расход
                </button>
            </form>
        </Layout>
    )
}

