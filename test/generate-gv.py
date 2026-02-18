import mysql.connector
from mysql.connector import Error
from datetime import datetime, timedelta
import random
import unidecode
from collections import defaultdict, Counter

# Dữ liệu mẫu họ tên
ho_dem = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Phan", "Vũ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý"]
ten_dem = ["Văn", "Thị", "Hữu", "Đức", "Minh", "Anh", "Tuấn", "Quốc", "Thanh", "Ngọc", "Hồng", "Phương"]
ten = [
    "An", "Bình", "Cường", "Dũng", "Hải", "Hòa", "Hùng", "Khanh",
    "Linh", "Long", "Minh", "Nam", "Phong", "Phúc", "Quân", "Sơn",
    "Thắng", "Thành", "Thiện", "Tiến", "Toàn", "Trang", "Trung",
    "Tuấn", "Việt", "Vinh", "Yến", "Ngọc", "Hương", "Mai", "Lan"
]
dia_chi = ["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ", "Huế", "Nha Trang", "Vũng Tàu", "Biên Hòa", "Thái Nguyên"]

# Hàm tạo mã giảng viên dạng TRAN_TRUNG_CUONG
def tao_ma_giang_vien(ho_ten):
    khong_dau = unidecode.unidecode(ho_ten).upper()
    ma = khong_dau.replace(" ", "_")
    return ma

# Hàm tạo email không dấu, chữ thường
def tao_email_khong_dau(ho, td, t, index):
    full = f"{ho} {td} {t}"
    khong_dau = unidecode.unidecode(full).lower().replace(" ", "")
    email = f"{khong_dau}{index}@university.edu.vn"
    return email

def get_existing_data(cursor):
    """Lấy dữ liệu hiện có từ database"""
    # Lấy danh sách giảng viên hiện có
    cursor.execute("SELECT ma_giang_vien, email, sdt FROM giang_vien")
    existing_gv = cursor.fetchall()
    used_ma_gv = {gv['ma_giang_vien'] for gv in existing_gv}
    used_emails = {gv['email'] for gv in existing_gv}
    used_phones = {gv['sdt'] for gv in existing_gv if gv['sdt']}
    
    # Lấy danh sách môn học
    cursor.execute("SELECT id, ma_mon_hoc, ten_mon_hoc FROM mon_hoc ORDER BY id")
    mon_hoc_list = cursor.fetchall()
    
    # Lấy phân công môn học hiện có
    cursor.execute("""
        SELECT gv.id as giang_vien_id, gv.ma_giang_vien, mh.id as mon_hoc_id, mh.ma_mon_hoc
        FROM giang_vien gv
        INNER JOIN giang_vien_mon_hoc gvmh ON gv.id = gvmh.giang_vien_id
        INNER JOIN mon_hoc mh ON gvmh.mon_hoc_id = mh.id
    """)
    phan_cong_hien_co = cursor.fetchall()
    
    # Lấy thông tin lớp học phần chưa có giảng viên
    cursor.execute("""
        SELECT lhp.id, lhp.mon_hoc_id, lhp.hoc_ky_id, lhp.nien_khoa_id, mh.ma_mon_hoc
        FROM lop_hoc_phan lhp
        INNER JOIN mon_hoc mh ON lhp.mon_hoc_id = mh.id
        WHERE lhp.giang_vien_id IS NULL
    """)
    lop_hoc_phan_chua_co_gv = cursor.fetchall()
    
    return {
        'used_ma_gv': used_ma_gv,
        'used_emails': used_emails,
        'used_phones': used_phones,
        'mon_hoc_list': mon_hoc_list,
        'phan_cong_hien_co': phan_cong_hien_co,
        'lop_hoc_phan_chua_co_gv': lop_hoc_phan_chua_co_gv,
        'existing_gv_count': len(existing_gv)
    }

def analyze_subject_distribution(mon_hoc_list, phan_cong_hien_co, lop_hoc_phan_chua_co_gv):
    """Phân tích phân bố môn học để phân công đồng đều"""
    # Đếm số giảng viên hiện có cho mỗi môn học
    mon_hoc_gv_count = defaultdict(int)
    for pc in phan_cong_hien_co:
        mon_hoc_gv_count[pc['mon_hoc_id']] += 1
    
    # Đếm số lớp học phần chưa có giảng viên cho mỗi môn học
    mon_hoc_lhp_count = defaultdict(int)
    for lhp in lop_hoc_phan_chua_co_gv:
        mon_hoc_lhp_count[lhp['mon_hoc_id']] += 1
    
    # Tính số giảng viên cần thiết cho mỗi môn học
    # Ưu tiên các môn học có nhiều lớp học phần chưa có giảng viên
    mon_hoc_priority = []
    for mh in mon_hoc_list:
        mh_id = mh['id']
        current_gv = mon_hoc_gv_count[mh_id]
        needed_lhp = mon_hoc_lhp_count[mh_id]
        
        # Tính điểm ưu tiên: số lớp học phần cần / (số giảng viên hiện có + 1)
        # Môn học có nhiều lớp học phần cần giảng viên hơn sẽ có điểm cao hơn
        priority_score = needed_lhp / (current_gv + 1) if (current_gv + 1) > 0 else needed_lhp
        
        mon_hoc_priority.append({
            'mon_hoc_id': mh_id,
            'ma_mon_hoc': mh['ma_mon_hoc'],
            'ten_mon_hoc': mh['ten_mon_hoc'],
            'current_gv': current_gv,
            'needed_lhp': needed_lhp,
            'priority_score': priority_score
        })
    
    # Sắp xếp theo điểm ưu tiên giảm dần
    mon_hoc_priority.sort(key=lambda x: x['priority_score'], reverse=True)
    
    return mon_hoc_priority

def distribute_subjects_evenly(mon_hoc_priority, num_gv, existing_assignments):
    """Phân công môn học đồng đều cho các giảng viên mới"""
    if not mon_hoc_priority:
        return [[] for _ in range(num_gv)]
    
    # Tạo danh sách môn học cần phân công (lặp lại theo độ ưu tiên)
    subject_queue = []
    total_priority = sum(mh['priority_score'] for mh in mon_hoc_priority)
    
    if total_priority > 0:
        for mh in mon_hoc_priority:
            # Số lần môn học này cần xuất hiện = priority_score * số giảng viên / tổng priority
            weight = int((mh['priority_score'] / total_priority) * num_gv * 2)  # x2 để đảm bảo đủ
            subject_queue.extend([mh['mon_hoc_id']] * max(1, weight))
    else:
        # Nếu không có priority, phân đều tất cả môn học
        for mh in mon_hoc_priority:
            subject_queue.extend([mh['mon_hoc_id']] * 2)
    
    # Xáo trộn để phân bố ngẫu nhiên
    random.shuffle(subject_queue)
    
    # Phân công cho từng giảng viên
    assignments = [[] for _ in range(num_gv)]
    subject_counter = Counter()
    
    # Phân công mỗi môn học cho giảng viên có ít môn học nhất
    for mon_hoc_id in subject_queue:
        # Tìm giảng viên có ít môn học nhất và chưa có môn học này
        best_gv_idx = None
        min_count = float('inf')
        
        for i in range(num_gv):
            if mon_hoc_id not in assignments[i]:
                if len(assignments[i]) < min_count:
                    min_count = len(assignments[i])
                    best_gv_idx = i
        
        if best_gv_idx is not None:
            assignments[best_gv_idx].append(mon_hoc_id)
            subject_counter[mon_hoc_id] += 1
        else:
            # Nếu tất cả giảng viên đã có môn học này, thêm vào giảng viên có ít môn nhất
            min_gv_idx = min(range(num_gv), key=lambda i: len(assignments[i]))
            if mon_hoc_id not in assignments[min_gv_idx]:
                assignments[min_gv_idx].append(mon_hoc_id)
                subject_counter[mon_hoc_id] += 1
    
    # Đảm bảo mỗi giảng viên có ít nhất 2 môn học
    all_mon_hoc_ids = [mh['mon_hoc_id'] for mh in mon_hoc_priority]
    for i in range(num_gv):
        while len(assignments[i]) < 2:
            # Thêm môn học chưa có hoặc ít giảng viên nhất
            available_subjects = [mh_id for mh_id in all_mon_hoc_ids if mh_id not in assignments[i]]
            if available_subjects:
                # Chọn môn học có ít giảng viên nhất trong assignments
                subject_counts = Counter()
                for j in range(num_gv):
                    for mh_id in assignments[j]:
                        subject_counts[mh_id] += 1
                
                best_subject = min(available_subjects, key=lambda mh_id: subject_counts.get(mh_id, 0))
                assignments[i].append(best_subject)
            else:
                break
    
    return assignments

def create_giang_vien(cursor, conn, num_gv, used_ma_gv, used_emails, used_phones):
    """Tạo giảng viên mới trong database"""
    giang_vien_ids = []
    
    for i in range(num_gv):
        # Tạo tên ngẫu nhiên
        ho = random.choice(ho_dem)
        td = random.choice(ten_dem)
        t = random.choice(ten)
        ho_ten = f"{ho} {td} {t}"
        
        # Tạo mã giảng viên (đảm bảo không trùng)
        ma_gv = tao_ma_giang_vien(ho_ten)
        counter = 1
        while ma_gv in used_ma_gv:
            ma_gv = f"{tao_ma_giang_vien(ho_ten)}_{counter}"
            counter += 1
        used_ma_gv.add(ma_gv)
        
        # Ngày sinh (1970–1990)
        start_date = datetime(1970, 1, 1)
        end_date = datetime(1990, 12, 31)
        days_between = (end_date - start_date).days
        random_days = random.randint(0, days_between)
        ngay_sinh = start_date + timedelta(days=random_days)
        
        # Email không dấu, unique
        email = tao_email_khong_dau(ho, td, t, i + 1)
        base = email.split('@')[0]
        counter = 0
        while email in used_emails:
            counter += 1
            email = f"{base}{counter}@university.edu.vn"
        used_emails.add(email)
        
        # Số điện thoại unique
        phone = f"09{random.randint(10000000, 99999999)}"
        while phone in used_phones:
            phone = f"09{random.randint(10000000, 99999999)}"
        used_phones.add(phone)
        
        # Giới tính
        gioi_tinh = random.choice(["NAM", "NU"])
        
        # Địa chỉ
        dia_chi_gv = random.choice(dia_chi)
        
        # Insert vào database
        try:
            cursor.execute("""
                INSERT INTO giang_vien (ma_giang_vien, ho_ten, ngay_sinh, email, sdt, gioi_tinh, dia_chi)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (ma_gv, ho_ten, ngay_sinh.strftime('%Y-%m-%d'), email, phone, gioi_tinh, dia_chi_gv))
            
            gv_id = cursor.lastrowid
            giang_vien_ids.append(gv_id)
            print(f"  ✓ Đã tạo giảng viên: {ma_gv} - {ho_ten} (ID: {gv_id})")
        except Error as e:
            print(f"  ✗ Lỗi khi tạo giảng viên {ma_gv}: {e}")
            conn.rollback()
            raise
    
    conn.commit()
    return giang_vien_ids

def assign_subjects_to_teachers(cursor, conn, giang_vien_ids, assignments, mon_hoc_list):
    """Phân công môn học cho giảng viên"""
    mon_hoc_dict = {mh['id']: mh for mh in mon_hoc_list}
    total_assignments = 0
    
    for gv_idx, gv_id in enumerate(giang_vien_ids):
        for mon_hoc_id in assignments[gv_idx]:
            try:
                cursor.execute("""
                    INSERT INTO giang_vien_mon_hoc (giang_vien_id, mon_hoc_id)
                    VALUES (%s, %s)
                """, (gv_id, mon_hoc_id))
                total_assignments += 1
                mon_hoc_info = mon_hoc_dict.get(mon_hoc_id, {})
                print(f"  ✓ Phân công: GV ID {gv_id} → {mon_hoc_info.get('ma_mon_hoc', mon_hoc_id)}")
            except Error as e:
                # Có thể đã tồn tại (unique constraint), bỏ qua
                if "Duplicate entry" not in str(e):
                    print(f"  ✗ Lỗi khi phân công môn học: {e}")
    
    conn.commit()
    print(f"\n  Tổng số phân công môn học: {total_assignments}")

def assign_teachers_to_classes(cursor, conn, lop_hoc_phan_chua_co_gv):
    """Gán giảng viên cho các lớp học phần chưa có giảng viên"""
    if not lop_hoc_phan_chua_co_gv:
        print("\n  Không có lớp học phần nào cần gán giảng viên.")
        return
    
    # Lấy danh sách giảng viên và môn học họ dạy
    cursor.execute("""
        SELECT gv.id as giang_vien_id, gvmh.mon_hoc_id
        FROM giang_vien gv
        INNER JOIN giang_vien_mon_hoc gvmh ON gv.id = gvmh.giang_vien_id
    """)
    gv_mon_hoc = cursor.fetchall()
    
    # Tạo dict: mon_hoc_id -> [danh sách giảng viên có thể dạy]
    mon_hoc_to_gv = defaultdict(list)
    for row in gv_mon_hoc:
        mon_hoc_to_gv[row['mon_hoc_id']].append(row['giang_vien_id'])
    
    # Đếm số lớp học phần đã gán cho mỗi giảng viên (để phân bố đồng đều)
    gv_class_count = defaultdict(int)
    
    assigned_count = 0
    for lhp in lop_hoc_phan_chua_co_gv:
        mon_hoc_id = lhp['mon_hoc_id']
        available_gv = mon_hoc_to_gv.get(mon_hoc_id, [])
        
        if available_gv:
            # Chọn giảng viên có ít lớp học phần nhất
            best_gv = min(available_gv, key=lambda gv_id: gv_class_count[gv_id])
            
            try:
                cursor.execute("""
                    UPDATE lop_hoc_phan
                    SET giang_vien_id = %s
                    WHERE id = %s
                """, (best_gv, lhp['id']))
                
                gv_class_count[best_gv] += 1
                assigned_count += 1
            except Error as e:
                print(f"  ✗ Lỗi khi gán giảng viên cho lớp học phần {lhp['id']}: {e}")
        else:
            print(f"  ⚠ Không có giảng viên nào dạy môn học ID {mon_hoc_id} cho lớp học phần {lhp['id']}")
    
    conn.commit()
    print(f"\n  Đã gán giảng viên cho {assigned_count}/{len(lop_hoc_phan_chua_co_gv)} lớp học phần")

def main():
    print("=" * 70)
    print("TẠO DỮ LIỆU GIẢNG VIÊN VÀ PHÂN CÔNG MÔN HỌC")
    print("=" * 70)
    
    # Hỏi số lượng giảng viên cần tạo
    while True:
        try:
            num_gv = int(input("\nNhập số lượng giảng viên cần tạo: "))
            if num_gv <= 0:
                print("Số lượng phải lớn hơn 0!")
                continue
            break
        except ValueError:
            print("Vui lòng nhập số nguyên hợp lệ!")
    
    # Kết nối database
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            port=3307,
            database="quanlysinhvien_kqht"
        )
        cursor = conn.cursor(dictionary=True)
        
        print("\n" + "=" * 70)
        print("BƯỚC 1: Lấy dữ liệu hiện có từ database...")
        print("=" * 70)
        
        existing_data = get_existing_data(cursor)
        print(f"  - Số giảng viên hiện có: {existing_data['existing_gv_count']}")
        print(f"  - Số môn học: {len(existing_data['mon_hoc_list'])}")
        print(f"  - Số phân công hiện có: {len(existing_data['phan_cong_hien_co'])}")
        print(f"  - Số lớp học phần chưa có giảng viên: {len(existing_data['lop_hoc_phan_chua_co_gv'])}")
        
        print("\n" + "=" * 70)
        print("BƯỚC 2: Phân tích phân bố môn học...")
        print("=" * 70)
        
        mon_hoc_priority = analyze_subject_distribution(
            existing_data['mon_hoc_list'],
            existing_data['phan_cong_hien_co'],
            existing_data['lop_hoc_phan_chua_co_gv']
        )
        
        print("\n  Top 10 môn học cần giảng viên nhất:")
        for i, mh in enumerate(mon_hoc_priority[:10], 1):
            print(f"    {i}. {mh['ma_mon_hoc']} - {mh['ten_mon_hoc']}")
            print(f"       (Hiện có: {mh['current_gv']} GV, Cần: {mh['needed_lhp']} lớp học phần)")
        
        print("\n" + "=" * 70)
        print("BƯỚC 3: Phân công môn học đồng đều...")
        print("=" * 70)
        
        assignments = distribute_subjects_evenly(
            mon_hoc_priority,
            num_gv,
            existing_data['phan_cong_hien_co']
        )
        
        # Hiển thị phân công
        print("\n  Phân công môn học cho các giảng viên mới:")
        for i, assignment in enumerate(assignments, 1):
            mon_hoc_names = [mh['ma_mon_hoc'] for mh in existing_data['mon_hoc_list'] 
                           if mh['id'] in assignment]
            print(f"    GV {i}: {len(assignment)} môn học - {', '.join(mon_hoc_names[:5])}{'...' if len(mon_hoc_names) > 5 else ''}")
        
        print("\n" + "=" * 70)
        print("BƯỚC 4: Tạo giảng viên mới...")
        print("=" * 70)
        
        giang_vien_ids = create_giang_vien(
            cursor,
            conn,
            num_gv,
            existing_data['used_ma_gv'],
            existing_data['used_emails'],
            existing_data['used_phones']
        )
        
        print("\n" + "=" * 70)
        print("BƯỚC 5: Phân công môn học cho giảng viên...")
        print("=" * 70)
        
        assign_subjects_to_teachers(
            cursor,
            conn,
            giang_vien_ids,
            assignments,
            existing_data['mon_hoc_list']
        )
        
        print("\n" + "=" * 70)
        print("BƯỚC 6: Gán giảng viên cho các lớp học phần...")
        print("=" * 70)
        
        # Lấy lại danh sách lớp học phần chưa có giảng viên (sau khi đã tạo giảng viên mới)
        cursor.execute("""
            SELECT lhp.id, lhp.mon_hoc_id, lhp.hoc_ky_id, lhp.nien_khoa_id, mh.ma_mon_hoc
            FROM lop_hoc_phan lhp
            INNER JOIN mon_hoc mh ON lhp.mon_hoc_id = mh.id
            WHERE lhp.giang_vien_id IS NULL
        """)
        lop_hoc_phan_chua_co_gv = cursor.fetchall()
        
        assign_teachers_to_classes(cursor, conn, lop_hoc_phan_chua_co_gv)
        
        print("\n" + "=" * 70)
        print("HOÀN TẤT!")
        print("=" * 70)
        print(f"  ✅ Đã tạo {num_gv} giảng viên mới")
        print(f"  ✅ Đã phân công môn học đồng đều")
        print(f"  ✅ Đã gán giảng viên cho các lớp học phần")
        print("=" * 70)
        
    except Error as e:
        print(f"\n❌ Lỗi MySQL: {e}")
        if 'conn' in locals() and conn.is_connected():
            conn.rollback()
    
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()
            print("\n🔌 Đã đóng kết nối MySQL\n")

if __name__ == "__main__":
    main()
