import mysql.connector
from mysql.connector import Error
import random

def gacha_diem():
    r = random.uniform(0, 100)
    if r < 50:
        return round(random.uniform(6, 8), 2)
    elif r < 60:
        return round(random.uniform(9, 10), 2)
    elif r < 99:
        return round(random.uniform(4, 6), 2)
    else:
        return round(random.uniform(0, 4), 2)

try:
    # Kết nối MySQL
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="quanlysinhvien_kqht"
    )

    cursor = conn.cursor(dictionary=True)

    # Lấy danh sách sinh viên - lớp học phần
    cursor.execute("""
        SELECT sinh_vien_id, lop_hoc_phan_id
        FROM sinh_vien_lop_hoc_phan
    """)
    records = cursor.fetchall()

    print(f"📌 Tổng bản ghi cần xử lý: {len(records)}")

    insert_sql = """
        INSERT INTO ket_qua_hoc_tap
        (diem_qua_trinh, diem_thanh_phan, diem_thi, sinh_vien_id, lop_hoc_phan_id)
        VALUES (%s, %s, %s, %s, %s)
    """

    count = 0
    for row in records:
        diem_qua_trinh = gacha_diem()
        diem_thanh_phan = gacha_diem()
        diem_thi = gacha_diem()

        values = (
            diem_qua_trinh,
            diem_thanh_phan,
            diem_thi,
            row["sinh_vien_id"],
            row["lop_hoc_phan_id"]
        )

        cursor.execute(insert_sql, values)
        count += 1

    conn.commit()

    print(f"✅ Đã tạo {count} bản ghi trong bảng ket_qua_hoc_tap")

except Error as e:
    print("❌ Lỗi:", e)

finally:
    if conn.is_connected():
        cursor.close()
        conn.close()
        print("🔌 Đã đóng kết nối MySQL")
