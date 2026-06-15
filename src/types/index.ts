export interface Member {
  login: string;
  slackId: string;
}

export interface Team {
  teamId: string;
  name: string;
  channelId: string;
  repos: string[];
  members: Member[];
  createdAt: string;
}
