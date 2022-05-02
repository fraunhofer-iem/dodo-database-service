import { RepositoryIdentifier } from '../../../entities/repositories/model';

export interface DodoUser {
  name: string;
  email: string;
  targets?: RepositoryIdentifier[];
}
