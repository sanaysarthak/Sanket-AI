from fastapi import HTTPException, Header

class Auth:
    def __init__(self):
        self.users = {
            "admin": {"role": "admin", "token": "admin-token"},
            "police": {"role": "police", "token": "police-token"},
            "intel": {"role": "intel", "token": "intel-token"}
        }

    def verify_token(self, x_token: str = Header(...)):
        """Verifies the token and returns the user role."""
        for user, data in self.users.items():
            if data["token"] == x_token:
                return data
        raise HTTPException(status_code=401, detail="Invalid Token")

    def check_permission(self, user_role: str, required_role: str):
        """Checks if the user has the required permission."""
        if user_role == "admin":
            return True
        if user_role == required_role:
            return True
        return False

auth_handler = Auth()
