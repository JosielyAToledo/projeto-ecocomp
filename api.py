from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient
from datetime import datetime
import uvicorn

app = FastAPI()

# Substitua pela sua String de Conexão do MongoDB Atlas
MONGO_DETAILS = "mongodb+srv://ecocomp:<db_password>@cluster0.ictnsp1.mongodb.net/?appName=Cluster0"
client = MongoClient(MONGO_DETAILS)
db = client.ecocomp
collection = db.sensor_data

# Modelo de dados que a API espera receber
class SensorData(BaseModel):
    temperatura: float
    umidadeAr: float
    umidadeSolo: float

@app.post("/dados")
async def receber_dados(data: SensorData):
    documento = data.dict()
    documento["data_hora"] = datetime.now() # Adiciona o timestamp
    
    try:
        res = collection.insert_one(documento)
        return {"status": "sucesso", "id": str(res.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dados")
async def pegar_dados():
    # Retorna os últimos 10 registros
    dados = list(collection.find().sort("data_hora", -1).limit(10))
    for d in dados:
        d["_id"] = str(d["_id"])
    return dados

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
