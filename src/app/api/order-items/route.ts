import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orderItems, orders, products, productVariants } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const orderId = searchParams.get('orderId');

    // Single order item by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const orderItem = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.id, parseInt(id)))
        .limit(1);

      if (orderItem.length === 0) {
        return NextResponse.json(
          { error: 'Order item not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(orderItem[0], { status: 200 });
    }

    // List order items with required orderId
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required', code: 'MISSING_ORDER_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(orderId))) {
      return NextResponse.json(
        { error: 'Valid order ID is required', code: 'INVALID_ORDER_ID' },
        { status: 400 }
      );
    }

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, parseInt(orderId)))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      productId,
      variantId,
      productName,
      variantName,
      quantity,
      unitPrice,
      totalPrice,
    } = body;

    // Validate required fields
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required', code: 'MISSING_ORDER_ID' },
        { status: 400 }
      );
    }

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required', code: 'MISSING_PRODUCT_ID' },
        { status: 400 }
      );
    }

    if (!productName || productName.trim() === '') {
      return NextResponse.json(
        { error: 'Product name is required', code: 'MISSING_PRODUCT_NAME' },
        { status: 400 }
      );
    }

    if (!quantity || isNaN(parseInt(quantity))) {
      return NextResponse.json(
        { error: 'Valid quantity is required', code: 'MISSING_QUANTITY' },
        { status: 400 }
      );
    }

    if (parseInt(quantity) <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0', code: 'INVALID_QUANTITY' },
        { status: 400 }
      );
    }

    if (unitPrice === undefined || unitPrice === null || isNaN(parseFloat(unitPrice))) {
      return NextResponse.json(
        { error: 'Valid unit price is required', code: 'MISSING_UNIT_PRICE' },
        { status: 400 }
      );
    }

    if (parseFloat(unitPrice) < 0) {
      return NextResponse.json(
        { error: 'Unit price cannot be negative', code: 'INVALID_UNIT_PRICE' },
        { status: 400 }
      );
    }

    if (totalPrice === undefined || totalPrice === null || isNaN(parseFloat(totalPrice))) {
      return NextResponse.json(
        { error: 'Valid total price is required', code: 'MISSING_TOTAL_PRICE' },
        { status: 400 }
      );
    }

    if (parseFloat(totalPrice) < 0) {
      return NextResponse.json(
        { error: 'Total price cannot be negative', code: 'INVALID_TOTAL_PRICE' },
        { status: 400 }
      );
    }

    // Validate orderId exists
    const orderExists = await db
      .select()
      .from(orders)
      .where(eq(orders.id, parseInt(orderId)))
      .limit(1);

    if (orderExists.length === 0) {
      return NextResponse.json(
        { error: 'Order not found', code: 'ORDER_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Validate productId exists
    const productExists = await db
      .select()
      .from(products)
      .where(eq(products.id, parseInt(productId)))
      .limit(1);

    if (productExists.length === 0) {
      return NextResponse.json(
        { error: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Validate variantId if provided
    if (variantId) {
      const variantExists = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.id, parseInt(variantId)))
        .limit(1);

      if (variantExists.length === 0) {
        return NextResponse.json(
          { error: 'Product variant not found', code: 'VARIANT_NOT_FOUND' },
          { status: 400 }
        );
      }
    }

    // Create order item
    const newOrderItem = await db
      .insert(orderItems)
      .values({
        orderId: parseInt(orderId),
        productId: parseInt(productId),
        variantId: variantId ? parseInt(variantId) : null,
        productName: productName.trim(),
        variantName: variantName ? variantName.trim() : null,
        quantity: parseInt(quantity),
        unitPrice: parseFloat(unitPrice),
        totalPrice: parseFloat(totalPrice),
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newOrderItem[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { quantity, unitPrice, totalPrice } = body;

    // Check if order item exists
    const existingOrderItem = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.id, parseInt(id)))
      .limit(1);

    if (existingOrderItem.length === 0) {
      return NextResponse.json(
        { error: 'Order item not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Validate quantity if provided
    if (quantity !== undefined) {
      if (isNaN(parseInt(quantity))) {
        return NextResponse.json(
          { error: 'Valid quantity is required', code: 'INVALID_QUANTITY' },
          { status: 400 }
        );
      }

      if (parseInt(quantity) <= 0) {
        return NextResponse.json(
          { error: 'Quantity must be greater than 0', code: 'INVALID_QUANTITY' },
          { status: 400 }
        );
      }
    }

    // Validate unitPrice if provided
    if (unitPrice !== undefined) {
      if (isNaN(parseFloat(unitPrice))) {
        return NextResponse.json(
          { error: 'Valid unit price is required', code: 'INVALID_UNIT_PRICE' },
          { status: 400 }
        );
      }

      if (parseFloat(unitPrice) < 0) {
        return NextResponse.json(
          { error: 'Unit price cannot be negative', code: 'INVALID_UNIT_PRICE' },
          { status: 400 }
        );
      }
    }

    // Validate totalPrice if provided
    if (totalPrice !== undefined) {
      if (isNaN(parseFloat(totalPrice))) {
        return NextResponse.json(
          { error: 'Valid total price is required', code: 'INVALID_TOTAL_PRICE' },
          { status: 400 }
        );
      }

      if (parseFloat(totalPrice) < 0) {
        return NextResponse.json(
          { error: 'Total price cannot be negative', code: 'INVALID_TOTAL_PRICE' },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updates: any = {};
    if (quantity !== undefined) updates.quantity = parseInt(quantity);
    if (unitPrice !== undefined) updates.unitPrice = parseFloat(unitPrice);
    if (totalPrice !== undefined) updates.totalPrice = parseFloat(totalPrice);

    // Update order item
    const updatedOrderItem = await db
      .update(orderItems)
      .set(updates)
      .where(eq(orderItems.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedOrderItem[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if order item exists
    const existingOrderItem = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.id, parseInt(id)))
      .limit(1);

    if (existingOrderItem.length === 0) {
      return NextResponse.json(
        { error: 'Order item not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete order item
    const deletedOrderItem = await db
      .delete(orderItems)
      .where(eq(orderItems.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Order item deleted successfully',
        orderItem: deletedOrderItem[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}