import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { homepageSlides } from '@/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single slide by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const slide = await db
        .select()
        .from(homepageSlides)
        .where(eq(homepageSlides.id, parseInt(id)))
        .limit(1);

      if (slide.length === 0) {
        return NextResponse.json(
          { error: 'Slide not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(slide[0], { status: 200 });
    }

    // List all slides with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const isActiveParam = searchParams.get('isActive');
    const sort = searchParams.get('sort') ?? 'displayOrder';
    const order = searchParams.get('order') ?? 'asc';

    let query = db.select().from(homepageSlides);

    // Filter by isActive if provided
    if (isActiveParam !== null) {
      const isActiveValue = isActiveParam === 'true';
      query = query.where(eq(homepageSlides.isActive, isActiveValue));
    }

    // Apply sorting
    const orderColumn = sort === 'displayOrder' ? homepageSlides.displayOrder : homepageSlides.createdAt;
    const orderDirection = order === 'desc' ? desc(orderColumn) : asc(orderColumn);
    
    const slides = await query
      .orderBy(orderDirection)
      .limit(limit)
      .offset(offset);

    return NextResponse.json(slides, { status: 200 });
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
    const { title, subtitle, imageUrl, linkUrl, buttonText, displayOrder, isActive } = body;

    // Validate required fields
    if (!title || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required', code: 'MISSING_TITLE' },
        { status: 400 }
      );
    }

    if (!imageUrl || imageUrl.trim() === '') {
      return NextResponse.json(
        { error: 'Image URL is required', code: 'MISSING_IMAGE_URL' },
        { status: 400 }
      );
    }

    // Prepare insert data with defaults
    const currentTimestamp = new Date().toISOString();
    const insertData = {
      title: title.trim(),
      subtitle: subtitle?.trim() || null,
      imageUrl: imageUrl.trim(),
      linkUrl: linkUrl?.trim() || null,
      buttonText: buttonText?.trim() || null,
      displayOrder: displayOrder !== undefined ? displayOrder : 0,
      isActive: isActive !== undefined ? isActive : true,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };

    const newSlide = await db
      .insert(homepageSlides)
      .values(insertData)
      .returning();

    return NextResponse.json(newSlide[0], { status: 201 });
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

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, subtitle, imageUrl, linkUrl, buttonText, displayOrder, isActive } = body;

    // Check if slide exists
    const existingSlide = await db
      .select()
      .from(homepageSlides)
      .where(eq(homepageSlides.id, parseInt(id)))
      .limit(1);

    if (existingSlide.length === 0) {
      return NextResponse.json(
        { error: 'Slide not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Validate required fields if provided
    if (title !== undefined && (!title || title.trim() === '')) {
      return NextResponse.json(
        { error: 'Title cannot be empty', code: 'INVALID_TITLE' },
        { status: 400 }
      );
    }

    if (imageUrl !== undefined && (!imageUrl || imageUrl.trim() === '')) {
      return NextResponse.json(
        { error: 'Image URL cannot be empty', code: 'INVALID_IMAGE_URL' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title.trim();
    if (subtitle !== undefined) updateData.subtitle = subtitle?.trim() || null;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl.trim();
    if (linkUrl !== undefined) updateData.linkUrl = linkUrl?.trim() || null;
    if (buttonText !== undefined) updateData.buttonText = buttonText?.trim() || null;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedSlide = await db
      .update(homepageSlides)
      .set(updateData)
      .where(eq(homepageSlides.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedSlide[0], { status: 200 });
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

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if slide exists
    const existingSlide = await db
      .select()
      .from(homepageSlides)
      .where(eq(homepageSlides.id, parseInt(id)))
      .limit(1);

    if (existingSlide.length === 0) {
      return NextResponse.json(
        { error: 'Slide not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deletedSlide = await db
      .delete(homepageSlides)
      .where(eq(homepageSlides.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Slide deleted successfully',
        slide: deletedSlide[0],
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