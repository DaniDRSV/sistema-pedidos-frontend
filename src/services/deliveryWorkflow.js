const STORAGE_KEY = "odyssey_delivery_workflow_v1";
const CHANGE_EVENT = "odyssey-delivery-workflow-change";

const demoCourier = {
  id: "delivery-demo",
  fullName: "Alex Repartidor",
  email: "repartidor@sistema.com",
  phone: "11 5555 0182",
  available: true,
};

const emptyStore = () => ({ couriers: [demoCourier], orders: {}, orderSnapshots: {} });

function readStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!parsed || !Array.isArray(parsed.couriers) || typeof parsed.orders !== "object") {
      return emptyStore();
    }

    return {
      couriers: parsed.couriers.some((courier) => courier.id === demoCourier.id)
        ? parsed.couriers
        : [...parsed.couriers, demoCourier],
      orders: parsed.orders,
      orderSnapshots: parsed.orderSnapshots || {},
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export const DELIVERY_WORKFLOW_EVENT = CHANGE_EVENT;

export const DeliveryStatus = Object.freeze({
  CREATED: "CREADO",
  PAID: "PAGADO",
  CASH_ON_DELIVERY: "PAGO_CONTRA_ENTREGA",
  REQUESTED: "SOLICITUD_ENVIADA",
  ASSIGNED: "ASIGNADO",
  ON_THE_WAY: "EN_CAMINO",
  DELIVERED: "ENTREGADO",
  CANCELLED: "CANCELADO",
});

export const PaymentMethod = Object.freeze({
  CARD: "CARD",
  CASH_ON_DELIVERY: "CASH_ON_DELIVERY",
});

const normalizePaymentMethod = (value) =>
  ["CASH", "COD", "CASH_ON_DELIVERY", "CONTRA_ENTREGA"].includes(
    String(value || "").toUpperCase()
  )
    ? PaymentMethod.CASH_ON_DELIVERY
    : PaymentMethod.CARD;

const getInitialStatus = (order) => {
  const status = String(order?.status || "").toUpperCase();
  if (["PAGADO", "PAID"].includes(status)) return DeliveryStatus.PAID;
  if (["CANCELADO", "CANCELLED"].includes(status)) return DeliveryStatus.CANCELLED;
  if (["ENTREGADO", "DELIVERED"].includes(status)) return DeliveryStatus.DELIVERED;
  if (["EN_CAMINO", "IN_DELIVERY"].includes(status)) return DeliveryStatus.ON_THE_WAY;
  return DeliveryStatus.CREATED;
};

export function getOrderWorkflow(order) {
  const store = readStore();
  const saved = store.orders[String(order.id)];
  if (saved) return saved;

  return {
    orderId: order.id,
    status: getInitialStatus(order),
    paymentMethod: normalizePaymentMethod(order.paymentMethod),
    updatedAt: order.updatedAt || order.createdAt || new Date().toISOString(),
  };
}

export function saveOrderWorkflow(order, patch) {
  const store = readStore();
  const key = String(order.id);
  const previous = store.orders[key] || getOrderWorkflow(order);
  const next = {
    ...previous,
    ...patch,
    orderId: order.id,
    updatedAt: new Date().toISOString(),
  };
  store.orders[key] = next;
  const snapshot = { ...order };
  delete snapshot.workflow;
  delete snapshot.courier;
  store.orderSnapshots[key] = snapshot;
  writeStore(store);
  return next;
}

export function registerCourier(user) {
  if (!user?.id) return;

  const store = readStore();
  const courier = {
    id: String(user.id),
    fullName: user.fullName || "Repartidor",
    email: user.email || "",
    phone: user.phone || "",
    available: true,
  };
  const index = store.couriers.findIndex((item) => String(item.id) === courier.id);
  if (index >= 0) {
    store.couriers[index] = { ...store.couriers[index], ...courier };
  } else {
    store.couriers.push(courier);
  }
  writeStore(store);
}

export function getCouriers() {
  return readStore().couriers;
}

export function setCourierAvailability(courierId, available) {
  const store = readStore();
  store.couriers = store.couriers.map((courier) =>
    String(courier.id) === String(courierId) ? { ...courier, available } : courier
  );
  writeStore(store);
}

export function setCourierBusy(courierId, busy) {
  setCourierAvailability(courierId, !busy);
}

export function hydrateOrders(orders) {
  return orders.map((order) => {
    const workflow = getOrderWorkflow(order);
    const courier = workflow.courierId
      ? getCouriers().find((item) => String(item.id) === String(workflow.courierId))
      : null;
    return { ...order, workflow, courier };
  });
}

export function mergeOrdersWithSnapshots(orders) {
  const store = readStore();
  const merged = new Map(Object.entries(store.orderSnapshots).map(([key, order]) => [String(key), order]));
  orders.forEach((order) => merged.set(String(order.id), order));
  return hydrateOrders([...merged.values()]);
}

export function getCourierOrders(orders, courierId) {
  return hydrateOrders(orders).filter(
    (order) => String(order.workflow.courierId) === String(courierId)
  );
}

export function getBasePaymentStatus(workflow) {
  return workflow.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
    ? DeliveryStatus.CASH_ON_DELIVERY
    : DeliveryStatus.PAID;
}
