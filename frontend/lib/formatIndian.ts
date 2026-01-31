export const formatIndian = (num: number) => {
    if (num === 0 || num === null || num === undefined) return '₹0'

    const absNum = Math.abs(num)

    if (absNum >= 10000000) {
        const crore = (num / 10000000).toFixed(1)
        return `₹${crore} Cr`
    }

    if (absNum >= 100000) {
        const lakh = (num / 100000).toFixed(1)
        return `₹${lakh} L`
    }

    if (absNum >= 1000) {
        return `₹${(num / 1000).toFixed(1)}K`
    }

    return `₹${num}`
}

export const formatIndianNumber = (num: number) => {
    if (num === 0 || num === null || num === undefined) return '0'

    const absNum = Math.abs(num)

    if (absNum >= 10000000) {
        return `${(num / 10000000).toFixed(1)} Cr`
    }

    if (absNum >= 100000) {
        return `${(num / 100000).toFixed(1)} L`
    }

    if (absNum >= 1000) {
        return `${(num / 1000).toFixed(1)}K`
    }

    return `${num}`
}
