import random
import time

# List of dental conditions our "AI" can detect
CONDITIONS = [
    "Healthy - No Issues Detected",
    "Dental Caries (Cavity) - Molar",
    "Periodontitis (Gum Disease)",
    "Impacted Wisdom Tooth",
    "Root Canal Infection"
]

def analyze_xray_image(file_url: str):
    """
    Simulates a Deep Learning inference process.
    Input: URL of the uploaded X-Ray.
    Output: JSON diagnosis with confidence score.
    """
    # 1. Simulate Processing Latency (AI takes time to 'think')
    time.sleep(2.5) 

    # 2. Simulate Prediction Logic (Random for demo, would be Model.predict() in real life)
    diagnosis = random.choice(CONDITIONS)
    confidence = round(random.uniform(85.0, 99.9), 1)
    
    # 3. Generate "AI Notes" based on diagnosis
    notes = ""
    if "Healthy" in diagnosis:
        notes = "Bone density appears normal. No visible lesions."
    elif "Cavity" in diagnosis:
        notes = "Dark shadow detected in enamel layer. Recommended: Filling or excavation."
    elif "Wisdom" in diagnosis:
        notes = "Tooth angulation is 45 degrees. Potential crowding risk."
    else:
        notes = "Soft tissue inflammation markers detected."

    return {
        "diagnosis": diagnosis,
        "confidence": confidence,
        "notes": notes,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }