import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products, productVariants, cart, wishlist, orderItems } from '@/db/schema';
import { eq, like, and, or, desc, asc, gte, lte, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');

    // Single product by ID or slug
    if (id || slug) {
      const whereCondition = id 
        ? eq(products.id, parseInt(id))
        : eq(products.slug, slug as string);

      const product = await db.select()
        .from(products)
        .where(whereCondition)
        .limit(1);

      if (product.length === 0) {
        return NextResponse.json({ 
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        }, { status: 404 });
      }

      return NextResponse.json(product[0]);
    }

    // List products with filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');
    const featured = searchParams.get('featured');
    const categoryId = searchParams.get('categoryId');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sort = searchParams.get('sort') ?? 'createdAt';
    const order = searchParams.get('order') ?? 'desc';

    let query = db.select().from(products);

    // Build WHERE conditions
    const conditions = [];

    // Search filter
    if (search) {
      conditions.push(
        or(
          like(products.name, `%${search}%`),
          like(products.slug, `%${search}%`),
          like(products.description, `%${search}%`),
          like(products.sku, `%${search}%`)
        )
      );
    }

    // Boolean filters
    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(products.isActive, isActive === 'true'));
    }

    if (featured !== null && featured !== undefined) {
      conditions.push(eq(products.featured, featured === 'true'));
    }

    // Category filter
    if (categoryId) {
      conditions.push(eq(products.categoryId, parseInt(categoryId)));
    }

    // Price range filters
    if (minPrice) {
      conditions.push(gte(products.basePrice, parseFloat(minPrice)));
    }

    if (maxPrice) {
      conditions.push(lte(products.basePrice, parseFloat(maxPrice)));
    }

    // Apply WHERE conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = sort === 'basePrice' 
      ? products.basePrice 
      : sort === 'name' 
      ? products.name 
      : products.createdAt;

    query = order === 'asc' 
      ? query.orderBy(asc(sortColumn))
      : query.orderBy(desc(sortColumn));

    // Apply pagination
    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results);

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
    const { name, slug, basePrice, sku, description, categoryId, stockQuantity, isActive, featured, images } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ 
        error: 'Product name is required',
        code: 'MISSING_NAME'
      }, { status: 400 });
    }

    if (!slug || !slug.trim()) {
      return NextResponse.json({ 
        error: 'Product slug is required',
        code: 'MISSING_SLUG'
      }, { status: 400 });
    }

    if (!sku || !sku.trim()) {
      return NextResponse.json({ 
        error: 'Product SKU is required',
        code: 'MISSING_SKU'
      }, { status: 400 });
    }

    if (basePrice === undefined || basePrice === null) {
      return NextResponse.json({ 
        error: 'Base price is required',
        code: 'MISSING_BASE_PRICE'
      }, { status: 400 });
    }

    // Validate base price is positive
    if (typeof basePrice !== 'number' || basePrice <= 0) {
      return NextResponse.json({ 
        error: 'Base price must be a positive number',
        code: 'INVALID_BASE_PRICE'
      }, { status: 400 });
    }

    // Check for duplicate slug
    const existingSlug = await db.select()
      .from(products)
      .where(eq(products.slug, slug.trim()))
      .limit(1);

    if (existingSlug.length > 0) {
      return NextResponse.json({ 
        error: 'Product with this slug already exists',
        code: 'DUPLICATE_SLUG'
      }, { status: 400 });
    }

    // Check for duplicate SKU
    const existingSku = await db.select()
      .from(products)
      .where(eq(products.sku, sku.trim()))
      .limit(1);

    if (existingSku.length > 0) {
      return NextResponse.json({ 
        error: 'Product with this SKU already exists',
        code: 'DUPLICATE_SKU'
      }, { status: 400 });
    }

    // Validate categoryId if provided
    if (categoryId !== undefined && categoryId !== null) {
      if (!Number.isInteger(categoryId) || categoryId <= 0) {
        return NextResponse.json({ 
          error: 'Category ID must be a valid positive integer',
          code: 'INVALID_CATEGORY_ID'
        }, { status: 400 });
      }
    }

    // Prepare insert data with defaults
    const currentTimestamp = new Date().toISOString();
    
    const newProduct = await db.insert(products)
      .values({
        name: name.trim(),
        slug: slug.trim(),
        sku: sku.trim(),
        basePrice,
        description: description?.trim() || null,
        categoryId: categoryId || null,
        stockQuantity: stockQuantity !== undefined ? stockQuantity : 0,
        isActive: isActive !== undefined ? isActive : true,
        featured: featured !== undefined ? featured : false,
        images: images || null,
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
      })
      .returning();

    return NextResponse.json(newProduct[0], { status: 201 });

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

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid product ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const productId = parseInt(id);

    // Check if product exists
    const existingProduct = await db.select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (existingProduct.length === 0) {
      return NextResponse.json({ 
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      }, { status: 404 });
    }

    const body = await request.json();
    const { name, slug, description, basePrice, categoryId, sku, stockQuantity, isActive, featured, images } = body;

    // Validate base price if provided
    if (basePrice !== undefined && basePrice !== null) {
      if (typeof basePrice !== 'number' || basePrice <= 0) {
        return NextResponse.json({ 
          error: 'Base price must be a positive number',
          code: 'INVALID_BASE_PRICE'
        }, { status: 400 });
      }
    }

    // Check for duplicate slug if slug is being updated
    if (slug && slug !== existingProduct[0].slug) {
      const duplicateSlug = await db.select()
        .from(products)
        .where(and(
          eq(products.slug, slug.trim()),
          sql`${products.id} != ${productId}`
        ))
        .limit(1);

      if (duplicateSlug.length > 0) {
        return NextResponse.json({ 
          error: 'Product with this slug already exists',
          code: 'DUPLICATE_SLUG'
        }, { status: 400 });
      }
    }

    // Check for duplicate SKU if SKU is being updated
    if (sku && sku !== existingProduct[0].sku) {
      const duplicateSku = await db.select()
        .from(products)
        .where(and(
          eq(products.sku, sku.trim()),
          sql`${products.id} != ${productId}`
        ))
        .limit(1);

      if (duplicateSku.length > 0) {
        return NextResponse.json({ 
          error: 'Product with this SKU already exists',
          code: 'DUPLICATE_SKU'
        }, { status: 400 });
      }
    }

    // Validate categoryId if provided
    if (categoryId !== undefined && categoryId !== null) {
      if (!Number.isInteger(categoryId) || categoryId <= 0) {
        return NextResponse.json({ 
          error: 'Category ID must be a valid positive integer',
          code: 'INVALID_CATEGORY_ID'
        }, { status: 400 });
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (slug !== undefined) updateData.slug = slug.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (basePrice !== undefined) updateData.basePrice = basePrice;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (sku !== undefined) updateData.sku = sku.trim();
    if (stockQuantity !== undefined) updateData.stockQuantity = stockQuantity;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (featured !== undefined) updateData.featured = featured;
    if (images !== undefined) updateData.images = images;

    const updatedProduct = await db.update(products)
      .set(updateData)
      .where(eq(products.id, productId))
      .returning();

    return NextResponse.json(updatedProduct[0]);

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

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid product ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const productId = parseInt(id);

    // Check if product exists
    const existingProduct = await db.select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (existingProduct.length === 0) {
      return NextResponse.json({ 
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      }, { status: 404 });
    }

    // Check if product has variants
    const variants = await db.select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId))
      .limit(1);

    if (variants.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete product with existing variants. Please delete variants first.',
        code: 'HAS_VARIANTS'
      }, { status: 400 });
    }

    // Check if product is in any cart
    const cartItems = await db.select()
      .from(cart)
      .where(eq(cart.productId, productId))
      .limit(1);

    if (cartItems.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete product that is in customer carts',
        code: 'IN_CART'
      }, { status: 400 });
    }

    // Check if product is in any wishlist
    const wishlistItems = await db.select()
      .from(wishlist)
      .where(eq(wishlist.productId, productId))
      .limit(1);

    if (wishlistItems.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete product that is in customer wishlists',
        code: 'IN_WISHLIST'
      }, { status: 400 });
    }

    // Check if product is in any orders
    const orderItemsExist = await db.select()
      .from(orderItems)
      .where(eq(orderItems.productId, productId))
      .limit(1);

    if (orderItemsExist.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete product that is in existing orders',
        code: 'IN_ORDERS'
      }, { status: 400 });
    }

    // Delete the product
    const deletedProduct = await db.delete(products)
      .where(eq(products.id, productId))
      .returning();

    return NextResponse.json({
      message: 'Product deleted successfully',
      product: deletedProduct[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}