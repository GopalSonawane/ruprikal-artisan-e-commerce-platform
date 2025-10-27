import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cart, products, productVariants } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    // Single cart item by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const cartItem = await db.select({
        id: cart.id,
        userId: cart.userId,
        productId: cart.productId,
        variantId: cart.variantId,
        quantity: cart.quantity,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
        product: {
          id: products.id,
          name: products.name,
          slug: products.slug,
          basePrice: products.basePrice,
          images: products.images,
          sku: products.sku,
        },
        variant: {
          id: productVariants.id,
          variantName: productVariants.variantName,
          price: productVariants.price,
          sku: productVariants.sku,
          attributes: productVariants.attributes,
        }
      })
        .from(cart)
        .leftJoin(products, eq(cart.productId, products.id))
        .leftJoin(productVariants, eq(cart.variantId, productVariants.id))
        .where(eq(cart.id, parseInt(id)))
        .limit(1);

      if (cartItem.length === 0) {
        return NextResponse.json({ 
          error: 'Cart item not found',
          code: "NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(cartItem[0], { status: 200 });
    }

    // List cart items for user
    if (!userId) {
      return NextResponse.json({ 
        error: "User ID is required",
        code: "MISSING_USER_ID" 
      }, { status: 400 });
    }

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const cartItems = await db.select({
      id: cart.id,
      userId: cart.userId,
      productId: cart.productId,
      variantId: cart.variantId,
      quantity: cart.quantity,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      product: {
        id: products.id,
        name: products.name,
        slug: products.slug,
        basePrice: products.basePrice,
        images: products.images,
        sku: products.sku,
      },
      variant: {
        id: productVariants.id,
        variantName: productVariants.variantName,
        price: productVariants.price,
        sku: productVariants.sku,
        attributes: productVariants.attributes,
      }
    })
      .from(cart)
      .leftJoin(products, eq(cart.productId, products.id))
      .leftJoin(productVariants, eq(cart.variantId, productVariants.id))
      .where(eq(cart.userId, userId))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(cartItems, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, productId, quantity, variantId } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ 
        error: "User ID is required",
        code: "MISSING_USER_ID" 
      }, { status: 400 });
    }

    if (!productId) {
      return NextResponse.json({ 
        error: "Product ID is required",
        code: "MISSING_PRODUCT_ID" 
      }, { status: 400 });
    }

    // Validate quantity
    const finalQuantity = quantity ?? 1;
    if (finalQuantity < 1 || !Number.isInteger(finalQuantity)) {
      return NextResponse.json({ 
        error: "Quantity must be a positive integer",
        code: "INVALID_QUANTITY" 
      }, { status: 400 });
    }

    // Validate product exists
    const product = await db.select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (product.length === 0) {
      return NextResponse.json({ 
        error: "Product not found",
        code: "PRODUCT_NOT_FOUND" 
      }, { status: 400 });
    }

    // Validate variant if provided
    if (variantId) {
      const variant = await db.select()
        .from(productVariants)
        .where(eq(productVariants.id, variantId))
        .limit(1);

      if (variant.length === 0) {
        return NextResponse.json({ 
          error: "Product variant not found",
          code: "VARIANT_NOT_FOUND" 
        }, { status: 400 });
      }
    }

    // Check if item already exists in cart
    const whereConditions = variantId 
      ? and(
          eq(cart.userId, userId),
          eq(cart.productId, productId),
          eq(cart.variantId, variantId)
        )
      : and(
          eq(cart.userId, userId),
          eq(cart.productId, productId),
          eq(cart.variantId, null)
        );

    const existingItem = await db.select()
      .from(cart)
      .where(whereConditions)
      .limit(1);

    const currentTime = new Date().toISOString();

    // If item exists, update quantity
    if (existingItem.length > 0) {
      const updatedItem = await db.update(cart)
        .set({
          quantity: existingItem[0].quantity + finalQuantity,
          updatedAt: currentTime
        })
        .where(eq(cart.id, existingItem[0].id))
        .returning();

      return NextResponse.json(updatedItem[0], { status: 201 });
    }

    // Create new cart item
    const newCartItem = await db.insert(cart)
      .values({
        userId,
        productId,
        variantId: variantId ?? null,
        quantity: finalQuantity,
        createdAt: currentTime,
        updatedAt: currentTime
      })
      .returning();

    return NextResponse.json(newCartItem[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();
    const { quantity, variantId } = body;

    // Check if cart item exists
    const existingItem = await db.select()
      .from(cart)
      .where(eq(cart.id, parseInt(id)))
      .limit(1);

    if (existingItem.length === 0) {
      return NextResponse.json({ 
        error: 'Cart item not found',
        code: "NOT_FOUND" 
      }, { status: 404 });
    }

    // Validate quantity if provided
    if (quantity !== undefined) {
      if (quantity < 1 || !Number.isInteger(quantity)) {
        return NextResponse.json({ 
          error: "Quantity must be a positive integer",
          code: "INVALID_QUANTITY" 
        }, { status: 400 });
      }
    }

    // Validate variant if provided
    if (variantId !== undefined && variantId !== null) {
      const variant = await db.select()
        .from(productVariants)
        .where(eq(productVariants.id, variantId))
        .limit(1);

      if (variant.length === 0) {
        return NextResponse.json({ 
          error: "Product variant not found",
          code: "VARIANT_NOT_FOUND" 
        }, { status: 400 });
      }
    }

    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (quantity !== undefined) {
      updateData.quantity = quantity;
    }

    if (variantId !== undefined) {
      updateData.variantId = variantId;
    }

    const updatedItem = await db.update(cart)
      .set(updateData)
      .where(eq(cart.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedItem[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    // Delete single cart item by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const deleted = await db.delete(cart)
        .where(eq(cart.id, parseInt(id)))
        .returning();

      if (deleted.length === 0) {
        return NextResponse.json({ 
          error: 'Cart item not found',
          code: "NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json({ 
        message: 'Cart item deleted successfully',
        deletedItem: deleted[0]
      }, { status: 200 });
    }

    // Delete all cart items for user
    if (userId) {
      const deleted = await db.delete(cart)
        .where(eq(cart.userId, userId))
        .returning();

      if (deleted.length === 0) {
        return NextResponse.json({ 
          error: 'No cart items found for this user',
          code: "NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json({ 
        message: `${deleted.length} cart item(s) deleted successfully`,
        deletedItems: deleted
      }, { status: 200 });
    }

    return NextResponse.json({ 
      error: "Either ID or User ID is required",
      code: "MISSING_PARAMETER" 
    }, { status: 400 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}