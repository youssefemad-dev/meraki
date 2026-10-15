import { NextResponse } from 'next/server';
import { InterpretedPreferences } from '@/lib/schemas/preferences';
import { applyRefinementAction, RefinementAction } from '@/lib/refinement/actions';

export async function POST(request: Request) {
  try {
    const { preferences, action } = await request.json();

    // Validate inputs
    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: 'Valid preferences object is required' },
        { status: 400 }
      );
    }

    if (!action || typeof action !== 'object' || !action.type) {
      return NextResponse.json(
        { error: 'Valid refinement action is required' },
        { status: 400 }
      );
    }

    // Apply the refinement action
    const updatedPreferences = applyRefinementAction(
      preferences as InterpretedPreferences,
      action as RefinementAction
    );

    // Return the updated preferences
    return NextResponse.json({
      preferences: updatedPreferences
    });
  } catch (error) {
    console.error('Error in refinement API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}