from flask import Flask, jsonify, request,send_from_directory
from flask_cors import CORS
import pyodbc
import pdb
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

UPLOAD_FOLDER = 'uploads'

#  SQL Server Connection
def get_connection():
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;"  
        "DATABASE=MyDatabase;"
        "Trusted_Connection=yes;"
        "UID=sa;"
        "PWD=Aakash@123"
    )
    return conn

#  LOGIN API (users table)  
@app.route('/login/users', methods=['POST'])

def login():
    
     data = request.json

     user_id = data.get('id')
     password = data.get('password')

     conn = get_connection()
     cursor = conn.cursor()

     query = "SELECT 1 FROM users where id=? and password=?"
     cursor.execute(query, (user_id, password))
     user = cursor.fetchone()
     
     if user and user[0]==1:
         
         
         conn.close()
         return jsonify({
             "message": "Login successful"             
         })
     else:
         conn.close()
         return jsonify({
             "message": "Invalid credentials"
         }), 401
         

#  GET ALL CUSTOMERS
@app.route('/customers', methods=['GET'])
def get_customers():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM customer")
    rows = cursor.fetchall()

    customers = []
    for row in rows:
        customers.append({
            "id": row[0],
            "name": row[1],
            "mobile": row[2],
            "address": row[3],
            "photo": row[4]
        })

    conn.close()
    return jsonify(customers)


# #  ADD CUSTOMER
@app.route('/add_customer', methods=['POST'])
def add_customer():
    conn = None
    try:
        data = request.json

        if not data:
            return jsonify({"error": "No data provided"}), 400

        conn = get_connection()
        cursor = conn.cursor()

        query = """
        INSERT INTO customer (id, name, mobile, address, photo)
        VALUES (?, ?, ?, ?, ?)
        """

        check_query = "SELECT 1 FROM customer WHERE id=? OR mobile=?"

        cust_id = data.get('id')
        name = data.get('name')
        mobile = data.get('mobile')
        address = data.get('address')
        photo = data.get('photo')

        if not all([cust_id, name, mobile, address, photo]):
            return jsonify({"error": "Fill all fields"}), 400

        cursor.execute(check_query, (cust_id, mobile))
        if cursor.fetchone():
            return jsonify({"message": "Customer already exists"}), 400

        cursor.execute(query, (cust_id, name, mobile, address, photo))
        conn.commit()

        return jsonify({"message": "Customer Added Successfully"}), 201

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

    finally:
        if conn:
            conn.close()

#  DELETE CUSTOMER
@app.route('/delete_customers/<int:id>', methods=['DELETE'])
def delete_customer(id):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM customer WHERE id=?", (id,))
        customer = cursor.fetchone()

        if not customer:
            conn.close()
            return jsonify({"error": "Customer not found"}), 404

        cursor.execute("DELETE FROM customer WHERE id=?", (id,))
        conn.commit()
        conn.close()

        return jsonify({"message": "Customer successfully delete ho gaya"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

# ViewFull Details
@app.route('/customer/<int:id>', methods=['GET'])
def get_customer(id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM customer WHERE id=?", (id,))
    row = cursor.fetchone()
    conn.close()

    if row:
        return jsonify({
            "id": row[0],
            "name": row[1],
            "mobile": row[2],
            "address": row[3],
            "photo": row[4]
        })
    else:
        return jsonify({"error": "Customer not found"}), 404
    
# Upload Photo
@app.route('/upload', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({"error": "No file"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    filename = file.filename
    file_path = os.path.join(UPLOAD_FOLDER, filename)

    file.save(file_path)

    return jsonify({
        "filename": filename,
        "path": f"uploads/{filename}"
    }), 201

@app.route('/uploads/<filename>')
def serve_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# #  RUN SERVER
if __name__ == '__main__':
    app.run(debug=True)