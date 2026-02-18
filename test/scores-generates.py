import os
import random
from collections import defaultdict
from typing import Dict, List, Tuple, Optional

import mysql.connector
from mysql.connector import Error

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


# Kết nối database
def connect_db():
    """Kết nối đến MySQL database, ưu tiên cấu hình từ file .env nằm ngoài thư mục test một cấp"""
    # Xác định đường dẫn tới file .env (thư mục cha của thư mục test)
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(base_dir, ".env")

    # Đọc biến môi trường từ file .env (nếu có)
    file_env = _load_env_file(env_path)

    # Ưu tiên: file .env -> biến môi trường hệ thống -> giá trị mặc định
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

def tinh_tbchp(diem_qua_trinh: float, diem_thanh_phan: float, diem_thi: float) -> float:
    """Tính điểm TBCHP (Trung bình cộng học phần)"""
    tbchp = diem_qua_trinh * 0.1 + diem_thanh_phan * 0.3 + diem_thi * 0.6
    return round(tbchp, 2)

def diem_he10_to_he4(diem: float) -> float:
    """Quy đổi điểm hệ 10 sang hệ 4"""
    if diem >= 9.0:
        return 4.0
    elif diem >= 8.5:
        return 3.7
    elif diem >= 8.0:
        return 3.5
    elif diem >= 7.0:
        return 3.0
    elif diem >= 6.5:
        return 2.5
    elif diem >= 5.5:
        return 2.0
    elif diem >= 5.0:
        return 1.5
    elif diem >= 4.0:
        return 1.0
    else:
        return 0.0

def tinh_gpa(ket_qua_theo_mon: Dict[int, float]) -> Optional[float]:
    """Tính GPA từ điểm cao nhất của mỗi môn học đã khóa điểm"""
    if not ket_qua_theo_mon:
        return None
    
    tong_diem_he4 = 0
    so_mon = 0
    
    for mon_hoc_id, diem_tbchp_cao_nhat in ket_qua_theo_mon.items():
        if diem_tbchp_cao_nhat is not None:
            diem_he4 = diem_he10_to_he4(diem_tbchp_cao_nhat)
            tong_diem_he4 += diem_he4
            so_mon += 1
    
    if so_mon == 0:
        return None
    
    return round(tong_diem_he4 / so_mon, 2)

def xep_loai_hoc_luc(gpa: Optional[float]) -> str:
    """Xếp loại học lực dựa trên GPA"""
    if gpa is None:
        return "KHONG_XET"
    if gpa >= 3.60:
        return "XUAT_SAC"
    elif gpa >= 3.20:
        return "GIOI"
    elif gpa >= 2.50:
        return "KHA"
    elif gpa >= 2.00:
        return "TRUNG_BINH"
    else:
        return "KHONG_DAT"

def doc_du_lieu_tu_database(cursor):
    """Đọc tất cả dữ liệu từ bảng ket_qua_hoc_tap và sinh_vien_lop_hoc_phan"""
    print("\nĐang đọc dữ liệu từ database...")
    
    # Đọc kết quả học tập
    cursor.execute("""
        SELECT 
            kq.id,
            kq.sinh_vien_id,
            kq.lop_hoc_phan_id,
            kq.diem_qua_trinh,
            kq.diem_thanh_phan,
            kq.diem_thi,
            lhp.mon_hoc_id,
            lhp.khoa_diem
        FROM ket_qua_hoc_tap kq
        INNER JOIN lop_hoc_phan lhp ON kq.lop_hoc_phan_id = lhp.id
    """)
    ket_qua_hoc_tap = cursor.fetchall()
    
    # Đọc sinh viên lớp học phần (nếu cần)
    cursor.execute("""
        SELECT 
            svlhp.id,
            svlhp.sinh_vien_id,
            svlhp.lop_hoc_phan_id,
            svlhp.loai_tham_gia,
            svlhp.ngay_dang_ky
        FROM sinh_vien_lop_hoc_phan svlhp
    """)
    sinh_vien_lop_hoc_phan = cursor.fetchall()
    
    print(f"  - Số bản ghi kết quả học tập: {len(ket_qua_hoc_tap)}")
    print(f"  - Số bản ghi sinh viên lớp học phần: {len(sinh_vien_lop_hoc_phan)}")
    
    return ket_qua_hoc_tap, sinh_vien_lop_hoc_phan


def tao_ban_ghi_kqht_cho_sv_chua_co(
    cursor,
    conn,
    sv_ids_chua_co_kqht,
    sinh_vien_lop_hoc_phan,
):
    """
    Tạo các bản ghi ket_qua_hoc_tap cho những sinh viên
    đã đăng ký lớp học phần nhưng CHƯA có bất kỳ kết quả học tập nào.
    """
    if not sv_ids_chua_co_kqht:
        return 0

    sv_ids_set = set(sv_ids_chua_co_kqht)

    insert_sql = """
        INSERT INTO ket_qua_hoc_tap
        (diem_qua_trinh, diem_thanh_phan, diem_thi, sinh_vien_id, lop_hoc_phan_id)
        VALUES (%s, %s, %s, %s, %s)
    """

    so_ban_ghi_moi = 0

    for row in sinh_vien_lop_hoc_phan:
        sv_id = row['sinh_vien_id']

        # Chỉ xử lý các sinh viên nằm trong danh sách chưa có KQHT
        if sv_id not in sv_ids_set:
            continue

        lhp_id = row['lop_hoc_phan_id']

        try:
            # Tạo bản ghi KQHT "rỗng" (điểm = 0), sẽ được cập nhật lại sau
            cursor.execute(
                insert_sql,
                (0.0, 0.0, 0.0, sv_id, lhp_id),
            )
            so_ban_ghi_moi += 1
        except Error as e:
            print(f"  ✗ Lỗi khi tạo KQHT cho SV {sv_id}, LHP {lhp_id}: {e}")

    if so_ban_ghi_moi:
        conn.commit()

    return so_ban_ghi_moi

def tinh_diem_cao_nhat_theo_mon(ket_qua_hoc_tap: List[Dict]) -> Dict[int, Dict[int, float]]:
    """Tính điểm TBCHP cao nhất của mỗi môn học cho mỗi sinh viên (chỉ tính các lớp đã khóa điểm)"""
    # Cấu trúc: {sinh_vien_id: {mon_hoc_id: diem_tbchp_cao_nhat}}
    diem_cao_nhat = defaultdict(lambda: defaultdict(lambda: None))
    
    for kq in ket_qua_hoc_tap:
        sinh_vien_id = kq['sinh_vien_id']
        mon_hoc_id = kq['mon_hoc_id']
        khoa_diem = kq['khoa_diem']
        
        # Chỉ tính các lớp đã khóa điểm
        if not khoa_diem:
            continue
        
        # Tính TBCHP
        tbchp = tinh_tbchp(
            float(kq['diem_qua_trinh']),
            float(kq['diem_thanh_phan']),
            float(kq['diem_thi'])
        )
        
        # Cập nhật điểm cao nhất
        if diem_cao_nhat[sinh_vien_id][mon_hoc_id] is None or tbchp > diem_cao_nhat[sinh_vien_id][mon_hoc_id]:
            diem_cao_nhat[sinh_vien_id][mon_hoc_id] = tbchp
    
    return diem_cao_nhat

def tao_diem_de_dat_tbchp(target_tbchp: float) -> Tuple[float, float, float]:
    """Tạo điểm quá trình, thành phần, thi để đạt TBCHP mong muốn"""
    # TBCHP = dqt * 0.1 + dtp * 0.3 + dt * 0.6
    # Để đảm bảo chính xác, ta sẽ tạo điểm thi trước (chiếm 60%)
    # Sau đó điều chỉnh điểm thành phần và quá trình
    
    # Tạo điểm thi trong khoảng hợp lý dựa trên target_tbchp
    if target_tbchp >= 9.0:
        diem_thi = random.uniform(8.5, 10.0)
    elif target_tbchp >= 8.0:
        diem_thi = random.uniform(7.5, 9.5)
    elif target_tbchp >= 7.0:
        diem_thi = random.uniform(6.5, 8.5)
    elif target_tbchp >= 6.0:
        diem_thi = random.uniform(5.5, 7.5)
    elif target_tbchp >= 5.0:
        diem_thi = random.uniform(4.5, 6.5)
    elif target_tbchp >= 4.0:
        diem_thi = random.uniform(3.5, 5.5)
    else:
        diem_thi = random.uniform(0, 4.5)
    
    diem_thi = round(diem_thi, 1)
    
    # Tính phần còn lại cần cho điểm thành phần và quá trình
    phan_con_lai = target_tbchp - (diem_thi * 0.6)
    
    # Phân bố cho điểm thành phần (30%) và quá trình (10%)
    if phan_con_lai > 0:
        # Điểm thành phần thường cao hơn điểm thi một chút
        diem_thanh_phan = min(10.0, max(0.0, phan_con_lai / 0.3 + random.uniform(-0.5, 1.0)))
        diem_qua_trinh = min(10.0, max(0.0, (phan_con_lai - diem_thanh_phan * 0.3) / 0.1))
    else:
        diem_thanh_phan = random.uniform(0, min(10.0, target_tbchp * 2))
        diem_qua_trinh = random.uniform(0, min(10.0, target_tbchp * 2))
    
    diem_thanh_phan = round(diem_thanh_phan, 1)
    diem_qua_trinh = round(diem_qua_trinh, 1)
    
    # Kiểm tra và điều chỉnh để đảm bảo TBCHP chính xác
    tbchp_tinh_lai = tinh_tbchp(diem_qua_trinh, diem_thanh_phan, diem_thi)
    sai_so = abs(tbchp_tinh_lai - target_tbchp)
    
    # Nếu sai số quá lớn (> 0.15), điều chỉnh lại điểm thi
    if sai_so > 0.15:
        # Tính lại điểm thi để đạt target_tbchp chính xác hơn
        diem_thi_can = (target_tbchp - diem_qua_trinh * 0.1 - diem_thanh_phan * 0.3) / 0.6
        diem_thi = max(0.0, min(10.0, round(diem_thi_can, 1)))
        tbchp_tinh_lai = tinh_tbchp(diem_qua_trinh, diem_thanh_phan, diem_thi)
        
        # Nếu vẫn còn sai số, điều chỉnh điểm thành phần
        if abs(tbchp_tinh_lai - target_tbchp) > 0.1:
            diem_thanh_phan_can = (target_tbchp - diem_qua_trinh * 0.1 - diem_thi * 0.6) / 0.3
            diem_thanh_phan = max(0.0, min(10.0, round(diem_thanh_phan_can, 1)))
            tbchp_tinh_lai = tinh_tbchp(diem_qua_trinh, diem_thanh_phan, diem_thi)
    
    return diem_qua_trinh, diem_thanh_phan, diem_thi

def nhap_thong_tin_phan_bo():
    """Hỏi người dùng về phân bố sinh viên"""
    print("\n" + "=" * 70)
    print("NHẬP THÔNG TIN PHÂN BỐ SINH VIÊN")
    print("=" * 70)
    
    # % sinh viên trượt môn (ít nhất 1 môn có TBCHP cao nhất < 4.0)
    while True:
        try:
            pct_truot_mon = float(input("\nNhập % sinh viên trượt môn (ít nhất 1 môn có TBCHP < 4.0): "))
            if pct_truot_mon < 0 or pct_truot_mon > 100:
                print("Phần trăm phải từ 0 đến 100!")
                continue
            break
        except ValueError:
            print("Vui lòng nhập số hợp lệ!")
    
    # % sinh viên trượt tốt nghiệp (tất cả môn >= 4.0 nhưng GPA < 2.0)
    while True:
        try:
            pct_truot_tot_nghiep = float(input("\nNhập % sinh viên trượt tốt nghiệp (tất cả môn >= 4.0 nhưng GPA < 2.0): "))
            if pct_truot_tot_nghiep < 0 or pct_truot_tot_nghiep > 100:
                print("Phần trăm phải từ 0 đến 100!")
                continue
            break
        except ValueError:
            print("Vui lòng nhập số hợp lệ!")
    
    # % sinh viên xếp loại Trung bình (GPA từ 2.0 đến 2.5)
    while True:
        try:
            pct_trung_binh = float(input("\nNhập % sinh viên xếp loại Trung bình (GPA từ 2.0 đến 2.5): "))
            if pct_trung_binh < 0 or pct_trung_binh > 100:
                print("Phần trăm phải từ 0 đến 100!")
                continue
            break
        except ValueError:
            print("Vui lòng nhập số hợp lệ!")
    
    # % sinh viên xếp loại Khá (GPA từ 2.5 đến 3.2)
    while True:
        try:
            pct_kha = float(input("\nNhập % sinh viên xếp loại Khá (GPA từ 2.5 đến 3.2): "))
            if pct_kha < 0 or pct_kha > 100:
                print("Phần trăm phải từ 0 đến 100!")
                continue
            break
        except ValueError:
            print("Vui lòng nhập số hợp lệ!")
    
    # % sinh viên xếp loại Giỏi (GPA từ 3.2 đến 3.6)
    while True:
        try:
            pct_gioi = float(input("\nNhập % sinh viên xếp loại Giỏi (GPA từ 3.2 đến 3.6): "))
            if pct_gioi < 0 or pct_gioi > 100:
                print("Phần trăm phải từ 0 đến 100!")
                continue
            break
        except ValueError:
            print("Vui lòng nhập số hợp lệ!")
    
    # % sinh viên xếp loại Xuất sắc (GPA >= 3.6)
    while True:
        try:
            pct_xuat_sac = float(input("\nNhập % sinh viên xếp loại Xuất sắc (GPA >= 3.6): "))
            if pct_xuat_sac < 0 or pct_xuat_sac > 100:
                print("Phần trăm phải từ 0 đến 100!")
                continue
            break
        except ValueError:
            print("Vui lòng nhập số hợp lệ!")
    
    # Kiểm tra tổng phần trăm
    tong_pct = pct_truot_mon + pct_truot_tot_nghiep + pct_trung_binh + pct_kha + pct_gioi + pct_xuat_sac
    if tong_pct > 100:
        print(f"\n⚠ Cảnh báo: Tổng phần trăm = {tong_pct}% > 100%")
        print("Sẽ điều chỉnh tự động để tổng = 100%")
        pct_truot_mon = pct_truot_mon * 100 / tong_pct
        pct_truot_tot_nghiep = pct_truot_tot_nghiep * 100 / tong_pct
        pct_trung_binh = pct_trung_binh * 100 / tong_pct
        pct_kha = pct_kha * 100 / tong_pct
        pct_gioi = pct_gioi * 100 / tong_pct
        pct_xuat_sac = pct_xuat_sac * 100 / tong_pct
    
    return {
        'pct_truot_mon': pct_truot_mon,
        'pct_truot_tot_nghiep': pct_truot_tot_nghiep,
        'pct_trung_binh': pct_trung_binh,
        'pct_kha': pct_kha,
        'pct_gioi': pct_gioi,
        'pct_xuat_sac': pct_xuat_sac
    }

def phan_loai_sinh_vien(
    ket_qua_hoc_tap: List[Dict],
    sinh_vien_lop_hoc_phan: List[Dict],
    cursor
) -> Dict[int, Dict]:
    """Phân loại sinh viên (dựa trên SV tham gia lớp học phần) và tính toán thông tin GPA"""
    print("\nĐang phân loại sinh viên...")
    
    # Tính điểm cao nhất theo môn cho mỗi sinh viên
    diem_cao_nhat = tinh_diem_cao_nhat_theo_mon(ket_qua_hoc_tap)
    
    # Lấy danh sách tất cả sinh viên dựa theo sinh_vien_lop_hoc_phan
    # (vì có thể SV đã tham gia LHP nhưng chưa phát sinh bản ghi ket_qua_hoc_tap)
    sv_ids_from_svlhp = {row['sinh_vien_id'] for row in (sinh_vien_lop_hoc_phan or [])}
    sv_ids_from_kqht = {row['sinh_vien_id'] for row in (ket_qua_hoc_tap or [])}

    all_sinh_vien_ids = sorted(sv_ids_from_svlhp | sv_ids_from_kqht)

    # Fallback nếu cả 2 danh sách đều rỗng (hiếm)
    if not all_sinh_vien_ids:
        cursor.execute("SELECT DISTINCT sinh_vien_id FROM sinh_vien_lop_hoc_phan")
        all_sinh_vien_ids = [row['sinh_vien_id'] for row in cursor.fetchall()]
    
    sinh_vien_info = {}
    
    for sv_id in all_sinh_vien_ids:
        ket_qua_theo_mon = diem_cao_nhat.get(sv_id, {})
        gpa = tinh_gpa(ket_qua_theo_mon)
        xep_loai = xep_loai_hoc_luc(gpa)
        
        # Kiểm tra có môn nào trượt không (TBCHP < 4.0)
        co_mon_truot = False
        for mon_id, diem in ket_qua_theo_mon.items():
            if diem is not None and diem < 4.0:
                co_mon_truot = True
                break
        
        sinh_vien_info[sv_id] = {
            'gpa': gpa,
            'xep_loai': xep_loai,
            'co_mon_truot': co_mon_truot,
            'co_ket_qua_hoc_tap': sv_id in sv_ids_from_kqht,
            'ket_qua_theo_mon': ket_qua_theo_mon
        }

    so_sv = len(sinh_vien_info)
    so_sv_co_kqht = sum(1 for _sv_id, info in sinh_vien_info.items() if info.get('co_ket_qua_hoc_tap'))
    so_sv_chua_co_kqht = so_sv - so_sv_co_kqht

    print(f"  - Tổng số sinh viên (theo SVLHP ∪ KQHT): {so_sv}")
    print(f"  - SV đã có kết quả học tập: {so_sv_co_kqht}")
    print(f"  - SV chưa có kết quả học tập: {so_sv_chua_co_kqht}")
    return sinh_vien_info

def tinh_tbchp_tu_gpa(target_gpa: float) -> float:
    """Tính điểm TBCHP trung bình cần thiết để đạt GPA mục tiêu"""
    # Dựa vào bảng quy đổi điểm hệ 10 sang hệ 4
    # Ta cần tìm điểm hệ 10 sao cho điểm hệ 4 trung bình = target_gpa
    
    # Bảng quy đổi ngược (từ GPA sang điểm hệ 10)
    if target_gpa >= 3.85:  # 3.7-4.0 -> 8.5-10
        return random.uniform(9.0, 10.0)
    elif target_gpa >= 3.6:  # 3.5-3.7 -> 8.0-8.5
        return random.uniform(8.5, 9.0)
    elif target_gpa >= 3.25:  # 3.0-3.5 -> 7.0-8.0
        return random.uniform(8.0, 8.5)
    elif target_gpa >= 3.0:  # 2.5-3.0 -> 6.5-7.0
        return random.uniform(7.0, 8.0)
    elif target_gpa >= 2.25:  # 2.0-2.5 -> 5.5-6.5
        return random.uniform(6.5, 7.0)
    elif target_gpa >= 1.75:  # 1.5-2.0 -> 5.0-5.5
        return random.uniform(5.5, 6.5)
    elif target_gpa >= 1.25:  # 1.0-1.5 -> 4.0-5.0
        return random.uniform(5.0, 5.5)
    else:  # 0.0-1.0 -> 0.0-4.0
        return random.uniform(4.0, 5.0)

def tao_diem_theo_yeu_cau(
    ket_qua_hoc_tap: List[Dict],
    sinh_vien_info: Dict[int, Dict],
    sinh_vien_lop_hoc_phan: List[Dict],
    phan_bo: Dict,
    cursor
) -> List[Dict]:
    """Tạo điểm số theo yêu cầu phân bố"""
    print("\nĐang tạo điểm số theo yêu cầu...")
    
    # Đếm số sinh viên có bản ghi ket_qua_hoc_tap để cập nhật
    tong_sv = sum(1 for _sv_id, info in sinh_vien_info.items() if info.get('co_ket_qua_hoc_tap'))
    so_sv_khong_co_kqht = len(sinh_vien_info) - tong_sv
    if so_sv_khong_co_kqht > 0:
        print(f"  - Còn {so_sv_khong_co_kqht} sinh viên chưa có bản ghi kết quả học tập, sẽ không được đưa vào phân bố điểm.")
    
    # Tính số lượng sinh viên cần cho mỗi loại
    so_sv_truot_mon = int(tong_sv * phan_bo['pct_truot_mon'] / 100)
    so_sv_truot_tot_nghiep = int(tong_sv * phan_bo['pct_truot_tot_nghiep'] / 100)
    so_sv_trung_binh = int(tong_sv * phan_bo['pct_trung_binh'] / 100)
    so_sv_kha = int(tong_sv * phan_bo['pct_kha'] / 100)
    so_sv_gioi = int(tong_sv * phan_bo['pct_gioi'] / 100)
    so_sv_xuat_sac = int(tong_sv * phan_bo['pct_xuat_sac'] / 100)
    
    print(f"  - Số SV trượt môn cần: {so_sv_truot_mon}")
    print(f"  - Số SV trượt tốt nghiệp cần: {so_sv_truot_tot_nghiep}")
    print(f"  - Số SV Trung bình cần: {so_sv_trung_binh}")
    print(f"  - Số SV Khá cần: {so_sv_kha}")
    print(f"  - Số SV Giỏi cần: {so_sv_gioi}")
    print(f"  - Số SV Xuất sắc cần: {so_sv_xuat_sac}")
    
    # Lấy danh sách môn học của mỗi sinh viên
    # Lưu ý: Cần cập nhật điểm cho cả lớp chưa khóa điểm để có thể khóa điểm sau
    ket_qua_by_sv = defaultdict(list)
    for kq in ket_qua_hoc_tap:
        ket_qua_by_sv[kq['sinh_vien_id']].append(kq)
    
    # Lấy danh sách môn học đã khóa điểm để tính GPA
    ket_qua_da_khoa_by_sv = defaultdict(list)
    for kq in ket_qua_hoc_tap:
        if kq['khoa_diem']:
            ket_qua_da_khoa_by_sv[kq['sinh_vien_id']].append(kq)
    
    # Tạo danh sách sinh viên cần cập nhật điểm
    danh_sach_cap_nhat = []
    sv_da_xu_ly = set()
    
    # 1. Xử lý sinh viên trượt môn (ít nhất 1 môn có TBCHP < 4.0)
    sv_truot_mon_da_xu_ly = 0
    sv_list = [(sv_id, info) for sv_id, info in sinh_vien_info.items() if info.get('co_ket_qua_hoc_tap')]
    random.shuffle(sv_list)
    
    for sv_id, info in sv_list:
        if sv_truot_mon_da_xu_ly >= so_sv_truot_mon:
            break
        
        if sv_id in sv_da_xu_ly:
            continue
        
        # Lấy danh sách môn học của sinh viên
        ket_qua_sv = ket_qua_by_sv.get(sv_id, [])
        
        if not ket_qua_sv:
            continue
        
        # Chọn một môn học ngẫu nhiên và đặt điểm < 4.0
        kq_chon = random.choice(ket_qua_sv)
        target_tbchp = random.uniform(0.0, 3.9)
        
        diem_qt, diem_tp, diem_thi = tao_diem_de_dat_tbchp(target_tbchp)
        
        danh_sach_cap_nhat.append({
            'id': kq_chon['id'],
            'diem_qua_trinh': diem_qt,
            'diem_thanh_phan': diem_tp,
            'diem_thi': diem_thi
        })
        
        sv_da_xu_ly.add(sv_id)
        sv_truot_mon_da_xu_ly += 1
    
    # 2. Xử lý các loại sinh viên còn lại dựa trên GPA
    sv_chua_xu_ly = [
        (sv_id, info) for sv_id, info in sv_list
        if sv_id not in sv_da_xu_ly
    ]
    random.shuffle(sv_chua_xu_ly)
    
    # Phân bố sinh viên theo từng loại
    loai_sinh_vien = {
        'truot_tot_nghiep': (so_sv_truot_tot_nghiep, (1.0, 1.99)),  # GPA từ 1.0 đến 1.99
        'trung_binh': (so_sv_trung_binh, (2.0, 2.49)),  # GPA từ 2.0 đến 2.49
        'kha': (so_sv_kha, (2.5, 3.19)),  # GPA từ 2.5 đến 3.19
        'gioi': (so_sv_gioi, (3.2, 3.59)),  # GPA từ 3.2 đến 3.59
        'xuat_sac': (so_sv_xuat_sac, (3.6, 4.0))  # GPA từ 3.6 đến 4.0
    }
    
    idx_sv = 0
    for loai, (so_luong, (gpa_min, gpa_max)) in loai_sinh_vien.items():
        so_da_xu_ly = 0
        
        while so_da_xu_ly < so_luong and idx_sv < len(sv_chua_xu_ly):
            sv_id, info = sv_chua_xu_ly[idx_sv]
            idx_sv += 1
            
            if sv_id in sv_da_xu_ly:
                continue
            
            # Lấy danh sách môn học của sinh viên (tất cả, không chỉ đã khóa điểm)
            ket_qua_sv = ket_qua_by_sv.get(sv_id, [])
            
            if not ket_qua_sv:
                continue
            
            # Lấy danh sách môn học đã khóa điểm để tính GPA
            ket_qua_da_khoa = ket_qua_da_khoa_by_sv.get(sv_id, [])
            
            # Nếu không có lớp đã khóa điểm, sử dụng tất cả lớp
            if not ket_qua_da_khoa:
                ket_qua_da_khoa = ket_qua_sv
            
            # Tính GPA mục tiêu
            target_gpa = random.uniform(gpa_min, gpa_max)
            
            # Tính điểm TBCHP trung bình cần thiết
            if loai == 'truot_tot_nghiep':
                # Trượt tốt nghiệp: tất cả môn >= 4.0 nhưng GPA < 2.0
                # Điểm hệ 10 trung bình khoảng 4.0-5.5 để GPA < 2.0
                target_tbchp_avg = random.uniform(4.0, 5.5)
            else:
                # Các loại khác: tính từ GPA mục tiêu
                target_tbchp_avg = tinh_tbchp_tu_gpa(target_gpa)
            
            # Cập nhật điểm cho tất cả các môn học của sinh viên
            for kq in ket_qua_sv:
                if loai == 'truot_tot_nghiep':
                    # Đảm bảo tất cả môn >= 4.0
                    target_tbchp = random.uniform(4.0, target_tbchp_avg + 0.5)
                    target_tbchp = min(5.5, target_tbchp)  # Giới hạn để GPA < 2.0
                else:
                    # Các loại khác: điểm xung quanh mức trung bình
                    target_tbchp = target_tbchp_avg + random.uniform(-0.8, 0.8)
                    target_tbchp = max(4.0, min(10.0, target_tbchp))
                
                diem_qt, diem_tp, diem_thi = tao_diem_de_dat_tbchp(target_tbchp)
                
                danh_sach_cap_nhat.append({
                    'id': kq['id'],
                    'diem_qua_trinh': diem_qt,
                    'diem_thanh_phan': diem_tp,
                    'diem_thi': diem_thi
                })
            
            sv_da_xu_ly.add(sv_id)
            so_da_xu_ly += 1
    
    print(f"  - Tổng số bản ghi cần cập nhật: {len(danh_sach_cap_nhat)}")
    return danh_sach_cap_nhat

def cap_nhat_database(cursor, conn, danh_sach_cap_nhat: List[Dict], mode: str = 'update'):
    """Cập nhật hoặc insert điểm vào database"""
    print(f"\nĐang cập nhật database (mode: {mode})...")
    
    if mode == 'update':
        # Cập nhật các bản ghi hiện có
        for item in danh_sach_cap_nhat:
            try:
                cursor.execute("""
                    UPDATE ket_qua_hoc_tap
                    SET diem_qua_trinh = %s,
                        diem_thanh_phan = %s,
                        diem_thi = %s
                    WHERE id = %s
                """, (item['diem_qua_trinh'], item['diem_thanh_phan'], item['diem_thi'], item['id']))
            except Error as e:
                print(f"  ✗ Lỗi khi cập nhật bản ghi ID {item['id']}: {e}")
        
        conn.commit()
        print(f"  ✓ Đã cập nhật {len(danh_sach_cap_nhat)} bản ghi")
    else:
        # Insert mới (nếu cần)
        print("  ⚠ Mode insert chưa được triển khai")

def main():
    print("=" * 70)
    print("TẠO ĐIỂM SỐ THEO PHÂN BỐ HỌC LỰC")
    print("=" * 70)
    
    # Kết nối database
    conn = connect_db()
    if not conn:
        return
    
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Đọc dữ liệu từ database
        ket_qua_hoc_tap, sinh_vien_lop_hoc_phan = doc_du_lieu_tu_database(cursor)

        # Kiểm tra sinh viên đã đăng ký lớp học phần nhưng chưa có bất kỳ kết quả học tập nào
        sv_ids_from_svlhp = {row['sinh_vien_id'] for row in (sinh_vien_lop_hoc_phan or [])}
        sv_ids_from_kqht = {row['sinh_vien_id'] for row in (ket_qua_hoc_tap or [])}
        sv_ids_chua_co_kqht = sorted(sv_ids_from_svlhp - sv_ids_from_kqht)

        if sv_ids_chua_co_kqht:
            print("\n⚠ Phát hiện sinh viên thiếu bản ghi kết quả học tập:")
            print(f"  - Số sinh viên đã đăng ký LHP nhưng CHƯA có KQHT: {len(sv_ids_chua_co_kqht)}")
            xac_nhan_tao_kqht = input(
                "Bạn có muốn tự động tạo các bản ghi kết quả học tập cho các sinh viên này không? (yes/no): "
            ).strip().lower()

            if xac_nhan_tao_kqht == 'yes':
                so_ban_ghi_moi = tao_ban_ghi_kqht_cho_sv_chua_co(
                    cursor,
                    conn,
                    sv_ids_chua_co_kqht,
                    sinh_vien_lop_hoc_phan,
                )
                print(f"  ✓ Đã tạo {so_ban_ghi_moi} bản ghi kết quả học tập mới.")

                # Đọc lại dữ liệu sau khi insert
                ket_qua_hoc_tap, sinh_vien_lop_hoc_phan = doc_du_lieu_tu_database(cursor)
            else:
                print("  → Giữ nguyên, KHÔNG tạo thêm bản ghi kết quả học tập.")

        if not ket_qua_hoc_tap:
            print("\n⚠ Không có dữ liệu kết quả học tập trong database!")
            return

        # Phân loại sinh viên
        sinh_vien_info = phan_loai_sinh_vien(ket_qua_hoc_tap, sinh_vien_lop_hoc_phan, cursor)
        
        # Nhập thông tin phân bố
        phan_bo = nhap_thong_tin_phan_bo()
        
        # Hỏi mode cập nhật
        print("\n" + "=" * 70)
        while True:
            mode = input("Chọn mode: (1) Update - Ghi đè điểm hiện có, (2) Insert - Tạo mới: ").strip()
            if mode == '1':
                mode = 'update'
                break
            elif mode == '2':
                mode = 'insert'
                break
            else:
                print("Vui lòng chọn 1 hoặc 2!")
        
        # Tạo điểm số theo yêu cầu
        danh_sach_cap_nhat = tao_diem_theo_yeu_cau(
            ket_qua_hoc_tap,
            sinh_vien_info,
            sinh_vien_lop_hoc_phan,
            phan_bo,
            cursor,
        )
        
        # Xác nhận trước khi cập nhật
        print("\n" + "=" * 70)
        xac_nhan = input(f"Bạn có chắc chắn muốn cập nhật {len(danh_sach_cap_nhat)} bản ghi? (yes/no): ").strip().lower()
        
        if xac_nhan == 'yes':
            # Cập nhật database
            cap_nhat_database(cursor, conn, danh_sach_cap_nhat, mode)
            
            print("\n" + "=" * 70)
            print("HOÀN THÀNH!")
            print("=" * 70)
            print("Đã cập nhật điểm số thành công!")
        else:
            print("\nĐã hủy thao tác.")
    
    except Error as e:
        print(f"\n✗ Lỗi: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()
