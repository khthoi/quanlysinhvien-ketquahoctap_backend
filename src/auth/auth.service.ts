import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NguoiDung } from './entity/nguoi-dung.entity';
import { CreateUserDto } from './dtos/create-user.dto';
import { LoginDto } from './dtos/login.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(NguoiDung)
        private nguoiDungRepo: Repository<NguoiDung>,
        private jwtService: JwtService,
    ) { }

    async login(loginDto: LoginDto) {
        const { tenDangNhap, password } = loginDto;
        const user = await this.nguoiDungRepo.findOne({ where: { tenDangNhap } });

        if (!user || !(await bcrypt.compare(password, user.matKhau))) {
            throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
        }

        const payload = {
            sub: user.id,
            email: user.tenDangNhap,
            vaiTro: user.vaiTro,
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.tenDangNhap,
                vaiTro: user.vaiTro,
            },
        };
    }

    async createUser(createUserDto: CreateUserDto) {
        const exist = await this.nguoiDungRepo.findOne({ where: { tenDangNhap: createUserDto.tenDangNhap } });
        if (exist) {
            throw new BadRequestException('Tên đăng nhập đã tồn tại');
        }

        const hashed = await bcrypt.hash(createUserDto.password, 10);

        const newUser = this.nguoiDungRepo.create({
            tenDangNhap: createUserDto.tenDangNhap,
            matKhau: hashed,
            vaiTro: createUserDto.vaiTro,
            sinhVien: createUserDto.sinhVienId
                ? ({ id: createUserDto.sinhVienId } as any)
                : null,
            giangVien: createUserDto.giangVienId
                ? ({ id: createUserDto.giangVienId } as any)
                : null,
            ngayTao: new Date(),
        });
        await this.nguoiDungRepo.save(newUser);
        const { matKhau, ...result } = newUser;
        return result;
    }

    async findAll() {
        return this.nguoiDungRepo.find({
            select: ['id', 'tenDangNhap', 'vaiTro', 'ngayTao'],
        });
    }

    async findOne(id: number) {
        const user = await this.nguoiDungRepo.findOne({
            where: { id },
            select: ['id', 'tenDangNhap', 'vaiTro', 'ngayTao'],
        });
        if (!user) throw new NotFoundException('Người dùng không tồn tại');
        return user;
    }

    async update(id: number, updateUserDto: UpdateUserDto) {
        const user = await this.nguoiDungRepo.findOne({ where: { id } });
        if (!user) throw new NotFoundException('Người dùng không tồn tại');

        if (updateUserDto.password) {
            user.matKhau = await bcrypt.hash(updateUserDto.password, 10);
        }
        if (updateUserDto.vaiTro) {
            user.vaiTro = updateUserDto.vaiTro;
        }

        await this.nguoiDungRepo.save(user);
        const { matKhau, ...result } = user;
        return result;
    }

    async remove(id: number) {
        const user = await this.nguoiDungRepo.findOne({ where: { id } });
        if (!user) throw new NotFoundException('Người dùng không tồn tại');
        await this.nguoiDungRepo.remove(user);
        return { message: 'Xóa thành công' };
    }

    async changePassword(userId: number, dto: ChangePasswordDto) {
        const user = await this.nguoiDungRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('Người dùng không tồn tại');

        const isValid = await bcrypt.compare(dto.oldPassword, user.matKhau);
        if (!isValid) throw new BadRequestException('Mật khẩu cũ không đúng');

        user.matKhau = await bcrypt.hash(dto.newPassword, 10);
        await this.nguoiDungRepo.save(user);
        return { message: 'Đổi mật khẩu thành công' };
    }
}