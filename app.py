
from flask import Flask
from flask_cors import CORS

from database import init_db
from routes import roadalert_routes

app = Flask(__name__)

# Allow requests from your frontend during development
CORS(app)

# Maximum upload size: 20 MB
app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024

# Create database tables
init_db()

# Register backend routes
app.register_blueprint(roadalert_routes)


@app.route("/")
def home():
    return {
        "message": "RoadAlert Backend is running!"
    }


if __name__ == "__main__":
    app.run(debug=True)
