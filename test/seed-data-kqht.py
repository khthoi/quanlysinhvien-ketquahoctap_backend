import mysql.connector
from mysql.connector import Error
import random


def get_percentage_input(prompt):
    while True:
        try:
            val = float(input(prompt))
            if val < 0:
                print("Tỉ lệ không được âm!")
                continue
            return val
        except ValueError:
            print("Vui lòng nhập số hợp lệ (có thể là số thập phân)!")


def generate_score_from_weights(weights):
    """
    weights: dict như { '8.5-10': 15.0, '6-8': 50.0, '4-6': 30.0, '0-4': 5.0 }
    Tổng weights phải = 100
    """
    r = random.uniform(0, 100)
    cumulative = 0.0
    
    for range_name, percent in weights.items():
        cumulative += percent
        if r < cumulative:
            if range_name == '8.5-10':
                return round(random.uniform(8.5, 10.0), 2)
            elif range_name == '6-8':
                return round(random.uniform(6.0, 8.0), 2)
            elif range_name == '4-6':
                return round(random.uniform(4.0, 6.0), 2)
            elif range_name == '0-4':
                return round(random.uniform(0.0, 4.0), 2)
    # fallback (nên không bao giờ tới đây nếu tổng = 100)
    return round(random.uniform(4.0, 6.0), 2)


def main():
    print("=== Tạo điểm ngẫu nhiên cho bảng ket_qua_hoc_tap ===\n")
    print("Nhập tỉ lệ phần trăm (%) xuất hiện của từng khoảng điểm.")
    print("Tổng các tỉ lệ PHẢI bằng đúng 100%.\n")

    while True:
        print("Ví dụ phổ biến:")
        print("  8.5–10: 15%    6–8: 50%    4–6: 30%    0–4: 5%   → tổng 100%\n")

        ty_le_85_10 = get_percentage_input("Tỉ lệ điểm 8.5 → 10.0 (%): ")
        ty_le_6_8   = get_percentage_input("Tỉ lệ điểm 6.0 → 8.0  (%): ")
        ty_le_4_6   = get_percentage_input("Tỉ lệ điểm 4.0 → 6.0  (%): ")
        ty_le_0_4   = get_percentage_input("Tỉ lệ điểm 0.0 → 4.0  (%): ")

        total = ty_le_85_10 + ty_le_6_8 + ty_le_4_6 + ty_le_0_4

        if abs(total - 100) < 0.001:
            break
        else:
            print(f"\n→ Tổng tỉ lệ: {total:.2f}%  ≠ 100%. Vui lòng nhập lại!\n")

    # Lưu tỉ lệ vào dict để dễ dùng
    score_weights = {
        '8.5-10': ty_le_85_10,
        '6-8'   : ty_le_6_8,
        '4-6'   : ty_le_4_6,
        '0-4'   : ty_le_0_4,
    }

    print("\nĐã xác nhận phân bố điểm:")
    for k, v in score_weights.items():
        print(f"  {k:6} : {v:5.1f}%")
    print("Tổng: 100.0%\n")

    # ─────────────────────────────────────────────────────────────
    # Kết nối database
    # ─────────────────────────────────────────────────────────────
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            port=3307,
            database="quanlysinhvien_kqht"
        )
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT sinh_vien_id, lop_hoc_phan_id
            FROM sinh_vien_lop_hoc_phan
            ORDER BY sinh_vien_id, lop_hoc_phan_id
        """)
        records = cursor.fetchall()

        total_records = len(records)
        print(f"📊 Tổng số cặp SV-LHP cần xử lý: {total_records:,}")

        check_sql = """
            SELECT 1 FROM ket_qua_hoc_tap 
            WHERE sinh_vien_id = %s AND lop_hoc_phan_id = %s
            LIMIT 1
        """

        insert_sql = """
            INSERT INTO ket_qua_hoc_tap
            (diem_qua_trinh, diem_thanh_phan, diem_thi, sinh_vien_id, lop_hoc_phan_id)
            VALUES (%s, %s, %s, %s, %s)
        """

        inserted = 0
        skipped = 0

        for i, row in enumerate(records, 1):
            sv_id = row["sinh_vien_id"]
            lhp_id = row["lop_hoc_phan_id"]

            cursor.execute(check_sql, (sv_id, lhp_id))
            if cursor.fetchone():
                skipped += 1
                continue

            # Sinh 3 điểm độc lập theo phân bố đã cấu hình
            diem_qt  = generate_score_from_weights(score_weights)
            diem_tp  = generate_score_from_weights(score_weights)
            diem_thi = generate_score_from_weights(score_weights)

            values = (diem_qt, diem_tp, diem_thi, sv_id, lhp_id)

            cursor.execute(insert_sql, values)
            inserted += 1

            if i % 500 == 0:
                print(f"  → Đã xử lý {i:,}/{total_records:,} bản ghi...")

        conn.commit()

        print("\n" + "="*60)
        print("HOÀN TẤT")
        print(f"   ✅ Insert mới     : {inserted:,} bản ghi")
        print(f"   ⏭ Đã tồn tại (skip): {skipped:,} bản ghi")
        print(f"   Tổng cộng         : {inserted + skipped:,} / {total_records:,}")
        print("="*60)

    except Error as e:
        print("\n❌ Lỗi MySQL:", e)
        if 'conn' in locals() and conn.is_connected():
            conn.rollback()

    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()
            print("🔌 Đóng kết nối MySQL\n")


if __name__ == "__main__":
    main()