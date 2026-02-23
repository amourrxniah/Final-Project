from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.services.email import send_welcome_email
from app.services.security import hash_password, verify_password, create_access_token, SECRET_KEY, ALGORITHM
from datetime import date
from jose import jwt
import requests

router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("/me")
def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")
    
    token = authorization.replace("Bearer ", "")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "name": user.name,
        "username": user.username,
        "email": user.email,
    }

def calculate_age(dob: date):
    today = date.today()
    return today.year - dob.year - (
        (today.month, today.day) < (dob.month, dob.day)
    )

@router.get("/check-username/{username}")
def check_username(username: str, db: Session = Depends(get_db)):
    exists = db.query(User).filter(User.username == username.lower()).first()
    return {"available": not bool(exists)}

@router.post("/signup")
async def manual_signup(data: dict, db: Session = Depends(get_db)):
    required = ["name", "username", "email", "password", "date_of_birth"]
    
    if not all(k in data for k in required):
        raise HTTPException(status_code=400, detail="Missing fields")
    
    #email exists
    if db.query(User).filter(User.email == data["email"]).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    #username exists
    if db.query(User).filter(User.username == data["username"]).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    try:
        dob = date.fromisoformat(data["date_of_birth"])
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

    if calculate_age(dob) < 13:
        raise HTTPException(status_code=400, detail="Must be 13+")

    user = User(
        name=data["name"],
        username=data["username"].lower(),
        email=data["email"].lower(),
        password_hash=hash_password(data["password"]),
        date_of_birth=dob,
        provider="manual"
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"user_id": user.id})

    return {"access_token": token}

@router.post("/login")
async def manual_login(data: dict, db: Session = Depends(get_db)):
    identifier = data.get("identifier")
    password = data.get("password")

    if not identifier or not password:
        raise HTTPException(status_code=400, detail="Missing identifier or password")

    identifier = identifier.lower()

    #check if identifier is email
    if "@" in identifier:
        user = db.query(User).filter(User.email == identifier).first()
    else:
        user = db.query(User).filter(User.username == identifier).first()
    
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"user_id": user.id})
    return {"access_token": token}

@router.post("/google")
async def google_auth(data: dict, db: Session = Depends(get_db)):
    google_user = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {data['access_token']}"}
    ).json()

    user = db.query(User).filter(User.email == google_user["email"]).first()

    if not user:
        user = User(
            email=google_user["email"],
            name=google_user.get("name"),
            provider="google",
            is_verified=True
        )
        db.add(user)
        db.commit()
        await send_welcome_email(user.email, user.name)

    token = create_access_token({"user_id": user.id})
    return {"access_token": token}

@router.post("/apple")
async def apple_auth(data: dict, db: Session = Depends(get_db)):
    email = data.get("email")
    name = data.get("full_name", {}).get("givenName", "Apple User")

    user = db.query(User).filter(User.email == email).first()
   
    if not user:
        user = User(
            email=email,
            name=name,
            provider="apple",
            is_verified=True
        )
        db.add(user)
        db.commit()
        await send_welcome_email(user.email, user.name)

    token = create_access_token({"user_id": user.id})
    return {"access_token": token}