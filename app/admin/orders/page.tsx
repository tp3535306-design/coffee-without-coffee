"use client";

import { useEffect, useState } from "react";

type OrderItem = {
  id: number;
  quantity: number;
  price: number;
  products: {
    id: number;
    name: string;
    image: string;
  };
};

type Order = {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/admin/orders");
        const data = await response.json();

        if (!response.ok) {
          console.error("Orders API status:", response.status);
          console.error("Orders API response:", data);
          throw new Error(data.error || "Failed to load orders");
        }

        if (!Array.isArray(data)) {
          throw new Error("The orders API did not return a list");
        }

        setOrders(data);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-semibold">Admin Orders</h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Manage customer orders from your Coffee Without Coffee store.
        </p>

        {loading ? (
          <p className="mt-10 text-sm text-muted-foreground">
            Loading orders...
          </p>
        ) : orders.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">
            No orders found.
          </p>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left">
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <td colSpan={7} className="px-5 py-6">
                      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
                        {/* Customer Information */}
                        <div>
                          <p className="font-mono text-sm font-semibold">
                            Order #{order.id}
                          </p>

                          <div className="mt-4 space-y-2 text-sm">
                            <p>
                              <span className="text-muted-foreground">
                                Customer:
                              </span>{" "}
                              {order.customer_name}
                            </p>

                            <p>
                              <span className="text-muted-foreground">
                                Email:
                              </span>{" "}
                              {order.customer_email}
                            </p>

                            <p>
                              <span className="text-muted-foreground">
                                Phone:
                              </span>{" "}
                              {order.customer_phone}
                            </p>
                            <div className="mt-3">
                              <label
                                htmlFor={`status-${order.id}`}
                                className="mb-2 block text-sm text-muted-foreground"
                              >
                                Order Status
                              </label>

                              <select
                                id={`status-${order.id}`}
                                value={order.status}
                                onChange={async (e) => {
                                  const newStatus = e.target.value;

                                  try {
                                    const response = await fetch(
                                      `/api/admin/orders/${order.id}`,
                                      {
                                        method: "PATCH",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          status: newStatus,
                                        }),
                                      },
                                    );

                                    const result = await response.json();

                                    if (!response.ok) {
                                      throw new Error(
                                        result.error ||
                                          "Failed to update status",
                                      );
                                    }

                                    setOrders((currentOrders) =>
                                      currentOrders.map((currentOrder) =>
                                        currentOrder.id === order.id
                                          ? {
                                              ...currentOrder,
                                              status: result.order.status,
                                            }
                                          : currentOrder,
                                      ),
                                    );

                                    alert("Order status updated successfully!");
                                  } catch (error) {
                                    console.error(
                                      "Status update error:",
                                      error,
                                    );
                                    alert(
                                      "Could not update order status. Please try again.",
                                    );
                                  }
                                }}
                                className="mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>

                            <p>
                              <span className="text-muted-foreground">
                                Date:
                              </span>{" "}
                              {new Date(order.created_at).toLocaleString()}
                            </p>
                          </div>

                          <div className="mt-5">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">
                              Total
                            </p>

                            <p className="mt-1 text-xl font-semibold">
                              ₹{Number(order.total_amount).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Ordered Products */}
                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            Ordered Products
                          </p>

                          <div className="mt-4 space-y-3">
                            {order.order_items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-4 rounded-xl border border-border p-3"
                              >
                                <img
                                  src={item.products.image}
                                  alt={item.products.name}
                                  className="h-16 w-16 rounded-lg object-cover"
                                />

                                <div className="flex-1">
                                  <p className="font-medium">
                                    {item.products.name}
                                  </p>

                                  <p className="mt-1 text-sm text-muted-foreground">
                                    ₹{Number(item.price).toFixed(2)} ×{" "}
                                    {item.quantity}
                                  </p>
                                </div>

                                <p className="font-mono text-sm">
                                  ₹
                                  {(Number(item.price) * item.quantity).toFixed(
                                    2,
                                  )}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
