from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.db.session import Base, SessionLocal, engine
from app.seed import seed_data

app = FastAPI(title="Coffee Roastery Manager")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()


app.include_router(router)


@app.get("/")
def root():
    return {"name": "Coffee Roastery Manager", "status": "ok"}
