/* eslint-disable import/prefer-default-export */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/db/supabase/client';

// submit table empty -> stop

// filter status
// isFeature (priority)
// time order

// when crawler is done
// insert web_nav table (tags <- tags[0] or 'other')
// update submit table status

export async function POST(req: NextRequest) {
  try {
    // Get Authorization
    const authHeader = req.headers.get('Authorization');

    // Check Authorization and Verify token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header is missing or malformed' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const submitKey = process.env.CRON_AUTH_KEY;
    // check key
    const isValid = submitKey === token;
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // get response data
    const body = await req.json();

    // Log only necessary information
    console.log('Callback received:', {
      code: body.code,
      msg: body.msg,
      url: body.data?.url,
      status: body.code === 200 ? 'success' : 'failed',
    });

    // Check response format and status
    if (!body || body.code === 10001 || !body.data || Object.keys(body.data).length === 0) {
      const supabase = createClient();
      // Update submit status to 2 for failed or empty response
      const { error: updateError } = await supabase
        .from('submit')
        .update({ status: 2 })
        .eq('url', body.data?.url || req.url);

      if (updateError) {
        console.error('Failed to update submit status:', updateError);
        return NextResponse.json(
          {
            error: 'Failed to update submit status',
            details: body.msg || 'Empty response',
          },
          { status: 500 },
        );
      }

      return NextResponse.json(
        {
          message: 'Crawler failed, submit status updated to 2',
          details: body.msg || 'Empty response',
        },
        { status: 200 },
      );
    }

    const { description, detail, name, screenshot_data, screenshot_thumbnail_data, tags, title, url } = body.data;

    const supabase = createClient();

    // Check if name already exists
    const { data: existingEntry, error: existingEntryError } = await supabase
      .from('web_navigation')
      .select('id')
      .eq('name', name)
      .single();

    if (existingEntryError && existingEntryError.code !== 'PGRST116') {
      // PGRST116 means no rows found
      throw new Error(existingEntryError.message);
    }

    if (existingEntry) {
      // Update existing entry
      const { error: updateWebNavigationError } = await supabase
        .from('web_navigation')
        .update({
          content: description,
          detail,
          image_url: screenshot_data,
          thumbnail_url: screenshot_thumbnail_data,
          tag_name: tags && tags.length ? tags[0] : 'other',
          category_name: tags && tags.length ? tags[0] : 'other',
          title,
          url,
        })
        .eq('id', existingEntry.id);

      if (updateWebNavigationError) {
        throw new Error(updateWebNavigationError.message);
      }

      console.log('Update result succeed!');
    } else {
      // Insert new entry
      const { error: insertWebNavigationError } = await supabase.from('web_navigation').insert({
        content: description,
        detail,
        name,
        image_url: screenshot_data,
        thumbnail_url: screenshot_thumbnail_data,
        tag_name: tags && tags.length ? tags[0] : 'other',
        category_name: tags && tags.length ? tags[0] : 'other',
        title,
        url,
      });

      if (insertWebNavigationError) {
        throw new Error(insertWebNavigationError.message);
      }

      console.log('Save result succeed!');
    }

    // Update submit table
    const { error: updateSubmitError } = await supabase.from('submit').update({ status: 1 }).eq('url', url);

    if (updateSubmitError) {
      throw new Error(updateSubmitError.message);
    }

    console.log('Update submit succeed!');
    return NextResponse.json({ message: 'Success' });
  } catch (error) {
    return NextResponse.json({ error: Error }, { status: 500 });
  }
}
