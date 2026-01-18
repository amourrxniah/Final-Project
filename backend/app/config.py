import os
from dotenv import load_dotenv

load_dotenv()

WEATHERSTACK_API_KEY = os.getenv("WEATHERSTACK_API_KEY")
OPENTRIPMAP_API_KEY = os.getenv("OPENTRIPMAP_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")