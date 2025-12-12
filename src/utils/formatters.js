/**
 * Format currency with max 2 decimal places
 * @param {number|string} amount - The amount to format
 * @param {string} locale - The locale for formatting (default: 'en-IN')
 * @param {string} currency - The currency code (default: 'INR')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, locale = 'en-IN', currency = 'INR') => {
  const num = parseFloat(amount) || 0
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(num)
}

/**
 * Format number with max 2 decimal places (without currency symbol)
 * @param {number|string} value - The value to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (value) => {
  const num = parseFloat(value) || 0
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(num)
}

/**
 * Format percentage with max 2 decimal places
 * @param {number|string} value - The value to format as percentage
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value) => {
  const num = parseFloat(value) || 0
  return `${num.toFixed(2)}%`
}
