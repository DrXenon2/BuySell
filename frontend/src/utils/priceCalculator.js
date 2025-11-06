/**
 * Price calculation utilities
 */

/**
 * Calculate cart total
 * @param {Array} items - Cart items
 * @returns {Object} Total calculations
 */
export const calculateCartTotal = (items) => {
  if (!items || items.length === 0) {
    return {
      subtotal: 0,
      discount: 0,
      tax: 0,
      shipping: 0,
      total: 0
    };
  }

  const subtotal = items.reduce((sum, item) => {
    const price = item.discountedPrice || item.price;
    return sum + (price * item.quantity);
  }, 0);

  const discount = items.reduce((sum, item) => {
    if (item.discountedPrice && item.discountedPrice < item.price) {
      return sum + ((item.price - item.discountedPrice) * item.quantity);
    }
    return sum;
  }, 0);

  // Default calculations (can be overridden by specific rules)
  const tax = subtotal * 0.18; // 18% tax
  const shipping = subtotal > 50000 ? 0 : 2500; // Free shipping above 50,000 XOF
  
  const total = subtotal - discount + tax + shipping;

  return {
    subtotal: Math.round(subtotal),
    discount: Math.round(discount),
    tax: Math.round(tax),
    shipping: Math.round(shipping),
    total: Math.round(total)
  };
};

/**
 * Calculate product discount
 * @param {number} originalPrice - Original price
 * @param {number} discountPercent - Discount percentage
 * @returns {Object} Discount calculations
 */
export const calculateProductDiscount = (originalPrice, discountPercent) => {
  const discountAmount = (originalPrice * discountPercent) / 100;
  const finalPrice = originalPrice - discountAmount;

  return {
    originalPrice: Math.round(originalPrice),
    discountPercent: Math.round(discountPercent),
    discountAmount: Math.round(discountAmount),
    finalPrice: Math.round(finalPrice)
  };
};

/**
 * Calculate order totals
 * @param {Object} order - Order object
 * @returns {Object} Order totals
 */
export const calculateOrderTotals = (order) => {
  const { subtotal, discount, tax, shipping } = order;
  
  const total = subtotal - discount + tax + shipping;

  return {
    subtotal: Math.round(subtotal),
    discount: Math.round(discount),
    tax: Math.round(tax),
    shipping: Math.round(shipping),
    total: Math.round(total)
  };
};

/**
 * Calculate shipping cost
 * @param {number} subtotal - Order subtotal
 * @param {string} method - Shipping method
 * @param {string} country - Destination country
 * @returns {number} Shipping cost
 */
export const calculateShippingCost = (subtotal, method = 'standard', country = 'SN') => {
  // Free shipping for orders above certain amount
  if (subtotal > 50000) {
    return 0;
  }

  const shippingRates = {
    standard: {
      SN: 1500,
      CI: 3000,
      CM: 3500,
      ML: 2500,
      BF: 2000,
      GN: 3000,
      NE: 4000,
      TG: 3500,
      BJ: 3000,
      FR: 8000,
      US: 12000,
      default: 5000
    },
    express: {
      SN: 3000,
      CI: 6000,
      CM: 7000,
      ML: 5000,
      BF: 4000,
      GN: 6000,
      NE: 8000,
      TG: 7000,
      BJ: 6000,
      FR: 15000,
      US: 20000,
      default: 10000
    },
    pickup: 0
  };

  const rate = shippingRates[method];
  if (method === 'pickup') return rate;
  
  return rate[country] || rate.default;
};

/**
 * Calculate tax amount
 * @param {number} subtotal - Order subtotal
 * @param {string} country - Destination country
 * @returns {number} Tax amount
 */
export const calculateTax = (subtotal, country = 'SN') => {
  const taxRates = {
    SN: 0.18, // 18% TVA
    CI: 0.18,
    CM: 0.19,
    ML: 0.18,
    BF: 0.18,
    GN: 0.18,
    NE: 0.19,
    TG: 0.18,
    BJ: 0.18,
    FR: 0.20,
    US: 0.08, // Average US sales tax
    default: 0.15
  };

  const taxRate = taxRates[country] || taxRates.default;
  return subtotal * taxRate;
};

/**
 * Apply coupon code
 * @param {number} subtotal - Order subtotal
 * @param {Object} coupon - Coupon object
 * @returns {Object} Coupon application result
 */
export const applyCoupon = (subtotal, coupon) => {
  if (!coupon || !coupon.isActive) {
    return {
      isValid: false,
      discount: 0,
      message: 'Coupon invalide'
    };
  }

  // Check expiration
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return {
      isValid: false,
      discount: 0,
      message: 'Coupon expiré'
    };
  }

  // Check minimum amount
  if (coupon.minAmount && subtotal < coupon.minAmount) {
    return {
      isValid: false,
      discount: 0,
      message: `Minimum ${coupon.minAmount} XOF requis`
    };
  }

  let discount = 0;

  if (coupon.type === 'percentage') {
    discount = (subtotal * coupon.value) / 100;
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else if (coupon.type === 'fixed') {
    discount = coupon.value;
  }

  return {
    isValid: true,
    discount: Math.round(discount),
    message: 'Coupon appliqué avec succès',
    coupon: coupon
  };
};

/**
 * Calculate installment payments
 * @param {number} totalAmount - Total amount
 * @param {number} installments - Number of installments
 * @param {number} interestRate - Annual interest rate
 * @returns {Object} Installment calculations
 */
export const calculateInstallments = (totalAmount, installments = 3, interestRate = 0) => {
  if (installments === 1) {
    return {
      monthlyPayment: totalAmount,
      totalPaid: totalAmount,
      totalInterest: 0,
      installments: [{
        number: 1,
        amount: totalAmount,
        dueDate: new Date()
      }]
    };
  }

  const monthlyRate = interestRate / 12 / 100;
  const monthlyPayment = (totalAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -installments));
  const totalPaid = monthlyPayment * installments;
  const totalInterest = totalPaid - totalAmount;

  const installmentPlan = [];
  const today = new Date();

  for (let i = 1; i <= installments; i++) {
    const dueDate = new Date(today);
    dueDate.setMonth(dueDate.getMonth() + i);
    
    installmentPlan.push({
      number: i,
      amount: Math.round(monthlyPayment),
      dueDate: dueDate.toISOString().split('T')[0]
    });
  }

  return {
    monthlyPayment: Math.round(monthlyPayment),
    totalPaid: Math.round(totalPaid),
    totalInterest: Math.round(totalInterest),
    installments: installmentPlan
  };
};

/**
 * Compare prices for price history
 * @param {Array} priceHistory - Price history array
 * @returns {Object} Price comparison data
 */
export const comparePrices = (priceHistory) => {
  if (!priceHistory || priceHistory.length === 0) {
    return {
      currentPrice: 0,
      lowestPrice: 0,
      highestPrice: 0,
      averagePrice: 0,
      priceChange: 0,
      isOnSale: false
    };
  }

  const sortedHistory = [...priceHistory].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  const currentPrice = sortedHistory[0].price;
  const prices = priceHistory.map(item => item.price);
  const lowestPrice = Math.min(...prices);
  const highestPrice = Math.max(...prices);
  const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

  const previousPrice = sortedHistory[1]?.price || currentPrice;
  const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;
  const isOnSale = currentPrice < previousPrice;

  return {
    currentPrice: Math.round(currentPrice),
    lowestPrice: Math.round(lowestPrice),
    highestPrice: Math.round(highestPrice),
    averagePrice: Math.round(averagePrice),
    priceChange: Math.round(priceChange * 100) / 100,
    isOnSale,
    savings: isOnSale ? Math.round(previousPrice - currentPrice) : 0
  };
};
