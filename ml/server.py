from fastapi import FastAPI
import joblib
import numpy as np
import json
import time
import os
app = FastAPI()

# Load model + scaler
model = joblib.load("ddos_model.pkl")
scaler = joblib.load("scaler.pkl")

#region agent log: setup
#LOG_PATH = r"c:\Users\paridhi\Desktop\Shield_Layer\debug-78bf98.log"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_PATH = os.path.join(BASE_DIR, "debug.log")
RUN_ID = "before_fix"
SESSION_ID = "78bf98"

def _append_debug_log(hypothesisId: str, location: str, message: str, data: dict | None = None) -> None:
    payload = {
        "sessionId": SESSION_ID,
        "runId": RUN_ID,
        "id": f"log_{int(time.time() * 1000)}",
        "timestamp": int(time.time() * 1000),
        "hypothesisId": hypothesisId,
        "location": location,
        "message": message,
        "data": data or {},
    }
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(payload) + "\n")

_append_debug_log(
    hypothesisId="D",
    location="server.py:startup",
    message="model/scaler loaded",
    data={
        "model_type": type(model).__name__,
        "model_n_features_in": int(getattr(model, "n_features_in_", -1)),
        "scaler_type": type(scaler).__name__,
        "scaler_n_features_in": int(getattr(scaler, "n_features_in_", -1)),
        "scaler_has_feature_names_in": bool(hasattr(scaler, "feature_names_in_")),
        "scaler_classes": getattr(model, "classes_", None).tolist() if hasattr(model, "classes_") else None,
        "has_predict_proba": bool(hasattr(model, "predict_proba")),
    },
)
#endregion

@app.post("/predict")
async def predict(data: dict):

    # 1️⃣ Build feature vector (correct order)
    flow_duration = data.get("flow_duration", 0)
    request_rate = data.get("request_rate", 0)
    avg_packet_size = data.get("avg_packet_size", 0)
    bytes_per_sec = data.get("bytes_per_sec", 0)

    #region agent log: feature extraction
    features = np.array([[
        flow_duration,
        request_rate,
        avg_packet_size,
        bytes_per_sec,
    ]])
    _append_debug_log(
        hypothesisId="A",
        location="server.py:predict:features_raw",
        message="received keys + extracted feature values",
        data={
            "received_keys": list(data.keys()) if hasattr(data, "keys") else None,
            "used_defaults": {
                "flow_duration": "flow_duration" not in data,
                "request_rate": "request_rate" not in data,
                "avg_packet_size": "avg_packet_size" not in data,
                "bytes_per_sec": "bytes_per_sec" not in data,
            },
            "features_raw": [float(flow_duration), float(request_rate), float(avg_packet_size), float(bytes_per_sec)],
        },
    )
    #endregion

    print("📥 RAW INPUT:", features)

    # 2️⃣ Scale features
    scaled = scaler.transform(features)

    #region agent log: scaled features
    _append_debug_log(
        hypothesisId="E",
        location="server.py:predict:features_scaled",
        message="scaled feature vector",
        data={
            "features_scaled": [float(x) for x in np.asarray(scaled).reshape(-1).tolist()],
        },
    )
    #endregion

    print("📊 SCALED:", scaled)

    # 3️⃣ Predict
    #pred = model.predict(scaled)[0]
    prob = model.predict_proba(scaled)[0][1]

    #region agent log: prediction output
    _append_debug_log(
        hypothesisId="C",
        location="server.py:predict:prediction",
        message="model  probability score ",
        data={
          #  "prediction": int(pred),
            "confidence_attack_class": float(prob),
        },
    )
    #endregion

    print( "CONF:", prob)

    # 4️⃣ Return response
    return {
      
        "confidence": float(prob)
    }
    # from fastapi import FastAPI
# import joblib
# import numpy as np

# app = FastAPI()

# model = joblib.load("ddos_model.pkl")

# @app.post("/predict")
# async def predict(data: dict):

#     features = np.array([[ 
#         data.get("flow_duration", 0),
#         data.get("request_rate", 0),        # Flow Packets/s
#         data.get("bytes_per_sec", 0),       # Flow Bytes/s
#         data.get("avg_packet_size", 0)      # Fwd Packet Length Mean
#     ]])

#     pred = model.predict(features)[0]
#     prob = model.predict_proba(features)[0][1]

#     return {
#         "prediction": int(pred),
#         "confidence": float(prob)
#     }