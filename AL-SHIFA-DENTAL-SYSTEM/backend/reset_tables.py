from sqlalchemy import text
from database import engine, Base
# Import all models to ensure Base.metadata is populated
import models 

def reset_tables():
    print("🔄 STARTING DATABASE RESET...")
    
    with engine.connect() as conn:
        try:
            # 1. Force Drop All Tables using Postgres 'CASCADE'
            print("🗑️  Force dropping all existing tables...")
            
            # This SQL block finds every table in the 'public' schema and drops it with CASCADE
            drop_query = text("""
                DO $$ DECLARE
                    r RECORD;
                BEGIN
                    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
                    END LOOP;
                END $$;
            """)
            
            conn.execute(drop_query)
            conn.commit()
            print("✅ All tables dropped successfully.")
            
        except Exception as e:
            print(f"❌ Error dropping tables: {e}")
            return

    # 2. Recreate Tables from Python Models
    print("🏗️  Recreating tables from models...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Success! New database structure applied.")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")

if __name__ == "__main__":
    reset_tables()