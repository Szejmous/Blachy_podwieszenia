from flask import Flask, render_template, request, jsonify
import numpy as np

app = Flask(__name__)

# Baza danych blach trapezowych
BLACHY = {
    "Pruszyński": {
        "T130": 337,
        "T135": 317,
        "T135P": 310,
        "T140": 304,
        "T150": 290,
        "T155": 280,
        "T160": 260
    },
    "ArcelorMittal": {
        "Hacierco 136/337": 337,
        "Hacierco 135/315": 315,
        "Hacierco 150/290": 290
    },
    "BP2": {
        "T130": 337,
        "T135-930": 310,
        "T135-950": 316.67,
        "T153-860": 287,
        "T160": 250
    }
}

@app.route('/')
def index():
    return render_template("index.html", producenci=BLACHY.keys())

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.json

    # Dane wejściowe
    load_kg_m2 = float(data["load_kg_m2"])
    producent = data["producent"]
    blacha = data["blacha"]
    spacing_mm = BLACHY[producent][blacha] / 1000  # Rozstaw z bazy w metrach
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

    # Moment maksymalny od obciążenia równomiernego (ql²/8, ujemny, bo w dół)
    max_moment_uniform = -(load_kg_m * L**2) / 8

    # Dokładniejszy wykres momentów od obciążenia równsomiernego (parabola, ujemna)
    x_values = np.linspace(0, L, 50)
    uniform_moment = [-(load_kg_m * x * (L - x)) / 2 for x in x_values]

    # Obliczanie reakcji w podporach dla sił punktowych
    R_A = 0  # Reakcja w lewej podporze
    R_B = 0  # Reakcja w prawej podporze
    for i, P in enumerate(forces):
        x = cumulative_distances[i]
        R_A += P * (L - x) / L  # Składowa reakcji w A
        R_B += P * x / L        # Składowa reakcji w B

    # Obliczanie momentów od sił punktowych w punktach sił i na końcach (ujemne)
    moment_values = []  # Momenty w miejscach sił
    point_moment_x = [0] + cumulative_distances + [L]  # Punkty x dla wykresu
    point_moment_values = [0]  # Moment na początku belki (0)
    current_moment = 0
    for i, x in enumerate(cumulative_distances):
        current_moment = -(R_A * x - sum(P * (x - d) for P, d in zip(forces, cumulative_distances) if d < x))
        moment_values.append(current_moment)
        point_moment_values.append(current_moment)
    point_moment_values.append(0)  # Moment na końcu belki (0)

    max_moment_forces = min([m for m in moment_values]) if moment_values else 0  # Minimum, bo ujemne

    # Sprawdzenie poprawności podwieszenia
    status = "Poprawne podwieszenie." if abs(max_moment_forces) <= abs(max_moment_uniform) else "Złe podwieszenie, zmniejsz obciążenie lub zmień lokalizację."

    return jsonify({
        "load_kg_m": load_kg_m,
        "L": L,
        "spacing_mm": spacing_mm * 1000,  # Zwracam w mm dla frontend
        "max_moment_uniform": max_moment_uniform,
        "uniform_moment": uniform_moment,
        "x_values": x_values.tolist(),
        "forces": forces,
        "distances": cumulative_distances,
        "moment_values": moment_values,
        "point_moment_x": point_moment_x,
        "point_moment_values": point_moment_values,
        "max_moment_forces": max_moment_forces,
        "status": status
    })

if __name__ == "__main__":
    app.run(debug=True)
