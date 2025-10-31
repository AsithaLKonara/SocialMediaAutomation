import { NextResponse } from 'next/server';
import postScheduler from '@/lib/scheduler';

export async function POST() {
  try {
    postScheduler.start();
    return NextResponse.json({
      success: true,
      message: 'Scheduler started successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    postScheduler.stop();
    return NextResponse.json({
      success: true,
      message: 'Scheduler stopped successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

