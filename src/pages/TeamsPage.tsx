import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Team } from '../types';
import { api } from '../lib/api';

export default function TeamsPage() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    api.get('/api/teams').then(setTeams).finally(() => setLoading(false));
  }, []);

  async function handleRun(team: Team) {
    setRunningId(team.teamId);
    setRunResult((r) => ({ ...r, [team.teamId]: '' }));
    try {
      const res = await api.post(`/api/teams/${team.teamId}/run`);
      setRunResult((r) => ({
        ...r,
        [team.teamId]: res.sent ? `Sent • ${res.prCount} PR${res.prCount !== 1 ? 's' : ''}` : 'Nothing to send',
      }));
    } catch (e: any) {
      setRunResult((r) => ({ ...r, [team.teamId]: `Error: ${e.message}` }));
    } finally {
      setRunningId(null);
    }
  }

  async function handleDelete(team: Team) {
    if (!confirm(`Delete "${team.name}"?`)) return;
    setDeletingId(team.teamId);
    try {
      await api.delete(`/api/teams/${team.teamId}`);
      setTeams((t) => t.filter((x) => x.teamId !== team.teamId));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Teams</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Each team gets a daily PR review nudge on Slack at 10:30 AM IST.
          </p>
        </div>
        <button
          onClick={() => navigate('/teams/new')}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          + Add Team
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : teams.length === 0 ? (
        <div className="border border-dashed border-gray-300 bg-white p-12 text-center rounded-lg">
          <p className="text-gray-500 text-sm">No teams yet.</p>
          <button
            onClick={() => navigate('/teams/new')}
            className="mt-3 text-blue-600 text-sm hover:underline"
          >
            Add your first team →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => (
            <div key={team.teamId} className="bg-white border border-gray-200 px-5 py-4 rounded-lg shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{team.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5 font-mono">{team.channelId}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {team.repos.length} repo{team.repos.length !== 1 ? 's' : ''} &middot;{' '}
                    {team.members.length} member{team.members.length !== 1 ? 's' : ''} &middot;{' '}
                    Mon–Fri 10:30 AM IST
                  </p>
                  {runResult[team.teamId] && (
                    <p className="text-xs text-gray-500 mt-1">{runResult[team.teamId]}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => navigate(`/teams/${team.teamId}/edit`)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(team)}
                    disabled={deletingId === team.teamId}
                    className="text-sm text-red-500 hover:text-red-700 disabled:opacity-40"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => handleRun(team)}
                    disabled={runningId === team.teamId}
                    className="text-sm border border-gray-300 px-3 py-1.5 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    {runningId === team.teamId ? 'Running...' : '▶ Run now'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
