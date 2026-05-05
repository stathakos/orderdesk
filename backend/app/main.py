from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# from sqlalchemy.orm import Session
from app import models, database, security
from app.routers import (
    customers,
    orders,
    categories,
    products,
    auth,
    users,
    delivery_workers,
    ingredients,
)

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Restaurant Orders API")

# ----------------------------
# CORS Middleware
# ----------------------------

# Allow frontend origin
origins = [
    "http://localhost:5173",  # your React dev server
    "http://127.0.0.1:5173",
    "http://192.168.1.36:5173",  # your machine's local IP
    "http://localhost:4173",  # preview mode
]

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",  # allow everything
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(delivery_workers.router)
app.include_router(ingredients.router)


def seed_admin():
    db = database.SessionLocal()
    try:
        existing = (
            db.query(models.User)
            .filter(models.User.role == models.UserRole.admin)
            .first()
        )
        if not existing:
            admin = models.User(
                username="admin",
                hashed_password=security.hash_password("admin123"),
                role=models.UserRole.admin,
                is_active=True,
            )
            db.add(admin)
            db.commit()
            print("✓ Default admin user created — username: admin, password: admin123")
            print("⚠️  Change the admin password immediately after first login!")
    finally:
        db.close()


seed_admin()


# Root endpoint
@app.get("/")
def read_root():
    return JSONResponse(
        {
            "message": "Welcome to the Restaurant Orders API",
            "available_endpoints": {
                "customers": "/customers",
                "orders": "/orders",
                "categories": "/categories",
                "products": "/products",
            },
        }
    )
