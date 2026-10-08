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

export const statusStyles = {
  [OrderStatus.CREATED]: "bg-sky-500/15 text-sky-300 border-sky-400/30",
  [OrderStatus.PAID]: "bg-violet-500/15 text-violet-300 border-violet-400/30",
  [OrderStatus.PREPARING]: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  [OrderStatus.ON_THE_WAY]: "bg-blue-500/15 text-blue-300 border-blue-400/30",
  [OrderStatus.DELIVERED]: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  [OrderStatus.CANCELLED]: "bg-rose-500/15 text-rose-300 border-rose-400/30",
};

export const isFinalStatus = (status) =>
  status === OrderStatus.DELIVERED || status === OrderStatus.CANCELLED;

export const isCashOnDelivery = (order) => order.paymentMethod !== PaymentMethod.CARD;

export const money = (value) =>
  new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" }).format(Number(value) || 0);

export const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("es-SV", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "—";
