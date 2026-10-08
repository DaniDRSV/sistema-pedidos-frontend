export const OrderStatus = Object.freeze({
  CREATED: "CREADO",
  PAID: "PAGADO",
  PREPARING: "EN_PREPARACION",
  ON_THE_WAY: "EN_CAMINO",
  DELIVERED: "ENTREGADO",
  CANCELLED: "CANCELADO",
});

export const PaymentMethod = Object.freeze({
  CARD: "CARD",
  CASH_ON_DELIVERY: "CASH_ON_DELIVERY",
});

export const statusLabels = {
  [OrderStatus.CREATED]: "Creado",
  [OrderStatus.PAID]: "Pagado",
  [OrderStatus.PREPARING]: "En preparación",
  [OrderStatus.ON_THE_WAY]: "En camino",
  [OrderStatus.DELIVERED]: "Entregado",
  [OrderStatus.CANCELLED]: "Cancelado",
};

export const isFinalStatus = (status) =>
  status === OrderStatus.DELIVERED || status === OrderStatus.CANCELLED;

export const isCashOnDelivery = (order) => order.paymentMethod !== PaymentMethod.CARD;

export const money = (value) =>
  new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" }).format(Number(value) || 0);
