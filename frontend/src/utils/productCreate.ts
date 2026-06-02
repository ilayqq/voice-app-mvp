import type { NavigateFunction } from 'react-router-dom'

export const OPEN_PRODUCT_CREATE_EVENT = 'open-product-create'

export type OpenProductCreateDetail = {
    barcode: string
}

export function openProductCreate(
    barcode: string,
    navigate: NavigateFunction,
    pathname: string,
) {
    if (pathname === '/products') {
        window.dispatchEvent(
            new CustomEvent<OpenProductCreateDetail>(OPEN_PRODUCT_CREATE_EVENT, {
                detail: { barcode },
            }),
        )
        return
    }

    navigate('/products', { state: { create: true, barcode } })
}
