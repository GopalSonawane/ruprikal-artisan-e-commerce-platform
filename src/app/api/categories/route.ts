import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories, products } from '@/db/schema';
import { eq, like, and, or, desc, asc, isNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');

    // Single category by ID or slug
    if (id || slug) {
      const whereCondition = id 
        ? eq(categories.id, parseInt(id))
        : eq(categories.slug, slug!);

      const category = await db.select()
        .from(categories)
        .where(whereCondition)
        .limit(1);

      if (category.length === 0) {
        return NextResponse.json({ 
          error: 'Category not found',
          code: 'CATEGORY_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(category[0]);
    }

    // List categories with pagination, search, filtering, and sorting
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const isActiveParam = searchParams.get('isActive');
    const parentIdParam = searchParams.get('parentId');
    const sort = searchParams.get('sort') ?? 'displayOrder';
    const order = searchParams.get('order') ?? 'asc';

    let query = db.select().from(categories);

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(categories.name, `%${search}%`),
          like(categories.slug, `%${search}%`),
          like(categories.description, `%${search}%`)
        )
      );
    }

    if (isActiveParam !== null) {
      const isActive = isActiveParam === 'true';
      conditions.push(eq(categories.isActive, isActive));
    }

    if (parentIdParam !== null) {
      if (parentIdParam === 'null') {
        conditions.push(isNull(categories.parentId));
      } else {
        conditions.push(eq(categories.parentId, parseInt(parentIdParam)));
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = sort === 'name' ? categories.name
      : sort === 'createdAt' ? categories.createdAt
      : sort === 'updatedAt' ? categories.updatedAt
      : categories.displayOrder;

    query = order === 'desc' 
      ? query.orderBy(desc(sortColumn))
      : query.orderBy(asc(sortColumn));

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, imageUrl, parentId, displayOrder, isActive } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ 
        error: 'Name is required',
        code: 'MISSING_NAME' 
      }, { status: 400 });
    }

    if (!slug || typeof slug !== 'string' || slug.trim() === '') {
      return NextResponse.json({ 
        error: 'Slug is required',
        code: 'MISSING_SLUG' 
      }, { status: 400 });
    }

    // Check if slug already exists
    const existingSlug = await db.select()
      .from(categories)
      .where(eq(categories.slug, slug.trim()))
      .limit(1);

    if (existingSlug.length > 0) {
      return NextResponse.json({ 
        error: 'Slug already exists',
        code: 'DUPLICATE_SLUG' 
      }, { status: 400 });
    }

    // Validate parentId if provided
    if (parentId !== undefined && parentId !== null) {
      const parentCategory = await db.select()
        .from(categories)
        .where(eq(categories.id, parseInt(parentId)))
        .limit(1);

      if (parentCategory.length === 0) {
        return NextResponse.json({ 
          error: 'Parent category not found',
          code: 'PARENT_NOT_FOUND' 
        }, { status: 400 });
      }
    }

    const now = new Date().toISOString();

    const newCategory = await db.insert(categories)
      .values({
        name: name.trim(),
        slug: slug.trim(),
        description: description ? description.trim() : null,
        imageUrl: imageUrl ? imageUrl.trim() : null,
        parentId: parentId !== undefined && parentId !== null ? parseInt(parentId) : null,
        displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newCategory[0], { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Check if category exists
    const existingCategory = await db.select()
      .from(categories)
      .where(eq(categories.id, parseInt(id)))
      .limit(1);

    if (existingCategory.length === 0) {
      return NextResponse.json({ 
        error: 'Category not found',
        code: 'CATEGORY_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { name, slug, description, imageUrl, parentId, displayOrder, isActive } = body;

    // If slug is being changed, check for duplicates
    if (slug && slug !== existingCategory[0].slug) {
      const duplicateSlug = await db.select()
        .from(categories)
        .where(eq(categories.slug, slug.trim()))
        .limit(1);

      if (duplicateSlug.length > 0) {
        return NextResponse.json({ 
          error: 'Slug already exists',
          code: 'DUPLICATE_SLUG' 
        }, { status: 400 });
      }
    }

    // Validate parentId if provided
    if (parentId !== undefined && parentId !== null) {
      // Prevent self-reference
      if (parseInt(parentId) === parseInt(id)) {
        return NextResponse.json({ 
          error: 'Category cannot be its own parent',
          code: 'SELF_REFERENCE' 
        }, { status: 400 });
      }

      const parentCategory = await db.select()
        .from(categories)
        .where(eq(categories.id, parseInt(parentId)))
        .limit(1);

      if (parentCategory.length === 0) {
        return NextResponse.json({ 
          error: 'Parent category not found',
          code: 'PARENT_NOT_FOUND' 
        }, { status: 400 });
      }
    }

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name.trim();
    if (slug !== undefined) updates.slug = slug.trim();
    if (description !== undefined) updates.description = description ? description.trim() : null;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl ? imageUrl.trim() : null;
    if (parentId !== undefined) updates.parentId = parentId !== null ? parseInt(parentId) : null;
    if (displayOrder !== undefined) updates.displayOrder = parseInt(displayOrder);
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    const updatedCategory = await db.update(categories)
      .set(updates)
      .where(eq(categories.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedCategory[0]);
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Check if category exists
    const existingCategory = await db.select()
      .from(categories)
      .where(eq(categories.id, parseInt(id)))
      .limit(1);

    if (existingCategory.length === 0) {
      return NextResponse.json({ 
        error: 'Category not found',
        code: 'CATEGORY_NOT_FOUND' 
      }, { status: 404 });
    }

    // Check if category has children
    const children = await db.select()
      .from(categories)
      .where(eq(categories.parentId, parseInt(id)))
      .limit(1);

    if (children.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete category with subcategories',
        code: 'HAS_CHILDREN' 
      }, { status: 400 });
    }

    // Check if category has products
    const categoryProducts = await db.select()
      .from(products)
      .where(eq(products.categoryId, parseInt(id)))
      .limit(1);

    if (categoryProducts.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete category with products',
        code: 'HAS_PRODUCTS' 
      }, { status: 400 });
    }

    const deletedCategory = await db.delete(categories)
      .where(eq(categories.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Category deleted successfully',
      category: deletedCategory[0]
    });
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}