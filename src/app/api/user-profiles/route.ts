import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    // Single user profile by ID or userId
    if (id || userId) {
      const whereCondition = id 
        ? eq(userProfiles.id, parseInt(id))
        : eq(userProfiles.userId, userId!);

      if (id && isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const profile = await db.select()
        .from(userProfiles)
        .where(whereCondition)
        .limit(1);

      if (profile.length === 0) {
        return NextResponse.json({ 
          error: 'User profile not found',
          code: 'PROFILE_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(profile[0], { status: 200 });
    }

    // List all user profiles with pagination, filtering, and search
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const isAdminFilter = searchParams.get('isAdmin');

    let query = db.select().from(userProfiles);
    const conditions = [];

    // Apply search filter
    if (search) {
      conditions.push(
        or(
          like(userProfiles.fullName, `%${search}%`),
          like(userProfiles.phone, `%${search}%`),
          like(userProfiles.userId, `%${search}%`)
        )
      );
    }

    // Apply isAdmin filter
    if (isAdminFilter !== null) {
      const isAdminValue = isAdminFilter === 'true';
      conditions.push(eq(userProfiles.isAdmin, isAdminValue));
    }

    // Combine all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const profiles = await query
      .orderBy(desc(userProfiles.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(profiles, { status: 200 });
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
    const { userId, fullName, phone, isAdmin } = body;

    // Validate required fields
    if (!userId || !userId.trim()) {
      return NextResponse.json({ 
        error: "userId is required",
        code: "MISSING_USER_ID" 
      }, { status: 400 });
    }

    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ 
        error: "fullName is required",
        code: "MISSING_FULL_NAME" 
      }, { status: 400 });
    }

    // Check if userId already exists
    const existingProfile = await db.select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId.trim()))
      .limit(1);

    if (existingProfile.length > 0) {
      return NextResponse.json({ 
        error: "User profile with this userId already exists",
        code: "DUPLICATE_USER_ID" 
      }, { status: 400 });
    }

    // Prepare data for insertion
    const now = new Date().toISOString();
    const profileData = {
      userId: userId.trim(),
      fullName: fullName.trim(),
      phone: phone?.trim() || null,
      isAdmin: isAdmin ?? false,
      createdAt: now,
      updatedAt: now,
    };

    // Insert new user profile
    const newProfile = await db.insert(userProfiles)
      .values(profileData)
      .returning();

    return NextResponse.json(newProfile[0], { status: 201 });
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
    const userId = searchParams.get('userId');

    // Validate that either id or userId is provided
    if (!id && !userId) {
      return NextResponse.json({ 
        error: "Either id or userId is required",
        code: "MISSING_IDENTIFIER" 
      }, { status: 400 });
    }

    // Validate id if provided
    if (id && isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();
    const { fullName, phone, isAdmin } = body;

    // Validate required fields for update
    if (fullName !== undefined && (!fullName || !fullName.trim())) {
      return NextResponse.json({ 
        error: "fullName cannot be empty",
        code: "INVALID_FULL_NAME" 
      }, { status: 400 });
    }

    // Check if profile exists
    const whereCondition = id 
      ? eq(userProfiles.id, parseInt(id))
      : eq(userProfiles.userId, userId!);

    const existingProfile = await db.select()
      .from(userProfiles)
      .where(whereCondition)
      .limit(1);

    if (existingProfile.length === 0) {
      return NextResponse.json({ 
        error: 'User profile not found',
        code: 'PROFILE_NOT_FOUND' 
      }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (fullName !== undefined) {
      updateData.fullName = fullName.trim();
    }

    if (phone !== undefined) {
      updateData.phone = phone?.trim() || null;
    }

    if (isAdmin !== undefined) {
      updateData.isAdmin = isAdmin;
    }

    // Update user profile
    const updatedProfile = await db.update(userProfiles)
      .set(updateData)
      .where(whereCondition)
      .returning();

    return NextResponse.json(updatedProfile[0], { status: 200 });
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
    const userId = searchParams.get('userId');

    // Validate that either id or userId is provided
    if (!id && !userId) {
      return NextResponse.json({ 
        error: "Either id or userId is required",
        code: "MISSING_IDENTIFIER" 
      }, { status: 400 });
    }

    // Validate id if provided
    if (id && isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if profile exists
    const whereCondition = id 
      ? eq(userProfiles.id, parseInt(id))
      : eq(userProfiles.userId, userId!);

    const existingProfile = await db.select()
      .from(userProfiles)
      .where(whereCondition)
      .limit(1);

    if (existingProfile.length === 0) {
      return NextResponse.json({ 
        error: 'User profile not found',
        code: 'PROFILE_NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete user profile
    const deletedProfile = await db.delete(userProfiles)
      .where(whereCondition)
      .returning();

    return NextResponse.json({ 
      message: 'User profile deleted successfully',
      profile: deletedProfile[0] 
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}