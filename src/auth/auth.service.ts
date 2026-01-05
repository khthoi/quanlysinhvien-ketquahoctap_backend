import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NguoiDung } from './entity/nguoi-dung.entity';
import { CreateUserDto } from './dtos/create-user.dto';
import { LoginDto } from './dtos/login.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { RequestChangePasswordDto } from './dtos/request-change-password.dto';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SinhVien } from 'src/sinh-vien/entity/sinh-vien.entity';
import { GiangVien } from 'src/danh-muc/entity/giang-vien.entity';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { VerifyChangePasswordOtpDto } from './dtos/verify-change-password-otp.dto';
import { GetUsersQueryDto } from './dtos/get-user-query.dto';
import { VaiTroNguoiDungEnum } from './enums/vai-tro-nguoi-dung.enum';

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
        };
    }

    async createUser(createUserDto: CreateUserDto) {
        const { sinhVienId, giangVienId, vaiTro } = createUserDto;

        // ❌ Không cho tạo ADMIN bằng API này
        if (vaiTro === VaiTroNguoiDungEnum.ADMIN) {
            throw new BadRequestException(
                'API này không hỗ trợ tạo tài khoản Quản trị viên',
            );
        }

        // ===== VALIDATE THEO VAI TRÒ =====

        switch (vaiTro) {
            case VaiTroNguoiDungEnum.SINH_VIEN:
                if (!sinhVienId) {
                    throw new BadRequestException(
                        'Tài khoản SINH_VIEN bắt buộc phải có sinhVienId',
                    );
                }
                if (giangVienId) {
                    throw new BadRequestException(
                        'Tài khoản SINH_VIEN không được liên kết với giangVienId',
                    );
                }
                break;

            case VaiTroNguoiDungEnum.GIANG_VIEN:
            case VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO:
                if (!giangVienId) {
                    throw new BadRequestException(
                        `Tài khoản ${vaiTro} bắt buộc phải có giangVienId`,
                    );
                }
                if (sinhVienId) {
                    throw new BadRequestException(
                        `Tài khoản ${vaiTro} không được liên kết với sinhVienId`,
                    );
                }
                break;

            default:
                throw new BadRequestException('Vai trò không hợp lệ');
        }

        // ===== CHECK USERNAME =====
        const exist = await this.nguoiDungRepo.findOne({
            where: { tenDangNhap: createUserDto.tenDangNhap },
        });

        if (exist) {
            throw new BadRequestException('Tên đăng nhập đã tồn tại');
        }

        // ===== CREATE USER =====
        const hashed = await bcrypt.hash(createUserDto.password, 10);

        const newUser = this.nguoiDungRepo.create({
            tenDangNhap: createUserDto.tenDangNhap,
            matKhau: hashed,
            vaiTro,
            sinhVien: sinhVienId ? ({ id: sinhVienId } as any) : null,
            giangVien: giangVienId ? ({ id: giangVienId } as any) : null,
            ngayTao: new Date(),
        });

        await this.nguoiDungRepo.save(newUser);

        const { matKhau, ...result } = newUser;
        return result;
    }


    async findAll(query: GetUsersQueryDto) {
        const { page = 1, limit = 10, search, vaiTro } = query;

        const qb = this.nguoiDungRepo.createQueryBuilder('nguoiDung')
            .leftJoinAndSelect('nguoiDung.sinhVien', 'sinhVien')
            .leftJoinAndSelect('nguoiDung.giangVien', 'giangVien')
            .select([
                'nguoiDung.id',
                'nguoiDung.tenDangNhap',
                'nguoiDung.vaiTro',
                'nguoiDung.ngayTao',

                'sinhVien.id',
                'sinhVien.maSinhVien',
                'sinhVien.hoTen',
                'sinhVien.email',
                'sinhVien.sdt',
                'sinhVien.ngaySinh',
                'sinhVien.gioiTinh',
                'sinhVien.diaChi',

                'giangVien.id',
                'giangVien.hoTen',
                'giangVien.email',
                'giangVien.sdt',
                'giangVien.ngaySinh',
                'giangVien.gioiTinh',
                'giangVien.diaChi',
            ]);

        // Lọc theo vaiTro (giữ nguyên như cũ, hỗ trợ nhiều định dạng)
        if (vaiTro) {
            let dbVaiTro: VaiTroNguoiDungEnum;
            const normalized = vaiTro.toLowerCase().replace(/-/g, '').replace(/\s+/g, '');

            if (['sinhvien', 'sinhvien'].includes(normalized)) {
                dbVaiTro = VaiTroNguoiDungEnum.SINH_VIEN;
            } else if (['giangvien', 'giangvien'].includes(normalized)) {
                dbVaiTro = VaiTroNguoiDungEnum.GIANG_VIEN;
            } else if (normalized === 'admin') {
                dbVaiTro = VaiTroNguoiDungEnum.ADMIN;
            } else if (normalized.includes('canbo') || normalized.includes('phongdaotao')) {
                dbVaiTro = VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO;
            } else {
                throw new BadRequestException('Vai trò không hợp lệ');
            }

            qb.andWhere('nguoiDung.vaiTro = :vaiTro', { vaiTro: dbVaiTro });
        }

        // Tìm kiếm (giữ nguyên)
        if (search) {
            const searchLower = search.toLowerCase();
            qb.andWhere(
                '(LOWER(nguoiDung.tenDangNhap) LIKE :search ' +
                'OR LOWER(sinhVien.hoTen) LIKE :search ' +
                'OR LOWER(sinhVien.maSinhVien) LIKE :search ' +
                'OR LOWER(sinhVien.email) LIKE :search ' +
                'OR LOWER(sinhVien.sdt) LIKE :search ' +
                'OR LOWER(giangVien.hoTen) LIKE :search ' +
                'OR LOWER(giangVien.email) LIKE :search ' +
                'OR LOWER(giangVien.sdt) LIKE :search)',
                { search: `%${searchLower}%` }
            );
        }

        const total = await qb.getCount();

        qb.skip((page - 1) * limit).take(limit);

        const entities = await qb.getMany();

        // Phần quan trọng: Format profile dựa trên sự tồn tại liên kết
        const formattedItems = entities.map(user => ({
            id: user.id,
            tenDangNhap: user.tenDangNhap,
            vaiTro: user.vaiTro,
            ngayTao: user.ngayTao,

            profile: user.sinhVien
                ? {
                    type: 'sinhvien',
                    id: user.sinhVien.id,
                    maSinhVien: user.sinhVien.maSinhVien,
                    hoTen: user.sinhVien.hoTen,
                    email: user.sinhVien.email,
                    sdt: user.sinhVien.sdt,
                    ngaySinh: user.sinhVien.ngaySinh,
                    gioiTinh: user.sinhVien.gioiTinh,
                    diaChi: user.sinhVien.diaChi,
                }
                : user.giangVien
                    ? {
                        type: 'giangvien',
                        id: user.giangVien.id,
                        hoTen: user.giangVien.hoTen,
                        email: user.giangVien.email,
                        sdt: user.giangVien.sdt,
                        ngaySinh: user.giangVien.ngaySinh,
                        gioiTinh: user.giangVien.gioiTinh,
                        diaChi: user.giangVien.diaChi,
                    }
                    : null,
        }));

        return {
            data: formattedItems,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
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
        const user = await this.nguoiDungRepo.findOne({
            where: { id },
            relations: ['sinhVien', 'giangVien'], // ← Load quan hệ để kiểm tra
        });

        if (!user) throw new NotFoundException('Người dùng không tồn tại');

        // === KIỂM TRA TÊN ĐĂNG NHẬP TRÙNG ===
        if (updateUserDto.tenDangNhap) {
            const exist = await this.nguoiDungRepo.findOne({
                where: { tenDangNhap: updateUserDto.tenDangNhap },
            });
            if (exist && exist.id !== id) {
                throw new BadRequestException('Tên đăng nhập đã tồn tại');
            }
            user.tenDangNhap = updateUserDto.tenDangNhap;
        }

        // === VALIDATION VAI TRÒ MỚI ===
        if (updateUserDto.vaiTro) {
            const newRole = updateUserDto.vaiTro;
            const currentRole = user.vaiTro;

            // Trường hợp 1: User là sinh viên → chỉ được giữ SINH_VIEN
            if (user.sinhVien) {
                if (newRole !== VaiTroNguoiDungEnum.SINH_VIEN) {
                    throw new BadRequestException('Sinh viên chỉ được giữ vai trò SINH_VIEN');
                }
            }
            // Trường hợp 2: User là giảng viên → chỉ được GIANG_VIEN hoặc CAN_BO_PHONG_DAO_TAO
            else if (user.giangVien) {
                if (![VaiTroNguoiDungEnum.GIANG_VIEN, VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO].includes(newRole)) {
                    throw new BadRequestException('Giảng viên chỉ được có vai trò GIANG_VIEN hoặc CAN_BO_PHONG_DAO_TAO');
                }
            }
            // Trường hợp 3: User không phải sinh viên cũng không phải giảng viên → không cho đổi vai trò
            else {
                if (newRole !== currentRole) {
                    throw new BadRequestException('Không thể thay đổi vai trò của tài khoản hệ thống này');
                }
            }

            user.vaiTro = newRole;
        }

        // Lưu thay đổi
        await this.nguoiDungRepo.save(user);

        // Trả về không có mật khẩu
        const { matKhau, ...result } = user;
        return result;
    }

    async remove(id: number): Promise<void> {
        const user = await this.nguoiDungRepo.findOne({ where: { id } });
        if (!user) throw new NotFoundException('Người dùng không tồn tại');
        await this.nguoiDungRepo.remove(user);
    }

    /**
     * Bước 1: Yêu cầu đổi mật khẩu
     * - Kiểm tra user có liên kết với SinhVien hoặc GiangVien
     * - Xác thực mật khẩu cũ
     * - Lưu tạm mật khẩu mới (đã hash)
     * - Tạo OTP và gửi qua email
     */
    async requestChangePassword(userId: number, dto: RequestChangePasswordDto) {
        // 1. Tìm user và load relations
        const user = await this.nguoiDungRepo.findOne({
            where: { id: userId },
            relations: ['sinhVien', 'giangVien'],
        });

        if (!user) {
            throw new NotFoundException('Người dùng không tồn tại');
        }

        // 2. Kiểm tra user phải liên kết với SinhVien hoặc GiangVien
        if (!user.sinhVien && !user.giangVien) {
            throw new BadRequestException(
                'Bạn không có quyền đổi mật khẩu. Tài khoản phải được liên kết với sinh viên hoặc giảng viên.',
            );
        }

        // 3. Xác thực mật khẩu cũ
        const isValidOldPassword = await bcrypt.compare(dto.oldPassword, user.matKhau);
        if (!isValidOldPassword) {
            throw new BadRequestException('Mật khẩu cũ không đúng');
        }

        // 4. Kiểm tra mật khẩu mới không được trùng với mật khẩu cũ
        const isSamePassword = await bcrypt.compare(dto.newPassword, user.matKhau);
        if (isSamePassword) {
            throw new BadRequestException('Mật khẩu mới không được trùng với mật khẩu cũ');
        }

        // 5. Lấy email từ bản ghi SinhVien hoặc GiangVien
        let email: string;
        let hoTen: string;

        if (user.sinhVien) {
            const sinhVien = await this.sinhVienRepo.findOne({
                where: { id: user.sinhVien.id },
            });
            if (!sinhVien || !sinhVien.email) {
                throw new BadRequestException('Không tìm thấy email của sinh viên');
            }
            email = sinhVien.email;
            hoTen = sinhVien.hoTen;
        } else if (user.giangVien) {
            const giangVien = await this.giangVienRepo.findOne({
                where: { id: user.giangVien.id },
            });
            if (!giangVien || !giangVien.email) {
                throw new BadRequestException('Không tìm thấy email của giảng viên');
            }
            email = giangVien.email;
            hoTen = giangVien.hoTen;
        } else {
            throw new BadRequestException('Không tìm thấy thông tin liên kết');
        }

        // 6. Hash mật khẩu mới và lưu tạm
        const hashedNewPassword = await bcrypt.hash(dto.newPassword, 10);

        // 7. Tạo OTP 6 số ngẫu nhiên
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 8. Lưu OTP, thời gian hết hạn và mật khẩu mới tạm thời
        user.changePasswordOtp = otp;
        user.changePasswordOtpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 phút
        user.pendingNewPassword = hashedNewPassword; // Lưu mật khẩu mới đã hash
        await this.nguoiDungRepo.save(user);

        // 9. Gửi email chứa OTP
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: '[Hệ thống QL Sinh viên] Mã OTP xác thực đổi mật khẩu',
                html: `
        <h3>Xin chào ${hoTen},</h3>
        <p>Bạn vừa yêu cầu đổi mật khẩu tài khoản.</p>
        <p>Mã OTP xác thực của bạn là: <strong style="font-size: 24px; color: #1976d2;">${otp}</strong></p>
        <p>Mã OTP này có hiệu lực trong <strong>5 phút</strong>.</p>
        <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này và liên hệ quản trị viên ngay lập tức.</p>
        <hr>
        <p style="font-size: 12px; color: #666;">Email này được gửi tự động, vui lòng không trả lời.</p>
      `,
            });
        } catch (error) {
            console.error('Lỗi gửi email OTP:', error);
            throw new BadRequestException('Không thể gửi email. Vui lòng thử lại sau.');
        }

        return {
            message: 'Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra email và nhập mã OTP để hoàn tất đổi mật khẩu.',
            email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Ẩn bớt email
        };
    }

    /**
     * Bước 2: Xác thực OTP và đổi mật khẩu
     * - Chỉ cần nhập OTP
     * - Nếu OTP đúng, cập nhật mật khẩu từ pendingNewPassword
     */
    async verifyChangePasswordOtp(userId: number, dto: VerifyChangePasswordOtpDto) {
        // 1. Tìm user
        const user = await this.nguoiDungRepo.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('Người dùng không tồn tại');
        }

        // 2. Kiểm tra có yêu cầu đổi mật khẩu không
        if (!user.changePasswordOtp || !user.changePasswordOtpExpires || !user.pendingNewPassword) {
            throw new BadRequestException(
                'Không tìm thấy yêu cầu đổi mật khẩu. Vui lòng thực hiện lại bước 1.',
            );
        }

        // 3. Kiểm tra OTP đã hết hạn chưa
        if (new Date() > user.changePasswordOtpExpires) {
            // Xóa dữ liệu tạm
            user.changePasswordOtp = null;
            user.changePasswordOtpExpires = null;
            user.pendingNewPassword = null;
            await this.nguoiDungRepo.save(user);

            throw new BadRequestException('Mã OTP đã hết hạn. Vui lòng yêu cầu mã OTP mới.');
        }

        // 4. Xác thực OTP
        if (user.changePasswordOtp !== dto.otp) {
            throw new BadRequestException('Mã OTP không đúng');
        }

        // 5. Cập nhật mật khẩu chính thức từ pendingNewPassword
        user.matKhau = user.pendingNewPassword;

        // 6. Xóa tất cả dữ liệu tạm sau khi đổi mật khẩu thành công
        user.changePasswordOtp = null;
        user.changePasswordOtpExpires = null;
        user.pendingNewPassword = null;

        await this.nguoiDungRepo.save(user);

        return {
            message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại bằng mật khẩu mới.',
        };
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

    /**
 * Tạo tài khoản cho sinh viên
 */
    async createAccountForSinhVien(sinhVienId: number) {
        // Kiểm tra sinh viên có tồn tại không
        const sinhVien = await this.sinhVienRepo.findOne({
            where: { id: sinhVienId },
        });

        if (!sinhVien) {
            throw new NotFoundException(`Không tìm thấy sinh viên với ID ${sinhVienId}`);
        }

        // Kiểm tra sinh viên có email không
        if (!sinhVien.email) {
            throw new BadRequestException(
                'Sinh viên này chưa có email. Vui lòng cập nhật email trước khi tạo tài khoản.',
            );
        }

        // Kiểm tra sinh viên đã có tài khoản chưa
        const existingAccount = await this.nguoiDungRepo.findOne({
            where: { sinhVien: { id: sinhVienId } },
        });

        if (existingAccount) {
            throw new BadRequestException('Sinh viên này đã có tài khoản');
        }

        // Kiểm tra email đã được dùng làm tên đăng nhập chưa
        const existingUsername = await this.nguoiDungRepo.findOne({
            where: { tenDangNhap: sinhVien.email },
        });

        if (existingUsername) {
            throw new BadRequestException('Email này đã được sử dụng làm tên đăng nhập');
        }

        // Tạo mật khẩu ngẫu nhiên
        const randomPassword = this.generateRandomPassword(10);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        // Tạo tài khoản mới
        const nguoiDung = this.nguoiDungRepo.create({
            tenDangNhap: sinhVien.email,
            matKhau: hashedPassword,
            vaiTro: VaiTroNguoiDungEnum.SINH_VIEN,
            sinhVien: sinhVien,
            ngayTao: new Date(),
        });

        await this.nguoiDungRepo.save(nguoiDung);

        // Gửi email chứa thông tin đăng nhập
        try {
            await this.mailerService.sendMail({
                to: sinhVien.email,
                subject: '[Hệ thống QL Sinh viên] Tài khoản sinh viên đã được tạo',
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #1976d2;">Xin chào ${sinhVien.hoTen},</h2>
                    <p>Tài khoản sinh viên của bạn đã được tạo thành công trong hệ thống quản lý sinh viên.</p>
                    
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1976d2;">
                        <h3 style="margin-top: 0; color: #333;">Thông tin đăng nhập:</h3>
                        <p style="margin: 10px 0;">
                            <strong>Tên đăng nhập:</strong> 
                            <span style="color: #1976d2; font-size: 16px;">${sinhVien.email}</span>
                        </p>
                        <p style="margin: 10px 0;">
                            <strong>Mật khẩu:</strong> 
                            <span style="color: #1976d2; font-size: 16px; font-family: monospace; background: #fff; padding: 5px 10px; border-radius: 4px;">${randomPassword}</span>
                        </p>
                    </div>
                    
                    <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                        <p style="margin: 0; color: #856404;">
                            <strong>⚠️ Lưu ý quan trọng:</strong><br/>
                            Vui lòng đổi mật khẩu ngay sau khi đăng nhập lần đầu để đảm bảo an toàn cho tài khoản của bạn.
                        </p>
                    </div>
                    
                    <p style="color: #666; margin-top: 30px;">Trân trọng,<br/>Hệ thống quản lý sinh viên</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #999;">Email này được gửi tự động, vui lòng không trả lời.</p>
                </div>
            `,
            });
        } catch (error) {
            console.error('Lỗi khi gửi email:', error);
            throw new BadRequestException('Không thể gửi email. Vui lòng thử lại sau.');
        }

        return {
            message: 'Tạo tài khoản thành công. Thông tin đăng nhập đã được gửi qua email.',
            data: {
                id: nguoiDung.id,
                tenDangNhap: nguoiDung.tenDangNhap,
                vaiTro: nguoiDung.vaiTro,
                sinhVienId: sinhVien.id,
                email: sinhVien.email,
            },
        };
    }

    /**
     * Tạo tài khoản cho giảng viên
     */
    async createAccountForGiangVien(giangVienId: number) {
        // Kiểm tra giảng viên có tồn tại không
        const giangVien = await this.giangVienRepo.findOne({
            where: { id: giangVienId },
        });

        if (!giangVien) {
            throw new NotFoundException(`Không tìm thấy giảng viên với ID ${giangVienId}`);
        }

        // Kiểm tra giảng viên có email không
        if (!giangVien.email) {
            throw new BadRequestException(
                'Giảng viên này chưa có email. Vui lòng cập nhật email trước khi tạo tài khoản.',
            );
        }

        // Kiểm tra giảng viên đã có tài khoản chưa
        const existingAccount = await this.nguoiDungRepo.findOne({
            where: { giangVien: { id: giangVienId } },
        });

        if (existingAccount) {
            throw new BadRequestException('Giảng viên này đã có tài khoản');
        }

        // Kiểm tra email đã được dùng làm tên đăng nhập chưa
        const existingUsername = await this.nguoiDungRepo.findOne({
            where: { tenDangNhap: giangVien.email },
        });

        if (existingUsername) {
            throw new BadRequestException('Email này đã được sử dụng làm tên đăng nhập');
        }

        // Tạo mật khẩu ngẫu nhiên
        const randomPassword = this.generateRandomPassword(10);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        // Tạo tài khoản mới
        const nguoiDung = this.nguoiDungRepo.create({
            tenDangNhap: giangVien.email,
            matKhau: hashedPassword,
            vaiTro: VaiTroNguoiDungEnum.GIANG_VIEN,
            giangVien: giangVien,
            ngayTao: new Date(),
        });

        await this.nguoiDungRepo.save(nguoiDung);

        // Gửi email chứa thông tin đăng nhập
        try {
            await this.mailerService.sendMail({
                to: giangVien.email,
                subject: '[Hệ thống QL Sinh viên] Tài khoản giảng viên đã được tạo',
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #1976d2;">Xin chào ${giangVien.hoTen},</h2>
                    <p>Tài khoản giảng viên của bạn đã được tạo thành công trong hệ thống quản lý sinh viên.</p>
                    
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1976d2;">
                        <h3 style="margin-top: 0; color: #333;">Thông tin đăng nhập:</h3>
                        <p style="margin: 10px 0;">
                            <strong>Tên đăng nhập:</strong> 
                            <span style="color: #1976d2; font-size: 16px;">${giangVien.email}</span>
                        </p>
                        <p style="margin: 10px 0;">
                            <strong>Mật khẩu:</strong> 
                            <span style="color: #1976d2; font-size: 16px; font-family: monospace; background: #fff; padding: 5px 10px; border-radius: 4px;">${randomPassword}</span>
                        </p>
                    </div>
                    
                    <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                        <p style="margin: 0; color: #856404;">
                            <strong>⚠️ Lưu ý quan trọng:</strong><br/>
                            Vui lòng đổi mật khẩu ngay sau khi đăng nhập lần đầu để đảm bảo an toàn cho tài khoản của bạn.
                        </p>
                    </div>
                    
                    <p style="color: #666; margin-top: 30px;">Trân trọng,<br/>Hệ thống quản lý sinh viên</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #999;">Email này được gửi tự động, vui lòng không trả lời.</p>
                </div>
            `,
            });
        } catch (error) {
            console.error('Lỗi khi gửi email:', error);
            throw new BadRequestException('Không thể gửi email. Vui lòng thử lại sau.');
        }

        return {
            message: 'Tạo tài khoản thành công. Thông tin đăng nhập đã được gửi qua email.',
            data: {
                id: nguoiDung.id,
                tenDangNhap: nguoiDung.tenDangNhap,
                vaiTro: nguoiDung.vaiTro,
                giangVienId: giangVien.id,
                email: giangVien.email,
            },
        };
    }

    /**
 * Tạo tài khoản cho sinh viên (đăng nhập = mã sinh viên)
 */
    async createAccountForSinhVienBasic(sinhVienId: number) {
        const sinhVien = await this.sinhVienRepo.findOne({
            where: { id: sinhVienId },
        });

        if (!sinhVien) {
            throw new NotFoundException(`Không tìm thấy sinh viên với ID ${sinhVienId}`);
        }

        if (!sinhVien.email) {
            throw new BadRequestException(
                'Sinh viên này chưa có email. Vui lòng cập nhật email trước khi tạo tài khoản.',
            );
        }

        if (!sinhVien.maSinhVien) {
            throw new BadRequestException(
                'Sinh viên này chưa có mã sinh viên.',
            );
        }

        // Kiểm tra sinh viên đã có tài khoản chưa
        const existingAccount = await this.nguoiDungRepo.findOne({
            where: { sinhVien: { id: sinhVienId } },
        });

        if (existingAccount) {
            throw new BadRequestException('Sinh viên này đã có tài khoản');
        }

        // Kiểm tra trùng tên đăng nhập (mã sinh viên)
        const existingUsername = await this.nguoiDungRepo.findOne({
            where: { tenDangNhap: sinhVien.maSinhVien },
        });

        if (existingUsername) {
            throw new BadRequestException('Mã sinh viên đã được sử dụng làm tên đăng nhập');
        }

        // Kiểm tra trùng email (thông qua sinh viên liên kết)
        const existingEmail = await this.nguoiDungRepo.findOne({
            where: { sinhVien: { email: sinhVien.email } },
        });

        if (existingEmail) {
            throw new BadRequestException('Email này đã được sử dụng cho tài khoản khác');
        }

        const defaultPassword =
            this.configService.get<string>('DEFAULT_PASSWORD') || '123456';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        const nguoiDung = this.nguoiDungRepo.create({
            tenDangNhap: sinhVien.maSinhVien,
            matKhau: hashedPassword,
            vaiTro: VaiTroNguoiDungEnum.SINH_VIEN,
            sinhVien,
            ngayTao: new Date(),
        });

        await this.nguoiDungRepo.save(nguoiDung);

        return {
            message: 'Tạo tài khoản sinh viên thành công với mật khẩu mặc định.',
            data: {
                id: nguoiDung.id,
                tenDangNhap: nguoiDung.tenDangNhap,
                vaiTro: nguoiDung.vaiTro,
                sinhVienId: sinhVien.id,
                email: sinhVien.email,
            },
        };
    }

    /**
  * Tạo tài khoản cho giảng viên (đăng nhập = mã giảng viên)
  */
    async createAccountForGiangVienBasic(giangVienId: number) {
        const giangVien = await this.giangVienRepo.findOne({
            where: { id: giangVienId },
        });

        if (!giangVien) {
            throw new NotFoundException(`Không tìm thấy giảng viên với ID ${giangVienId}`);
        }

        if (!giangVien.email) {
            throw new BadRequestException(
                'Giảng viên này chưa có email. Vui lòng cập nhật email trước khi tạo tài khoản.',
            );
        }

        if (!giangVien.maGiangVien) {
            throw new BadRequestException(
                'Giảng viên này chưa có mã giảng viên.',
            );
        }

        // Kiểm tra giảng viên đã có tài khoản chưa
        const existingAccount = await this.nguoiDungRepo.findOne({
            where: { giangVien: { id: giangVienId } },
        });

        if (existingAccount) {
            throw new BadRequestException('Giảng viên này đã có tài khoản');
        }

        // Kiểm tra trùng tên đăng nhập (mã giảng viên)
        const existingUsername = await this.nguoiDungRepo.findOne({
            where: { tenDangNhap: giangVien.maGiangVien },
        });

        if (existingUsername) {
            throw new BadRequestException('Mã giảng viên đã được sử dụng làm tên đăng nhập');
        }

        // Kiểm tra trùng email (thông qua giảng viên liên kết)
        const existingEmail = await this.nguoiDungRepo.findOne({
            where: { giangVien: { email: giangVien.email } },
        });

        if (existingEmail) {
            throw new BadRequestException('Email này đã được sử dụng cho tài khoản khác');
        }

        const defaultPassword =
            this.configService.get<string>('DEFAULT_PASSWORD') || '123456';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        const nguoiDung = this.nguoiDungRepo.create({
            tenDangNhap: giangVien.maGiangVien,
            matKhau: hashedPassword,
            vaiTro: VaiTroNguoiDungEnum.GIANG_VIEN,
            giangVien,
            ngayTao: new Date(),
        });

        await this.nguoiDungRepo.save(nguoiDung);

        return {
            message: 'Tạo tài khoản giảng viên thành công với mật khẩu mặc định.',
            data: {
                id: nguoiDung.id,
                tenDangNhap: nguoiDung.tenDangNhap,
                vaiTro: nguoiDung.vaiTro,
                giangVienId: giangVien.id,
                email: giangVien.email,
            },
        };
    }

    /**
     * Tạo mật khẩu ngẫu nhiên
     */
    private generateRandomPassword(length: number = 10): string {
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const special = '!@#$%^&*';
        const allChars = uppercase + lowercase + numbers + special;

        let password = '';

        // Đảm bảo có ít nhất 1 ký tự từ mỗi loại
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += special[Math.floor(Math.random() * special.length)];

        // Thêm các ký tự ngẫu nhiên còn lại
        for (let i = password.length; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }

        // Trộn ngẫu nhiên các ký tự
        return password
            .split('')
            .sort(() => Math.random() - 0.5)
            .join('');
    }
}