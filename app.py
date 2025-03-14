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

    # Obciążenie na fałdę (kg/m)
    load_kg_m = load_kg_m2 * spacing_mm

    # Siły punktowe i odległości
    forces = []
    distances = []
    for i in range(6):
        p = float(data.get(f"P{i+1}", 0))
        x = float(data.get(f"x{i+1}", 0))
        if p > 0 and (i == 0 or x > 0):  # Pomiń, jeśli P=0 lub x=0 (oprócz pierwszej siły)
            forces.append(p)
            distances.append(x)

    # Obliczanie pozycji sił na belce
    cumulative_distances = [0]
    for i, x in enumerate(distances):
        cumulative_distances.append(cumulative_distances[-1] + x)
    cumulative_distances.pop(0)  # Usuń początkowe 0

    L = max(cumulative_distances) if cumulative_distances else 1  # Długość belki

    # Moment maksymalny od obciążenia równomiernego (ql²/8)
    max_moment_uniform = (load_kg_m * L**2) / 8

    # Wykres momentów od obciążenia równomiernego
    uniform_moment = [0, max_moment_uniform / 2, max_moment_uniform, max_moment_uniform / 2, 0]

    # Moment od sił punktowych
    moment_values = []
    for i, P in enumerate(forces):
        x = cumulative_distances[i]
        moment = P * x * (L - x) / L  # Moment w punkcie siły
        moment_values.append(moment)

    max_moment_forces = max(moment_values) if moment_values else 0

    # Sprawdzenie poprawności podwieszenia
    status = "Poprawne podwieszenie." if max_moment_forces <= max_moment_uniform else "Złe podwieszenie, zmniejsz obciążenie lub zmień lokalizację."

    return jsonify({
        "load_kg_m": load_kg_m,
        "L": L,
        "max_moment_uniform": max_moment_uniform,
        "uniform_moment": uniform_moment,
        "forces": forces,
        "distances": cumulative_distances,
        "moment_values": moment_values,
        "max_moment_forces": max_moment_forces,
        "status": status
    })

if __name__ == "__main__":
    app.run(debug=True)
