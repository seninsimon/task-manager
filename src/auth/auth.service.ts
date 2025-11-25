import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private usersService: UsersService, private jwtService: JwtService) { }


    async generateToken(id: string, email: string) {
        const payload = {
            email: email,
            id: id,
        }
        return {
            accessToken: this.jwtService.sign(payload, {
                secret: 'secretKey',
                expiresIn: '1h',
            }),
            refreshToken: this.jwtService.sign(payload, {
                secret: 'refreshsecretKey',
                expiresIn: '1h',
            })
        }
    }

    async register(name: string, email: string, password: string) {
        const user = await this.usersService.findByEmail(email);
        if (user) {
            throw new UnauthorizedException('User already exists');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await this.usersService.create({ name, email, password: hashedPassword });

        const tokens = await this.generateToken(newUser._id.toString(), email);
        return { newUser, ...tokens };
    }


    async login(email: string, password: string) {
        const user = await this.usersService.findByEmail(email)
        if (!user) {
            throw new UnauthorizedException("invalid credentials")
        }
        const match = await bcrypt.compare(password, user.password)
        if (!match) throw new UnauthorizedException('Invalid credentials');

        const tokens = await this.generateToken(user._id.toString(), email);
        return { user, ...tokens };
    }
}
