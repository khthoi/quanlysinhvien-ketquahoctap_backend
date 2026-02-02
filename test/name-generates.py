import random
import datetime
import openpyxl
from openpyxl.styles import Font, Alignment
import unicodedata


def remove_accents(input_str):
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return ''.join([c for c in nfkd_form if not unicodedata.combining(c)])


# Danh sách tên giữ nguyên
ho_list = ['Nguyễn', 'Đàm', 'Trần', 'Trương', 'Đặng', 'Lý', 'Lê', 'Huỳnh', 'Võ']

ten_dem_nu = [
    'Thị', 'Ngọc', 'Thu', 'Thanh', 'Hồng', 'Kim', 'Mai', 'Lan', 'Ánh', 'Bích', 'Diệu', 'Trúc', 'Thảo', 'Vy', 'Linh', 'An', 'Nhi', 'Tâm', 
    'Hiền', 'Hạnh', 'Phương', 'Yến', 'Như', 'Quỳnh', 'Tiên', 'Khánh', 'Diễm', 'Uyên', 'Thùy', 'Tuyết', 'Kiều', 'Ái', 'Mỹ', 'Châu', 'Khuê', 
    'Sa', 'Tường', 'Hạ', 'Vân', 'Bảo Ngọc', 'Ngọc Anh', 'Thu Hương', 'Thanh Trúc', 'Thùy Linh', 'Mai Anh', 'Diệu Linh', 'Khánh Vy', 'Ánh Ngọc', 
    'Tuyết Mai', 'Ngọc Bích', 'Bích Ngọc'
]

ten_nu = ['Mai', 'Lan', 'Linh', 'Vy', 'Ngọc', 'Hương', 'Trang', 'Thảo', 'Nhung', 'Yến', 'Nhi', 'My', 'Ánh', 'Hằng', 'Quỳnh', 'Trâm', 'Chi', 'Diệp', 'Hà', 'Phương']

ten_dem_nam = [
    'Văn', 'Đức', 'Hữu', 'Minh', 'Quốc', 'Công', 'Thành', 'Anh', 'Trung', 'Hoàng', 'Duy', 'Phúc', 'Khánh', 'Tấn', 'Bảo', 'Hải', 'Nhật', 'Trọng', 
    'Đình', 'Gia'
]

ten_nam = ['Anh', 'Bình', 'Cường', 'Dũng', 'Đạt', 'Hùng', 'Khang', 'Long', 'Nam', 'Phát', 'Phong', 'Quân', 'Sơn', 'Tài', 'Thắng', 'Thiện', 'Toàn', 'Tuấn', 'Vinh', 'Vũ']


def generate_full_name(gioi_tinh):
    ho = random.choice(ho_list)
    if gioi_tinh == 'NU':
        ten_dem = random.choice(ten_dem_nu)
        ten = random.choice(ten_nu)
    else:
        ten_dem = random.choice(ten_dem_nam)
        ten = random.choice(ten_nam)
    return f"{ho} {ten_dem} {ten}"


def random_birthday_in_year(year):
    """Random ngày tháng sinh trong năm được chỉ định"""
    month = random.randint(1, 12)
    
    # Số ngày tối đa của tháng
    if month in [4, 6, 9, 11]:
        max_day = 30
    elif month == 2:
        # Không xử lý nhuận cho đơn giản, lấy an toàn 28
        max_day = 28
    else:
        max_day = 31
        
    day = random.randint(1, max_day)
    return datetime.date(year, month, day)


def get_valid_int(prompt, min_val=None, max_val=None):
    while True:
        try:
            value = int(input(prompt))
            if min_val is not None and value < min_val:
                print(f"Giá trị phải ≥ {min_val}!")
                continue
            if max_val is not None and value > max_val:
                print(f"Giá trị phải ≤ {max_val}!")
                continue
            return value
        except ValueError:
            print("Vui lòng nhập số nguyên hợp lệ!")


def generate_unique_phone(used_phones):
    while True:
        phone = '0' + ''.join(random.choices('0123456789', k=9))
        if phone not in used_phones:
            used_phones.add(phone)
            return phone


def generate_email(full_name, phone):
    name_no_accent = remove_accents(full_name.lower().replace(' ', ''))
    last_five = phone[-5:]
    return f"{name_no_accent}{last_five}@gmail.com"


def main():
    print("=== Tạo danh sách sinh viên ===\n")

    # Nhập thông tin chung
    ma_lop = input("Nhập mã lớp (ví dụ: CNTT_K2025_A): ").strip()
    while not ma_lop:
        print("Mã lớp không được để trống!")
        ma_lop = input("Nhập mã lớp: ").strip()

    nam_nhap_hoc = get_valid_int("Năm nhập học: ", min_val=2000, max_val=2035)
    thang_nhap_hoc = get_valid_int("Tháng nhập học (1-12): ", 1, 12)
    ngay_nhap_hoc = get_valid_int("Ngày nhập học (1-31): ", 1, 31)

    try:
        ngay_nhap_hoc_date = datetime.date(nam_nhap_hoc, thang_nhap_hoc, ngay_nhap_hoc)
    except ValueError:
        print("Ngày nhập học không hợp lệ! Sử dụng ngày mặc định 01/09.")
        ngay_nhap_hoc_date = datetime.date(nam_nhap_hoc, 9, 1)

    ngay_nhap_hoc_str = ngay_nhap_hoc_date.strftime("%d/%m/%Y")

    ma_sv_start = get_valid_int("Mã sinh viên bắt đầu (ví dụ 23010001): ")
    so_luong = get_valid_int("Số lượng sinh viên cần tạo: ", min_val=1, max_val=1000)

    # Thông tin cố định
    dia_chi = "Hà Nội"
    tinh_trang = "DANG_HOC"

    # Chuẩn bị dữ liệu
    data = []
    used_phones = set()

    nam_sinh = nam_nhap_hoc - 18

    for i in range(so_luong):
        stt = i + 1
        ma_sv = ma_sv_start + i

        gioi_tinh = random.choice(['NAM', 'NU'])
        ho_ten = generate_full_name(gioi_tinh)

        # Sinh năm cố định = năm nhập học - 18, random ngày tháng
        ngay_sinh_date = random_birthday_in_year(nam_sinh)
        ngay_sinh = ngay_sinh_date.strftime("%d/%m/%Y")

        sdt = generate_unique_phone(used_phones)
        email = generate_email(ho_ten, sdt)

        row = [
            stt,
            ma_sv,
            ho_ten,
            ngay_sinh,
            gioi_tinh,
            dia_chi,
            email,
            sdt,
            ngay_nhap_hoc_str,
            tinh_trang,
            ma_lop
        ]
        data.append(row)

    # Tạo file Excel
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "DanhSachSinhVien"

    headers = [
        "STT", "Mã sinh viên", "Họ Tên", "Ngày sinh", "Giới tính",
        "Địa chỉ", "Email", "SĐT", "Ngày nhập học", "Tình trạng", "Mã lớp"
    ]
    ws.append(headers)

    # Định dạng header
    for cell in ws[1]:
        cell.font = Font(bold=True)
        cell.alignment = Alignment(horizontal='center', vertical='center')

    # Thêm dữ liệu
    for row in data:
        ws.append(row)

    # Tự động điều chỉnh độ rộng cột
    for col in ws.columns:
        max_length = 0
        column = col[0].column_letter
        for cell in col:
            try:
                if cell.value and len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        adjusted_width = max_length + 3
        ws.column_dimensions[column].width = adjusted_width

    # Lưu file
    file_name = f"danh_sach_{ma_lop.replace(' ','_')}.xlsx"
    wb.save(file_name)
    print(f"\nĐã tạo thành công file: {file_name}")
    print(f"Tổng cộng: {so_luong} sinh viên | Năm sinh: {nam_sinh}")


if __name__ == "__main__":
    main()