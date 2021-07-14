import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { GithubApiService } from './github-api.service';
import { RepositoryIdentifierDto } from './model/RepositoryIdentifierDto';

@Injectable()
export class ValidationService {
  constructor(private ghApiService: GithubApiService) {}

  /**
   *
   * @param repoIdent
   * @returns true if the repository exists
   * @throws HTTP Exception with the status code provided from the GitHub api
   */
  public async verify(repoIdent: RepositoryIdentifierDto) {
    const repoStatus = await this.ghApiService.getStatus(repoIdent);
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
}
