import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types, HydratedDocument } from "mongoose";

export type TaskDocument = HydratedDocument<Task>;

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop()
  dueDate?: Date;

  @Prop({ type: Types.ObjectId, ref: "User", default: null })
  assignee: Types.ObjectId | null;

  @Prop()
  branchName?: string;

  @Prop({
    type: String,
    enum: ["not_started", "in_progress", "in_review", "done"],
    default: "not_started",
  })
  progress: string;

  @Prop({ type: Types.ObjectId, ref: "Project", required: true })
  projectId: Types.ObjectId;

  // Embedded Todos
  @Prop([
    {
      _id: { type: Types.ObjectId, auto: true },
      text: String,
      done: Boolean,
    },
  ])
  todos: { _id: Types.ObjectId; text: string; done: boolean }[];


  @Prop({ type: Types.ObjectId, ref: "Company", required: true })
  company: Types.ObjectId;

}

export const TaskSchema = SchemaFactory.createForClass(Task);
