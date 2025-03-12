/* eslint-disable import/prefer-default-export */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/db/supabase/client';

import crawler from './crawler';

// submit table empty -> stop

// filter status
// isFeature (priority)
// time order

// when crawler is done
// insert web_nav table (tags <- tags[0] or 'other')
// update submit table status

export async function POST(req: NextRequest) {
  try {
    // 获取请求头中的 Authorization
    const authHeader = req.headers.get('Authorization');

    // 检查 Authorization 是否存在并验证 token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header is missing or malformed' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const cronKey = process.env.CRON_AUTH_KEY;
    // 假设这里有一个函数 `verifyToken` 用于验证 token，如果验证失败则抛出错误
    const isValid = cronKey === token;
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const supabase = createClient();

    console.log('supabase connected!');

    const [{ data: categoryList, error: categoryListError }, { data: submitList, error: submitListError }] =
      await Promise.all([
        supabase.from('navigation_category').select(),
        supabase
          .from('submit')
          .select()
          .eq('status', 0)
          .order('is_feature', { ascending: false })
          .order('created_at', { ascending: true }),
      ]);

    console.log('supabase get categoryList succeed!');
    if (categoryListError || !categoryList) {
      return NextResponse.json({ error: 'Category is null' }, { status: 201 });
    }

    if (submitListError || !submitList || !submitList[0]) {
      return NextResponse.json({ error: 'Submit list is null' }, { status: 202 });
    }
    console.log('supabase get submitList succeed!');

    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/cron_callback`;

    const firstSubmitData = submitList[0];
    console.log(firstSubmitData);
    const res = await crawler({
      url: firstSubmitData.url!,
      tags: categoryList!.map((item) => item.name),
      callback_url: callbackUrl,
      key: cronKey,
    });

    console.log('Crawler response:', res);

    if (res.code === 504) {
      return NextResponse.json(
        {
          error: 'Crawler timeout',
          details: res.msg,
        },
        { status: 504 },
      );
    }

    if (res.code !== 200) {
      return NextResponse.json(
        {
          error: 'Crawler error',
          details: res.msg,
        },
        { status: res.code },
      );
    }

    return NextResponse.json({
      message: 'Success',
      data: res.data,
    });
  } catch (error) {
    return Response.json({ error });
  }
}

// export async function PUT(req: NextRequest) {
//   try {
//     // 获取请求头中的 Authorization
//     const authHeader = req.headers.get('Authorization');

//     // 检查 Authorization 是否存在并验证 token
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return NextResponse.json({ error: 'Authorization header is missing or malformed' }, { status: 401 });
//     }

//     const token = authHeader.split(' ')[1];
//     const cronKey = process.env.CRON_AUTH_KEY;
//     // 假设这里有一个函数 `verifyToken` 用于验证 token，如果验证失败则抛出错误
//     const isValid = cronKey === token;
//     if (!isValid) {
//       return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
//     }

//     const supabase = createClient();

//     console.log('supabase connected!');

//     const [{ data: categoryList, error: categoryListError }, { data: submitList, error: submitListError }] =
//       await Promise.all([
//         supabase.from('navigation_category').select(),
//         supabase
//           .from('submit')
//           .select()
//           .eq('status', 0)
//           .order('is_feature', { ascending: false })
//           .order('created_at', { ascending: true }),
//       ]);

//     console.log('supabase get categoryList succeed!');
//     if (categoryListError || !categoryList) {
//       return NextResponse.json({ error: 'Category is null' }, { status: 201 });
//     }

//     if (submitListError || !submitList || !submitList[0]) {
//       return NextResponse.json({ error: 'Submit list is null' }, { status: 202 });
//     }
//     console.log('supabase get submitList succeed!');

//     const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/cron_callback`;

//     // Process one at a time with longer timeout
//     const BATCH_SIZE = 1; // Reduced to 1 to test individual requests
//     const TIMEOUT = 120000; // Increased to 120 seconds
//     const results = [];

//     const crawlerWithTimeout = async (submitData: any) => {
//       try {
//         console.log(`Starting crawler for ${submitData.url}`);
//         const timeoutPromise = new Promise((_, reject) =>
//           setTimeout(() => reject(new Error(`Crawler timeout after ${TIMEOUT}ms`)), TIMEOUT),
//         );

//         const crawlerPromise = crawler({
//           url: submitData.url!,
//           tags: categoryList!.map((item) => item.name),
//           callback_url: callbackUrl,
//           key: cronKey,
//         });

//         console.log(`Waiting for crawler response for ${submitData.url}...`);
//         const result = await Promise.race([crawlerPromise, timeoutPromise]);
//         console.log(`Crawler completed for ${submitData.url}:`, result);
//         return { success: true, data: result, url: submitData.url };
//       } catch (error) {
//         console.error(`Failed to crawl ${submitData.url}:`, error);
//         // Log more details about the error
//         if (error instanceof Error) {
//           console.error('Error details:', {
//             message: error.message,
//             stack: error.stack,
//             name: error.name,
//           });
//         }
//         return { success: false, error, url: submitData.url };
//       }
//     };

//     for (let i = 0; i < submitList.length; i += BATCH_SIZE) {
//       const batch = submitList.slice(i, i + BATCH_SIZE);
//       console.log(`\n--- Processing batch ${i / BATCH_SIZE + 1}, size: ${batch.length} ---`);

//       const batchPromises = batch.map((submitData) => crawlerWithTimeout(submitData));

//       const batchResults = await Promise.all(batchPromises);
//       console.log(
//         `\nBatch ${i / BATCH_SIZE + 1} results:`,
//         batchResults.map((r) => ({
//           url: r.url,
//           success: r.success,
//           response: r.success ? r.data : 'failed',
//         })),
//       );

//       // Filter out successful results
//       const successfulResults = batchResults.filter((r) => r.success).map((r) => r.data);
//       results.push(...successfulResults);

//       // Add a longer delay between requests
//       if (i + BATCH_SIZE < submitList.length) {
//         console.log('Waiting 2 seconds before next request...');
//         await new Promise((resolve) => setTimeout(resolve, 2000));
//       }
//     }

//     console.log('api get crawler succeed!');
//     console.log(`Total processed: ${submitList.length}, Successful: ${results.length}`);

//     if (results.length === 0) {
//       throw new Error('All crawler operations failed');
//     }

//     const failedCount = submitList.length - results.length;
//     if (failedCount > 0) {
//       console.warn(`${failedCount} crawler operations failed`);
//     }

//     return NextResponse.json({
//       message: 'Completed',
//       total: submitList.length,
//       successful: results.length,
//       failed: failedCount,
//     });
//   } catch (error) {
//     return Response.json({ error });
//   }
// }
