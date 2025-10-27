import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { wishlist, products } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    // Single wishlist item by ID
    if (id) {
      const itemId = parseInt(id);
      if (isNaN(itemId)) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const item = await db.select({
        id: wishlist.id,
        userId: wishlist.userId,
        productId: wishlist.productId,
        createdAt: wishlist.createdAt,
        product: products
      })
        .from(wishlist)
        .leftJoin(products, eq(wishlist.productId, products.id))
        .where(eq(wishlist.id, itemId))
        .limit(1);

      if (item.length === 0) {
        return NextResponse.json({ 
          error: 'Wishlist item not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(item[0], { status: 200 });
    }

    // List wishlist items for a user
    if (!userId) {
      return NextResponse.json({ 
        error: "userId is required",
        code: "MISSING_USER_ID" 
      }, { status: 400 });
    }

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const items = await db.select({
      id: wishlist.id,
      userId: wishlist.userId,
      productId: wishlist.productId,
      createdAt: wishlist.createdAt,
      product: products
    })
      .from(wishlist)
      .leftJoin(products, eq(wishlist.productId, products.id))
      .where(eq(wishlist.userId, userId))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(items, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, productId } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ 
        error: "userId is required",
        code: "MISSING_USER_ID" 
      }, { status: 400 });
    }

    if (!productId) {
      return NextResponse.json({ 
        error: "productId is required",
        code: "MISSING_PRODUCT_ID" 
      }, { status: 400 });
    }

    // Validate productId is a valid integer
    const parsedProductId = parseInt(productId);
    if (isNaN(parsedProductId)) {
      return NextResponse.json({ 
        error: "Valid productId is required",
        code: "INVALID_PRODUCT_ID" 
      }, { status: 400 });
    }

    // Check if product exists
    const product = await db.select()
      .from(products)
      .where(eq(products.id, parsedProductId))
      .limit(1);

    if (product.length === 0) {
      return NextResponse.json({ 
        error: "Product not found",
        code: "PRODUCT_NOT_FOUND" 
      }, { status: 400 });
    }

    // Check if item already exists in wishlist
    const existingItem = await db.select()
      .from(wishlist)
      .where(
        and(
          eq(wishlist.userId, userId),
          eq(wishlist.productId, parsedProductId)
        )
      )
      .limit(1);

    if (existingItem.length > 0) {
      return NextResponse.json(existingItem[0], { status: 200 });
    }

    // Add item to wishlist
    const newItem = await db.insert(wishlist)
      .values({
        userId,
        productId: parsedProductId,
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newItem[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const productId = searchParams.get('productId');

    // Delete by ID
    if (id) {
      const itemId = parseInt(id);
      if (isNaN(itemId)) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const deleted = await db.delete(wishlist)
        .where(eq(wishlist.id, itemId))
        .returning();

      if (deleted.length === 0) {
        return NextResponse.json({ 
          error: 'Wishlist item not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json({ 
        message: 'Wishlist item deleted successfully',
        item: deleted[0]
      }, { status: 200 });
    }

    // Delete by userId and productId
    if (userId && productId) {
      const parsedProductId = parseInt(productId);
      if (isNaN(parsedProductId)) {
        return NextResponse.json({ 
          error: "Valid productId is required",
          code: "INVALID_PRODUCT_ID" 
        }, { status: 400 });
      }

      const deleted = await db.delete(wishlist)
        .where(
          and(
            eq(wishlist.userId, userId),
            eq(wishlist.productId, parsedProductId)
          )
        )
        .returning();

      if (deleted.length === 0) {
        return NextResponse.json({ 
          error: 'Wishlist item not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json({ 
        message: 'Wishlist item deleted successfully',
        item: deleted[0]
      }, { status: 200 });
    }

    // Delete all items for a user (clear entire wishlist)
    if (userId) {
      const deleted = await db.delete(wishlist)
        .where(eq(wishlist.userId, userId))
        .returning();

      if (deleted.length === 0) {
        return NextResponse.json({ 
          error: 'No wishlist items found for this user',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json({ 
        message: `${deleted.length} wishlist item(s) deleted successfully`,
        count: deleted.length,
        items: deleted
      }, { status: 200 });
    }

    // No valid parameters provided
    return NextResponse.json({ 
      error: "id, or userId with optional productId is required",
      code: "MISSING_PARAMETERS" 
    }, { status: 400 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}