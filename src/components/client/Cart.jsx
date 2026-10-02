import { useState } from "react";
import api from "../../services/api";
import { calculateCart, money } from "../../utils/cartTotals";

export default function Cart({ cart, onClose, onOrderCreated }) {
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  const { lines, subtotal, tax, total } = calculateCart(cart.items);

  const handleCheckout = async () => {
    setError("");

    if (cart.items.length === 0) {
      setError("El carrito está vacío.");
      return;
    }

    if (address.trim().length < 5) {
      setError("Ingresa la dirección de entrega.");
      return;
    }

    setSending(true);

    try {
      const response = await api.post("/orders", {
        items: cart.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        address: address.trim(),
        notes: notes.trim() || undefined,
      });

      setOrder(response.data);
      cart.clearCart();
      onOrderCreated?.();
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 409 && Array.isArray(data?.details)) {
        data.details.forEach((detail) => {
          if (detail.available === undefined) {
            cart.removeItem(detail.productId);
          } else if (detail.available > 0) {
            cart.updateQuantity(detail.productId, detail.available);
          } else {
            cart.removeItem(detail.productId);
          }
        });
      }

      setError(
        data?.error ||
          data?.message ||
          "No se pudo confirmar el pedido. Intenta de nuevo."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 md:p-10">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 p-6 text-white">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-black">Carrito de compras</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            Cerrar
          </button>
        </div>

        {order ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
            <p className="text-lg font-bold text-emerald-400">¡Pedido confirmado!</p>
            <p className="mt-2 text-sm text-slate-300">
              Número de pedido: <span className="font-bold">{order.orderNumber}</span>
            </p>
            <p className="mt-1 text-sm text-slate-300">
              Total a pagar en efectivo: <span className="font-bold">{money(order.total)}</span>
            </p>
          </div>
        ) : cart.items.length === 0 ? (
          <p className="py-10 text-center text-slate-400">Tu carrito está vacío.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-3 py-3">Producto</th>
                    <th className="px-3 py-3">Cantidad</th>
                    <th className="px-3 py-3">Precio sin IVA</th>
                    <th className="px-3 py-3">Precio con IVA</th>
                    <th className="px-3 py-3">Subtotal sin IVA</th>
                    <th className="px-3 py-3">IVA (13%)</th>
                    <th className="px-3 py-3">Total con IVA</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {lines.map((line) => (
                    <tr key={line.productId}>
                      <td className="px-3 py-3 font-semibold">{line.name}</td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min="1"
                          max={line.stock}
                          value={line.quantity}
                          onChange={(e) => cart.updateQuantity(line.productId, e.target.value)}
                          className="w-20 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-3">{money(line.unitPrice)}</td>
                      <td className="px-3 py-3">{money(line.unitPriceWithTax)}</td>
                      <td className="px-3 py-3">{money(line.subtotal)}</td>
                      <td className="px-3 py-3">{money(line.tax)}</td>
                      <td className="px-3 py-3 font-bold text-emerald-400">{money(line.total)}</td>
                      <td className="px-3 py-3 text-right">
                        <button
                    type="button"
                    onClick={() => cart.removeItem(line.productId)}
                    className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400 transition-all duration-200 hover:bg-red-500 hover:text-white active:scale-90"
                    >
                    Eliminar
</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 ml-auto w-full max-w-xs space-y-1 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal (sin IVA)</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>IVA 13%</span>
                <span>{money(tax)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-2 text-base font-black">
                <span>Total a pagar</span>
                <span className="text-emerald-400">{money(total)}</span>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Dirección de entrega"
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
              />
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas para el pedido (opcional)"
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
              />
              <p className="text-xs text-slate-400">Método de pago: efectivo contra entrega.</p>
            </div>
          </>
        )}

        {error && (
          <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </p>
        )}

        {!order && cart.items.length > 0 && (
          <button
            type="button"
            onClick={handleCheckout}
            disabled={sending}
            className="mt-6 w-full rounded-xl bg-emerald-600 py-3 font-bold transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {sending ? "Procesando..." : "Confirmar pedido"}
          </button>
        )}
      </div>
    </div>
  );
}