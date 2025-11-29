import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";


export type ProjectDocument = HydratedDocument<Project>

@Schema({ timestamps: true })
export class Project {

    @Prop({ required: true })
    name: string

    @Prop()
    repoUrl: string

    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    owner: Types.ObjectId


    @Prop({ type: [{ type: Types.ObjectId, ref: "user" }], default: [] })
    members: Types.ObjectId[];

    @Prop({ required: true, unique: true })
    inviteToken: string;

}

export const ProjectSchema = SchemaFactory.createForClass(Project);

