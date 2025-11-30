import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type CompanyDocument = HydratedDocument<Company>;

@Schema({ timestamps: true })
export class Company {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  owner: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: "User" }], default: [] })
  employees: Types.ObjectId[];

  @Prop({ required: true, unique: true })
  inviteToken: string;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
