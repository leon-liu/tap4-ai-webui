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
  process.stdout.write('🚀 [Crawler Callback] Starting...\n');

  try {
    // Get Authorization
    const authHeader = req.headers.get('Authorization');
    process.stdout.write('📝 [Crawler Callback] Checking authorization\n');

    // Check Authorization and Verify token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      process.stdout.write('❌ [Crawler Callback] Missing or invalid authorization\n');
      return NextResponse.json({ error: 'Authorization header is missing or malformed' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const submitKey = process.env.CRON_AUTH_KEY;
    // check key
    const isValid = submitKey === token;
    if (!isValid) {
      process.stdout.write('❌ [Crawler Callback] Invalid token\n');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // get response data
    const body = await req.json();
    process.stdout.write(
      `📥 [Crawler Callback] Received data: ${JSON.stringify({
        code: body.code,
        msg: body.msg,
        url: body.data?.url,
        status: body.code === 200 ? 'success' : 'failed',
        timestamp: new Date().toISOString(),
      })}\n`,
    );

    console.info(!body || body.code === 10001 || !body.data || Object.keys(body.data).length === 0);

    // Check response format and status
    if (!body || body.code === 10001 || !body.data || Object.keys(body.data).length === 0) {
      process.stdout.write('⚠️ [Crawler Callback] Invalid or empty response received\n');
      const supabase = createClient();
      // Update submit status to 2 for failed or empty response
      const { error: updateError } = await supabase
        .from('submit')
        .update({ status: 2 })
        .eq('url', body.data?.url || body.url || req.url);

      if (updateError) {
        process.stdout.write(`❌ [Crawler Callback] Failed to update submit status: ${JSON.stringify(updateError)}\n`);
        return NextResponse.json(
          {
            error: 'Failed to update submit status',
            details: body.msg || 'Empty response',
          },
          { status: 500 },
        );
      }

      process.stdout.write('✅ [Crawler Callback] Updated submit status to 2\n');
      return NextResponse.json(
        {
          message: 'Crawler failed, submit status updated to 2',
          details: body.msg || 'Empty response',
        },
        { status: 200 },
      );
    }

    const { description, detail, name, screenshot_data, screenshot_thumbnail_data, tags, title, url } = body.data;
    process.stdout.write(`🔄 [Crawler Callback] Processing data for URL: ${url}\n`);

    const supabase = createClient();

    // Check if name already exists
    const { data: existingEntry, error: existingEntryError } = await supabase
      .from('web_navigation')
      .select('id')
      .eq('name', name)
      .single();

    if (existingEntryError && existingEntryError.code !== 'PGRST116') {
      process.stdout.write(`❌ [Crawler Callback] Error checking existing entry: ${existingEntryError.message}\n`);
      throw new Error(existingEntryError.message);
    }

    if (existingEntry) {
      process.stdout.write(`📝 [Crawler Callback] Updating existing entry for: ${url}\n`);
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
        process.stdout.write(
          `❌ [Crawler Callback] Error updating web navigation: ${JSON.stringify(updateWebNavigationError)}\n`,
        );
        throw new Error(updateWebNavigationError.message);
      }

      process.stdout.write(`✅ [Crawler Callback] Successfully updated entry for: ${url}\n`);
    } else {
      process.stdout.write(`📝 [Crawler Callback] Creating new entry for: ${url}\n`);
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
        process.stdout.write(
          `❌ [Crawler Callback] Error inserting web navigation: ${JSON.stringify(insertWebNavigationError)}\n`,
        );
        throw new Error(insertWebNavigationError.message);
      }

      process.stdout.write(`✅ [Crawler Callback] Successfully created new entry for: ${url}\n`);
    }

    // Update submit table
    process.stdout.write(`📝 [Crawler Callback] Updating submit status to 1 for: ${url}\n`);
    const { error: updateSubmitError } = await supabase.from('submit').update({ status: 1 }).eq('url', url);

    if (updateSubmitError) {
      process.stdout.write(
        `❌ [Crawler Callback] Error updating submit status: ${JSON.stringify(updateSubmitError)}\n`,
      );
      throw new Error(updateSubmitError.message);
    }

    process.stdout.write(`✅ [Crawler Callback] Process completed successfully for: ${url}\n`);
    return NextResponse.json({ message: 'Success' });
  } catch (error) {
    process.stdout.write(`❌ [Crawler Callback] Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    return NextResponse.json({ error: Error }, { status: 500 });
  }
}
