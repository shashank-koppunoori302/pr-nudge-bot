const GITHUB_API = 'https://api.github.com';

export interface PR {
  number: number;
  title: string;
  htmlUrl: string;
  repository: string;
  createdAt: string;
  assignedAt: string | null;
  author: string;
}

function ghHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function searchAllPages(token: string, query: string): Promise<any[]> {
  const results: any[] = [];
  let page = 1;
  while (true) {
    const url = new URL(`${GITHUB_API}/search/issues`);
    url.searchParams.set('q', query);
    url.searchParams.set('per_page', '100');
    url.searchParams.set('page', String(page));
    const res = await fetch(url.toString(), { headers: ghHeaders(token) });
    if (!res.ok) throw new Error(`GitHub search failed: ${res.status}`);
    const data = await res.json();
    results.push(...data.items);
    if (data.items.length < 100) break;
    page++;
  }
  return results;
}

async function getReviewRequestedAt(
  token: string,
  repo: string,
  prNumber: number,
  login: string,
): Promise<string | null> {
  try {
    const res = await fetch(`${GITHUB_API}/repos/${repo}/issues/${prNumber}/timeline`, {
      headers: ghHeaders(token),
    });
    if (!res.ok) return null;
    const events: any[] = await res.json();
    for (const event of events.reverse()) {
      if (
        event.event === 'review_requested' &&
        event.requested_reviewer?.login?.toLowerCase() === login.toLowerCase()
      ) {
        return event.created_at as string;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function searchPRsForReviewer(
  token: string,
  org: string,
  login: string,
  repos: string[],
): Promise<PR[]> {
  const repoFilters = repos.map((r) => `repo:${org}/${r}`).join(' ');
  const query = `is:open is:pr is:unmerged review-requested:${login} ${repoFilters} draft:false "/prbot track" in:comments`;

  const raw = await searchAllPages(token, query);

  return Promise.all(
    raw.map(async (item) => {
      const repo = item.repository_url.replace('https://api.github.com/repos/', '');
      const assignedAt = await getReviewRequestedAt(token, repo, item.number, login);
      return {
        number: item.number,
        title: item.title,
        htmlUrl: item.html_url,
        repository: repo,
        createdAt: item.created_at,
        assignedAt,
        author: item.user.login,
      };
    }),
  );
}
