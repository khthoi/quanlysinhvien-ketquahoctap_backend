# Hệ thống Quản lý Sinh viên - Kết quả Học tập

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">
  Backend API cho hệ thống quản lý sinh viên và kết quả học tập
</p>

<p align="center">
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
</p>

---

## 📋 Mục lục

- [Giới thiệu](#giới-thiệu)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Các khối chức năng chính](#các-khối-chức-năng-chính)
- [Các nhóm API](#các-nhóm-api)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Hướng dẫn cài đặt](#hướng-dẫn-cài-đặt)
- [Cấu hình môi trường](#cấu-hình-môi-trường)
- [Thiết lập Database](#thiết-lập-database)
- [Chạy ứng dụng](#chạy-ứng-dụng)
- [Tài liệu API](#tài-liệu-api)
- [Cấu trúc dự án](#cấu-trúc-dự-án)

---

## 🎯 Giới thiệu

Hệ thống Quản lý Sinh viên - Kết quả Học tập là một ứng dụng backend được xây dựng bằng **NestJS**, cung cấp các API để quản lý toàn bộ quy trình đào tạo, từ quản lý danh mục (khoa, ngành, lớp), quản lý sinh viên, giảng viên, đến quản lý kết quả học tập và báo cáo.

Hệ thống hỗ trợ nhiều vai trò người dùng khác nhau: **Quản trị viên**, **Cán bộ phòng Đào tạo**, **Giảng viên**, và **Sinh viên**, mỗi vai trò có các quyền truy cập và chức năng riêng.

---

## 🛠 Công nghệ sử dụng

- **Framework**: NestJS 11.x
- **Ngôn ngữ**: TypeScript
- **Database**: MySQL
- **ORM**: TypeORM
- **Xác thực**: JWT (JSON Web Token)
- **Validation**: class-validator, class-transformer
- **Tài liệu API**: Swagger/OpenAPI
- **Email**: Nodemailer (Gmail SMTP)
- **File Upload**: Multer
- **Excel Processing**: ExcelJS

---

## 🏗 Các khối chức năng chính

### 1. **Xác thực & Quản lý người dùng** (`auth`)
- Đăng nhập, đăng xuất
- Quản lý tài khoản người dùng
- Phân quyền theo vai trò (Admin, Cán bộ phòng ĐT, Giảng viên, Sinh viên)
- Đổi mật khẩu với xác thực OTP qua email
- Tự động tạo tài khoản từ danh sách sinh viên/giảng viên

### 2. **Quản lý Danh mục** (`danh-muc`)
- Quản lý Khoa (thêm, sửa, xóa, tìm kiếm)
- Quản lý Ngành (thêm, sửa, xóa, tìm kiếm)
- Quản lý Lớp niên chế (thêm, sửa, xóa, tìm kiếm)
- Quản lý Môn học (thêm, sửa, xóa, tìm kiếm)
- Quản lý Giảng viên (thêm, sửa, xóa, tìm kiếm, cập nhật thông tin cá nhân)
- Quản lý Niên khóa
- Phân công môn học cho giảng viên
- Upload danh sách giảng viên từ file Excel

### 3. **Quản lý Sinh viên** (`sinh-vien`)
- Quản lý thông tin sinh viên
- Upload danh sách sinh viên từ file Excel
- Tìm kiếm và lọc sinh viên
- Quản lý lớp học phần của sinh viên

### 4. **Quản lý Đào tạo** (`dao-tao`)
- Quản lý chương trình đào tạo
- Quản lý học phần
- Quản lý lớp học phần
- Đăng ký học phần cho sinh viên
- Quản lý lịch học

### 5. **Quản lý Giảng dạy** (`giang-day`)
- Quản lý lớp học phần
- Phân công giảng viên
- Quản lý yêu cầu học phần
- Điểm danh sinh viên
- Quản lý lịch giảng dạy

### 6. **Quản lý Kết quả** (`ket-qua`)
- Nhập điểm cho sinh viên
- Cập nhật điểm
- Xem kết quả học tập
- Tính điểm trung bình
- Upload điểm từ file Excel

### 7. **Báo cáo** (`bao-cao`)
- Xuất báo cáo kết quả học tập
- Thống kê theo khoa, ngành, lớp
- Báo cáo tổng hợp

---

## 📡 Các nhóm API

### 🔐 `/auth` - Xác thực & Quản lý người dùng
- `POST /auth/login` - Đăng nhập
- `POST /auth/create-user` - Tạo tài khoản mới
- `GET /auth/users` - Lấy danh sách người dùng (có phân trang)
- `GET /auth/users/:id` - Lấy thông tin chi tiết người dùng
- `PUT /auth/users/:id` - Cập nhật thông tin người dùng
- `DELETE /auth/users/:id` - Xóa người dùng
- `POST /auth/request-change-password` - Yêu cầu đổi mật khẩu (gửi OTP)
- `POST /auth/verify-change-password-otp` - Xác thực OTP đổi mật khẩu
- `POST /auth/reset-password` - Đặt lại mật khẩu mới
- `POST /auth/auto-create-accounts` - Tự động tạo tài khoản từ danh sách

### 📚 `/danh-muc` - Quản lý Danh mục

**Khoa:**
- `GET /danh-muc/khoa` - Lấy danh sách khoa
- `GET /danh-muc/khoa/:id` - Lấy thông tin chi tiết khoa
- `POST /danh-muc/khoa` - Tạo khoa mới
- `PUT /danh-muc/khoa/:id` - Cập nhật khoa
- `DELETE /danh-muc/khoa/:id` - Xóa khoa

**Ngành:**
- `GET /danh-muc/nganh` - Lấy danh sách ngành
- `GET /danh-muc/nganh/:id` - Lấy thông tin chi tiết ngành
- `POST /danh-muc/nganh` - Tạo ngành mới
- `PUT /danh-muc/nganh/:id` - Cập nhật ngành
- `DELETE /danh-muc/nganh/:id` - Xóa ngành

**Lớp:**
- `GET /danh-muc/lop` - Lấy danh sách lớp
- `GET /danh-muc/lop/:id` - Lấy thông tin chi tiết lớp
- `POST /danh-muc/lop` - Tạo lớp mới
- `PUT /danh-muc/lop/:id` - Cập nhật lớp
- `DELETE /danh-muc/lop/:id` - Xóa lớp

**Môn học:**
- `GET /danh-muc/mon-hoc` - Lấy danh sách môn học
- `GET /danh-muc/mon-hoc/:id` - Lấy thông tin chi tiết môn học
- `POST /danh-muc/mon-hoc` - Tạo môn học mới
- `PUT /danh-muc/mon-hoc/:id` - Cập nhật môn học
- `DELETE /danh-muc/mon-hoc/:id` - Xóa môn học

**Giảng viên:**
- `GET /danh-muc/giang-vien` - Lấy danh sách giảng viên
- `GET /danh-muc/giang-vien/:id` - Lấy thông tin chi tiết giảng viên
- `POST /danh-muc/giang-vien` - Tạo giảng viên mới
- `PUT /danh-muc/giang-vien/:id` - Cập nhật giảng viên
- `PUT /danh-muc/giang-vien/:id/thong-tin-ca-nhan` - Cập nhật thông tin cá nhân
- `DELETE /danh-muc/giang-vien/:id` - Xóa giảng viên
- `POST /danh-muc/giang-vien/upload` - Upload danh sách giảng viên từ Excel

**Phân công môn học:**
- `GET /danh-muc/phan-cong-mon-hoc` - Lấy danh sách phân công
- `POST /danh-muc/phan-cong-mon-hoc` - Tạo phân công mới
- `PUT /danh-muc/phan-cong-mon-hoc/:id` - Cập nhật phân công
- `DELETE /danh-muc/phan-cong-mon-hoc/:id` - Xóa phân công

**Niên khóa:**
- `GET /danh-muc/nien-khoa` - Lấy danh sách niên khóa
- `GET /danh-muc/nien-khoa/:id` - Lấy thông tin chi tiết niên khóa
- `POST /danh-muc/nien-khoa` - Tạo niên khóa mới
- `PUT /danh-muc/nien-khoa/:id` - Cập nhật niên khóa
- `DELETE /danh-muc/nien-khoa/:id` - Xóa niên khóa

### 👥 `/sinh-vien` - Quản lý Sinh viên
- `GET /sinh-vien` - Lấy danh sách sinh viên (có phân trang, tìm kiếm)
- `GET /sinh-vien/:id` - Lấy thông tin chi tiết sinh viên
- `POST /sinh-vien` - Tạo sinh viên mới
- `PUT /sinh-vien/:id` - Cập nhật thông tin sinh viên
- `DELETE /sinh-vien/:id` - Xóa sinh viên
- `POST /sinh-vien/upload` - Upload danh sách sinh viên từ Excel
- `GET /sinh-vien/:id/lop-hoc-phan` - Lấy danh sách lớp học phần của sinh viên

### 🎓 `/dao-tao` - Quản lý Đào tạo
- `GET /dao-tao/chuong-trinh-dao-tao` - Lấy danh sách chương trình đào tạo
- `POST /dao-tao/chuong-trinh-dao-tao` - Tạo chương trình đào tạo mới
- `GET /dao-tao/hoc-phan` - Lấy danh sách học phần
- `POST /dao-tao/hoc-phan` - Tạo học phần mới
- `GET /dao-tao/lop-hoc-phan` - Lấy danh sách lớp học phần
- `POST /dao-tao/lop-hoc-phan` - Tạo lớp học phần mới
- `POST /dao-tao/dang-ky-hoc-phan` - Đăng ký học phần cho sinh viên

### 📖 `/giang-day` - Quản lý Giảng dạy
- `GET /giang-day/lop-hoc-phan` - Lấy danh sách lớp học phần
- `GET /giang-day/lop-hoc-phan/:id` - Lấy thông tin chi tiết lớp học phần
- `POST /giang-day/lop-hoc-phan` - Tạo lớp học phần mới
- `PUT /giang-day/lop-hoc-phan/:id` - Cập nhật lớp học phần
- `GET /giang-day/yeu-cau-hoc-phan` - Lấy danh sách yêu cầu học phần
- `POST /giang-day/yeu-cau-hoc-phan` - Tạo yêu cầu học phần mới

### 📊 `/ket-qua` - Quản lý Kết quả
- `GET /ket-qua` - Lấy danh sách kết quả học tập
- `GET /ket-qua/:id` - Lấy thông tin chi tiết kết quả
- `POST /ket-qua` - Tạo kết quả học tập mới
- `PUT /ket-qua/:id` - Cập nhật điểm
- `POST /ket-qua/upload` - Upload điểm từ file Excel
- `GET /ket-qua/sinh-vien/:sinhVienId` - Lấy kết quả học tập của sinh viên

### 📈 `/bao-cao` - Báo cáo
- `GET /bao-cao/ket-qua-hoc-tap` - Xuất báo cáo kết quả học tập
- `GET /bao-cao/thong-ke` - Thống kê tổng hợp
- `GET /bao-cao/theo-khoa` - Báo cáo theo khoa
- `GET /bao-cao/theo-nganh` - Báo cáo theo ngành

---

## 💻 Yêu cầu hệ thống

- **Node.js**: phiên bản 18.x trở lên
- **npm**: phiên bản 9.x trở lên (hoặc yarn)
- **MySQL**: phiên bản 8.0 trở lên
- **Git**: để clone repository

---

## 📦 Hướng dẫn cài đặt

### Bước 1: Clone repository

```bash
git clone <repository-url>
cd quanlysinhvien-ketquahoctap_backend
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

Lệnh này sẽ cài đặt tất cả các package cần thiết được liệt kê trong `package.json`.

### Bước 3: Tạo file cấu hình môi trường

Tạo file `.env` ở thư mục gốc của dự án (cùng cấp với `package.json`). Xem chi tiết ở phần [Cấu hình môi trường](#cấu-hình-môi-trường).

---

## ⚙️ Cấu hình môi trường

Tạo file `.env` trong thư mục gốc của dự án với nội dung sau:

```env
# ===== Cấu hình Database =====
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=quanlysinhvien_kqht

# ===== Cấu hình Server =====
PORT=3000

# ===== Cấu hình JWT =====
JWT_SECRET=your_jwt_secret_key_here

# ===== Cấu hình Email (Gmail SMTP) =====
EMAIL_APP=your_email@gmail.com
EMAIL_APP_PASSWORD=your_app_password

# ===== Cấu hình CORS =====
FRONTEND_ADMIN_URL=http://localhost:3001
FRONTEND_CL_SIDE_URL=http://localhost:3002
```

### Giải thích các biến môi trường:

- **DB_HOST**: Địa chỉ máy chủ MySQL (mặc định: `localhost`)
- **DB_PORT**: Cổng kết nối MySQL (mặc định: `3306`)
- **DB_USERNAME**: Tên người dùng MySQL (mặc định: `root`)
- **DB_PASSWORD**: Mật khẩu MySQL
- **DB_NAME**: Tên database (mặc định: `quanlysinhvien_kqht`)
- **PORT**: Cổng chạy ứng dụng backend (mặc định: `3000`)
- **JWT_SECRET**: Chuỗi bí mật để ký JWT token (nên đặt một chuỗi ngẫu nhiên, phức tạp)
- **EMAIL_APP**: Địa chỉ email Gmail dùng để gửi email (ví dụ: `your_email@gmail.com`)
- **EMAIL_APP_PASSWORD**: Mật khẩu ứng dụng Gmail (không phải mật khẩu đăng nhập thông thường)
- **FRONTEND_ADMIN_URL**: URL của frontend admin (dùng cho CORS)
- **FRONTEND_CL_SIDE_URL**: URL của frontend client-side (dùng cho CORS)

### ⚠️ Lưu ý về Email App Password:

Để lấy **App Password** cho Gmail:

1. Đăng nhập vào tài khoản Google của bạn
2. Truy cập [Google Account Security](https://myaccount.google.com/security)
3. Bật **2-Step Verification** (nếu chưa bật)
4. Vào mục **App passwords**
5. Tạo mật khẩu ứng dụng mới cho "Mail"
6. Copy mật khẩu vừa tạo vào `EMAIL_APP_PASSWORD`

---

## 🗄️ Thiết lập Database

### Bước 1: Tạo database

Đăng nhập vào MySQL và tạo database mới:

```sql
CREATE DATABASE quanlysinhvien_kqht CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Bước 2: Cấu hình kết nối

Đảm bảo file `.env` đã được cấu hình đúng với thông tin kết nối MySQL của bạn (xem phần [Cấu hình môi trường](#cấu-hình-môi-trường)).

### Bước 3: Tự động tạo bảng

Hệ thống sử dụng **TypeORM** với `synchronize: true` (chỉ dùng trong môi trường development), nên các bảng sẽ được tự động tạo khi bạn chạy ứng dụng lần đầu.

⚠️ **Cảnh báo**: Trong môi trường production, nên tắt `synchronize` và sử dụng migrations thay thế.

---

## 🚀 Chạy ứng dụng

### Chế độ Development (có hot-reload)

```bash
npm run start:dev
```

Ứng dụng sẽ chạy tại `http://localhost:3000` (hoặc port bạn đã cấu hình trong `.env`).

Khi có thay đổi code, ứng dụng sẽ tự động reload.

### Chế độ Production

**Bước 1: Build ứng dụng**

```bash
npm run build
```

Lệnh này sẽ compile TypeScript sang JavaScript và lưu vào thư mục `dist/`.

**Bước 2: Chạy ứng dụng**

```bash
npm run start:prod
```

### Chế độ Debug

```bash
npm run start:debug
```

### Kiểm tra ứng dụng đã chạy

Mở trình duyệt và truy cập:

- **API Base URL**: `http://localhost:3000`
- **Swagger Documentation**: `http://localhost:3000/api-docs`

Nếu thấy trang Swagger hiển thị, nghĩa là ứng dụng đã chạy thành công! 🎉

---

## 📖 Tài liệu API

Hệ thống sử dụng **Swagger/OpenAPI** để tự động tạo tài liệu API.

### Truy cập tài liệu:

Sau khi chạy ứng dụng, truy cập:

```
http://localhost:3000/api-docs
```

Tại đây, bạn có thể:
- Xem tất cả các endpoint API
- Xem cấu trúc request/response
- Test API trực tiếp trên trình duyệt
- Xem các model/DTO được sử dụng

### Sử dụng API:

Hầu hết các API đều yêu cầu xác thực bằng **JWT Token**. 

**Cách lấy token:**

1. Gọi API đăng nhập: `POST /auth/login`
2. Copy `access_token` từ response
3. Thêm vào header của các request tiếp theo:

```
Authorization: Bearer <your_access_token>
```

Trong Swagger UI, bạn có thể click nút **"Authorize"** và nhập token để test các API có yêu cầu xác thực.

---

## 📁 Cấu trúc dự án

```
quanlysinhvien-ketquahoctap_backend/
├── src/
│   ├── auth/                 # Module xác thực & quản lý người dùng
│   │   ├── decorators/       # Custom decorators (GetUser, Roles)
│   │   ├── dtos/            # Data Transfer Objects
│   │   ├── entity/          # Entity NguoiDung
│   │   ├── enums/           # Enums (VaiTroNguoiDungEnum)
│   │   ├── guards/          # Auth guards (JwtAuthGuard, RolesGuard)
│   │   ├── strategies/      # Passport strategies (JWT)
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   └── auth.service.ts
│   │
│   ├── danh-muc/            # Module quản lý danh mục
│   │   ├── dtos/
│   │   ├── entity/          # Khoa, Nganh, Lop, MonHoc, GiangVien, NienKhoa
│   │   ├── enums/
│   │   ├── danh-muc.controller.ts
│   │   ├── danh-muc.module.ts
│   │   └── danh-muc.service.ts
│   │
│   ├── sinh-vien/           # Module quản lý sinh viên
│   ├── dao-tao/             # Module quản lý đào tạo
│   ├── giang-day/           # Module quản lý giảng dạy
│   ├── ket-qua/             # Module quản lý kết quả
│   ├── bao-cao/             # Module báo cáo
│   ├── common/              # Shared utilities
│   ├── app.module.ts        # Root module
│   ├── app.controller.ts
│   ├── app.service.ts
│   └── main.ts              # Entry point
│
├── test/                    # Test files & sample data
├── dist/                    # Compiled JavaScript (sau khi build)
├── uploads/                 # Thư mục lưu file upload
├── .env                     # File cấu hình môi trường (tạo mới)
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🧪 Chạy tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## 📝 Scripts có sẵn

- `npm run build` - Build ứng dụng
- `npm run start` - Chạy ứng dụng (production mode)
- `npm run start:dev` - Chạy ứng dụng (development mode với hot-reload)
- `npm run start:debug` - Chạy ứng dụng (debug mode)
- `npm run start:prod` - Chạy ứng dụng từ thư mục `dist/`
- `npm run lint` - Kiểm tra và sửa lỗi code style
- `npm run format` - Format code với Prettier
- `npm run test` - Chạy unit tests
- `npm run test:e2e` - Chạy end-to-end tests
- `npm run test:cov` - Chạy tests và tạo coverage report

---

## 🔒 Bảo mật

- Tất cả API (trừ `/auth/login`) đều yêu cầu JWT token
- Mật khẩu được hash bằng bcrypt trước khi lưu vào database
- CORS được cấu hình để chỉ cho phép các frontend được chỉ định
- Input validation được thực hiện bằng class-validator

---

## 📞 Hỗ trợ

Nếu gặp vấn đề trong quá trình cài đặt hoặc sử dụng, vui lòng:

1. Kiểm tra lại file `.env` đã được cấu hình đúng chưa
2. Đảm bảo MySQL đã được cài đặt và đang chạy
3. Kiểm tra port 3000 (hoặc port bạn đã cấu hình) có bị chiếm dụng không
4. Xem log lỗi trong terminal để biết thêm chi tiết

---

## 📄 License

[MIT licensed](LICENSE)

---

<p align="center">
  Made with ❤️ using NestJS
</p>
