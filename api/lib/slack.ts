import { PR } from './github';

export interface Workload {
  reviewerDisplay: string;
  prs: PR[];
}

function ageInDays(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / 86_400_000;
}

function formatAge(days: number): string {
  if (days < 1) {
    const hours = Math.floor(days * 24);
    return hours === 0 ? 'just now' : `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  if (days < 30) {
    const d = Math.floor(days);
    return `${d} day${d !== 1 ? 's' : ''}`;
  }
  const m = Math.floor(days / 30);
  return `${m} month${m !== 1 ? 's' : ''}`;
}

function ageIndicator(days: number, hasAssignedAt: boolean): string {
  if (!hasAssignedAt) return '⚪';
  if (days > 6) return '🔴';
  if (days > 3) return '🟡';
  return '🟢';
}

export function renderBlocks(workloads: Workload[]): object[] {
  if (!workloads.length) {
    return [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: '🙌 Nothing to nudge today. All caught up!' },
      },
    ];
  }

  const totalPRs = workloads.reduce((s, w) => s + w.prs.length, 0);
  const reviewerWord = workloads.length !== 1 ? 'reviewers' : 'reviewer';
  const prWord = totalPRs !== 1 ? 'PRs' : 'PR';

  const header: object[] = [
    { type: 'divider' },
    { type: 'header', text: { type: 'plain_text', text: '📋 Pending PR Reviews', emoji: true } },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `*${workloads.length} ${reviewerWord} • ${totalPRs} active ${prWord}*\n_Comment \`/prbot track\` on your PR for me to track it_`,
        },
      ],
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: '*Legend:* 🟢 ≤ 3 days  |  🟡 4–6 days  |  🔴 > 6 days  |  ⚪ review date unavailable',
        },
      ],
    },
    { type: 'divider' },
  ];

  const body = workloads.flatMap((w) => {
    const lines = w.prs.slice(0, 10).map((pr) => {
      const repo = pr.repository.split('/').pop();
      const title = pr.title.length > 100 ? pr.title.slice(0, 100) + '...' : pr.title;
      const ref = pr.assignedAt || pr.createdAt;
      const days = ageInDays(ref);
      const indicator = ageIndicator(days, !!pr.assignedAt);
      const agePart = pr.assignedAt ? ` (assigned ${formatAge(days)} ago)` : '';
      return `• ${indicator} \`${repo}\`  -  <${pr.htmlUrl}|${title}>${agePart}`;
    });

    const prWord = w.prs.length !== 1 ? 'PRs' : 'PR';
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `👤 *${w.reviewerDisplay}* (${w.prs.length} ${prWord})\n\n${lines.join('\n')}`,
        },
      },
      { type: 'divider' },
    ];
  });

  return [...header, ...body];
}

export async function postBlocks(
  token: string,
  channelId: string,
  blocks: object[],
): Promise<void> {
  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channel: channelId, blocks, text: 'Pull Request Review Summary' }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Slack API error: ${data.error}`);
}
