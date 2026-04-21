from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.services.email import send_welcome_email
from app.services.security import hash_password, verify_password, create_access_token, SECRET_KEY, ALGORITHM
from app.services.security import get_current_user as get_user
from datetime import date
import requests

class LoginRequest(BaseModel):
    identifier: str
    password: str

class SignupRequest(BaseModel):
    name: str
    username: str
    email: str
    password: str
    date_of_birth: str

router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("/me")
def get_current_user(current_user: User = Depends(get_user)):
    
    return {
        "name": current_user.name,
        "username": current_user.username,
        "email": current_user.email,
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
async def manual_signup(data: SignupRequest, db: Session = Depends(get_db)):
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

    # await send_welcome_email(user.email, user.name)

    token = create_access_token({"user_id": user.id})

    return {"access_token": token}

@router.get("/check-email/{email}")
def check_email(email: str, db: Session = Depends(get_db)):
    exists = db.query(User).filter(User.email == email.lower()).first()
    return {"available": not bool(exists)}

@router.post("/login")
async def manual_login(data: LoginRequest, db: Session = Depends(get_db)):
    identifier = data.identifier
    password = data.password

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

@router.post("/forgot-password")
def forgot_password(email:dict, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email["email"]).first()

    if user:
        #generate reset token
        #send email or just log for now
        print("Reset link set")

    return {"message": "If account exists, email sent"}

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
        db.refresh(user)

        # try:
        #     await send_welcome_email(user.email, user.name)
        # except Exception as e:
        #     print("Email failed:", e)

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
        #await send_welcome_email(user.email, user.name)

    token = create_access_token({"user_id": user.id})
    return {"access_token": token}