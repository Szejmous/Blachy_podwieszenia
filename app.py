from flask import Flask, request, jsonify, render_template
import numpy as np

app = Flask(__name__)

# Słownik z rozstawami fałd dla blach (w mm)
BLACHY_ROZSTAWY = {
    "Pruszyński": {
        "T130": 337,
        "T135": 317,
        "T135P": 310,
        "T140": 304,
        "T150": 290,
        "T155": 280,
        "T160": 260  # Poprawiona wartość
    },
    "ArcelorMittal": {
        "Hacierco 136/337": 337,
        "Hacierco 135/315": 315,
        "Hacierco 150/290": 290
    },
    "BP2": {
        "T130": 325,
        "T135-930": 310,
        "T135-950": 317,
        "T153-860": 287,
        "T160": 320
    }
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    # Pobieranie danych z formularza
    data = request.get_json()
    load_kg_m2 = float(data['load_kg_m2'])  # Obciążenie w kg/m²
    producent = data['producent']
    blacha = data['blacha']
    L = float(data['beam_span'])  # Rozpiętość belki w metrach

    # Zaokrąglenie L do najbliższej wartości podzielnej przez 0.1 m
    L = round(L * 10) / 10  # Zaokrąglamy do 1 miejsca po przecinku

    # Pobieranie rozstawu fałd dla wybranej blachy
    spacing_mm = BLACHY_ROZSTAWY[producent][blacha]

    # Obliczenie obciążenia liniowego (kg/m) na podstawie obciążenia powierzchniowego i rozstawu fałd
    load_kg_m = load_kg_m2 * (spacing_mm / 1000)  # Przeliczamy mm na m

    # Siły punktowe z sumowaniem odległości
    forces = []
    cumulative_distances = []
    total_distance = 0
    for i in range(1, 7):
        force = float(data[f'P{i}'])
        distance = float(data[f'x{i}'])
        if force > 0 and total_distance + distance <= L:  # Sprawdzamy, czy nie przekraczamy L
            forces.append(force)
            total_distance += distance
            cumulative_distances.append(total_distance)

    # Obliczenia dla obciążenia równomiernego
    x_step = 0.1  # Stały krok co 0.1 m
    x_values = np.arange(0, L + x_step, x_step)  # Punkty od 0 do L z krokiem 0.1 m
    uniform_moment = (load_kg_m / 2) * (L * x_values - x_values**2)  # Obliczenie momentu
    uniform_moment = -uniform_moment  # Odwrócenie wartości na ujemne

    # Obliczenia dla obciążeń punktowych
    point_moment = np.zeros_like(x_values)
    for i, force in enumerate(forces):
        a = cumulative_distances[i]  # Pozycja sumowana od początku
        # Reakcje w podporach
        R_A = force * (L - a) / L  # Reakcja w lewej podporze
        # Moment w punkcie x
        moment = np.where(x_values <= a, R_A * x_values, R_A * x_values - force * (x_values - a))
        moment = np.where(x_values <= L, moment, 0)  # Upewniamy się, że moment jest 0 poza L
        point_moment += moment
    point_moment = -point_moment  # Odwrócenie wartości na ujemne

    # Maksymalne wartości momentów (uwzględniamy, że są ujemne, bierzemy wartości bezwzględne)
    max_uniform_moment = np.max(np.abs(uniform_moment))
    max_point_moment = np.max(np.abs(point_moment))

    # Teoretyczny maksymalny moment ciągły (dla obciążenia równomiernego, bez odwrócenia)
    max_continuous_moment_theoretical = (load_kg_m * L**2) / 8

    # Status
    status = "Podwieszenie jest poprawne" if max_continuous_moment_theoretical > max_point_moment else "Zbyt duże obciążenie, zmień podwieszenie"

    # Przygotowanie danych do przesłania
    response_data = {
        "L": L,
        "x_values": x_values.tolist(),
        "uniform_moment": uniform_moment.tolist(),
        "point_moment_values": point_moment.tolist(),
        "forces": forces,
        "distances": cumulative_distances,  # Używamy sumowanych odległości
        "load_kg_m": load_kg_m,
        "spacing_mm": spacing_mm,
        "max_uniform_moment": float(max_uniform_moment),
        "max_point_moment": float(max_point_moment),
        "max_continuous_moment_theoretical": float(max_continuous_moment_theoretical),
        "status": status
    }

    print("Returned data:", response_data)
    return jsonify(response_data)

if __name__ == '__main__':
    app.run(debug=True)
