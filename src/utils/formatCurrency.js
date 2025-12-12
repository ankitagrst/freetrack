/**
 * Format currency with max 2 decimal places
 * @param {number|string} amount - The amount to format
 * @param {string} currency - Currency code (default: INR)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'INR') => {
  const num = parseFloat(amount) || 0
  
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(num)
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(num)
}

/**
 * Format number with max 2 decimal places (without currency symbol)
 * @param {number|string} amount - The amount to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (amount) => {
  const num = parseFloat(amount) || 0
  return num.toFixed(2).replace(/\.00$/, '')
}

/**
 * Format percentage with max 2 decimal places
 * @param {number|string} value - The value to format
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value) => {
  const num = parseFloat(value) || 0
  return `${num.toFixed(2).replace(/\.00$/, '')}%`
}
