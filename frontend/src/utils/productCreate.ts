import type { NavigateFunction } from 'react-router-dom'

export const OPEN_PRODUCT_CREATE_EVENT = 'open-product-create'
export const OPEN_PRODUCT_CREATE_VOICE_EVENT = 'open-product-create-voice'

export type OpenProductCreateDetail = {
    barcode: string
}

export type OpenProductCreateVoiceDetail = {
    productName?: string
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

export function openProductCreateFromVoice(
    navigate: NavigateFunction,
    pathname: string,
    productName?: string,
) {
    const detail: OpenProductCreateVoiceDetail = { productName }
    if (pathname === '/products') {
        window.dispatchEvent(
            new CustomEvent<OpenProductCreateVoiceDetail>(OPEN_PRODUCT_CREATE_VOICE_EVENT, {
                detail,
            }),
        )
        return
    }

    navigate('/products', { state: { create: true, productName } })
}
