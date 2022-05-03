import { RepositoryIdentifier } from 'src/entities/repositories/model';

export async function* querier<T>(
  repoIdent: RepositoryIdentifier,
  queryPage: (
    repoIdent: RepositoryIdentifier,
    pageNumber: number,
  ) => Promise<T[]>,
  predicate: (element: T) => boolean,
) {
  let page: T[] = [];
  let pageNumber = 1;

  do {
    page = await queryPage(repoIdent, pageNumber);
    yield* page.filter(predicate);
    pageNumber += 1;
  } while (page.length == 100);
}
