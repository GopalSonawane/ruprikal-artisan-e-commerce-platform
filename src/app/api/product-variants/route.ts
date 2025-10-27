import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { productVariants, products, cart, orderItems } from '@/db/schema';
import { eq, like, and, or, desc, asc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single variant by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const variant = await db.select()
        .from(productVariants)
        .where(eq(productVariants.id, parseInt(id)))
        .limit(1);

      if (variant.length === 0) {
        return NextResponse.json({ 
          error: 'Product variant not found',
          code: 'VARIANT_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(variant[0], { status: 200 });
    }

    // List variants with pagination, filtering, and search
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const productIdParam = searchParams.get('productId');
    const isActiveParam = searchParams.get('isActive');

    let query = db.select().from(productVariants);

    const conditions = [];

    // Filter by productId
    if (productIdParam) {
      const productId = parseInt(productIdParam);
      if (!isNaN(productId)) {
        conditions.push(eq(productVariants.productId, productId));
      }
    }

    // Filter by isActive
    if (isActiveParam !== null) {
      const isActive = isActiveParam === 'true';
      conditions.push(eq(productVariants.isActive, isActive));
    }

    // Search in variantName and sku
    if (search) {
      conditions.push(
        or(
          like(productVariants.variantName, `%${search}%`),
          like(productVariants.sku, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query
      .orderBy(desc(productVariants.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
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
    const { productId, variantName, sku, price, stockQuantity, attributes, isActive } = body;

    // Validate required fields
    if (!productId) {
      return NextResponse.json({ 
        error: "Product ID is required",
        code: "MISSING_PRODUCT_ID" 
      }, { status: 400 });
    }

    if (!variantName || variantName.trim() === '') {
      return NextResponse.json({ 
        error: "Variant name is required",
        code: "MISSING_VARIANT_NAME" 
      }, { status: 400 });
    }

    if (!sku || sku.trim() === '') {
      return NextResponse.json({ 
        error: "SKU is required",
        code: "MISSING_SKU" 
      }, { status: 400 });
    }

    if (price === undefined || price === null) {
      return NextResponse.json({ 
        error: "Price is required",
        code: "MISSING_PRICE" 
      }, { status: 400 });
    }

    // Validate price is positive
    if (typeof price !== 'number' || price <= 0) {
      return NextResponse.json({ 
        error: "Price must be a positive number",
        code: "INVALID_PRICE" 
      }, { status: 400 });
    }

    // Validate productId is a valid integer
    if (typeof productId !== 'number' || isNaN(productId)) {
      return NextResponse.json({ 
        error: "Product ID must be a valid number",
        code: "INVALID_PRODUCT_ID" 
      }, { status: 400 });
    }

    // Check if product exists
    const existingProduct = await db.select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (existingProduct.length === 0) {
      return NextResponse.json({ 
        error: "Product not found",
        code: "PRODUCT_NOT_FOUND" 
      }, { status: 400 });
    }

    // Check if SKU is unique
    const existingSku = await db.select()
      .from(productVariants)
      .where(eq(productVariants.sku, sku.trim()))
      .limit(1);

    if (existingSku.length > 0) {
      return NextResponse.json({ 
        error: "SKU already exists",
        code: "DUPLICATE_SKU" 
      }, { status: 400 });
    }

    // Validate stockQuantity if provided
    const finalStockQuantity = stockQuantity !== undefined && stockQuantity !== null 
      ? (typeof stockQuantity === 'number' ? stockQuantity : 0)
      : 0;

    if (finalStockQuantity < 0) {
      return NextResponse.json({ 
        error: "Stock quantity cannot be negative",
        code: "INVALID_STOCK_QUANTITY" 
      }, { status: 400 });
    }

    // Validate attributes if provided
    let finalAttributes = null;
    if (attributes !== undefined && attributes !== null) {
      if (typeof attributes === 'object') {
        finalAttributes = attributes;
      } else {
        return NextResponse.json({ 
          error: "Attributes must be a valid JSON object",
          code: "INVALID_ATTRIBUTES" 
        }, { status: 400 });
      }
    }

    // Create new variant
    const timestamp = new Date().toISOString();
    const newVariant = await db.insert(productVariants)
      .values({
        productId,
        variantName: variantName.trim(),
        sku: sku.trim(),
        price,
        stockQuantity: finalStockQuantity,
        attributes: finalAttributes,
        isActive: isActive !== undefined ? isActive : true,
        createdAt: timestamp,
        updatedAt: timestamp
      })
      .returning();

    return NextResponse.json(newVariant[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const variantId = parseInt(id);

    // Check if variant exists
    const existingVariant = await db.select()
      .from(productVariants)
      .where(eq(productVariants.id, variantId))
      .limit(1);

    if (existingVariant.length === 0) {
      return NextResponse.json({ 
        error: 'Product variant not found',
        code: 'VARIANT_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { variantName, sku, price, stockQuantity, attributes, isActive } = body;

    const updates: any = {};

    // Validate and update variantName
    if (variantName !== undefined) {
      if (typeof variantName !== 'string' || variantName.trim() === '') {
        return NextResponse.json({ 
          error: "Variant name must be a non-empty string",
          code: "INVALID_VARIANT_NAME" 
        }, { status: 400 });
      }
      updates.variantName = variantName.trim();
    }

    // Validate and update SKU
    if (sku !== undefined) {
      if (typeof sku !== 'string' || sku.trim() === '') {
        return NextResponse.json({ 
          error: "SKU must be a non-empty string",
          code: "INVALID_SKU" 
        }, { status: 400 });
      }

      const trimmedSku = sku.trim();

      // Check if SKU is unique (excluding current variant)
      if (trimmedSku !== existingVariant[0].sku) {
        const existingSku = await db.select()
          .from(productVariants)
          .where(
            and(
              eq(productVariants.sku, trimmedSku),
              sql`${productVariants.id} != ${variantId}`
            )
          )
          .limit(1);

        if (existingSku.length > 0) {
          return NextResponse.json({ 
            error: "SKU already exists",
            code: "DUPLICATE_SKU" 
          }, { status: 400 });
        }
      }

      updates.sku = trimmedSku;
    }

    // Validate and update price
    if (price !== undefined) {
      if (typeof price !== 'number' || price <= 0) {
        return NextResponse.json({ 
          error: "Price must be a positive number",
          code: "INVALID_PRICE" 
        }, { status: 400 });
      }
      updates.price = price;
    }

    // Validate and update stockQuantity
    if (stockQuantity !== undefined) {
      if (typeof stockQuantity !== 'number' || stockQuantity < 0) {
        return NextResponse.json({ 
          error: "Stock quantity must be a non-negative number",
          code: "INVALID_STOCK_QUANTITY" 
        }, { status: 400 });
      }
      updates.stockQuantity = stockQuantity;
    }

    // Validate and update attributes
    if (attributes !== undefined) {
      if (attributes !== null && typeof attributes !== 'object') {
        return NextResponse.json({ 
          error: "Attributes must be a valid JSON object or null",
          code: "INVALID_ATTRIBUTES" 
        }, { status: 400 });
      }
      updates.attributes = attributes;
    }

    // Update isActive
    if (isActive !== undefined) {
      updates.isActive = isActive;
    }

    // Always update updatedAt
    updates.updatedAt = new Date().toISOString();

    const updatedVariant = await db.update(productVariants)
      .set(updates)
      .where(eq(productVariants.id, variantId))
      .returning();

    return NextResponse.json(updatedVariant[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const variantId = parseInt(id);

    // Check if variant exists
    const existingVariant = await db.select()
      .from(productVariants)
      .where(eq(productVariants.id, variantId))
      .limit(1);

    if (existingVariant.length === 0) {
      return NextResponse.json({ 
        error: 'Product variant not found',
        code: 'VARIANT_NOT_FOUND' 
      }, { status: 404 });
    }

    // Check if variant is in any cart
    const inCart = await db.select()
      .from(cart)
      .where(eq(cart.variantId, variantId))
      .limit(1);

    if (inCart.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete variant that is in customer carts",
        code: "VARIANT_IN_CART" 
      }, { status: 400 });
    }

    // Check if variant is in any orders
    const inOrders = await db.select()
      .from(orderItems)
      .where(eq(orderItems.variantId, variantId))
      .limit(1);

    if (inOrders.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete variant that is in orders",
        code: "VARIANT_IN_ORDERS" 
      }, { status: 400 });
    }

    // Delete the variant
    const deleted = await db.delete(productVariants)
      .where(eq(productVariants.id, variantId))
      .returning();

    return NextResponse.json({ 
      message: 'Product variant deleted successfully',
      variant: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}