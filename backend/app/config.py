import os
from dotenv import load_dotenv

load_dotenv()

OPENWEATHERMAP_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")
GEOAPIFY_API_KEY = os.getenv("GEOAPIFY_API_KEY")