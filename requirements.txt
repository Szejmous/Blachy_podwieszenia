from flask import Flask, render_template, request, jsonify
import numpy as np

app = Flask(__name__)

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.json

    # Dane wejściowe
    load_kg_m2 = float(data["load_kg_m2"])
    spacing_mm = float(data["spacing_mm"]) / 1000  # Konwersja na metry

    # Obliczenie obciążenia na fałdę
    load_kg_m = load_kg_m2 * spacing_mm

    # Pobranie sił i odległości
    forces = []
    distances = []

    for i in range(6):
        p = float(data.get(f"P{i+1}", 0))
        x = float(data.get(f"x{i+1}", 0))
        if p > 0 and (i == 0 or x > 0):
            forces.append(p)
            distances.append(sum(distances) + x if i > 0 else x)

    L = max(distances) if distances else 1  # Długość belki (założenie)

    # Moment maksymalny od obciążenia równomiernego (ql²/8)
    max_moment_uniform = (load_kg_m * L ** 2) / 8

    # Moment od sił punktowych
    moment_values = []
    for i, P in enumerate(forces):
        moment = P * (distances[i] * (L - distances[i])) / L
        moment_values.append(moment)

    max_moment_forces = max(moment_values) if moment_values else 0

    # Sprawdzenie poprawności podwieszenia
    status = "Poprawne podwieszenie." if max_moment_forces <= max_moment_uniform else "Złe podwieszenie, zmniejsz obciążenie lub zmień lokalizację."

    return jsonify({
        "load_kg_m": load_kg_m,
        "max_moment_uniform": max_moment_uniform,
        "moment_values": moment_values,
        "max_moment_forces": max_moment_forces,
        "status": status
    })

if __name__ == "__main__":
    app.run(debug=True)
