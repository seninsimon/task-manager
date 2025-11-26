import { Injectable } from '@nestjs/common';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel : Model<UserDocument>) {}

    async create(userData : Partial<User>) : Promise<UserDocument>
    {
        return this.userModel.create(userData);
    }

    async findByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email });
    }


    async setRefreshToken(userId : string , hashedtoken : string)
    {
        await this.userModel.findByIdAndUpdate( userId , {hashedRefreshToken : hashedtoken})
    }


    async removeRefreshToken(userId : string)
    {
        await this.userModel.findByIdAndUpdate(userId , {hashedRefreshToken : null});
    }

    async findById(userId : string) : Promise<UserDocument | null>{
        return this.userModel.findById(userId)
    }
}
