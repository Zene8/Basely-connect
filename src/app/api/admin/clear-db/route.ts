import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 1. Clear User table
    const deletedUsers = await prisma.user.deleteMany({});
    
    // 2. We keep Company table as it's the data source
    // 3. We keep UserMatch table as it's the desired data
    
    return NextResponse.json({ 
      success: true, 
      message: "Database cleared of user/portfolio data.",
      details: {
        deletedUsers: deletedUsers.count
      }
    });
  } catch (error: any) {
    console.error("Clear DB Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
