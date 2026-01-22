import random
import datetime
import openpyxl
from openpyxl.styles import Font, Alignment
import unicodedata

# Function to remove accents from Vietnamese names
def remove_accents(input_str):
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return ''.join([c for c in nfkd_form if not unicodedata.combining(c)])

# Lists for names
ho_list = ['Nguyễn', 'Đàm', 'Trần', 'Trương', 'Đặng', 'Lý', 'Lê', 'Huỳnh', 'Võ']

ten_dem_nu = [
    'Thị', 'Ngọc', 'Thu', 'Thanh', 'Hồng', 'Kim', 'Mai', 'Lan', 'Ánh', 'Bích', 'Diệu', 'Trúc', 'Thảo', 'Vy', 'Linh', 'An', 'Nhi', 'Tâm', 
    'Hiền', 'Hạnh', 'Phương', 'Yến', 'Như', 'Quỳnh', 'Tiên', 'Khánh', 'Diễm', 'Uyên', 'Thùy', 'Tuyết', 'Kiều', 'Ái', 'Mỹ', 'Châu', 'Khuê', 
    'Sa', 'Tường', 'Hạ', 'Vân', 'Bảo Ngọc', 'Ngọc Anh', 'Thu Hương', 'Thanh Trúc', 'Thùy Linh', 'Mai Anh', 'Diệu Linh', 'Khánh Vy', 'Ánh Ngọc', 
    'Tuyết Mai', 'Ngọc Bích', 'Bích Ngọc'
]

ten_nu = [
    'Mai', 'Lan', 'Linh', 'Vy', 'Ngọc', 'Hương', 'Trang', 'Thảo', 'Nhung', 'Yến', 'Nhi', 'My', 'Ánh', 'Hằng', 'Quỳnh', 'Trâm', 'Chi', 'Diệp', 
    'Hà', 'Phương'
]

ten_dem_nam = [
    'Văn', 'Đức', 'Hữu', 'Minh', 'Quốc', 'Công', 'Thành', 'Anh', 'Trung', 'Hoàng', 'Duy', 'Phúc', 'Khánh', 'Tấn', 'Bảo', 'Hải', 'Nhật', 'Trọng', 
    'Đình', 'Gia'
]

ten_nam = [
    'Anh', 'Bình', 'Cường', 'Dũng', 'Đạt', 'Hùng', 'Khang', 'Long', 'Nam', 'Phát', 'Phong', 'Quân', 'Sơn', 'Tài', 'Thắng', 'Thiện', 'Toàn', 'Tuấn', 
    'Vinh', 'Vũ'
]

# Function to generate random full name
def generate_full_name(gioi_tinh):
    ho = random.choice(ho_list)
    if gioi_tinh == 'NU':
        ten_dem = random.choice(ten_dem_nu)
        ten = random.choice(ten_nu)
    else:
        ten_dem = random.choice(ten_dem_nam)
        ten = random.choice(ten_nam)
    return f"{ho} {ten_dem} {ten}"

# Function to generate random date
def random_date(start_year, end_year):
    year = random.randint(start_year, end_year)
    month = random.randint(1, 12)
    day = random.randint(1, 28)  # Safe for all months
    return datetime.date(year, month, day)

# Function to generate unique phone number (10 digits starting with 0)
def generate_unique_phone(used_phones):
    while True:
        phone = '0' + ''.join(random.choices('0123456789', k=9))
        if phone not in used_phones:
            used_phones.add(phone)
            return phone

# Function to generate email
def generate_email(full_name, phone):
    name_no_accent = remove_accents(full_name.lower().replace(' ', ''))
    last_five = phone[-5:]
    return f"{name_no_accent}{last_five}@gmail.com"

# Main program
def main():
    # User inputs
    ma_sv_start = int(input("Nhập mã sinh viên bắt đầu: "))
    so_luong = int(input("Nhập số lượng sinh viên: "))
    # Note: "số điện thoại" in input might be a misnomer; assuming random phones, ignoring specific input for phone start

    # Constants
    dia_chi = "Hà Nội"
    tinh_trang = "DANG_HOC"
    ma_lop = "CNTT_K2021_A"
    ngay_nhap_hoc = "01/09/2021"  # Default, can randomize if needed

    # Prepare data
    data = []
    used_phones = set()

    for i in range(so_luong):
        stt = i + 1
        ma_sv = ma_sv_start + i
        gioi_tinh = random.choice(['NAM', 'NU'])
        ho_ten = generate_full_name(gioi_tinh)
        ngay_sinh = random_date(1998, 2005).strftime("%d/%m/%Y")
        sdt = generate_unique_phone(used_phones)
        email = generate_email(ho_ten, sdt)
        ngay_nhap_hoc_formatted = ngay_nhap_hoc  # Fixed for all

        row = [
            stt, ma_sv, ho_ten, ngay_sinh, gioi_tinh, dia_chi, email, sdt, ngay_nhap_hoc_formatted, tinh_trang, ma_lop
        ]
        data.append(row)

    # Create Excel file
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Danh sách sinh viên"

    # Headers
    headers = [
        "STT", "Mã sinh viên", "Họ Tên", "Ngày sinh", "Giới tính", "Địa chỉ", "email", "SĐT", 
        "Ngày Nhập học", "Tình trạng", "Mã lớp"
    ]
    ws.append(headers)

    # Style header
    for cell in ws[1]:
        cell.font = Font(bold=True)
        cell.alignment = Alignment(horizontal='center')

    # Add data
    for row in data:
        ws.append(row)

    # Auto-adjust column widths
    for col in ws.columns:
        max_length = 0
        column = col[0].column_letter
        for cell in col:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(cell.value)
            except:
                pass
        adjusted_width = (max_length + 2)
        ws.column_dimensions[column].width = adjusted_width

    # Save file
    file_name = "danh_sach_sinh_vien.xlsx"
    wb.save(file_name)
    print(f"File Excel '{file_name}' đã được tạo thành công.")

if __name__ == "__main__":
    main()