
from flask import Blueprint, request, jsonify
from database import get_db_connection

roadalert_routes = Blueprint("roadalert", __name__)



# Submit a new road incident
@roadalert_routes.route("/api/incidents", methods=["POST"])
def create_incident():

    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Invalid data"}), 400

    incident_type = data.get("incident_type", "").strip()
    severity = data.get("severity", "Medium").strip()
    description = data.get("description", "").strip()
    location = data.get("location", "").strip()

    if not incident_type or not location:
        return jsonify({
            "error": "Incident type and location are required"
        }), 400

    connection = get_db_connection()

    cursor = connection.execute("""
        INSERT INTO incidents
        (incident_type, severity, description, location)
        VALUES (?, ?, ?, ?)
    """, (incident_type, severity, description, location))

    database_id = cursor.lastrowid
    incident_id = f"RA-{1000 + database_id}"

    connection.execute("""
        UPDATE incidents
        SET incident_id = ?
        WHERE id = ?
    """, (incident_id, database_id))

    connection.commit()
    connection.close()

    return jsonify({
        "message": "Incident submitted successfully",
        "incident_id": incident_id,
        "status": "Pending"
    }), 201


# View all incidents
@roadalert_routes.route("/api/incidents", methods=["GET"])
def get_incidents():

    connection = get_db_connection()

    incidents = connection.execute("""
        SELECT * FROM incidents
        ORDER BY created_at DESC
    """).fetchall()

    connection.close()

    return jsonify([dict(incident) for incident in incidents])
