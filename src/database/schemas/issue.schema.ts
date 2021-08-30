import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Label } from './labels.schema';
import { Assignee } from './assignee.schema';
import { Assignees } from './assignees.schema';
import { Milestone } from './milestone.schema';
import { Pull_request } from './pull_request.schema';


import { Document, Schema as mSchema } from 'mongoose';
// import {
//   PullRequestFile,
//   RepositoryFile,
// } from 'src/github-api/model/PullRequest';
// import { PullRequest } from './pullRequest.schema';

@Schema()
export class Issue {

  @Prop([{ type: mSchema.Types.ObjectId, ref: 'Labels' }])
  label: Label[];
  // @Prop([String])
  // labels: string[];

  @Prop({ type: mSchema.Types.ObjectId, ref: 'Assignee' })
  assignee: Assignee;


  @Prop([{ type: mSchema.Types.ObjectId, ref: 'Assignees' }])
  assignees: Assignees[];

  @Prop({ type: mSchema.Types.ObjectId, ref: 'Milestone' })
  milestone: Milestone;

  @Prop({ type: mSchema.Types.ObjectId, ref: 'Pull_request' })
  pull_request: Pull_request;

  @Prop()
  created_at: string;

  @Prop()
  updated_at: string;
  
  @Prop()
  closed_at: string;

  @Prop()
  state: string;

  @Prop()
  issueId: number;

  @Prop()
  title: string;

  // TODO: create a schema for Users to fill the creator of the issue as well as the
  // assignees
}

export type IssueDocument = Issue & Document;

export const IssueSchema = SchemaFactory.createForClass(Issue);
