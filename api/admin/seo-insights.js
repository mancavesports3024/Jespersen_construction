const { getSearchConsoleClient, getGscSiteUrl } = require('../_lib/gsc-credentials');
const { isAuthenticated } = require('../_lib/admin-auth');

/** Terms that suggest the query is relevant to construction / exterior / storm work (for prioritization). */
const CONSTRUCTION_HINT =
  /roof|siding|gutter|hail|storm|insurance|claim|contractor|exterior|repair|replacement|damage|leak|shingle|metal|vinyl|deck|fascia|soffit|flashing|estimate|supplement|adjuster|wind|emergency|construction|remodel|reno|restoration|water|ice|vent|sheath|wrap|trim|window|door|paint|fence|patio|concrete|foundation|joplin|webb city|carthage|neosho|fayetteville|rogers|bentonville|pittsburg|galena|miami|grove|vinita|missouri|arkansas|kansas|oklahoma/i;

function ymd(d) {
  return d.toISOString().slice(0, 10);
}

function rowsToQueryMap(rows) {
  const map = new Map();
  for (const row of rows || []) {
    const q = row.keys?.[0] || '';
    if (!q || q === '(not set)') continue;
    map.set(q, {
      clicks: Number(row.clicks || 0),
      impressions: Number(row.impressions || 0),
      ctr: Number(row.ctr || 0),
      position: Number(row.position || 0),
    });
  }
  return map;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  res.setHeader('Cache-Control', 'no-store');

  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const siteUrl = getGscSiteUrl();
    const days = Math.min(90, Math.max(7, Number.parseInt(req.query.days || '28', 10) || 28));

    const end = new Date();
    const recentEnd = ymd(end);
    const recentStartDate = new Date(end);
    recentStartDate.setDate(recentStartDate.getDate() - days);
    const recentStart = ymd(recentStartDate);

    const previousEndDate = new Date(recentStartDate);
    previousEndDate.setDate(previousEndDate.getDate() - 1);
    const previousEnd = ymd(previousEndDate);

    const previousStartDate = new Date(previousEndDate);
    previousStartDate.setDate(previousStartDate.getDate() - (days - 1));
    const previousStart = ymd(previousStartDate);

    const searchconsole = await getSearchConsoleClient();

    const [recentResult, previousResult] = await Promise.all([
      searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: recentStart,
          endDate: recentEnd,
          dimensions: ['query'],
          rowLimit: 500,
        },
      }),
      searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: previousStart,
          endDate: previousEnd,
          dimensions: ['query'],
          rowLimit: 500,
        },
      }),
    ]);

    const recentMap = rowsToQueryMap(recentResult.data.rows);
    const previousMap = rowsToQueryMap(previousResult.data.rows);
    const allQueries = new Set([...recentMap.keys(), ...previousMap.keys()]);

    const rows = [];
    for (const query of allQueries) {
      const r = recentMap.get(query) || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
      const p = previousMap.get(query) || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
      const deltaImpressions = r.impressions - p.impressions;
      const deltaClicks = r.clicks - p.clicks;
      const constructionRelated = CONSTRUCTION_HINT.test(query);
      rows.push({
        query,
        recentImpressions: r.impressions,
        previousImpressions: p.impressions,
        deltaImpressions,
        recentClicks: r.clicks,
        previousClicks: p.clicks,
        deltaClicks,
        avgPositionRecent: r.position,
        constructionRelated,
      });
    }

    const risingByImpressions = [...rows]
      .filter((row) => row.deltaImpressions > 0)
      .sort((a, b) => b.deltaImpressions - a.deltaImpressions)
      .slice(0, 40);

    const risingByClicks = [...rows]
      .filter((row) => row.deltaClicks > 0)
      .sort((a, b) => b.deltaClicks - a.deltaClicks)
      .slice(0, 25);

    const constructionRising = risingByImpressions.filter((row) => row.constructionRelated).slice(0, 15);

    return res.status(200).json({
      siteUrl,
      windowDays: days,
      disclaimer:
        'Insights use the official Google Search Console API only. Google does not offer a public API for Google Trends; for broad industry trends, use trends.google.com manually or your Ads/SEO tools.',
      dateRanges: {
        recent: { start: recentStart, end: recentEnd },
        previous: { start: previousStart, end: previousEnd },
      },
      risingByImpressions,
      risingByClicks,
      constructionRising,
    });
  } catch (error) {
    const message = error?.message || 'Failed to fetch SEO insights.';

    if (message.includes('403') || message.includes('Forbidden')) {
      return res.status(403).json({
        error: 'Access denied. Add the service-account email as a user in Search Console.',
      });
    }

    if (message.includes('404') || message.toLowerCase().includes('not found')) {
      return res.status(404).json({
        error: 'Site not found. Make sure GSC_SITE_URL matches your Search Console property exactly.',
      });
    }

    return res.status(error.statusCode || 500).json({ error: message });
  }
};
