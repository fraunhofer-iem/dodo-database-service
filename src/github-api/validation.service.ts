import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class ValidationService {
  /**
   *
   * @param repoIdent
   * @returns true if the repository exists
   * @throws HTTP Exception with the status code provided from the GitHub api
   */
  public async verify(repoStatus: number) {
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
