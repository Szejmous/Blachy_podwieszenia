from flask import Flask, request, render_template, jsonify
import numpy as np

app = Flask(__name__)

# Lista producentów (dla dropdowna)
producenci = ["Pruszyński", "ArcelorMittal", "BP2"]

@app.route('/')
def index():
    return render_template('index.html', producenci=producenci)

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.get_json()
    
    # Pobranie danych z formularza
    L = float(data.get('beam_span', 1))  # Długość belki w metrach
    load_kg_m2 = float(data.get('load_kg_m2', 0))  # Obciążenie w kg/m²
    producent = data.get('producent', 'Pruszyński')
    blacha = data.get('blacha', 'T130')
    
    # Przykładowe rozstawy belek dla producentów (w mm)
    rozstawy = {
        "Pruszyński": {"T130": 337, "T135": 333, "T135P": 333, "T140": 333, "T150": 333, "T155": 333, "T160": 333},
        "ArcelorMittal": {"Hacierco 136/337": 337, "Hacierco 135/315": 315, "Hacierco 150/290": 290},
        "BP2": {"T130": 337, "T135-930": 930, "T135-950": 950, "T153-860": 860, "T160": 1000}
    }
    spacing_mm = rozstawy[producent].get(blacha, 337)  # Rozstaw w mm
    load_kg_m = load_kg_m2 * (spacing_mm / 1000)  # Obciążenie liniowe w kg/m

    # Pobranie sił punktowych i ich pozycji
    forces = [float(data.get(f'P{i}', 0)) for i in range(1, 7)]
    distances = [float(data.get(f'x{i}', 0)) for i in range(1, 7)]
    forces = [f for f in forces if f > 0]  # Usuń zera
    distances = [d for d, f in zip(distances, forces) if f > 0]  # Usuń zera

    # Obliczanie pozycji jako sumy przyrostów
    absolute_distances = []
    current_pos = 0
    for d in distances:
        current_pos += d
        absolute_distances.append(current_pos)

    # Walidacja danych
    if L <= 0:
        return jsonify({"status": "Błąd: Rozpiętość belki musi być większa od 0"})
    if any(d < 0 or d > L for d in absolute_distances):
        return jsonify({"status": "Błąd: Pozycje sił muszą być w zakresie [0, L]"})

    # Obliczenia dla obciążenia równomiernego
    x_values = np.arange(0, L + 0.1, 0.1)  # Dokładny zakres od 0 do L z krokiem 0.1 m
    uniform_moment = [- (load_kg_m * x * (L - x)) / 2 for x in x_values]  # Poprawna parabola

    # Obliczenia dla obciążeń punktowych
    R_A = sum(f * (L - d) for f, d in zip(forces, absolute_distances)) / L  # Reakcja w A
    R_B = sum(f * d for f, d in zip(forces, absolute_distances)) / L  # Reakcja w B
    point_moment_x = [0] + absolute_distances + [L]  # Kluczowe punkty: 0, miejsca sił, L
    point_moment_values = []
    for x in point_moment_x:
        M = R_A * x
        for f, d in zip(forces, absolute_distances):
            if x > d:
                M -= f * (x - d)
        point_moment_values.append(-M)  # Ujemne wartości zgodnie z konwencją

    # Maksymalne wartości momentów
    max_uniform_moment = min(uniform_moment)  # Minimum, bo momenty są ujemne
    max_point_moment = min(point_moment_values)  # Minimum, bo momenty są ujemne
    max_continuous_moment_theoretical = - (load_kg_m * L * L) / 8  # Maksymalny moment teoretyczny

    return jsonify({
        "status": "Poprawne obliczenia",
        "L": L,
        "load_kg_m": load_kg_m,
        "spacing_mm": spacing_mm,
        "x_values": x_values.tolist(),
        "uniform_moment": uniform_moment,
        "point_moment_x": point_moment_x,
        "point_moment_values": point_moment_values,
        "forces": forces,
        "distances": absolute_distances,  # Zwracamy absolutne pozycje
        "max_uniform_moment": max_uniform_moment,
        "max_point_moment": max_point_moment,
        "max_continuous_moment_theoretical": max_continuous_moment_theoretical
    })

if __name__ == '__main__':
    app.run(debug=True)
