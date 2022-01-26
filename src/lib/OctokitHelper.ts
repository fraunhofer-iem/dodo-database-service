import { Octokit } from 'octokit';

export const OCTOKIT = getOctokitClient();

function getOctokitClient() {
  const token = process.env.GITHUB_ACCESS_TOKEN;
  if (token) {
    return new Octokit({
      auth: token,
    });
  } else {
    this.logger.warn(
      'If no access token is provided the request limit is set to 60 requests per hour, which is not sufficient for most use cases.',
    );
    return new Octokit();
  }
}
