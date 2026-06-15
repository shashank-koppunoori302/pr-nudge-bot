import { searchPRsForReviewer, PR } from './github';
import { renderBlocks, postBlocks, Workload } from './slack';

const ORG = 'GoKwik';

interface Member {
  login: string;
  slackId: string;
}

interface Team {
  teamId: string;
  name: string;
  channelId: string;
  repos: string[];
  members: Member[];
}

export async function runNudgeForTeam(team: Team): Promise<{ sent: boolean; prCount: number }> {
  const githubToken = process.env.GITHUB_TOKEN;
  const slackToken = process.env.SLACK_BOT_TOKEN;

  if (!githubToken || !slackToken) {
    throw new Error('GITHUB_TOKEN and SLACK_BOT_TOKEN must be set in secrets');
  }

  const results = await Promise.allSettled(
    team.members.map((m) => searchPRsForReviewer(githubToken, ORG, m.login, team.repos)),
  );

  const prsByMember = new Map<string, PR[]>();
  team.members.forEach((m, i) => {
    const result = results[i];
    if (result.status === 'fulfilled') {
      prsByMember.set(m.login, result.value);
    } else {
      console.error(`Failed to fetch PRs for ${m.login}:`, result.reason);
      prsByMember.set(m.login, []);
    }
  });

  const slackMap = new Map(team.members.map((m) => [m.login, m.slackId ? `<@${m.slackId}>` : m.login]));

  const workloads: Workload[] = team.members
    .filter((m) => (prsByMember.get(m.login) ?? []).length > 0)
    .map((m) => ({
      reviewerDisplay: slackMap.get(m.login) ?? m.login,
      prs: (prsByMember.get(m.login) ?? []).sort(
        (a, b) => new Date(a.assignedAt || a.createdAt).getTime() - new Date(b.assignedAt || b.createdAt).getTime(),
      ),
    }))
    .sort((a, b) => b.prs.length - a.prs.length);

  const totalPRs = workloads.reduce((s, w) => s + w.prs.length, 0);

  if (!workloads.length) {
    console.log(`[${team.name}] No pending reviews.`);
    return { sent: false, prCount: 0 };
  }

  const blocks = renderBlocks(workloads);
  await postBlocks(slackToken, team.channelId, blocks);

  console.log(`[${team.name}] Posted ${totalPRs} PRs across ${workloads.length} reviewers.`);
  return { sent: true, prCount: totalPRs };
}
