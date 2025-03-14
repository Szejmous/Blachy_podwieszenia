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
    L = float(data["beam_span"])  # Rozpiętość belki w metrach

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
    cumulative_distances.pop(0)

    # Moment maksymalny od obciążenia równomiernego (ql²/8)
    max_moment_uniform = (load_kg_m * L**2) / 8

    # Dokładniejszy wykres momentów od obciążenia równomiernego (parabola)
    x_values = np.linspace(0, L, 50)
    uniform_moment = [load_kg_m * x * (L - x) / 2 for x in x_values]

    # Moment od sił punktowych
    moment_values = []
    for i, P in enumerate(forces):
        x = cumulative_distances[i]
        moment = P * x * (L - x) / L
        moment_values.append(moment)

    max_moment_forces = max(moment_values) if moment_values else 0

    # Sprawdzenie poprawności podwieszenia
    status = "Poprawne podwieszenie." if max_moment_forces <= max_moment_uniform else "Złe podwieszenie, zmniejsz obciążenie lub zmień lokalizację."

    return jsonify({
        "load_kg_m": load_kg_m,
        "L": L,
        "max_moment_uniform": max_moment_uniform,
        "uniform_moment": uniform_moment.tolist(),
        "x_values": x_values.tolist(),
        "forces": forces,
        "distances": cumulative_distances,
        "moment_values": moment_values,
        "max_moment_forces": max_moment_forces,
        "status": status
    })

if __name__ == "__main__":
    app.run(debug=True)
