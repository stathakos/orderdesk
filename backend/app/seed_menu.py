from app.database import SessionLocal
from app import models

# ------------------------------------------
# MENU DATA (EDIT FREELY)
# ------------------------------------------
CATEGORIES = {
    "Appetizers": {
        "customizations": [],
        "products": [
            ("Fries", 3.00),
            ("Fries with Cheese", 3.50),
            ("Garlic Bread", 3.50),
            ("Onion Rings", 3.50),
            ("Chicken Wings", 5.00),
            ("Cheese Sticks", 4.50),
        ],
    },
    "Pizzas": {
        "customizations": [
            {"name": "+Cheese", "price": 1.00},
            {"name": "+Pepperoni", "price": 0.80},
            {"name": "+Mozzarela", "price": 1.50},
            {"name": "+Feta Cheese", "price": 0.80},
            {"name": "+Philadelphia", "price": 0.70},
            {"name": "+Barbecue Sauce", "price": 0.50},
            {"name": "+Ham", "price": 0.70},
            {"name": "+Bacon", "price": 0.80},
            {"name": "+Chicken", "price": 1.50},
            {"name": "+Fresh tomatoes", "price": 0.50},
            {"name": "+Olives", "price": 0.50},
            {"name": "+Mushrooms", "price": 0.70},
            {"name": "+Peppers", "price": 0.50},
            {"name": "+Onions", "price": 0.60},
            {"name": "+Pineapple", "price": 1.00},
        ],
        "products": [
            ("Margherita", 7.50),
            ("Pepperoni", 8.50),
            ("Special", 9.50),
            ("Vegetarian", 8.00),
            ("Chicken Pizza", 9.00),
            ("Palermo", 8.50),
            ("Riviera", 9.00),
            ("Hawaian", 8.50),
        ],
    },
    "Plates": {
        "customizations": [
            {"name": "+Extra Rice", "price": 1.00},
            {"name": "+Extra Potatoes", "price": 1.50},
            {"name": "+Extra Salad", "price": 1.00},
        ],
        "products": [
            ("Chicken Plate", 9.00),
            ("Pork Plate", 9.00),
            ("Chicken Nuggets Plate", 8.00),
            ("Beef Plate", 10.00),
            ("Club Sandwich Plate", 8.50),
        ],
    },
    "Pasta": {
        "customizations": [
            {"name": "+Extra Sauce", "price": 1.00},
            {"name": "+Extra Cheese", "price": 1.00},
            {"name": "+Extra Milk Cream", "price": 1.00},
            {"name": "+onion", "price": 0.50},
            {"name": "+mushrooms", "price": 0.70},
            {"name": "+olives", "price": 0.50},
            {"name": "+peppers", "price": 0.50},
        ],
        "products": [
            ("Spaghetti Bolognese", 8.00),
            ("Penne Arrabiata", 7.50),
            ("Lasagna", 9.00),
            ("Carbonara", 9.00),
            ("Meatballs Pasta", 8.50),
            ("Ragu Pasta", 9.50),
            ("Penne with Chicken", 8.50),
        ],
    },
    "Burgers": {
        "customizations": [
            {"name": "+Extra Patty", "price": 2.00},
            {"name": "+Extra Cheese", "price": 1.00},
            {"name": "+Bacon", "price": 1.00},
            {"name": "+Lettuce", "price": 0.50},
            {"name": "+Tomato", "price": 0.50},
            {"name": "+Onion", "price": 0.60},
            {"name": "+Pickles", "price": 0.50},
            {"name": "+Ketchup", "price": 0.30},
            {"name": "+Mustard", "price": 0.30},
            {"name": "+Mayonnaise", "price": 0.30},
            {"name": "+Barbecue Sauce", "price": 0.50},
        ],
        "products": [
            ("Classic Burger", 7.00),
            ("Bacon Burger", 8.00),
            ("Double Burger", 9.50),
            ("Umami Burger", 9.00),
            ("Chicken Burger", 8.50),
            ("Pulled Pork Burger", 8.50),
            ("Veggie Burger", 7.50),
        ],
    },
    "Salads": {
        "customizations": [],
        "products": [
            ("Greek Salad", 5.00),
            ("Caesar Salad", 6.50),
            ("Garden Salad", 4.50),
            ("Chicken Salad", 6.00),
            ("Chef Salad", 5.50),
            ("Ntakos Salad", 5.50),
        ],
    },
    "Refreshments": {
        "customizations": [],
        "products": [
            ("Coca Cola", 1.80),
            ("Sprite", 1.80),
            ("Orange Juice", 2.00),
        ],
    },
    "Beers": {
        "customizations": [],
        "products": [
            ("Carlsberg", 3.50),
            ("Sapporo", 4.00),
            ("Asahi", 4.50),
            ("Guiness", 4.00),
            ("Madrid Lager", 3.50),
        ],
    },
}


# ------------------------------------------
# SEEDING LOGIC
# ------------------------------------------
def main():
    db = SessionLocal()
    try:
        print("Seeding menu...")
        for category_name, data in CATEGORIES.items():
            products = data["products"]
            customizations = data["customizations"]
            category = (
                db.query(models.Category)
                .filter(models.Category.name == category_name)
                .first()
            )
            if not category:
                category = models.Category(
                    name=category_name,
                    customizations=customizations,
                )
                db.add(category)
                db.commit()
                db.refresh(category)
            else:
                # Update customizations if category already exists
                category.customizations = customizations
                db.commit()

            for prod_name, price in products:
                existing = (
                    db.query(models.Product)
                    .filter(
                        models.Product.name == prod_name,
                        models.Product.category_id == category.id,
                    )
                    .first()
                )
                if not existing:
                    new_product = models.Product(
                        name=prod_name,
                        price=price,
                        category_id=category.id,
                        is_available=True,
                    )
                    db.add(new_product)
            db.commit()
            print(f"  ✓ {category_name} ({len(products)} products)")
        print("Seeding complete.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
