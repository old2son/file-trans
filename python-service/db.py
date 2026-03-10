import pymysql
from datetime import datetime

def get_connection():
    return pymysql.connect(
        host="localhost",
        user="root",
        password="Y.e13711406615",
        database="file_transform",
        charset="utf8mb4"
    )

def add_visit_record():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            sql = "INSERT INTO visit_records (visit_time) VALUES (%s)"
            cursor.execute(sql, (datetime.now(),))
        conn.commit()
    finally:
        conn.close()

print(__name__)
if __name__ == "__main__":
    add_visit_record()
    print("插入成功")