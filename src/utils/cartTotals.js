// Misma lógica que el backend (src/domain/services/pricing.js).
// Los precios vienen SIN IVA. Todo se calcula en centavos para evitar errores de decimales.
const TAX_PERCENT = 13;

const toCents = (amount) => Math.round(Number(amount) * 100);

export const calculateLine = (price, quantity) => {
  const unit = toCents(price);
  const unitTax = Math.round((unit * TAX_PERCENT) / 100);

  return {
    unitPrice: unit / 100,
    unitPriceWithTax: (unit + unitTax) / 100,
    subtotal: (unit * quantity) / 100,
    tax: (unitTax * quantity) / 100,
    total: ((unit + unitTax) * quantity) / 100,
  };
};

export const calculateCart = (items) => {
  const lines = items.map((item) => ({
    ...item,
    ...calculateLine(item.price, item.quantity),
  }));

  const sum = (key) => lines.reduce((acc, line) => acc + toCents(line[key]), 0) / 100;

  return {
    lines,
    subtotal: sum("subtotal"),
    tax: sum("tax"),
    total: sum("total"),
  };
};

export const money = (value) => `$${Number(value).toFixed(2)}`;