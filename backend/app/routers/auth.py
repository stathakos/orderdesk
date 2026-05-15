from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, schemas, security
from ..dependencies import get_db, get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = (
        db.query(models.User)
        .filter(models.User.username == credentials.username)
        .first()
    )

    if not user or not security.verify_password(
        credentials.password, str(user.hashed_password)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact your administrator.",
        )

    access_token = security.create_access_token(
        data={"sub": user.username, "role": user.role}
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    """Returns the currently logged in user's profile."""
    return current_user


@router.patch("/me/password", status_code=200)
def change_my_password(
    body: schemas.ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Allows any logged-in user to change their own password."""
    if not security.verify_password(
        body.current_password, str(current_user.hashed_password)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    setattr(current_user, "hashed_password", security.hash_password(body.new_password))
    db.commit()
    return {"message": "Password changed successfully"}


@router.post("/refresh", response_model=schemas.Token)
def refresh_token(current_user: models.User = Depends(get_current_user)):
    """Issue a fresh token for the currently logged in user."""
    access_token = security.create_access_token(
        data={"sub": current_user.username, "role": current_user.role}
    )
    return {"access_token": access_token, "token_type": "bearer"}
