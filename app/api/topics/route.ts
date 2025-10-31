import { NextRequest, NextResponse } from 'next/server';
import { TopicModel, Platform } from '@/lib/models/topic';

export async function GET() {
  try {
    const topics = await TopicModel.findAll();
    return NextResponse.json({ success: true, data: topics });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, platforms } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    const topic = await TopicModel.create({
      title,
      description,
      platforms: platforms || ['linkedin', 'facebook', 'instagram', 'x'],
    });

    return NextResponse.json({ success: true, data: topic }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Topic ID is required' },
        { status: 400 }
      );
    }

    const deleted = await TopicModel.delete(parseInt(id));
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Topic not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Topic deleted' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
