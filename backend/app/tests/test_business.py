from app.models import entities  # noqa: F401
from app.db.session import Base, engine, SessionLocal
from app.seed import seed_data
from fastapi.testclient import TestClient

from app.main import app

Base.metadata.create_all(bind=engine)
db = SessionLocal()
seed_data(db)
db.close()

client = TestClient(app)


def login(username: str, password: str):
    res = client.post("/auth/login", json={"username": username, "password": password})
    assert res.status_code == 200
    return res.json()["access_token"]


def test_seed_default_beans():
    token = login("admin", "admin123")
    res = client.get("/beans", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert len(res.json()) >= 4


def test_purchase_roast_sale_fifo_and_soft_delete():
    token = login("admin", "admin123")
    headers = {"Authorization": f"Bearer {token}"}

    beans = client.get("/beans", headers=headers).json()
    bean_id = beans[0]["id"]

    p = client.post("/purchases", json={"bean_type_id": bean_id, "quantity_kg": 100, "price_per_kg": 120000, "vat_type": "VAT"}, headers=headers)
    assert p.status_code == 200

    product_payload = {
        "name": "Blend Test", "vat_type": "VAT", "recipes": [{"bean_type_id": bean_id, "ratio_percent": 100}]
    }
    pr = client.post("/products", json=product_payload, headers=headers)
    if pr.status_code not in (200, 201):
        products = client.get("/products", headers=headers).json()
        product = next(x for x in products if x["name"] == "Blend Test")
        product_id = product["id"]
    else:
        product_id = pr.json()["id"]

    roast = client.post("/roasts", json={"product_id": product_id, "input_green_kg": 20, "output_finished_kg": 16}, headers=headers)
    assert roast.status_code == 200
    assert roast.json()["yield_percent"] == 80

    customer = client.post("/customers", json={"name": "Khách test", "status": "active"}, headers=headers)
    assert customer.status_code == 200

    sale = client.post("/sales", json={"customer_id": customer.json()["id"], "product_id": product_id, "quantity_kg": 5, "price_per_kg": 300000, "packaging_cost_per_kg": 5000, "payments": [{"amount": 500000, "method": "cash"}]}, headers=headers)
    assert sale.status_code == 200
    assert sale.json()["vat_percent"] == 8

    inv_before = client.get("/inventory", headers=headers).json()["current"]
    finished_before = [x for x in inv_before if x["segment"] == "FINISHED" and x["product_id"] == product_id]
    assert finished_before

    delete_resp = client.delete(f"/sales/{sale.json()['id']}", headers=headers)
    assert delete_resp.status_code == 200

    inv_after = client.get("/inventory", headers=headers).json()["current"]
    finished_after = [x for x in inv_after if x["segment"] == "FINISHED" and x["product_id"] == product_id][0]
    assert finished_after["quantity_kg"] >= finished_before[0]["quantity_kg"]
