import digestFetch, { FetchError } from '@meathill/digest-fetch';
import { Comment, ResponseBody } from '@awesome-comment/core/types';
import { getTidbKey } from '~/utils/tidb';
import { getCacheKey, getConfig } from '~/utils/api';

export default defineEventHandler(async function (event): Promise<ResponseBody<Comment[]>> {
  const query = getQuery(event);
  const { postId } = query;
  const start = Number(query.start || 0);
  if (!postId) {
    throw createError({
      statusCode: 404,
      message: 'Missing post id',
    });
  }

  const storage = useStorage('data');
  const key = getCacheKey(postId + (start ? '-' + start : ''));
  const stored = await storage.getItem(key) as Comment[];
  if (stored) {
    console.log('[cache] get comments from cache: ', key);
    return {
      code: 0,
      data: stored,
    };
  }

  const data: Comment[] = [];
  try {
    const url = 'https://ap-northeast-1.data.tidbcloud.com/api/v1beta/app/dataapp-NFYbhmOK/endpoint/v1/get';
    const params = new URLSearchParams();
    params.set('post_id', postId as string);
    params.set('start', start.toString());
    const kv = await getTidbKey();
    const response = await digestFetch(`${url}?${params}`, null, {
      method: 'GET',
      realm: 'tidb.cloud',
      ...kv,
    });
    const result = await response.json();
    data.push(...result.data.rows);

    const config = await getConfig();
    for (const item of data) {
      if (!item.user) continue;
      item.user = JSON.parse(String(item.user));
      item.isAdmin = config?.adminEmails?.includes(item.user?.email || '');
    }
  } catch (e) {
    const message = (e as Error).message || String(e);
    throw createError({
      statusCode: (e as FetchError).status,
      message,
    });
  }

  await storage.setItem(key, data, {
    ttl: 60 * 30,
  });

  return {
    code: 0,
    data,
  };
});
