
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      customer_name,
      customer_email,
      customer_phone,
      items,
    } = body;

    // Validate customer details
    if (
      typeof customer_name !== "string" ||
      !customer_name.trim() ||
      typeof customer_email !== "string" ||
      !customer_email.trim() ||
      typeof customer_phone !== "string" ||
      !customer_phone.trim()
    ) {
      return NextResponse.json(
        { error: "Please provide valid customer details." },
        { status: 400 }
      );
    }

    // Validate cart
    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > 50
    ) {
      return NextResponse.json(
        { error: "Cart is empty or invalid." },
        { status: 400 }
      );
    }

    // Validate product IDs and quantities
    for (const item of items) {
      if (
        !Number.isInteger(item.product_id) ||
        item.product_id <= 0 ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0 ||
        item.quantity > 99
      ) {
        return NextResponse.json(
          { error: "Invalid product or quantity." },
          { status: 400 }
        );
      }
    }

    // Reject duplicate product IDs
    const productIds = items.map(
      (item: { product_id: number }) => item.product_id
    );

    if (new Set(productIds).size !== productIds.length) {
      return NextResponse.json(
        { error: "Duplicate products are not allowed." },
        { status: 400 }
      );
    }

    // Fetch actual product prices from Supabase
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, price")
      .in("id", productIds);

    if (productsError) {
      console.error("Products error:", productsError);

      return NextResponse.json(
        { error: "Could not verify product prices." },
        { status: 500 }
      );
    }

    // Check that every requested product exists
    if (!products || products.length !== productIds.length) {
      return NextResponse.json(
        { error: "One or more products do not exist." },
        { status: 400 }
      );
    }

    // Create order items using database prices
    const orderItems = items.map(
      (item: { product_id: number; quantity: number }) => {
        const product = products.find(
          (p) => Number(p.id) === item.product_id
        );

        if (!product) {
          throw new Error("Product not found.");
        }

        const price = Number(product.price);

        if (!Number.isFinite(price) || price < 0) {
          throw new Error("Invalid product price.");
        }

        return {
          product_id: item.product_id,
          quantity: item.quantity,
          price: price,
        };
      }
    );

    // Calculate total on the server
    const totalInCents = orderItems.reduce(
      (sum, item) =>
        sum + Math.round(item.price * 100) * item.quantity,
      0
    );

    const total_amount = totalInCents / 100;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: customer_name.trim(),
        customer_email: customer_email.trim(),
        customer_phone: customer_phone.trim(),
        total_amount: total_amount,
        status: "pending",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order error:", orderError);

      return NextResponse.json(
        { error: "Could not create order." },
        { status: 500 }
      );
    }

    // Create order items
    const finalOrderItems = orderItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(finalOrderItems);

    if (itemsError) {
      console.error("Order items error:", itemsError);

      // Attempt to remove incomplete order
      const { error: deleteError } = await supabase
        .from("orders")
        .delete()
        .eq("id", order.id);

      if (deleteError) {
        console.error("Order cleanup error:", deleteError);
      }

      return NextResponse.json(
        { error: "Could not save order items." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      total_amount: total_amount,
    });
  } catch (error) {
    console.error("Checkout error:", error);

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
