import { HttpException, HttpStatus } from '@nestjs/common';
import { OCTOKIT } from '../../../lib';
import { RepositoryIdentifier } from '../model';

/**
 *
 * @param repoIdent
 * @returns true if the repository exists
 * @throws HTTP Exception with the status code provided from the GitHub api
 */
export async function repoExists(repoIdent: RepositoryIdentifier) {
  const repoStatus = await getRepoStatus(repoIdent);
  switch (repoStatus) {
    case 200:
      return true;
    case 301:
      throw new HttpException(
        'The requested repository has been moved',
        HttpStatus.MOVED_PERMANENTLY,
      );
    case 403:
      throw new HttpException(
        'You have no access to the provided repository',
        HttpStatus.FORBIDDEN,
      );
    case 404:
      throw new HttpException(
        'The requested repository was not found',
        HttpStatus.NOT_FOUND,
      );
    default:
      throw new HttpException(
        'An unknown error occured',
        HttpStatus.BAD_REQUEST,
      );
  }
}

/**
 *
 * @param repoIdent
 * @returns
 * Status: 200 exists
 * Status: 301 Moved Permanently
 * Status: 403 Forbidden
 * Status: 404 Not Found
 */
async function getRepoStatus(repoIdent: RepositoryIdentifier): Promise<number> {
  return OCTOKIT.rest.repos
    .get({
      owner: repoIdent.owner,
      repo: repoIdent.repo,
    })
    .then((r) => {
      return r.status;
    })
    .catch((r) => {
      if ('status' in r) {
        return r.status;
      } else {
        return 500;
      }
    });
}
