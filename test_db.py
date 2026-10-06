from sqlalchemy import text

from database.db import engine


try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("Ket noi MySQL thanh cong!")
        print(result.fetchone())

except Exception as error:
    print("Ket noi MySQL that bai!")
    print(error)