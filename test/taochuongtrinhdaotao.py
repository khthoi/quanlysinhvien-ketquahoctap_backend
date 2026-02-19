import os
import json
import random
from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import Dict, List, Tuple

import mysql.connector
from mysql.connector import Error
import unidecode


# ====================== CẤU HÌNH & HẰNG SỐ ======================

JSON_MON_HOC_PATH = r"JSON response 9.txt"

SO_TIN_CHI_MUC_TIEU = 147
SO_HOC_KY_CTDT = 8

MAJORS = {
    "KTPM": {
        "ten_nganh_hien_thi": "Kỹ thuật phần mềm",
    },
    "ATTT": {
        "ten_nganh_hien_thi": "An toàn thông tin",
    },
    "AI": {
        "ten_nganh_hien_thi": "Trí tuệ nhân tạo (AI)",
    },
}


# ====================== HÀM ĐỌC .ENV & KẾT NỐI DB ======================

def _load_env_file(env_path: str) -> Dict[str, str]:
    """Đọc file .env đơn giản (key=value, bỏ qua comment)"""
    env_vars: Dict[str, str] = {}
    if not os.path.exists(env_path):
        return env_vars

    try:
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" not in line:
                    continue
                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                if key:
                    env_vars[key] = value
    except Exception as e:
        print(f"⚠ Không thể đọc file .env: {e}")
    return env_vars


def connect_db():
    """Kết nối đến MySQL database, ưu tiên cấu hình từ file .env nằm ngoài thư mục test một cấp"""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(base_dir, ".env")

    file_env = _load_env_file(env_path)

    host = file_env.get("DB_HOST") or os.getenv("DB_HOST", "localhost")
    port_str = file_env.get("DB_PORT") or os.getenv("DB_PORT", "3306")
    user = file_env.get("DB_USERNAME") or os.getenv("DB_USERNAME", "root")
    password = file_env.get("DB_PASSWORD") or os.getenv("DB_PASSWORD", "")
    database = file_env.get("DB_DATABASE") or os.getenv("DB_DATABASE", "quanlysinhvien_kqht")

    try:
        conn = mysql.connector.connect(
            host=host,
            user=user,
            password=password,
            port=int(port_str) if str(port_str).isdigit() else 3306,
            database=database,
        )
        return conn
    except Error as e:
        print(f"Lỗi kết nối database: {e}")
        print(f"  - Đã thử kết nối với host={host}, port={port_str}, user={user}, database={database}")
        return None


# ====================== ĐỌC FILE JSON MÔN HỌC ======================

def load_courses_from_json(path: str) -> List[Dict]:
    """Đọc file JSON chứa toàn bộ môn học hiện có của hệ thống"""
    print(f"\nĐang đọc danh sách môn học từ file: {path}")
    if not os.path.exists(path):
        raise FileNotFoundError(f"Không tìm thấy file môn học: {path}")

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # File JSON có thể có 2 dạng:
    #   - {"data": [ ... ]}
    #   - [ ... ] (list các phần tử)
    if isinstance(data, dict) and "data" in data:
        raw_items = data["data"]
    elif isinstance(data, list):
        raw_items = data
    else:
        raise ValueError(
            "Định dạng file JSON không hợp lệ. "
            "Kỳ vọng là list các môn hoặc dict có key 'data'."
        )

    if not raw_items:
        print("  - File JSON không có phần tử nào.")
        return []

    # ================== CHUẨN HÓA DỮ LIỆU MÔN HỌC ==================
    #
    # Có 2 kiểu dữ liệu đầu vào:
    #   1) Danh sách môn học: mỗi phần tử đã có đủ các field:
    #        - maMonHoc, tenMonHoc, loaiMon, soTinChi
    #   2) Danh sách lớp học phần (giống file 'JSON response 9.txt'):
    #        - maLopHocPhan, maMonHoc, soTinChi, ...
    #      → cần gom theo maMonHoc để suy ra danh sách môn học duy nhất.

    first = raw_items[0]
    if "tenMonHoc" in first and "loaiMon" in first:
        # Trường hợp 1: đã là danh sách môn học đúng chuẩn
        courses = raw_items
        print(f"  - Số môn học trong file (đã chuẩn): {len(courses)}")
        return courses

    # Trường hợp 2: dữ liệu là danh sách lớp học phần → gom theo maMonHoc
    print("  - Phát hiện dữ liệu là DANH SÁCH LỚP HỌC PHẦN, sẽ gom theo 'maMonHoc' để tạo danh sách môn học duy nhất.")

    course_map: Dict[str, Dict] = {}
    for item in raw_items:
        ma = item.get("maMonHoc")
        if not ma:
            continue

        if ma not in course_map:
            so_tc = item.get("soTinChi", 0)
            # Vì file không có tên môn & loại môn, tạm thời:
            #   - tenMonHoc: dùng luôn mã môn
            #   - loaiMon  : gán 'KHAC' để phân biệt là dữ liệu sinh tự động
            course_map[ma] = {
                "maMonHoc": ma,
                "tenMonHoc": ma,
                "loaiMon": "KHAC",
                "soTinChi": so_tc,
            }

    courses = list(course_map.values())
    print(f"  - Đã suy ra {len(courses)} môn học duy nhất từ danh sách {len(raw_items)} lớp học phần.")
    return courses


def sync_mon_hoc_from_json(cursor, conn, json_courses: List[Dict]) -> Dict[str, Dict]:
    """
    Đảm bảo tất cả môn học trong file JSON đều tồn tại trong bảng mon_hoc.
    Trả về dict mapping ma_mon_hoc -> thông tin môn học trong DB.
    """
    print("\nĐang đồng bộ bảng mon_hoc từ file JSON...")

    # Lưu ý: bảng mon_hoc trong DB hiện tại không có cột 'mo_ta',
    # nên chỉ select các cột thực tế tồn tại để tránh lỗi 1054.
    cursor.execute(
        "SELECT id, ma_mon_hoc, ten_mon_hoc, loai_mon, so_tin_chi FROM mon_hoc"
    )
    existing = cursor.fetchall()
    mon_hoc_by_ma: Dict[str, Dict] = {row["ma_mon_hoc"]: row for row in existing}

    # Chuẩn bị danh sách môn học sẽ thêm mới
    to_insert: List[Dict] = []
    for mh in json_courses:
        ma = mh["maMonHoc"]
        if ma in mon_hoc_by_ma:
            continue
        to_insert.append(mh)

    if not to_insert:
        print("  - Không có môn học mới cần thêm từ file JSON.")
        return mon_hoc_by_ma

    print("\nCác môn học mới sẽ được thêm vào DB (từ file JSON):")
    for mh in to_insert:
        print(
            f"  - {mh['maMonHoc']}: {mh['tenMonHoc']} "
            f"({mh['soTinChi']} tín chỉ, loại {mh['loaiMon']})"
        )

    confirm = (
        input("  → Xác nhận thêm các môn học mới này vào DB? (y/n): ")
        .strip()
        .lower()
    )
    if confirm != "y":
        print("  → Bỏ qua việc thêm môn học mới từ file JSON.")
        return mon_hoc_by_ma

    inserted = 0

    # Chỉ insert các cột thật sự có trong bảng mon_hoc (bỏ 'mo_ta' để tránh lỗi).
    insert_sql = """
        INSERT INTO mon_hoc (ten_mon_hoc, ma_mon_hoc, loai_mon, so_tin_chi)
        VALUES (%s, %s, %s, %s)
    """

    for mh in to_insert:
        ma = mh["maMonHoc"]
        # Kiểm tra lại trong DB xem đã tồn tại chưa
        cursor.execute(
            "SELECT id FROM mon_hoc WHERE ma_mon_hoc = %s LIMIT 1",
            (ma,),
        )
        existed = cursor.fetchone()
        if existed:
            print(f"  • Bỏ qua {ma} vì đã tồn tại trong DB (id={existed['id']}).")
            continue

        try:
            cursor.execute(
                insert_sql,
                (
                    mh["tenMonHoc"],
                    mh["maMonHoc"],
                    mh["loaiMon"],
                    mh["soTinChi"],
                ),
            )
            new_id = cursor.lastrowid
            inserted += 1
            mon_hoc_by_ma[ma] = {
                "id": new_id,
                "ma_mon_hoc": mh["maMonHoc"],
                "ten_mon_hoc": mh["tenMonHoc"],
                "loai_mon": mh["loaiMon"],
                "so_tin_chi": mh["soTinChi"],
            }
        except Error as e:
            print(f"  ✗ Lỗi khi thêm môn học {ma}: {e}")

    if inserted:
        conn.commit()

    print(f"  - Số môn học mới được thêm vào DB: {inserted}")
    print(f"  - Tổng số môn học trong DB sau đồng bộ: {len(mon_hoc_by_ma)}")
    return mon_hoc_by_ma


# ====================== HỖ TRỢ CHỌN NGÀNH & NIÊN KHÓA ======================

def chon_nganh_va_nien_khoa(cursor) -> Dict[str, Dict]:
    """
    Hỏi người dùng mapping:
      - mỗi ngành (KTPM/ATTT/AI) -> nganh_id
      - mỗi ngành -> nien_khoa_id áp dụng CTĐT
    """
    print("\n" + "=" * 70)
    print("CHỌN NGÀNH & NIÊN KHÓA CHO CÁC CHƯƠNG TRÌNH ĐÀO TẠO")
    print("=" * 70)

    cursor.execute("SELECT id, ma_nganh, ten_nganh FROM nganh ORDER BY id")
    ds_nganh = cursor.fetchall()
    if not ds_nganh:
        raise RuntimeError("Trong DB chưa có bản ghi nào trong bảng 'nganh'.")

    print("\nDanh sách ngành hiện có:")
    for row in ds_nganh:
        print(f"  - ID {row['id']:3d}: {row['ma_nganh']} - {row['ten_nganh']}")

    cursor.execute("SELECT id, ma_nien_khoa, ten_nien_khoa FROM nien_khoa ORDER BY id")
    ds_nien_khoa = cursor.fetchall()
    if not ds_nien_khoa:
        raise RuntimeError("Trong DB chưa có bản ghi nào trong bảng 'nien_khoa'.")

    print("\nDanh sách niên khóa hiện có:")
    for row in ds_nien_khoa:
        print(f"  - ID {row['id']:3d}: {row['ma_nien_khoa']} - {row['ten_nien_khoa']}")

    result: Dict[str, Dict] = {}

    for major_code, info in MAJORS.items():
        ten_hien_thi = info["ten_nganh_hien_thi"]
        print("\n" + "-" * 70)
        print(f"Thiết lập cho ngành: {ten_hien_thi} ({major_code})")

        while True:
            try:
                nganh_id = int(input("  → Nhập ID ngành tương ứng: ").strip())
            except ValueError:
                print("    Vui lòng nhập số nguyên hợp lệ.")
                continue
            if any(r["id"] == nganh_id for r in ds_nganh):
                break
            print("    ID ngành không tồn tại, vui lòng nhập lại.")

        while True:
            try:
                nien_khoa_id = int(input("  → Nhập ID niên khóa áp dụng CTĐT: ").strip())
            except ValueError:
                print("    Vui lòng nhập số nguyên hợp lệ.")
                continue
            if any(r["id"] == nien_khoa_id for r in ds_nien_khoa):
                break
            print("    ID niên khóa không tồn tại, vui lòng nhập lại.")

        nganh_row = next(r for r in ds_nganh if r["id"] == nganh_id)
        nk_row = next(r for r in ds_nien_khoa if r["id"] == nien_khoa_id)

        result[major_code] = {
            "nganh_id": nganh_id,
            "nganh": nganh_row,
            "nien_khoa_id": nien_khoa_id,
            "nien_khoa": nk_row,
        }

    return result


# ====================== PHÂN LOẠI MÔN HỌC CHO 3 NGÀNH ======================

def build_course_sets(mon_hoc_by_ma: Dict[str, Dict]) -> Dict[str, List[str]]:
    """
    Xây dựng danh sách mã môn cho từng ngành:
      - COMMON: môn đại cương + cơ sở ngành chung
      - KTPM / ATTT / AI: chuyên ngành riêng, cộng chung.
    CHÚ Ý: Chỉ giữ lại các môn thực sự tồn tại trong DB.
    """
    # Môn đại cương & cơ sở dùng chung cho 3 ngành
    common_codes = {
        # Chính trị, pháp luật, GDTC, NN
        "ML1011", "ML1021", "ML1031", "ML1051",
        "PL1001",
        "TH1001", "TH1002", "TH1003",
        "TN1001", "TN1002", "TN1003",
        # Toán - Xác suất
        "TH1101", "TH1102", "TH1103", "TH1104", "TH1105",
        # Nhập môn CNTT
        "IT1001", "IT1002", "IT1003", "IT1004",
        # Cơ sở ngành
        "IT2001", "IT2002", "IT2003", "IT2004", "IT2005", "IT2006",
        "IT2008",  # Trí tuệ nhân tạo cơ sở
        # Một số môn kinh tế / quản trị dùng chung
        "MG2001", "AC2001",
    }

    # Kỹ thuật phần mềm
    ktpm_spec = {
        "IT2007",  # Công nghệ phần mềm
        "IT3001",  # Lập trình di động
        "IT3004",  # Java nâng cao
        "IT3005",  # Đồ họa máy tính
        "IT3006",  # Thương mại điện tử (ứng dụng)
        "IT3007",  # Quản trị mạng
        "IT3009",  # Cloud computing
        "IT3010",  # Python
        "IT3011",  # Big Data
        "IT3012",  # IoT
        "IT3013",  # Blockchain
        "IT4001",  # Phát triển game
        "IT4003",  # Computer Vision
        "IT4004",  # DevOps
        "IT4005",  # Quản lý dự án CNTT
        "IT4006",  # Kiểm thử phần mềm
        "IT4007",  # Thực tập
        "IT4008",  # Đồ án chuyên ngành
        "IT4009",  # Khóa luận tốt nghiệp
        "IT4010",  # Seminar
    }

    # An toàn thông tin
    attt_spec = {
        "IT3002",  # AT & BMTT
        "IT3007",  # Quản trị mạng
        "IT3009",  # Cloud
        "IS3005",  # SCM (liên quan HTTT)
        "IS3009",  # TMĐT
        "IS4003",  # Quản trị rủi ro CNTT
        "IT3011",  # Big Data
        "IT3012",  # IoT
        "IT3013",  # Blockchain
        "IT4002",  # NLP (liên quan xử lý dữ liệu)
        "IT4003",  # Computer Vision
        "IT4004",  # DevOps
        "IT4007",  # Thực tập
        "IT4008",  # Đồ án CN
        "IT4009",  # Khóa luận
    }

    # Trí tuệ nhân tạo
    ai_spec = {
        "IT2008",  # Trí tuệ nhân tạo
        "IT3003",  # Học máy
        "IT3010",  # Python
        "IT3011",  # Big Data
        "IT3005",  # Đồ họa máy tính
        "IT3012",  # IoT
        "IT4001",  # Game
        "IT4002",  # NLP
        "IT4003",  # Computer Vision
        "IT4007",  # Thực tập
        "IT4008",  # Đồ án CN
        "IT4009",  # Khóa luận
        "IT4010",  # Seminar
    }

    def filter_existing(codes: List[str]) -> List[str]:
        return [c for c in codes if c in mon_hoc_by_ma]

    ktpm_set = set(filter_existing(list(common_codes))) | set(filter_existing(list(ktpm_spec)))
    attt_set = set(filter_existing(list(common_codes))) | set(filter_existing(list(attt_spec)))
    ai_set = set(filter_existing(list(common_codes))) | set(filter_existing(list(ai_spec)))

    print("\nTóm tắt sơ bộ số môn / ngành (trước khi bù đủ 147 tín chỉ):")
    for code, s in [("KTPM", ktpm_set), ("ATTT", attt_set), ("AI", ai_set)]:
        tong_tc = sum(mon_hoc_by_ma[m]["so_tin_chi"] for m in s)
        print(f"  - {code}: {len(s)} môn, {tong_tc} tín chỉ")

    return {
        "KTPM": sorted(ktpm_set),
        "ATTT": sorted(attt_set),
        "AI": sorted(ai_set),
    }


# ====================== BÙ THÊM MÔN ĐỂ ĐỦ 147 TÍN CHỈ ======================

# Danh sách một số học phần chuyên ngành "thực" cho từng ngành.
# Đây là các môn tham khảo từ CTĐT điển hình, được dùng để đặt tên
# cho các học phần bù tín chỉ thay vì đặt tên chung chung.
EXTRA_COURSES_BY_MAJOR = {
    "KTPM": [
        ("Kiến trúc và Thiết kế Phần mềm", 3),
        ("Phân tích và Thiết kế Hệ thống Thông tin", 3),
        ("Phát triển Ứng dụng Web", 3),
        ("Phát triển Ứng dụng Web nâng cao", 3),
        ("Phát triển Ứng dụng Di động", 3),
        ("Lập trình Java nâng cao", 3),
        ("Lập trình .NET", 3),
        ("Công nghệ Microservices", 3),
        ("DevOps cho Phát triển Phần mềm", 3),
        ("Kiểm thử và Đảm bảo chất lượng Phần mềm", 3),
        ("Quản lý Dự án Phần mềm", 3),
        ("Phân tích yêu cầu phần mềm nâng cao", 2),
        ("Thiết kế giao diện và Trải nghiệm người dùng", 2),
        ("Seminar Kỹ thuật Phần mềm hiện đại", 1),
        ("Đồ án chuyên đề Kỹ thuật Phần mềm", 2),
    ],
    "ATTT": [
        ("Mật mã học ứng dụng", 3),
        ("An toàn mạng máy tính", 3),
        ("An ninh hệ thống thông tin", 3),
        ("Quản trị an ninh mạng", 3),
        ("Kiểm thử xâm nhập (Penetration Testing)", 3),
        ("Phân tích mã độc", 3),
        ("Điều tra số (Digital Forensics)", 3),
        ("Quản lý rủi ro và tuân thủ an toàn thông tin", 3),
        ("Bảo mật ứng dụng Web", 3),
        ("Bảo mật cơ sở dữ liệu", 2),
        ("Bảo mật hệ điều hành", 2),
        ("Seminar An toàn thông tin", 1),
        ("Chuyên đề nâng cao về An toàn thông tin", 2),
    ],
    "AI": [
        ("Học máy nâng cao", 3),
        ("Học sâu (Deep Learning)", 3),
        ("Thị giác máy tính nâng cao", 3),
        ("Xử lý ngôn ngữ tự nhiên nâng cao", 3),
        ("Học tăng cường (Reinforcement Learning)", 3),
        ("Khai phá dữ liệu nâng cao", 3),
        ("AI cho Thương mại điện tử", 3),
        ("AI cho Tài chính – Ngân hàng", 3),
        ("Triển khai mô hình AI trên nền tảng đám mây", 3),
        ("Tối ưu hóa trong học máy", 2),
        ("Đạo đức và pháp lý trong AI", 2),
        ("Seminar Ứng dụng Trí tuệ nhân tạo", 1),
        ("Đồ án chuyên đề Trí tuệ nhân tạo", 2),
    ],
}

def tao_mon_moi_cho_nganh(
    cursor,
    conn,
    major_code: str,
    mon_hoc_by_ma: Dict[str, Dict],
    so_tin_chi_can_them: int,
) -> List[str]:
    """
    Tạo thêm các môn học "chuyên đề" mới cho 1 ngành để đủ 147 tín chỉ.
    Trả về danh sách mã môn học mới.
    """
    if so_tin_chi_can_them <= 0:
        return []

    print(f"\n  → Ngành {major_code} cần bù thêm {so_tin_chi_can_them} tín chỉ. Đang tạo học phần chuyên ngành bổ sung...")

    created_codes: List[str] = []

    # Chuẩn bị danh sách môn học sẽ tạo mới
    remaining = so_tin_chi_can_them
    idx = 1

    pending_courses: List[Dict] = []

    # Lấy danh sách học phần chuyên ngành tham khảo theo từng ngành
    course_pool = EXTRA_COURSES_BY_MAJOR.get(major_code, [])
    if not course_pool:
        # Fallback nếu chưa cấu hình riêng cho ngành: dùng một số tên chung
        course_pool = [
            ("Chuyên đề Công nghệ thông tin hiện đại", 3),
            ("Chuyên đề Hệ thống thông tin", 3),
            ("Seminar chuyên ngành CNTT", 1),
        ]

    while remaining > 0:
        # Chọn ngẫu nhiên một môn có số tín chỉ không vượt quá phần còn thiếu
        valid_courses = [c for c in course_pool if c[1] <= remaining]
        if not valid_courses:
            # Nếu tất cả môn trong pool có số tín chỉ lớn hơn phần còn lại,
            # chọn môn có số tín chỉ nhỏ nhất để tránh vòng lặp vô hạn.
            course_name, tc = min(course_pool, key=lambda x: x[1])
            if tc > remaining and remaining > 0:
                tc = remaining
        else:
            course_name, tc = random.choice(valid_courses)

        ma_mon = f"{major_code}_CD{idx}"
        ten_mon = course_name
        loai_mon = "CHUYEN_NGANH"

        # Tránh trùng mã trong tập dữ liệu hiện có và trong danh sách pending
        base_ma = ma_mon
        suffix = 1
        while ma_mon in mon_hoc_by_ma or any(p["ma_mon_hoc"] == ma_mon for p in pending_courses):
            ma_mon = f"{base_ma}_{suffix}"
            suffix += 1

        pending_courses.append(
            {
                "ma_mon_hoc": ma_mon,
                "ten_mon_hoc": ten_mon,
                "loai_mon": loai_mon,
                "so_tin_chi": tc,
            }
        )

        remaining -= tc
        idx += 1

    if not pending_courses:
        print("  → Không có môn mới nào cần tạo thêm.")
        return []

    print("\nDanh sách các môn chuyên ngành sẽ tạo thêm:")
    for mh in pending_courses:
        print(
            f"    - {mh['ma_mon_hoc']}: {mh['ten_mon_hoc']} "
            f"({mh['so_tin_chi']} tín chỉ, loại {mh['loai_mon']})"
        )

    confirm = (
        input("  → Xác nhận tạo các môn chuyên ngành mới này? (y/n): ")
        .strip()
        .lower()
    )
    if confirm != "y":
        print(f"  → Bỏ qua tạo môn chuyên ngành bổ sung cho ngành {major_code}.")
        return []

    # Chỉ insert các cột thực tế tồn tại trong bảng mon_hoc.
    insert_sql = """
        INSERT INTO mon_hoc (ten_mon_hoc, ma_mon_hoc, loai_mon, so_tin_chi)
        VALUES (%s, %s, %s, %s)
    """

    for mh in pending_courses:
        ma_mon = mh["ma_mon_hoc"]

        # Kiểm tra lại trong DB xem đã tồn tại chưa
        cursor.execute(
            "SELECT id FROM mon_hoc WHERE ma_mon_hoc = %s LIMIT 1",
            (ma_mon,),
        )
        existed = cursor.fetchone()
        if existed:
            print(f"    • Bỏ qua {ma_mon} vì đã tồn tại trong DB (id={existed['id']}).")
            continue

        try:
            cursor.execute(
                insert_sql,
                (
                    mh["ten_mon_hoc"],
                    ma_mon,
                    mh["loai_mon"],
                    mh["so_tin_chi"],
                ),
            )
            new_id = cursor.lastrowid
            mon_hoc_by_ma[ma_mon] = {
                "id": new_id,
                "ma_mon_hoc": ma_mon,
                "ten_mon_hoc": mh["ten_mon_hoc"],
                "loai_mon": mh["loai_mon"],
                "so_tin_chi": mh["so_tin_chi"],
            }
            created_codes.append(ma_mon)
            print(
                f"    ✓ Đã tạo môn mới: {ma_mon} - {mh['ten_mon_hoc']} "
                f"({mh['so_tin_chi']} tín chỉ)"
            )
        except Error as e:
            print(f"    ✗ Lỗi khi tạo môn mới {ma_mon}: {e}")

    if created_codes:
        conn.commit()

    print(f"  → Đã tạo {len(created_codes)} môn mới cho ngành {major_code}")
    return created_codes


# ====================== GÁN HỌC KỲ (1 → 8) CHO MÔN TRONG CTĐT ======================

def guess_semester_from_code(ma_mon_hoc: str) -> int:
    """
    Đoán thứ tự học kỳ (1→8) từ mã môn học.
    Quy tắc tương đối:
      - Năm 1: 1–2
      - Năm 2: 3–4
      - Năm 3: 5–6
      - Năm 4: 7–8
    """
    code = ma_mon_hoc.upper()

    year = 1
    if code.startswith("IT"):
        try:
            num = int(code[2:6])
            if 1000 <= num < 2000:
                year = 1
            elif 2000 <= num < 3000:
                year = 2
            elif 3000 <= num < 4000:
                year = 3
            else:
                year = 4
        except Exception:
            year = 2
    elif code.startswith("IS"):
        try:
            num = int(code[2:6])
            if 2000 <= num < 3000:
                year = 2
            elif 3000 <= num < 4000:
                year = 3
            else:
                year = 4
        except Exception:
            year = 3
    elif code.startswith("TH") or code.startswith("TN") or code.startswith("ML") or code.startswith("PL"):
        year = 1
    elif code.startswith("AC") or code.startswith("MG"):
        year = 2
    else:
        year = 2

    if year < 1:
        year = 1
    if year > 4:
        year = 4

    # Xác định học kỳ trong năm (1 hoặc 2) dựa trên chữ số cuối của mã môn
    digits = "".join(ch for ch in code if ch.isdigit())
    if digits:
        last_digit = int(digits[-1])
        sem_in_year = 1 if last_digit % 2 == 1 else 2
    else:
        sem_in_year = 1

    hoc_ky = (year - 1) * 2 + sem_in_year

    if hoc_ky < 1:
        hoc_ky = 1
    if hoc_ky > SO_HOC_KY_CTDT:
        hoc_ky = SO_HOC_KY_CTDT

    return hoc_ky


def build_ctdt_plan_for_major(
    major_code: str,
    course_codes: List[str],
    mon_hoc_by_ma: Dict[str, Dict],
) -> Tuple[List[Dict], Dict[int, int]]:
    """
    Xây dựng danh sách chi tiết CTĐT cho 1 ngành:
      - trả về list dict: {ma_mon_hoc, mon_hoc_id, thu_tu_hoc_ky}
      - đồng thời trả về dict: hoc_ky (1→8) -> tổng tín chỉ trong CTĐT kỳ đó
    """
    # Phân nhóm theo học kỳ dự đoán
    per_sem: Dict[int, List[str]] = defaultdict(list)
    for ma in course_codes:
        hk = guess_semester_from_code(ma)
        if hk < 1:
            hk = 1
        if hk > SO_HOC_KY_CTDT:
            hk = SO_HOC_KY_CTDT
        per_sem[hk].append(ma)

    # Đảm bảo có đủ key 1..8
    for i in range(1, SO_HOC_KY_CTDT + 1):
        per_sem.setdefault(i, [])

    plan: List[Dict] = []
    tong_tc_theo_hk: Dict[int, int] = defaultdict(int)

    for hk in range(1, SO_HOC_KY_CTDT + 1):
        # Để CTĐT cân bằng hơn, có thể giữ nguyên thứ tự môn
        for ma in sorted(per_sem[hk]):
            mh = mon_hoc_by_ma[ma]
            so_tc = int(mh["so_tin_chi"])
            plan.append(
                {
                    "ma_mon_hoc": ma,
                    "mon_hoc_id": mh["id"],
                    "thu_tu_hoc_ky": hk,
                }
            )
            tong_tc_theo_hk[hk] += so_tc

    print(f"\nKế hoạch CTĐT ngành {major_code}:")
    for hk in range(1, SO_HOC_KY_CTDT + 1):
        print(f"  - Học kỳ {hk}: {tong_tc_theo_hk[hk]} tín chỉ, {len(per_sem[hk])} môn")

    return plan, tong_tc_theo_hk


# ====================== TẠO BẢN GHI CTĐT & CHI TIẾT ======================

def create_chuong_trinh(
    cursor,
    conn,
    major_code: str,
    major_info: Dict,
) -> int:
    """Tạo 1 bản ghi chuong_trinh_dao_tao cho ngành tương ứng, trả về id."""
    nganh = major_info["nganh"]
    ma_chuong_trinh = f"CTDT_{major_code}"
    ten_chuong_trinh = f"Chương trình đào tạo ngành {nganh['ten_nganh']} ({major_code})"
    thoi_gian_dao_tao = 4  # năm

    print(f"\nTạo CTĐT cho ngành {nganh['ten_nganh']} ({major_code})...")

    # Kiểm tra CTĐT đã tồn tại hay chưa theo mã
    cursor.execute(
        "SELECT id FROM chuong_trinh_dao_tao WHERE ma_chuong_trinh = %s LIMIT 1",
        (ma_chuong_trinh,),
    )
    existed = cursor.fetchone()
    if existed:
        print(
            f"  → CTĐT với mã {ma_chuong_trinh} đã tồn tại (ID={existed['id']}), "
            "bỏ qua tạo mới."
        )
        return existed["id"]

    cursor.execute(
        """
        INSERT INTO chuong_trinh_dao_tao (ma_chuong_trinh, ten_chuong_trinh, thoi_gian_dao_tao, nganh_id)
        VALUES (%s, %s, %s, %s)
        """,
        (ma_chuong_trinh, ten_chuong_trinh, thoi_gian_dao_tao, nganh["id"]),
    )
    ct_id = cursor.lastrowid
    conn.commit()
    print(f"  ✓ Đã tạo CTĐT ID = {ct_id}, mã = {ma_chuong_trinh}")
    return ct_id


def create_chi_tiet_ctdt(
    cursor,
    conn,
    chuong_trinh_id: int,
    plan: List[Dict],
    shared_codes: Dict[str, int],
):
    """
    Tạo các bản ghi chi_tiet_chuong_trinh_dao_tao cho 1 CTĐT.
    shared_codes: ma_mon_hoc -> số ngành sử dụng (>=2 -> môn chung).
    """
    print(f"\n  → Đang thêm chi tiết CTĐT (ID={chuong_trinh_id})...")

    # Bảng chi_tiet_chuong_trinh_dao_tao hiện tại KHÔNG có cột 'ghi_chu' trong DB,
    # nên chỉ insert các cột thực tế tồn tại để tránh lỗi 1054.
    insert_sql = """
        INSERT INTO chi_tiet_chuong_trinh_dao_tao (thu_tu_hoc_ky, chuong_trinh_id, mon_hoc_id)
        VALUES (%s, %s, %s)
    """
    count = 0
    for item in plan:
        ma = item["ma_mon_hoc"]
        mon_hoc_id = item["mon_hoc_id"]
        hk = item["thu_tu_hoc_ky"]

        try:
            # Kiểm tra chi tiết CTĐT đã tồn tại chưa
            cursor.execute(
                """
                SELECT id FROM chi_tiet_chuong_trinh_dao_tao
                WHERE chuong_trinh_id = %s AND mon_hoc_id = %s AND thu_tu_hoc_ky = %s
                LIMIT 1
                """,
                (chuong_trinh_id, mon_hoc_id, hk),
            )
            existed = cursor.fetchone()
            if existed:
                print(
                    f"    • Bỏ qua chi tiết CTĐT cho môn {ma} (đã tồn tại, id={existed['id']})."
                )
                continue

            cursor.execute(insert_sql, (hk, chuong_trinh_id, mon_hoc_id))
            count += 1
        except Error as e:
            print(f"    ✗ Lỗi khi thêm chi tiết CTĐT, môn {ma}: {e}")

    if count:
        conn.commit()
    print(f"  → Đã thêm {count} bản ghi chi tiết CTĐT.")


def create_ap_dung_ctdt(
    cursor,
    conn,
    chuong_trinh_id: int,
    major_info: Dict,
):
    """Tạo bản ghi ap_dung_chuong_trinh_dt cho ngành + niên khóa đã chọn."""
    nganh = major_info["nganh"]
    nk = major_info["nien_khoa"]

    print(f"  → Tạo bản ghi áp dụng CTĐT cho ngành {nganh['ten_nganh']} - niên khóa {nk['ma_nien_khoa']}")

    # Bảng ap_dung_chuong_trinh_dt trong DB hiện tại không có cột 'ghi_chu',
    # nên bỏ cột này khỏi câu lệnh INSERT để tránh lỗi 1054.
    insert_sql = """
        INSERT INTO ap_dung_chuong_trinh_dt (chuong_trinh_id, nganh_id, nien_khoa_id, ngay_ap_dung)
        VALUES (%s, %s, %s, %s)
    """
    today = date.today()
    try:
        # Kiểm tra bản ghi áp dụng đã tồn tại chưa
        cursor.execute(
            """
            SELECT id FROM ap_dung_chuong_trinh_dt
            WHERE chuong_trinh_id = %s AND nganh_id = %s AND nien_khoa_id = %s
            LIMIT 1
            """,
            (chuong_trinh_id, nganh["id"], nk["id"]),
        )
        existed = cursor.fetchone()
        if existed:
            print(
                f"    • Bỏ qua tạo ap_dung_chuong_trinh_dt (đã tồn tại, id={existed['id']})."
            )
            return

        cursor.execute(
            insert_sql, (chuong_trinh_id, nganh["id"], nk["id"], today)
        )
        conn.commit()
        print("    ✓ Đã tạo bản ghi áp dụng CTĐT.")
    except Error as e:
        print(f"    ✗ Lỗi khi tạo ap_dung_chuong_trinh_dt: {e}")


# ====================== TẠO GIẢNG VIÊN & PHÂN CÔNG MÔN HỌC ======================

# Dữ liệu mẫu để sinh giảng viên
GV_HO = [
    "Nguyễn",
    "Trần",
    "Lê",
    "Phạm",
    "Hoàng",
    "Phan",
    "Vũ",
    "Đặng",
    "Bùi",
    "Đỗ",
    "Hồ",
    "Ngô",
    "Dương",
    "Lý",
]
GV_TEN_DEM = [
    "Văn",
    "Thị",
    "Hữu",
    "Đức",
    "Minh",
    "Anh",
    "Tuấn",
    "Quốc",
    "Thanh",
    "Ngọc",
    "Hồng",
    "Phương",
]
GV_TEN = [
    "An",
    "Bình",
    "Cường",
    "Dũng",
    "Hải",
    "Hòa",
    "Hùng",
    "Khanh",
    "Linh",
    "Long",
    "Minh",
    "Nam",
    "Phong",
    "Phúc",
    "Quân",
    "Sơn",
    "Thắng",
    "Thành",
    "Thiện",
    "Tiến",
    "Toàn",
    "Trang",
    "Trung",
    "Tuấn",
    "Việt",
    "Vinh",
    "Yến",
    "Ngọc",
    "Hương",
    "Mai",
    "Lan",
]
GV_DIA_CHI = [
    "Hà Nội",
    "TP. Hồ Chí Minh",
    "Đà Nẵng",
    "Hải Phòng",
    "Cần Thơ",
    "Huế",
    "Nha Trang",
    "Vũng Tàu",
    "Biên Hòa",
    "Thái Nguyên",
]


def _tao_ma_giang_vien(ho_ten: str) -> str:
    """Tạo mã giảng viên từ họ tên ở dạng IN HOA, không dấu, cách nhau bởi '_'."""
    khong_dau = unidecode.unidecode(ho_ten).upper()
    return khong_dau.replace(" ", "_")


def _tao_email_giang_vien(ho: str, ten_dem: str, ten: str, index: int) -> str:
    """Tạo email không dấu, chữ thường, đảm bảo stable theo index."""
    full = f"{ho} {ten_dem} {ten}"
    khong_dau = unidecode.unidecode(full).lower().replace(" ", "")
    return f"{khong_dau}{index}@university.edu.vn"


def _auto_create_giang_vien(cursor, conn, so_luong: int) -> List[int]:
    """
    Tự động tạo thêm giảng viên nếu hệ thống đang thiếu.
    Trả về danh sách id giang_vien mới tạo.
    """
    if so_luong <= 0:
        return []

    # Lấy dữ liệu hiện có để tránh trùng lặp
    cursor.execute("SELECT ma_giang_vien, email, sdt FROM giang_vien")
    existing = cursor.fetchall()
    used_ma = {row["ma_giang_vien"] for row in existing if row.get("ma_giang_vien")}
    used_email = {row["email"] for row in existing if row.get("email")}
    used_phone = {row["sdt"] for row in existing if row.get("sdt")}

    # Chuẩn bị danh sách giảng viên sẽ tạo mới
    pending_gv: List[Dict] = []

    for i in range(so_luong):
        ho = random.choice(GV_HO)
        ten_dem = random.choice(GV_TEN_DEM)
        ten = random.choice(GV_TEN)
        ho_ten = f"{ho} {ten_dem} {ten}"

        # Mã giảng viên duy nhất
        ma_gv = _tao_ma_giang_vien(ho_ten)
        base_ma = ma_gv
        suffix = 1
        while ma_gv in used_ma or any(gv["ma_giang_vien"] == ma_gv for gv in pending_gv):
            ma_gv = f"{base_ma}_{suffix}"
            suffix += 1
        used_ma.add(ma_gv)

        # Ngày sinh ngẫu nhiên 1970–1990
        start_date = datetime(1970, 1, 1)
        end_date = datetime(1990, 12, 31)
        delta_days = (end_date - start_date).days
        random_days = random.randint(0, delta_days)
        ngay_sinh = start_date + timedelta(days=random_days)

        # Email duy nhất
        email = _tao_email_giang_vien(ho, ten_dem, ten, i + 1)
        base_email = email.split("@")[0]
        suffix = 0
        while email in used_email or any(gv["email"] == email for gv in pending_gv):
            suffix += 1
            email = f"{base_email}{suffix}@university.edu.vn"
        used_email.add(email)

        # SĐT duy nhất
        sdt = f"09{random.randint(10000000, 99999999)}"
        while sdt in used_phone or any(gv["sdt"] == sdt for gv in pending_gv):
            sdt = f"09{random.randint(10000000, 99999999)}"
        used_phone.add(sdt)

        gioi_tinh = random.choice(["NAM", "NU"])
        dia_chi = random.choice(GV_DIA_CHI)

        pending_gv.append(
            {
                "ma_giang_vien": ma_gv,
                "ho_ten": ho_ten,
                "ngay_sinh": ngay_sinh,
                "email": email,
                "sdt": sdt,
                "gioi_tinh": gioi_tinh,
                "dia_chi": dia_chi,
            }
        )

    if not pending_gv:
        print("  → Không có giảng viên mới nào cần tạo thêm.")
        return []

    print("\nDanh sách giảng viên sẽ được tạo mới:")
    for gv in pending_gv:
        print(
            f"  - {gv['ma_giang_vien']}: {gv['ho_ten']}, "
            f"Email: {gv['email']}, SĐT: {gv['sdt']}, "
            f"Giới tính: {gv['gioi_tinh']}, Địa chỉ: {gv['dia_chi']}"
        )

    confirm = (
        input("  → Xác nhận tạo các giảng viên mới này? (y/n): ")
        .strip()
        .lower()
    )
    if confirm != "y":
        print("  → Bỏ qua việc tạo giảng viên tự động.")
        return []

    inserted_ids: List[int] = []

    for gv in pending_gv:
        # Kiểm tra tồn tại trong DB theo mã, email hoặc SĐT
        cursor.execute(
            """
            SELECT id FROM giang_vien
            WHERE ma_giang_vien = %s OR email = %s OR sdt = %s
            LIMIT 1
            """,
            (gv["ma_giang_vien"], gv["email"], gv["sdt"]),
        )
        existed = cursor.fetchone()
        if existed:
            print(
                f"  • Bỏ qua {gv['ma_giang_vien']} vì giảng viên đã tồn tại (id={existed['id']})."
            )
            continue

        try:
            cursor.execute(
                """
                INSERT INTO giang_vien (ma_giang_vien, ho_ten, ngay_sinh, email, sdt, gioi_tinh, dia_chi)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    gv["ma_giang_vien"],
                    gv["ho_ten"],
                    gv["ngay_sinh"].strftime("%Y-%m-%d"),
                    gv["email"],
                    gv["sdt"],
                    gv["gioi_tinh"],
                    gv["dia_chi"],
                ),
            )
            gv_id = cursor.lastrowid
            inserted_ids.append(gv_id)
            print(
                f"  ✓ Đã tạo giảng viên: {gv['ma_giang_vien']} - {gv['ho_ten']} (ID={gv_id})"
            )
        except Error as e:
            print(f"  ✗ Lỗi khi tạo giảng viên {gv['ma_giang_vien']}: {e}")

    if inserted_ids:
        conn.commit()

    return inserted_ids


def _assign_mon_hoc_to_giang_vien(
    cursor, conn, giang_vien_ids: List[int], mon_hoc_ids: List[int], min_mon_per_gv: int = 7
) -> None:
    """
    Phân công danh sách môn học cho danh sách giảng viên, đảm bảo mỗi giảng viên có ít nhất min_mon_per_gv môn.
    Chỉ thêm mới vào bảng giang_vien_mon_hoc, bỏ qua lỗi trùng lặp (nếu đã có).
    """
    if not giang_vien_ids or not mon_hoc_ids:
        print("  → Không có dữ liệu để phân công giảng viên.")
        return

    print(f"\nĐANG PHÂN CÔNG MÔN HỌC CHO GIẢNG VIÊN (mỗi giảng viên ít nhất {min_mon_per_gv} môn)...")
    gv_count = len(giang_vien_ids)
    
    # Lấy danh sách phân công hiện có để tránh trùng lặp
    cursor.execute("SELECT giang_vien_id, mon_hoc_id FROM giang_vien_mon_hoc")
    existing_assignments = cursor.fetchall()
    existing_set = {(row["giang_vien_id"], row["mon_hoc_id"]) for row in existing_assignments}
    
    # Đếm số môn hiện có của mỗi giảng viên
    gv_mon_count: Dict[int, int] = defaultdict(int)
    for gv_id, mon_id in existing_set:
        gv_mon_count[gv_id] += 1

    # Chuẩn bị danh sách phân công mới
    assignments: List[Tuple[int, int]] = []
    assignments_set = set()  # Dùng để kiểm tra nhanh trùng lặp
    
    # Bước 1: Phân công đảm bảo mỗi giảng viên có ít nhất min_mon_per_gv môn
    mon_idx = 0
    for gv_idx, gv_id in enumerate(giang_vien_ids):
        current_count = gv_mon_count[gv_id]
        needed = max(0, min_mon_per_gv - current_count)
        
        attempts = 0
        max_attempts = len(mon_hoc_ids) * 2  # Giới hạn số lần thử để tránh vòng lặp vô hạn
        
        while needed > 0 and attempts < max_attempts:
            if mon_idx >= len(mon_hoc_ids):
                # Nếu hết môn, quay lại đầu danh sách
                mon_idx = 0
            
            mon_id = mon_hoc_ids[mon_idx]
            assignment_key = (gv_id, mon_id)
            
            # Chỉ thêm nếu chưa tồn tại trong DB và chưa được phân công trong lần này
            if assignment_key not in existing_set and assignment_key not in assignments_set:
                assignments.append((gv_id, mon_id))
                assignments_set.add(assignment_key)
                needed -= 1
            
            mon_idx += 1
            attempts += 1
    
    # Bước 2: Phân công các môn còn lại theo vòng tròn (đảm bảo phân bổ đều)
    for idx, mon_id in enumerate(mon_hoc_ids):
        gv_id = giang_vien_ids[idx % gv_count]
        assignment_key = (gv_id, mon_id)
        
        # Chỉ thêm nếu chưa tồn tại trong DB và chưa được phân công trong lần này
        if assignment_key not in existing_set and assignment_key not in assignments_set:
            assignments.append((gv_id, mon_id))
            assignments_set.add(assignment_key)

    if not assignments:
        print("  → Không có phân công môn học mới nào cần thực hiện (tất cả đã được phân công).")
        # Kiểm tra và báo cáo số môn của mỗi giảng viên
        print("\nThống kê số môn của mỗi giảng viên:")
        for gv_id in giang_vien_ids:
            count = gv_mon_count[gv_id]
            status = "✓" if count >= min_mon_per_gv else "✗"
            print(f"  {status} Giảng viên ID {gv_id}: {count} môn")
        return

    print(f"\nSẽ thêm {len(assignments)} phân công mới.")
    print("(Danh sách chi tiết quá dài, chỉ hiển thị thống kê)")

    confirm = (
        input("  → Xác nhận thêm các phân công này vào DB? (y/n): ")
        .strip()
        .lower()
    )
    if confirm != "y":
        print("  → Bỏ qua bước phân công giảng viên.")
        return

    total_inserted = 0

    for gv_id, mon_id in assignments:
        # Kiểm tra tồn tại trước khi insert (kiểm tra lại để chắc chắn)
        cursor.execute(
            """
            SELECT 1 FROM giang_vien_mon_hoc
            WHERE giang_vien_id = %s AND mon_hoc_id = %s
            LIMIT 1
            """,
            (gv_id, mon_id),
        )
        existed = cursor.fetchone()
        if existed:
            continue

        try:
            cursor.execute(
                """
                INSERT INTO giang_vien_mon_hoc (giang_vien_id, mon_hoc_id)
                VALUES (%s, %s)
                """,
                (gv_id, mon_id),
            )
            total_inserted += 1
            gv_mon_count[gv_id] += 1
        except Error as e:
            # Có thể đã tồn tại phân công (unique constraint), bỏ qua nếu là lỗi trùng
            if "Duplicate entry" not in str(e):
                print(
                    f"  ✗ Lỗi khi phân công môn học id={mon_id} cho giảng viên id={gv_id}: {e}"
                )

    if total_inserted:
        conn.commit()
    
    print(f"  → Đã phân công thêm {total_inserted} dòng vào bảng giang_vien_mon_hoc.")
    
    # Báo cáo số môn của mỗi giảng viên sau khi phân công
    print("\nThống kê số môn của mỗi giảng viên sau khi phân công:")
    for gv_id in giang_vien_ids:
        count = gv_mon_count[gv_id]
        status = "✓" if count >= min_mon_per_gv else "✗"
        print(f"  {status} Giảng viên ID {gv_id}: {count} môn")


def auto_create_giang_vien_and_assign_for_ctdt(
    cursor,
    conn,
    full_course_sets: Dict[str, List[str]],
    mon_hoc_by_ma: Dict[str, Dict],
) -> None:
    """
    Sau khi tạo CTĐT, tự động:
      - Bổ sung giảng viên để đảm bảo có ít nhất 80 giảng viên.
      - Phân công giảng viên dạy các môn thuộc CTĐT vừa tạo, mỗi giảng viên ít nhất 7 môn.
    """
    print("\n" + "=" * 70)
    print("TẠO GIẢNG VIÊN VÀ PHÂN CÔNG MÔN HỌC CHO CÁC CTĐT VỪA TẠO")
    print("=" * 70)

    # 1. Lấy danh sách giảng viên hiện có
    cursor.execute("SELECT id FROM giang_vien")
    gv_existing = cursor.fetchall()
    gia_tri_hien_co = [row["id"] for row in gv_existing]
    
    SO_LUONG_GIANG_VIEN_TOI_THIEU = 80

    if len(gia_tri_hien_co) >= SO_LUONG_GIANG_VIEN_TOI_THIEU:
        print(f"  - Đã có {len(gia_tri_hien_co)} giảng viên trong hệ thống (đủ yêu cầu tối thiểu {SO_LUONG_GIANG_VIEN_TOI_THIEU}).")
        giang_vien_ids = gia_tri_hien_co
    else:
        # Tính số lượng giảng viên cần tạo thêm
        so_luong_can_tao = SO_LUONG_GIANG_VIEN_TOI_THIEU - len(gia_tri_hien_co)
        print(
            f"  - Hiện có {len(gia_tri_hien_co)} giảng viên. Cần tạo thêm {so_luong_can_tao} giảng viên "
            f"để đạt tối thiểu {SO_LUONG_GIANG_VIEN_TOI_THIEU} giảng viên."
        )
        new_gv_ids = _auto_create_giang_vien(cursor, conn, so_luong_can_tao)
        giang_vien_ids = gia_tri_hien_co + new_gv_ids
        
        # Lấy lại danh sách đầy đủ sau khi tạo mới
        cursor.execute("SELECT id FROM giang_vien")
        gv_all = cursor.fetchall()
        giang_vien_ids = [row["id"] for row in gv_all]
        print(f"  - Tổng số giảng viên sau khi tạo: {len(giang_vien_ids)}")

    if not giang_vien_ids:
        print("  ✗ Không có giảng viên nào để phân công, bỏ qua bước phân công.")
        return

    # 2. Lấy danh sách ID môn học thuộc các CTĐT vừa tạo (bao gồm tất cả: đại cương, tự chọn, chuyên ngành)
    mon_ids_set = set()
    for codes in full_course_sets.values():
        for ma in codes:
            mh = mon_hoc_by_ma.get(ma)
            if mh and "id" in mh:
                mon_ids_set.add(mh["id"])

    mon_ids_sorted = sorted(mon_ids_set)
    print(f"  - Số môn học thuộc các CTĐT (bao gồm đại cương, tự chọn, chuyên ngành): {len(mon_ids_sorted)}")

    if not mon_ids_sorted:
        print("  → Không tìm thấy môn học nào để phân công, kết thúc.")
        return

    # 3. Phân công môn học cho giảng viên, đảm bảo mỗi giảng viên có ít nhất 7 môn
    _assign_mon_hoc_to_giang_vien(cursor, conn, giang_vien_ids, mon_ids_sorted, min_mon_per_gv=7)


# ====================== MAIN ======================

def main():
    print("=" * 70)
    print("TẠO CHƯƠNG TRÌNH ĐÀO TẠO CHO 3 NGÀNH (KTPM / ATTT / AI)")
    print("=" * 70)

    # 1. Kết nối DB
    conn = connect_db()
    if not conn:
        return

    cursor = conn.cursor(dictionary=True)

    try:
        # 2. Đọc danh sách môn học từ file JSON và đồng bộ vào DB
        json_courses = load_courses_from_json(JSON_MON_HOC_PATH)
        mon_hoc_by_ma = sync_mon_hoc_from_json(cursor, conn, json_courses)

        # 3. Chọn ngành & niên khóa tương ứng cho 3 CTĐT
        mapping_nganh = chon_nganh_va_nien_khoa(cursor)

        # 4. Xây dựng danh sách môn học cho từng ngành (chưa bù đủ 147 tín)
        course_sets = build_course_sets(mon_hoc_by_ma)

        # 5. Tính tổng tín chỉ từng ngành, tạo thêm môn mới nếu cần để đủ 147
        full_course_sets: Dict[str, List[str]] = {}
        for major_code, codes in course_sets.items():
            tong_tc = sum(mon_hoc_by_ma[c]["so_tin_chi"] for c in codes)
            print(f"\nNgành {major_code}: hiện có {tong_tc} tín chỉ.")
            if tong_tc < SO_TIN_CHI_MUC_TIEU:
                need = SO_TIN_CHI_MUC_TIEU - tong_tc
                new_codes = tao_mon_moi_cho_nganh(cursor, conn, major_code, mon_hoc_by_ma, need)
                codes = list(codes) + new_codes
                tong_tc = sum(mon_hoc_by_ma[c]["so_tin_chi"] for c in codes)
            else:
                print(f"  → Đã đủ hoặc vượt {SO_TIN_CHI_MUC_TIEU} tín chỉ, không cần bù.")

            print(f"  → Sau khi bù (nếu có), tổng tín chỉ ngành {major_code}: {tong_tc}")
            full_course_sets[major_code] = sorted(set(codes))

        # 6. Xác định môn chung giữa nhiều ngành (để ghi chú trong chi tiết CTĐT)
        shared_counter: Dict[str, int] = defaultdict(int)
        for major_code, codes in full_course_sets.items():
            for c in codes:
                shared_counter[c] += 1

        # 7. Xây dựng kế hoạch CTĐT (gán học kỳ 1→8) cho từng ngành
        plan_by_major: Dict[str, List[Dict]] = {}
        tong_tc_theo_hk_by_major: Dict[str, Dict[int, int]] = {}

        for major_code, codes in full_course_sets.items():
            print("\n" + "=" * 70)
            print(f"XÂY DỰNG CTĐT CHO NGÀNH {major_code}")
            print("=" * 70)
            plan, tong_theo_hk = build_ctdt_plan_for_major(major_code, codes, mon_hoc_by_ma)
            plan_by_major[major_code] = plan
            tong_tc_theo_hk_by_major[major_code] = tong_theo_hk

        # 8. Tạo bản ghi CTĐT & chi tiết & áp dụng
        ctdt_id_by_major: Dict[str, int] = {}
        for major_code in MAJORS.keys():
            info = mapping_nganh[major_code]
            ct_id = create_chuong_trinh(cursor, conn, major_code, info)
            ctdt_id_by_major[major_code] = ct_id

            create_chi_tiet_ctdt(cursor, conn, ct_id, plan_by_major[major_code], shared_counter)
            create_ap_dung_ctdt(cursor, conn, ct_id, info)

        # 9. Sau khi đã tạo CTĐT cho 3 ngành, tự động tạo giảng viên (nếu cần)
        #    và phân công giảng viên cho tất cả các môn nằm trong CTĐT vừa tạo.
        auto_create_giang_vien_and_assign_for_ctdt(
            cursor,
            conn,
            full_course_sets,
            mon_hoc_by_ma,
        )

        print("\n" + "=" * 70)
        print("HOÀN TẤT TẠO CHƯƠNG TRÌNH ĐÀO TẠO")
        print("=" * 70)
        for major_code in MAJORS.keys():
            print(
                f"  ✓ Ngành {major_code}: CTĐT ID = {ctdt_id_by_major[major_code]}, "
                f"{len(plan_by_major[major_code])} chi tiết môn học"
            )
        print("=" * 70)

    except Exception as e:
        print(f"\n✗ Lỗi: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()
        print("\n🔌 Đã đóng kết nối MySQL\n")


if __name__ == "__main__":
    main()
