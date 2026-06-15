import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Member } from '../types';
import { api } from '../lib/api';

interface FormState {
  name: string;
  channelId: string;
  repos: string;
  members: Member[];
}

const empty: FormState = {
  name: '',
  channelId: '',
  repos: '',
  members: [{ login: '', slackId: '' }],
};

export default function TeamFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [loadingTeam, setLoadingTeam] = useState(isEdit);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api.get(`/api/teams/${id}`)
      .then((team) => {
        setForm({
          name: team.name,
          channelId: team.channelId,
          repos: team.repos.join('\n'),
          members: team.members.length ? team.members : [{ login: '', slackId: '' }],
        });
      })
      .finally(() => setLoadingTeam(false));
  }, [id]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setMember(index: number, field: keyof Member, value: string) {
    setForm((f) => {
      const members = [...f.members];
      members[index] = { ...members[index], [field]: value };
      return { ...f, members };
    });
  }

  function addMember() {
    setForm((f) => ({ ...f, members: [...f.members, { login: '', slackId: '' }] }));
  }

  function removeMember(index: number) {
    setForm((f) => ({ ...f, members: f.members.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const repos = form.repos
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean);
    const members = form.members.filter((m) => m.login.trim());

    if (!form.name.trim() || !form.channelId.trim() || !repos.length || !members.length) {
      setError('Name, channel ID, at least one repo, and at least one member are required.');
      setSaving(false);
      return;
    }

    const payload = { name: form.name.trim(), channelId: form.channelId.trim(), repos, members };

    try {
      if (isEdit) {
        const existing = await api.get(`/api/teams/${id}`);
        await api.put(`/api/teams/${id}`, { ...payload, createdAt: existing.createdAt });
      } else {
        await api.post('/api/teams', payload);
      }
      navigate('/');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loadingTeam) {
    return <p className="text-sm text-gray-500 px-6 py-8">Loading...</p>;
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <button
        onClick={() => navigate('/')}
        className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-flex items-center gap-1"
      >
        ← Back
      </button>

      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        {isEdit ? 'Edit Team' : 'Add Team'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Team name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Checkout Team"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slack Channel ID</label>
          <input
            type="text"
            value={form.channelId}
            onChange={(e) => setField('channelId', e.target.value)}
            placeholder="C0B6K3GPFEG"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Right-click the channel in Slack → View channel details → copy ID from the bottom.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Repos <span className="font-normal text-gray-400">(one per line)</span>
          </label>
          <textarea
            value={form.repos}
            onChange={(e) => setField('repos', e.target.value)}
            placeholder={'gokwik.pdp\ncheckout-dashboard-ui\napi.getkwik.co'}
            rows={6}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">
            Repo names only — no org prefix. GoKwik org is assumed.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Members</label>
            <button
              type="button"
              onClick={addMember}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add member
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_32px] gap-0 bg-gray-50 border-b border-gray-200 px-3 py-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">GitHub login</span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Slack member ID</span>
              <span />
            </div>

            {form.members.map((m, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_1fr_32px] gap-0 border-b border-gray-100 last:border-b-0"
              >
                <input
                  type="text"
                  value={m.login}
                  onChange={(e) => setMember(i, 'login', e.target.value)}
                  placeholder="shashank-koppunoori302"
                  className="px-3 py-2 text-sm text-gray-900 font-mono border-r border-gray-100 focus:outline-none focus:bg-blue-50 transition-colors"
                />
                <input
                  type="text"
                  value={m.slackId}
                  onChange={(e) => setMember(i, 'slackId', e.target.value)}
                  placeholder="U05FZMRACSU"
                  className="px-3 py-2 text-sm text-gray-900 font-mono border-r border-gray-100 focus:outline-none focus:bg-blue-50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => removeMember(i)}
                  disabled={form.members.length === 1}
                  className="flex items-center justify-center text-gray-400 hover:text-red-500 disabled:opacity-20 text-lg leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Slack member ID: click a user's name → three dots → Copy member ID.
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md px-4 py-2 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white text-sm px-5 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Add team'}
          </button>
        </div>
      </form>
    </div>
  );
}
