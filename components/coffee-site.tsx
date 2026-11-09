"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Coffee,
  Menu,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  X,
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  note: string;
  price: number;
  color: string;
  ingredients: string[];
  image: string;
};

const productColors = ["#b86f45", "#8f6b5b", "#714d3a"];

function ProductCard({
  product,
  onOpen,
  onAdd,
}: {
  product: Product;
  onOpen: () => void;
  onAdd: () => void;
}) {
  return (
    <article className="group flex flex-col rounded-[1.6rem] bg-card p-3 shadow-[0_18px_40px_rgba(67,42,25,0.07)] ring-1 ring-border/60 transition hover:-translate-y-1 hover:shadow-[0_22px_45px_rgba(67,42,25,0.13)]">
      <button
        onClick={onOpen}
        className="relative flex h-56 items-end justify-center overflow-hidden rounded-[1.25rem] bg-secondary p-6 text-left"
        aria-label={`View ${product.name}`}
      >
        <span className="absolute left-4 top-4 rounded-full bg-background/80 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          best seller
        </span>
        <Image
          src={product.image}
          alt={product.name}
          width={400}
          height={300}
          className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
        />
      </button>
      <div className="flex flex-1 flex-col px-2 pb-2 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl font-semibold text-foreground">
              {product.name}
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {product.note}
            </p>
          </div>
          <span className="font-mono text-sm font-semibold text-primary">
            ${product.price}
          </span>
        </div>
        <div className="mt-auto flex items-center justify-between pt-5">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" /> 4.9
          </div>
          <button
            onClick={onAdd}
            className="rounded-full bg-primary px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-primary-foreground transition hover:bg-primary/90"
          >
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}

export function CoffeeSite() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState("");
  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("/api/products");
        const data = await response.json();

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const formattedProducts: Product[] = data.map(
          (
            item: {
              id: number;
              name: string;
              description: string;
              price: number;
              image: string;
            },
            index: number,
          ) => ({
            id: String(item.id),
            name: item.name,
            note: item.description,
            price: Number(item.price),
            color: productColors[index % productColors.length],
            ingredients: [],
            image: item.image,
          }),
        );

        setProducts(formattedProducts);
      } catch (error) {
        console.error("Product fetching error:", error);
        setProductError("Unable to load products.");
      } finally {
        setLoadingProducts(false);
      }
    }

    fetchProducts();
  }, []);
  const [selected, setSelected] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = useMemo(
    () =>
      Object.entries(cart).reduce(
        (sum, [id, qty]) =>
          sum + (products.find((p) => p.id === id)?.price || 0) * qty,
        0,
      ),
    [cart, products],
  );
  const add = (id: string) =>
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const change = (id: string, delta: number) =>
    setCart((c) => {
      const next = Math.max(0, (c[id] || 0) + delta);
      const copy = { ...c };
      if (next) copy[id] = next;
      else delete copy[id];
      return copy;
    });
  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !customerName.trim() ||
      !customerEmail.trim() ||
      !customerPhone.trim()
    ) {
      alert("Please fill in all customer details.");
      return;
    }

    setCheckoutLoading(true);

    try {
      const items = Object.entries(cart).map(([id, quantity]) => {
        const product = products.find((p) => p.id === id);

        if (!product) {
          throw new Error("Product not found.");
        }

        return {
          product_id: Number(id),
          quantity,
          price: product.price,
        };
      });

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          total_amount: total,
          items,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Order failed.");
      }

      alert(`Order placed successfully! Order ID: ${data.order_id}`);

      setCart({});
      setCheckoutOpen(false);
      setCartOpen(false);
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setCheckoutLoading(false);
    }
  };
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <a
            href="#top"
            className="font-serif text-xl font-bold tracking-tight"
          >
            coffee <span className="text-primary">without</span> coffee
            <span className="text-primary">.</span>
          </a>
          <nav
            className={`${menuOpen ? "flex" : "hidden"} absolute left-0 top-full w-full flex-col gap-5 border-b border-border bg-background px-5 py-6 md:static md:flex md:w-auto md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0`}
          >
            <a
              href="#shop"
              onClick={() => setMenuOpen(false)}
              className="text-sm hover:text-primary"
            >
              Shop blends
            </a>
            <a
              href="#why"
              onClick={() => setMenuOpen(false)}
              className="text-sm hover:text-primary"
            >
              Our why
            </a>
            <a
              href="#ritual"
              onClick={() => setMenuOpen(false)}
              className="text-sm hover:text-primary"
            >
              The ritual
            </a>
            <a
              href="#contact"
              onClick={() => setMenuOpen(false)}
              className="text-sm hover:text-primary"
            >
              Say hello
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCartOpen(true)}
              className="relative rounded-full p-2.5 transition hover:bg-secondary"
              aria-label="Open cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-[9px] text-primary-foreground">
                  {count}
                </span>
              )}
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-full p-2.5 md:hidden"
              aria-label="Toggle navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      <main id="top">
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-20 pt-14 md:grid-cols-[1fr_1.05fr] md:pb-28 md:pt-20 lg:px-8">
          <div>
            <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.24em] text-primary">
              a softer morning ritual
            </p>
            <h1 className="max-w-xl font-serif text-6xl font-semibold leading-[.94] tracking-[-0.04em] md:text-8xl">
              Your cup of <em className="font-normal text-primary">not</em>{" "}
              coffee.
            </h1>
            <p className="mt-7 max-w-md text-base leading-7 text-muted-foreground">
              A collection of roasted roots, cacao, and curious botanicals for
              the people who love the ritual — just not the jitters.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#shop"
                className="inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3.5 font-mono text-xs uppercase tracking-wider text-primary-foreground transition hover:gap-4"
              >
                Explore blends <ArrowRight className="h-4 w-4" />
              </a>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                caffeine-free · plant-powered
              </span>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] bg-secondary">
            <Image
              src="/coffee-hero.png"
              alt="Oat milk latte alternative on a warm wooden table"
              width={1200}
              height={800}
              className="h-[390px] w-full object-cover md:h-[540px]"
              priority
            />
            <div className="absolute bottom-5 left-5 rounded-2xl bg-background/90 px-4 py-3 backdrop-blur">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                the daily pour
              </p>
              <p className="mt-1 font-serif text-lg">slow down. sip better.</p>
            </div>
          </div>
        </section>
        <section
          id="shop"
          className="border-y border-border/70 bg-secondary/50"
        >
          <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
            <div className="mb-10 flex items-end justify-between gap-5">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
                  the collection
                </p>
                <h2 className="mt-3 font-serif text-4xl font-semibold md:text-5xl">
                  Meet your new usual.
                </h2>
              </div>
              <a
                href="#shop"
                className="hidden items-center gap-2 font-mono text-xs uppercase tracking-wider text-primary md:flex"
              >
                All blends <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {loadingProducts ? (
                <p className="col-span-full text-center">Loading products...</p>
              ) : productError ? (
                <p className="col-span-full text-center text-red-500">
                  {productError}
                </p>
              ) : products.length === 0 ? (
                <p className="col-span-full text-center">
                  No products available.
                </p>
              ) : (
                products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={() => add(product.id)}
                    onOpen={() => setSelected(product)}
                  />
                ))
              )}
            </div>
          </div>
        </section>
        <section
          id="why"
          className="mx-auto grid max-w-7xl gap-12 px-5 py-24 md:grid-cols-2 md:items-center lg:px-8"
        >
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
              why we started
            </p>
            <h2 className="mt-4 max-w-lg font-serif text-5xl font-semibold leading-tight">
              Because a morning ritual should feel{" "}
              <em className="font-normal text-primary">good</em>.
            </h2>
          </div>
          <div className="space-y-6 text-base leading-7 text-muted-foreground">
            <p>
              Coffee is a beautiful thing. It is also a lot: the buzzing, the
              crash, the “don’t talk to me until I’ve had it.” We wanted the
              warm mug, the familiar pause, and the little moment of care —
              without the caffeine hangover.
            </p>
            <p>
              So we went looking for what else could fill the cup. Turns out,
              the plant world had plenty to say.
            </p>
            <a
              href="#ritual"
              className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-primary"
            >
              Read our story <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
        <section
          id="ritual"
          className="bg-primary px-5 py-20 text-primary-foreground lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 md:grid-cols-4">
              <div className="md:col-span-1">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary-foreground/60">
                  the ritual
                </p>
                <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight">
                  Make space for the in-between.
                </h2>
              </div>
              {[
                [
                  "01",
                  "Scoop",
                  "One generous spoonful into your favorite mug.",
                ],
                ["02", "Pour", "Add hot water or your go-to milk."],
                ["03", "Whisk", "Make it silky. A little froth never hurt."],
                ["04", "Pause", "Take the first sip slowly."],
              ].map(([num, title, text]) => (
                <div
                  key={num}
                  className="border-t border-primary-foreground/30 pt-5"
                >
                  <span className="font-mono text-xs text-primary-foreground/60">
                    {num}
                  </span>
                  <h3 className="mt-8 font-serif text-2xl">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-primary-foreground/70">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="contact" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="rounded-[2rem] bg-card p-8 shadow-[0_18px_40px_rgba(67,42,25,0.07)] md:flex md:items-center md:justify-between md:p-14">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
                stay in the loop
              </p>
              <h2 className="mt-3 font-serif text-4xl font-semibold">
                A little more calm, delivered.
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
                New blends, slow morning ideas, and good things to put in your
                mug.
              </p>
            </div>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-8 flex max-w-md flex-1 gap-2 md:ml-10 md:mt-0"
            >
              <label className="sr-only" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                required
                className="min-w-0 flex-1 rounded-full border border-border bg-background px-5 py-3 text-sm outline-none ring-primary focus:ring-2"
              />
              <button className="rounded-full bg-primary px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-primary-foreground">
                Join
              </button>
            </form>
          </div>
        </section>
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 md:flex-row md:items-center md:justify-between lg:px-8">
          <p className="font-serif text-lg font-bold">
            coffee <span className="text-primary">without</span> coffee
            <span className="text-primary">.</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Made for slower mornings. © 2026 CWC.
          </p>
          <a
            href="#top"
            aria-label="Back to top"
            className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary"
          >
            back to top
          </a>
        </div>
      </footer>
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/35 p-5"
          role="dialog"
          aria-modal="true"
          aria-label={`${selected.name} details`}
        >
          <div className="relative w-full max-w-lg rounded-[2rem] bg-background p-7 shadow-2xl">
            <button
              onClick={() => setSelected(null)}
              className="absolute right-5 top-5 rounded-full p-2 hover:bg-secondary"
              aria-label="Close details"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mb-6 flex h-52 items-center justify-center rounded-[1.5rem] bg-secondary">
              <div
                className="h-32 w-24 rounded-b-[2rem] rounded-t-xl"
                style={{ backgroundColor: selected.color }}
              />
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
              small batch blend
            </p>
            <div className="mt-2 flex items-start justify-between">
              <h2 className="font-serif text-3xl font-semibold">
                {selected.name}
              </h2>
              <span className="font-mono text-lg text-primary">
                ${selected.price}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {selected.note}. A comforting, caffeine-free alternative built for
              your everyday cup.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {selected.ingredients.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground"
                >
                  {item}
                </span>
              ))}
            </div>
            <button
              onClick={() => {
                add(selected.id);
                setSelected(null);
                setCartOpen(true);
              }}
              className="mt-7 w-full rounded-full bg-primary py-3.5 font-mono text-xs uppercase tracking-wider text-primary-foreground"
            >
              Add to cart
            </button>
          </div>
        </div>
      )}
      {cartOpen && (
        <div
          className="fixed inset-0 z-50 bg-foreground/35"
          onClick={() => setCartOpen(false)}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-background p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border pb-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-primary">
                  your basket
                </p>
                <h2 className="mt-1 font-serif text-3xl">Good choice.</h2>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="rounded-full p-2 hover:bg-secondary"
                aria-label="Close cart"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto py-5">
              {count === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Coffee className="h-10 w-10 text-primary" />
                  <p className="mt-4 font-serif text-xl">
                    Your basket is empty.
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Find a blend that feels like you.
                  </p>
                </div>
              ) : (
                Object.entries(cart).map(([id, qty]) => {
                  const p = products.find((x) => x.id === id)!;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-4 border-b border-border py-4"
                    >
                      <Image
                        src={p.image}
                        alt={p.name}
                        width={80}
                        height={80}
                        className="h-16 w-14 rounded-xl object-contain"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-serif text-lg">{p.name}</p>
                        <p className="font-mono text-xs text-primary">
                          ${p.price}
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <button
                            onClick={() => change(id, -1)}
                            className="rounded-full border border-border p-1"
                            aria-label={`Decrease ${p.name}`}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="font-mono text-xs">{qty}</span>
                          <button
                            onClick={() => change(id, 1)}
                            className="rounded-full border border-border p-1"
                            aria-label={`Increase ${p.name}`}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="border-t border-border pt-5">
              <div className="flex justify-between font-serif text-xl">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <button
                disabled={!count}
                onClick={() => setCheckoutOpen(true)}
                className="mt-5 w-full rounded-full bg-primary py-4 font-mono text-xs uppercase tracking-wider text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                Checkout
              </button>
            </div>
          </aside>
        </div>
      )}
      {checkoutOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/50 p-5">
          <div className="w-full max-w-md rounded-3xl bg-background p-7 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-3xl">Your details</h2>
              <button
                type="button"
                onClick={() => setCheckoutOpen(false)}
                className="rounded-full p-2 hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCheckout} className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
              />

              <input
                type="email"
                placeholder="Email Address"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
              />

              <input
                type="tel"
                placeholder="Phone Number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
              />

              <div className="flex justify-between border-t border-border pt-4 font-serif text-xl">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <button
                type="submit"
                disabled={checkoutLoading}
                className="w-full rounded-full bg-primary py-4 font-mono text-xs uppercase tracking-wider text-primary-foreground disabled:opacity-50"
              >
                {checkoutLoading ? "Placing Order..." : "Place Order"}
              </button>
            </form>
          </div>
        </div>
      )}

      
    </div>
  );
}

export default CoffeeSite;
