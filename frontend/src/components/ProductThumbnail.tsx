import { useState } from 'react'
import type { Product } from '../types'
import { resolveImageUrl } from '../utils/media'

type Props = {
  product: Product
  size?: 'sm' | 'md'
  className?: string
}

const sizes = {
  sm: 'h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] text-xl',
  md: 'h-20 w-20 text-2xl',
}

export default function ProductThumbnail({ product, size = 'sm', className = '' }: Props) {
  const src = resolveImageUrl(product.image_url || product.imageUrl)
  const [failed, setFailed] = useState(false)
  const sizeClass = sizes[size]

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={product.name}
        className={`${sizeClass} rounded-xl object-cover ring-1 ring-white/20 shrink-0 bg-white/5 ${className}`}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} rounded-xl shrink-0 flex items-center justify-center
                  bg-indigo-500/15 ring-1 ring-indigo-400/25 text-indigo-300 font-semibold ${className}`}
      aria-hidden
    >
      {product.name?.[0]?.toUpperCase() || '📦'}
    </div>
  )
}
