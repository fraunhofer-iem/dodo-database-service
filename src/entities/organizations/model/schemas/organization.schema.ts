import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as mSchema } from 'mongoose';
import { User } from '../../../users/model/schemas';
import { Repository } from '../../../repositories/model/schemas';

/**
 * For further information, see:
 * https://docs.github.com/en/rest/reference/orgs
 */
@Schema()
export class Organization {
  @Prop([{ type: mSchema.Types.ObjectId, ref: 'Repository' }])
  repositories: Repository[];

  @Prop([{ type: mSchema.Types.ObjectId, ref: 'User' }])
  members: User[];

  @Prop()
  owner: string;
}

export type OrganizationDocument = Organization & Document;

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
