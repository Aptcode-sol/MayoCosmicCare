/**
 * Format numbers in Indian numbering system (Lakh/Crore)
 * 1,000,000 => 10 Lakh
 * 10,000,000 => 1 Crore
 * 1,200,000 => 12.0 Lakh
 */
export const formatIndian = (num) => {
    if (num === 0 || num === null || num === undefined) return '₹0';

    const absNum = Math.abs(num);

    // Crore (10,000,000)
    if (absNum >= 10000000) {
        const crore = (num / 10000000).toFixed(1);
        return `₹${crore} Cr`;
    }

    // Lakh (100,000)
    if (absNum >= 100000) {
        const lakh = (num / 100000).toFixed(1);
        return `₹${lakh} L`;
    }

    // Thousands
    if (absNum >= 1000) {
        return `₹${(num / 1000).toFixed(1)}K`;
    }

    return `₹${num}`;
};

/**
 * Format only the number part (without ₹)
 */
export const formatIndianNumber = (num) => {
    if (num === 0 || num === null || num === undefined) return '0';

    const absNum = Math.abs(num);

    if (absNum >= 10000000) {
        return `${(num / 10000000).toFixed(1)} Cr`;
    }

    if (absNum >= 100000) {
        return `${(num / 100000).toFixed(1)} L`;
    }

    if (absNum >= 1000) {
        return `${(num / 1000).toFixed(1)}K`;
    }

    return num.toString();
};
