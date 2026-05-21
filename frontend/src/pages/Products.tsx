import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import type { Product } from '../types'
import apiClient from '../services/api'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import ProductForm from "../components/ProductForm"
import { useNavigate } from "react-router-dom"

export default function Products() {
    const [products, setProducts] = useState<Product[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const navigate = useNavigate()

    useEffect(() => {
        apiClient.getProducts().then(setProducts)
    }, [])

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // const handleDelete = (id: number | undefined) => {
    //     if (confirm('Удалить товар?')) {
    //         apiClient.deleteProduct(id)
    //         setProducts(prev => prev.filter(p => p.id !== id))
    //     }
    // }

    return (
        <Layout title="Товары" showBack>
            <div className="relative isolate px-6 pt-12 pb-16 lg:px-8 text-white">

                <GradientTop />

                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={pageVariants}
                    className="mx-auto max-w-6xl space-y-10"
                >

                    {/* SEARCH + ACTION */}

                    <motion.div
                        variants={itemVariants}
                        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                    >

                        <input
                            type="text"
                            placeholder="🔎 Поиск товара..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full sm:max-w-sm rounded-lg bg-white/10 px-4 py-2
                            backdrop-blur-md ring-1 ring-white/20
                            placeholder-gray-400
                            focus:outline-none focus:ring-2 focus:ring-indigo-400
                            transition"
                        />

                        {!showForm && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    setEditingProduct(null)
                                    setShowForm(true)
                                }}
                                className="rounded-lg bg-indigo-500 px-6 py-2 font-semibold
                                hover:bg-indigo-400 transition shadow-lg shadow-indigo-500/20"
                            >
                                ➕ Добавить товар
                            </motion.button>
                        )}

                    </motion.div>


                    {/* FORM */}

                    <AnimatePresence mode="wait">

                        {showForm && (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                                transition={{
                                    duration: 0.35,
                                    ease: "easeOut"
                                }}
                                className="rounded-2xl bg-white/10 backdrop-blur-lg
                                p-6 ring-1 ring-white/20 shadow-xl"
                            >

                                <ProductForm
                                    product={editingProduct}
                                    onSave={async product => {

                                        if (editingProduct) {
                                            setProducts(products.map(p =>
                                                p.id === product.id ? product : p
                                            ))
                                        } else {
                                            const created = await apiClient.createProduct(product)
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


                    {/* LIST */}

                    {!showForm && (

                        <motion.div
                            layout
                            variants={staggerVariants}
                            className="grid gap-4"
                        >

                            {filteredProducts.length === 0 ? (

                                <motion.div
                                    variants={itemVariants}
                                    className="rounded-xl bg-white/10 p-6
                                    backdrop-blur-md ring-1 ring-white/20
                                    text-center text-gray-300"
                                >
                                    {searchTerm ? 'Товары не найдены' : 'Нет товаров'}
                                </motion.div>

                            ) : (

                                <AnimatePresence>

                                    {filteredProducts.map(product => (

                                        <motion.div
                                            layout
                                            key={product.id}
                                            whileHover={{ scale: 1.03, y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => navigate(`/products/${product.barcode}`)}
                                            className="cursor-pointer flex items-center justify-between
                                            rounded-2xl bg-white/10 backdrop-blur-md
                                            p-5 ring-1 ring-white/20
                                            hover:ring-indigo-400/50
                                            transition shadow-lg"
                                        >

                                            <div className="space-y-1">

                                                <div className="text-lg font-semibold">
                                                    {product.name}
                                                </div>

                                                <div className="text-sm text-gray-300">
                                                    📦 {product.barcode}
                                                </div>

                                                {product.category && (
                                                    <div className="text-xs text-gray-400">
                                                        {product.category}
                                                    </div>
                                                )}

                                            </div>

                                            <div className="text-indigo-300">
                                                →
                                            </div>

                                        </motion.div>

                                    ))}

                                </AnimatePresence>

                            )}

                        </motion.div>

                    )}

                </motion.div>

                <GradientBottom />

            </div>
        </Layout>
    )
}


/* ---------- animations ---------- */

const pageVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12,
            delayChildren: 0.1
        },
    },
}

const staggerVariants: Variants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.1
        },
    },
}

const itemVariants: Variants = {

    hidden: {
        opacity: 0,
        y: 25,
        scale: 0.98,
    },

    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 120,
            damping: 14
        }
    },

    exit: {
        opacity: 0,
        y: -20,
        scale: 0.95,
        transition: {
            duration: 0.25
        }
    }
}


/* ---------- gradients ---------- */

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
                -translate-x-1/2
                bg-gradient-to-tr from-pink-400 to-indigo-500 opacity-30"
            />
        </div>
    )
}