import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NguoiDung } from './entity/nguoi-dung.entity';
import { CreateUserDto } from './dtos/create-user.dto';
import { LoginDto } from './dtos/login.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SinhVien } from 'src/sinh-vien/entity/sinh-vien.entity';
import { GiangVien } from 'src/danh-muc/entity/giang-vien.entity';
import { ResetPasswordDto } from './dtos/reset-password.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(NguoiDung) private nguoiDungRepo: Repository<NguoiDung>,
        @InjectRepository(SinhVien) private sinhVienRepo: Repository<SinhVien>,
        @InjectRepository(GiangVien) private giangVienRepo: Repository<GiangVien>,
        private jwtService: JwtService,
        private configService: ConfigService,
        private readonly mailerService: MailerService,
    ) { }

    async login(loginDto: LoginDto) {
        const { tenDangNhap, password } = loginDto;
        const user = await this.nguoiDungRepo.findOne({ where: { tenDangNhap } });

        if (!user || !(await bcrypt.compare(password, user.matKhau))) {
            throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
        }

        const payload = {
            sub: user.id,
            tenDangNhap: user.tenDangNhap,
            vaiTro: user.vaiTro,
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                tenDangNhap: user.tenDangNhap,
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

    /**
   * API Reset mật khẩu dành cho Admin
   * Điều kiện:
   * - User phải liên kết với SinhVien hoặc GiangVien
   * - Email + SĐT phải khớp với bản ghi SinhVien/GiangVien tương ứng
   * - Tạo mật khẩu mới ngẫu nhiên, hash lưu vào DB và gửi email
   */

    async resetPassword(dto: ResetPasswordDto) {
        const { userId, email, sdt } = dto;

        // 1. Tìm user theo id
        const user = await this.nguoiDungRepo.findOne({
            where: { id: userId },
            relations: ['sinhVien', 'giangVien'], // Load relation để kiểm tra nhanh
        });

        if (!user) {
            throw new NotFoundException('Người dùng không tồn tại');
        }

        // 2. Kiểm tra user phải liên kết với SinhVien hoặc GiangVien
        if (!user.sinhVien && !user.giangVien) {
            throw new BadRequestException(
                'Người dùng không liên kết với sinh viên hoặc giảng viên',
            );
        }

        // 3. Xác minh email + sdt khớp với bản ghi liên kết
        if (user.sinhVien) {
            const sinhVien = await this.sinhVienRepo.findOne({
                where: { id: user.sinhVien.id },
            });
            if (!sinhVien) {
                throw new BadRequestException('Bản ghi sinh viên không tồn tại');
            }
            if (sinhVien.email !== email || sinhVien.sdt !== sdt) {
                throw new BadRequestException('Email hoặc số điện thoại không khớp với sinh viên');
            }
        } else if (user.giangVien) {
            const giangVien = await this.giangVienRepo.findOne({
                where: { id: user.giangVien.id },
            });
            if (!giangVien) {
                throw new BadRequestException('Bản ghi giảng viên không tồn tại');
            }
            if (giangVien.email !== email || giangVien.sdt !== sdt) {
                throw new BadRequestException('Email hoặc số điện thoại không khớp với giảng viên');
            }
        }

        // 4. Tạo mật khẩu mới (8 ký tự ngẫu nhiên)
        const newPasswordRaw = Math.random().toString(36).substring(2, 10); // ví dụ: "a1b2c3d4"
        const hashedPassword = await bcrypt.hash(newPasswordRaw, 10);

        // 5. Cập nhật mật khẩu trong DB
        user.matKhau = hashedPassword;
        await this.nguoiDungRepo.save(user);

        // 6. Gửi email chứa mật khẩu mới
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: '[Hệ thống QL Sinh viên] Đặt lại mật khẩu',
                text: `Mật khẩu mới của bạn là: ${newPasswordRaw}\n\nVui lòng đăng nhập ngay và đổi mật khẩu để bảo mật tài khoản.`,
                html: `
          <h3>Đặt lại mật khẩu thành công</h3>
          <p>Mật khẩu mới của bạn là: <strong style="font-size: 18px; color: #d32f2f;">${newPasswordRaw}</strong></p>
          <p>Vui lòng <a href="URL_CUA_HE_THONG">đăng nhập</a> và đổi mật khẩu ngay lập tức.</p>
          <p>Nếu bạn không yêu cầu đặt lại, vui lòng liên hệ quản trị viên.</p>
        `,
            });
        } catch (error) {
            // Không throw lỗi email để không block toàn bộ flow, chỉ log
            console.error('Lỗi gửi email reset password:', error);
        }

        // 7. Trả về thông báo thành công
        return {
            message: 'Reset mật khẩu thành công. Mật khẩu mới đã được gửi qua email.',
        };
    }
}